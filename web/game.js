import Loader from "./util/loader.js"
import Ws from "./util/ws.js";

class Game {

    //Starts here from Index.html
    constructor() {
        this.loader = new Loader();
        //Debug
        //console.log = function () { }
    }

    async start() {
        //Login (Websocket is started and added to Game after submit)
        // const Login = await this.loader.load("/ui/login/login", 1);
        // new Login().login(async (topic, action, data) => {
        //     console.log(this);
        //     //start websocket
        //     const Ws = await this.loader.load("../../util/ws");
        //     this.ws = new Ws(this);
        //     await this.ws.connect();
        //     this.ws.request(topic, action, data)
        //         .then(data => {
        //             console.log("data", data);
        //             document.body.innerHTML = "";
        //             document.cookie = "clientId=" + data;
        //             this.clientId = data;
        //             this.startMainMenu();
        //         })
        //         .catch(data => {
        //             this.ws.close(4000, data);
        //             el.previousSibling.textContent = data;
        //         });
        // });
        // this.loader.unload("ui/login/login");

        // //autologin
        const Ws = await this.loader.load("../../util/ws");
        this.ws = new Ws(this);
        await this.ws.connect();
        this.clientId = await this.ws.request("user", "register", { username: "test", password: "test" })
        document.body.innerHTML = "";
        document.cookie = "clientId=" + this.clientId;
        this.startMainMenu();
    }

    async startMainMenu() {
        console.log("clientId", this.clientId);
        const Mainmenu = await this.loader.load("/ui/mainmenu/mainmenu", 1);
        this.mainmenu = new Mainmenu(this);
        this.mainmenu.start();
    }

    //Maps
    async createMap(type) {
        return new Promise(async (resolve, reject) => {
            //await this.loader.load("maps/mountainwaters/water");//needs to be according to mapid
            const Map2 = await this.loader.load("/maps/mountainwaters/map");
            let map = new Map2();
            let mapJSON = await map.init();
            await this.ws.request("maps", "create", { type: type, mapJSON: mapJSON });
            resolve();
        });
        // await this.ws.request("maps", "create", { type: type });
    }
    getMaps() { return this.ws.request("maps", "get"); }

    //Characters
    createCharacter(name) { return this.ws.request("characters", "create", { name: name }); }
    getCharacters() { return this.ws.request("characters", "get"); }
    editCharacter(data) { return this.ws.request("characters", "edit", { id: data.id, name: data.name, value: data.value }); }
    deleteCharacter(id) { return this.ws.request("characters", "delete", { id: id }); }

    //Settings

    //needs to Move here

    //join a map

    async joinMap(mapId) {
        this.currentMap = mapId;
        document.body.innerHTML = "";
        //load Three
        const Ingameui = await this.loader.load("/ui/ingameui/ingameui", 1);
        this.ingameui = new Ingameui(this);

        const settings = await this.ws.request("settings", "get");
        const characters = await this.ws.request("characters", "get");
        const mapData = await this.ws.request("map", "join", { mapId: mapId });
        console.log("Map", mapData);

        const Controls = await this.loader.load("/engine/controls");

        //get initial Roatation for controls
        let initialRoataion = { yaw: 0, pitch: 0 };
        // for (let i = mapData.objects.length; i > 0; i--) {
        //     const object = mapData.objects[i];
        //     if (object && object.object.userData && object.object.userData.playerId === this.clientId) {
        //         var quaternion = new THREE.Quaternion();
        //         new THREE.Matrix4().fromArray(object.object.matrix).decompose(new THREE.Vector3(), quaternion, new THREE.Vector3());
        //         initialRoataion.yaw = quaternion.y;

        //         new THREE.Matrix4().fromArray(object.object.children[0].matrix).decompose(new THREE.Vector3(), quaternion, new THREE.Vector3());
        //         initialRoataion.pitch = quaternion.x;
        //         break;
        //     }
        // }
        this.controls = new Controls(settings, this.ingameui.canvas, this.ws, initialRoataion);

        let stats = {};
        stats.statsCont = document.createElement("div");
        stats.statsCont.className = "stats";
        document.body.appendChild(stats.statsCont);
        stats.textCont = document.createElement("div");
        stats.statsCont.appendChild(stats.textCont);
        stats.barCont = document.createElement("div");
        stats.statsCont.appendChild(stats.barCont);
        stats.bar = document.createElement("div");
        stats.barCont.appendChild(stats.bar);

        this.workerActions = {
            "stats": data => {
                stats.textCont.innerHTML = `FPS: ${data.fps} <br> Interval: ${data.msBtFr}ms <br> Delta: ${data.msFr}ms <br>`;
                stats.barCont.style.width = data.msBtFr * 5 + "px";
                stats.bar.style.width = data.msFr * 5 + "px";
            }
        }
        const offscreenCanvas = this.ingameui.canvas.transferControlToOffscreen();
        this.worker = new Worker("util/worker.js", { type: "module" });
        this.worker.onmessage = function (e) {
            const action = window.game.workerActions[e.data.action];
            if (typeof action === "function") { action(e.data.data); }
        }
        this.worker.postMessage({
            action: "startEngine",
            data: {
                clientId: this.clientId,
                offscreenCanvas: offscreenCanvas,
                settings: settings,
                characters: characters,
                mapData: mapData
            }
        }, [offscreenCanvas]);

        this.ws.on("map", "addObjects", (status, data, send) => {
            this.worker.postMessage({ action: "addObjects", data: data });
        })
        this.ws.on("map", "updateObjects", (status, data, send) => {
            this.worker.postMessage({ action: "updateObjects", data: data });
        })
        this.ws.on("map", "removeObjects", (status, data, send) => {
            this.worker.postMessage({ action: "removeObjects", data: data });
        })

        //this.ingameui.removeProgressBar();
        this.ingameui.show();

        function getFib(num) {
            if (num === 0) {
                return 0;
            }
            else if (num === 1) {
                return 1;
            }
            else {
                return getFib(num - 1) + getFib(num - 2);
            }
        }
        //getFib(45);

        // await this.loader.load("engine/stats");
        // await this.loader.load("engine/engine");
        // this.engine = new Engine(this.loader.client_id, this.ingameui.canvas, settings, characters);
        // this.engine.stats.getData(data => {
        //     stats.textCont.innerHTML = `FPS: ${data.fps} <br> msBtFr: ${data.msBtFr} <br> msFr: ${data.msFr} <br>`;
        //     stats.barCont.style.width = data.msBtFr * 5 + "px";
        //     stats.bar.style.width = data.msFr * 5 + "px";
        // });
        // this.engine.addObjects(mapData);

        // this.ws.on("map", "addObjects", (status, data, send) => {
        //     this.engine.addObjects(data);
        // })
        // this.ws.on("map", "updateObjects", (status, data, send) => {
        //     this.engine.updateObjects(data);
        // })
        // this.ws.on("map", "removeObjects", (status, data, send) => {
        //     this.engine.removeObjects(data);
        // })
    }

    async leaveMap() {
        this.ws.removeHandler("map", "addObjects");
        this.ws.removeHandler("map", "updateObjects");
        this.ws.removeHandler("map", "removeObjects");

        this.worker.terminate();

        // this.engine.dispose();
        // delete this.engine;

        delete this.ingamemenu;
        document.body.innerHTML = "";
        await this.ws.request("map", "leave", { mapId: this.currentMap });
        await this.mainmenu.start();
    }
}

export default Game