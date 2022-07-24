import { ObjectLoader } from 'three'
import Physics from './physics.js'
import Player from './player.js'
import Controller from './controller.js'
import Stats from './stats.js'
import * as THREE from 'three'

class Simulator {

    //public
    constructor() {
        this.maps = {};
        this.controller = new Controller();
        this.stats = new Stats();
        this.physics = new Physics(this.stats);
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "STARTED");
    }

    //public
    addMapFromJSON(mapJSON) {
        //create map object
        this.maps[mapJSON.id] = {
            type: mapJSON.type,
            settings: mapJSON.settings,
            objects: [],
            physicsObjects: [],
            visuals: {},
            players: {},
            changes: {},
            objectRelations: {}
        };

        //load objects from JSON

        mapJSON.static_objects.forEach(object => {
            const mapObject = this.addAsSeparatedObjectToMap(this.maps[mapJSON.id], object, true);
            mapObject.updateMatrixWorld(true);
        })

        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "CREATED MAP", mapJSON.id);
    }

    //public
    startMap(mapId, callback) {
        const map = this.maps[mapId];
        this.stats.addMetric("loop", true);
        map.count = 0;
        map.loop = setInterval(() => {
            this.stats.start("loop");
            const mol = map.physicsObjects.length;
            for (let i = 0; i < mol; i++) { this.updateObject(map, map.physicsObjects[i]) }
            if (Object.keys(map.changes).length !== 0) {
                //console.log(map.changes)
                callback(Object.keys(map.players), map.changes);
                map.changes = {};
            }
            map.count++;
            this.stats.end("loop");
        }, 31); //-> 30fps more or less 31
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "STARTED MAP", mapId);
    }

    //public
    stopMap(mapId) {
        clearInterval(this.maps[mapId].loop);
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "STOPPED MAP", mapId, mapId);
        return { id: mapId, objects: this.maps[mapId].objects };
    }

    updateObject(map, object) {
        if (this.physics.isPhysicsObject(object)) {
            if (object.userData.playerId) {
                this.controller.applyForceFromActions(object);//0.003ms when no action
            } else if (object.isInstancedMesh === true) {
                var positions = [];
                for (let i = 0; i < object.count; i++) {

                    var instance = { userData: { physics: object.userData.physics } }

                    // let mat = new THREE.Matrix4();
                    // object.getMatrixAt(i, mat);
                    // let vec = new THREE.Vector3();
                    // vec.setFromMatrixPosition(mat);

                    const matrix = new THREE.Matrix4();
                    const position = new THREE.Vector3(
                        Math.round(Math.random() * 1000 - 500),
                        Math.round(Math.random() * 1000 - 500),
                        Math.round(Math.random() * 1000 - 500)
                    );
                    const rotation = new THREE.Euler(
                        Math.round(Math.random() * 2 * Math.PI),
                        Math.round(Math.random() * 2 * Math.PI),
                        Math.round(Math.random() * 2 * Math.PI)
                    );
                    const quaternion = new THREE.Quaternion();
                    quaternion.setFromEuler(rotation);
                    const scale = new THREE.Vector3(1, 1, 1);

                    matrix.compose(position, quaternion, scale);
                    object.setMatrixAt(i, matrix);
                    positions.push(position.x);
                    positions.push(position.y);
                    positions.push(position.z);
                }
                
                this.physics.mapBounds(object);
                if (map.count % 30 === 0) {
                    this.physics.getChanges(object).forEach(change => {
                        this.submitChange(map, object.uuid, change);
                    });
                }
            } else {
                //this.physics.gravitySpacial(object, map.physicsObjects);
            }

            if (object.userData.physics.currentSpeed.length() !== 0) {
                //this.physics.collisionIntersect(object, map.physicsObjects);
                //this.physics.airResistance(object);
                //this.physics.airResistanceBasic(object);
                //this.physics.mapBounds(object);
            }

            this.physics.getChanges(object).forEach(change => {
                this.submitChange(map, object.uuid, change);
            });
        }
    }

    submitChange(map, uuid, change) {
        if (map.changes[uuid] !== undefined) {
            Object.entries(change).forEach(([key, value]) => {
                map.changes[uuid][key] = value;
            });
        } else { map.changes[uuid] = change; }
    }

    //public
    controlPlayer(playerId, change) {
        const mapId = this.getMapIdOfPlayer(playerId);
        const object = this.maps[mapId].players[playerId];

        this.controller.updateRotation(this.maps[mapId], object, change, this.submitChange);
        this.controller.updateActions(object, change);
    }

    //public
    addPlayerToMap(playerId, mapId) {
        const map = this.maps[mapId];
        const player = new Player(playerId);
        const playerObj = this.addAsSeparatedObjectToMap(map, player.objects.yaw);
        map.players[playerId] = playerObj;

        return {
            type: map.type,
            objects: this.joinObjects(map),
            playerIds: Object.keys(map.players),
            newPlayerObjects: [this.joinObject(playerObj, map.visuals[playerObj.uuid])]
        };
    }

    //public
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

    //public
    getPlayers(mapId) { return Object.keys(this.maps[mapId].players); }

    //public
    getMapIdOfPlayer(playerId) {
        let res = undefined;
        Object.entries(this.maps).forEach(([mapId, map]) => {
            if (map.players[playerId]) { res = mapId; }
        });
        return res;
    }

    //public
    getPlayersIdsOfMap(mapId) { //for ui
        return Object.keys(this.maps[mapId].players);
    }

    addAsSeparatedObjectToMap(map, object, objectFromJSON) {
        const { objectJSON, visualsJSON } = this.separateObject(objectFromJSON === true ? object : object.toJSON());
        const sepObject = new ObjectLoader().parse(objectJSON);
        if (sepObject.userData && sepObject.userData.physics && sepObject.userData.physics.mass) {
            this.physics.prepareObject(sepObject);
            map.physicsObjects.push(sepObject);
        } else {
            map.objects.push(sepObject);
        }
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
        map.physicsObjects.forEach(object => {
            mapObjects.push(this.joinObject(object, map.visuals[object.uuid]));
        })
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
export default Simulator;