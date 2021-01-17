class Game {

    constructor(loader) {
        this.loader = loader;

        //Debug
        //console.log = function () { }
    }

    async start() {
        //load ui
        await this.loader.load("ui/ui", 1);
        this.ui = new Ui(this);

        //login
        await this.loader.load("ui/login/login", 1);
        await new Login(this).login();
        await this.loader.unload("ui/login/login");

        //Auto login
        //await this.ws.request("user", "login", { username: '123', password: '123' });

        //mainmenu
        await this.loader.load("ui/mainmenu/mainmenu", 1);

        this.mainmenu = new Mainmenu(this);
        await this.mainmenu.start();
    }

    //Maps

    createMap() { return this.ws.request("maps", "create", { type: "mountainwaters" }); }

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
        await this.loader.load("engine/self");
        await this.loader.load("engine/controls");
        await this.loader.load("engine/player/player");
        await this.loader.load("engine/physics");
        await this.loader.load("maps/mountainwaters/water");//needs to be according to mapid
        await this.loader.load("maps/mountainwaters/map");
        const mapState = await this.ws.request("map", "join", { mapId: mapId });
        const settings = await this.ws.request("settings", "get");
        const characters = await this.ws.request("characters", "get");
        this.engine = new Engine(this, settings, characters, this.loader.client_id);
        this.engine.createMapState(mapState, this.loader.client_id);
        this.engine.handleChanges(changes => {
            this.ws.request("map", "change", { changes: changes });
        });
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