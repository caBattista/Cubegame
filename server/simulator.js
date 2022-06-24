const THREE = require("./three.js");
const Physics = require("./physics.js");
const Player = require("./player.js");
const Controller = require("./controller.js");

class Simulator {

    constructor() {
        this.maps = {};
        this.controller = new Controller(THREE);
        this.physics = new Physics(THREE);
    }

    addMap(mapJSON) {
        //create map object
        this.maps[mapJSON.id] = {
            type: mapJSON.type,
            settings: mapJSON.settings,
            objects: [],
            visuals: {},
            players: {},
            change: {}
        };

        //load objects from JSON
        mapJSON.static_objects.forEach(object => {
            const mapObject = this.addAsSeparatedObjectToMap(this.maps[mapJSON.id], object, true);
            mapObject.updateMatrixWorld(true);
        })

        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "CREATED MAP", mapJSON.id);
    }

    startMap(mapId, callback) {
        const map = this.maps[mapId];
        map.loop = setInterval(() => {
            map.objects.forEach(object => this.updateObject(map, object));
            if (Object.keys(map.change).length !== 0) {
                callback(Object.keys(map.players), map.change);
                map.change = {};
            }
        }, 1000 / 30);
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "STARTED MAP", mapId);
    }

    stopMap(mapId) {
        clearInterval(this.maps[mapId].loop);
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "STOPPED MAP", mapId, mapId);
        return { id: mapId, objects: this.maps[mapId].objects };
    }

    updateObject(map, object) {
        if (this.physics.isPhysicsObject(object)) {

            this.physics.prepareObject(object);

            if (object.userData.playerId) {
                this.controller.applyForceFromActions(object);
            }

            this.physics.collision(object, map.objects);
            this.physics.spacialGravity(object, map.objects);
            this.physics.airResistance(object);
            this.physics.updatePosition(object);

            this.physics.getChanges(object).forEach(change => {
                this.submitChange(map, object.uuid, change);
            });
        }
    }

    submitChange(map, uuid, change) {
        if (map.change[uuid] !== undefined) {
            Object.entries(change).forEach(([key, values]) => {
                map.change[uuid][key] = values;
            });
        } else { map.change[uuid] = change; }
    }

    controlPlayer(playerId, change) {
        const mapId = this.getMapIdOfPlayer(playerId);
        const object = this.maps[mapId].players[playerId];

        this.controller.updateRotation(this.maps[mapId], object, change, this.submitChange);
        this.controller.updateActions(object, change);
    }

    addPlayerToMap(playerId, mapId) {
        const map = this.maps[mapId];
        const player = new Player(playerId, THREE);
        const playerObj = this.addAsSeparatedObjectToMap(map, player.objects.yaw);
        map.players[playerId] = playerObj;

        return {
            type: map.type,
            objects: this.joinObjects(map),
            playerIds: Object.keys(map.players),
            newPlayerObjects: [this.joinObject(playerObj, map.visuals[playerObj.uuid])]
        };
    }

    removePlayerFromMap(playerToRemoveId) {
        let res = { mapId: undefined, playerIds: [], removedObjectIds: [] };
        Object.entries(this.maps).forEach(([mapId, map]) => {
            Object.entries(map.players).forEach(([playerId, playerObject]) => {
                if (playerToRemoveId === playerId) {
                    delete map.players[playerId];
                    res.mapId = mapId;
                    res.playerIds = Object.keys(map.players);
                    res.removedObjectIds = [playerObject.uuid];
                    map.objects.splice(map.objects.indexOf(playerObject), 1);
                    console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "REMOVED", playerId, "FROM MAP", mapId);
                }
            })
        });
        return res;
    }

    getPlayers(mapId) { return Object.keys(this.maps[mapId].players); }

    getMapIdOfPlayer(playerId) {
        let res = undefined;
        Object.entries(this.maps).forEach(([mapId, map]) => {
            if (map.players[playerId]) { res = mapId; }
        });
        return res;
    }

    getPlayersIdsOfMap(mapId) { //for ui
        return Object.keys(this.maps[mapId].players);
    }

    addAsSeparatedObjectToMap(map, object, objectFromJSON) {
        const { objectJSON, visualsJSON } = this.separateObject(objectFromJSON === true ? object : object.toJSON());
        const sepObject = new THREE.ObjectLoader().parse(objectJSON);
        map.objects.push(sepObject);
        map.visuals[objectJSON.object.uuid] = visualsJSON;
        return sepObject;
    }

    //convert json object to object with textures or
    separateObject(objectJSON) {
        let visualsJSON = {};

        if (objectJSON.materials) {
            visualsJSON.materials = structuredClone(objectJSON.materials);
            delete objectJSON.materials;
        }
        if (objectJSON.images) {
            visualsJSON.images = structuredClone(objectJSON.images);
            delete objectJSON.images;
        }
        if (objectJSON.textures) {
            visualsJSON.textures = structuredClone(objectJSON.textures);
            delete objectJSON.textures;
        }
        if (objectJSON.object.material) {
            visualsJSON.object_material = structuredClone(objectJSON.object.material);
            delete objectJSON.object.material;
        }

        if (objectJSON.object.children) {
            visualsJSON.children = {};
            objectJSON.object.children.forEach(child => {
                visualsJSON.children[child.uuid] = structuredClone(child.material);
            })
        }

        return { objectJSON: objectJSON, visualsJSON: visualsJSON };
    }

    getMapState(mapId) {
        return { id: mapId, type: this.maps[mapId].type, objects: this.joinObjects(this.maps[mapId]) };
    }

    joinObjects(map) {
        const mapObjects = [];
        map.objects.forEach(object => {
            mapObjects.push(this.joinObject(object, map.visuals[object.uuid]));
        })
        return mapObjects;
    }

    joinObject(object, visuals) {
        const objectJSON = object.toJSON();
        if (visuals) {
            if (visuals.materials) { objectJSON.materials = structuredClone(visuals.materials); }
            if (visuals.images) { objectJSON.images = structuredClone(visuals.images); }
            if (visuals.textures) { objectJSON.textures = structuredClone(visuals.textures); }
            if (visuals.object_material) { objectJSON.object.material = structuredClone(visuals.object_material); }

        }

        if (visuals.children) {
            objectJSON.object.children.forEach(child => {
                child.material = visuals.children[child.uuid];
            })
        }
        return objectJSON;
    }
}
module.exports = Simulator;