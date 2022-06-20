class Game {

    //Starts here from Index.html
    constructor(loader) {
        this.loader = loader;
        //Debug
        //console.log = function () { }
    }

    async start() {
        //Load UI
        await this.loader.load("ui/ui", 1);
        this.ui = new Ui(this);

        //Login (Websocket is started and added to Game after submit)
        await this.loader.load("ui/login/login", 1);
        await new Login(this).login();
        //await new Login(this).autoLogin("test", "test", "login");
        await this.loader.unload("ui/login/login");

        //add cid
        console.log("clientId", this.loader.client_id);
        this.addCid = url => { return url + "?client_id=" + this.loader.client_id; };

        //Mainmenu 
        await this.loader.load("ui/mainmenu/mainmenu", 1);

        this.mainmenu = new Mainmenu(this);
        await this.mainmenu.start();
    }

    //Maps
    createMap(type) { return this.ws.request("maps", "create", { type: type }); }
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
        await this.loader.load("ui/ingameui/ingameui", 1);
        this.ingameui = new Ingameui(this);
        await this.loader.load("engine/three");
        await this.loader.load("engine/stats");
        await this.loader.load("engine/engine");
        await this.loader.load("engine/controls");
        await this.loader.load("engine/player/player");
        //await this.loader.load("maps/mountainwaters/water");//needs to be according to mapid
        await this.loader.load("maps/mountainwaters/map");

        const settings = await this.ws.request("settings", "get");
        settings.interval = await this.getClientInterval();
        const characters = await this.ws.request("characters", "get");
        const data = await this.ws.request("map", "join", { mapId: mapId });
        console.log("mapstate", data);

        this.engine = new Engine(this, settings, characters);
        this.engine.addObjects(data);

        this.ws.on("map", "updateMap", (status, data, send) => {
            this.engine.updateMap(data);
        })
        this.ws.on("map", "addObjects", (status, data, send) => {
            this.engine.addObjects(data);
        })
        this.ws.on("map", "removeObjects", (status, data, send) => {
            this.engine.removeObjects(data);
        })
    }

    getClientInterval() {
        return new Promise(resolve =>
            requestAnimationFrame(t1 =>
                requestAnimationFrame(t2 => resolve(t2 - t1))
            ))
    }

    async leaveMap() {
        this.ws.removeHandler("map", "addObjects");
        this.ws.removeHandler("map", "updateObjects");
        this.ws.removeHandler("map", "removeObjects");
        this.engine.dispose();
        delete this.ingamemenu;
        delete this.engine;
        document.body.innerHTML = "";
        await this.ws.request("map", "leave", { mapId: this.currentMap });
        await this.mainmenu.start();
    }
} 