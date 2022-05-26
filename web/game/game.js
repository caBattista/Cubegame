class Game {

    //Starts here from Index.html
    constructor(loader) {
        this.loader = loader;

        //Debug
        //console.log = function () { }
    }

    async start() {
        this.headers = new Headers();
        this.headers.set('cliendId', this.loader.client_id);

        //Load UI
        await this.loader.load("ui/ui", 1);
        this.ui = new Ui(this);

        //Login (Websocket is started and added to Game after submit)
        await this.loader.load("ui/login/login", 1);
        await new Login(this).login();
        //await new Login(this).autoLogin("test", "test", "login");
        await this.loader.unload("ui/login/login");

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
        const characters = await this.ws.request("characters", "get");
        const mapState = await this.ws.request("map", "join", { mapId: mapId });
        console.log("mapstate", mapState);

        this.engine = new Engine(this, settings, characters, this.loader.client_id);
        this.engine.createMapState(mapState, this.loader.client_id);

        this.ws.on("map", "addPlayers", (status, data, send) => {
            this.engine.addPlayers(data);
        })
        this.ws.on("map", "updatePlayers", (status, data, send) => {
            this.engine.updatePlayers(data);
        })
        this.ws.on("map", "removePlayers", (status, data, send) => {
            this.engine.removePlayers(data);
        })
    }

    async leaveMap() {
        this.ws.removeHandler("map", "addPlayers");
        this.ws.removeHandler("map", "updatePlayers");
        this.ws.removeHandler("map", "removePlayers");
        this.engine.dispose();
        delete this.ingamemenu;
        delete this.engine;
        document.body.innerHTML = "";
        await this.ws.request("map", "leave", { mapId: this.currentMap });
        await this.mainmenu.start();
    }
} 