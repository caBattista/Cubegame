const THREE = require("./three.js");
class Simulator {

    constructor() {
        this.maps = {};
    }

    addMap(map) {
        this.maps[map.id] = {
            players: {}, change: false,
            settings: map.settings,
            objects: [], 
            visuals : {}
        };
        map.static_objects.forEach(object => {
            const res = this.createMeshFromObject(object);
            this.maps[map.id].objects.push(res.mesh);
            this.maps[map.id].visuals[object.object.uuid] = res.visuals;
        })
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR: CREATED MAP", map.id);
    }

    createMeshFromObject(object) {
        const res = this.separateObject(object);//sepereate visuals from json object
        const mesh = new THREE.ObjectLoader().parse(res.object);//create the object
        mesh.updateMatrixWorld(true);//important for raycaster (force calculates Matrix without render)
        return { mesh: mesh, visuals: res.visuals };
    }

    startMap(mapId, callback) {
        //calculation loop
        this.maps[mapId].loop = setInterval(() => {
            Object.keys(this.maps[mapId].players).forEach((key) => {
                this.movePlayer(mapId, key);
            });
            if (this.maps[mapId].change === true) {
                this.maps[mapId].change = false;
                callback(this.getMapState(mapId));
            }
        }, 1000 / 30);
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR: STARTED MAP", mapId);
    }

    stopMap(mapId) {
        clearInterval(this.maps[mapId].loop);
        console.log("\x1b[35m%s\x1b[0m", "SIMULATOR: STOPPED MAP", mapId, mapId);
        return { id: mapId, static_objects: this.maps[mapId].objects };
    }

    movePlayer(mapId, playerId) {
        const map = this.maps[mapId];
        const player = map.players[playerId];

        function moveDegRad(degRad) {
            player.elements.yaw.position.add(
                player.elements.yaw.getWorldDirection(new THREE.Vector3())
                    .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
                    .multiply(new THREE.Vector3(player.settings.speed, 0, player.settings.speed))
            );

            player.elements.yaw.position.x = Math.round(player.elements.yaw.position.x * 1000) / 1000;
            player.elements.yaw.position.y = Math.round(player.elements.yaw.position.y * 1000) / 1000;
            player.elements.yaw.position.z = Math.round(player.elements.yaw.position.z * 1000) / 1000;

            map.change = true;
        }

        let jump = false;
        Object.entries(player.controls).forEach(([key, val]) => {
            if (val.pressed === true) {
                if (key === "controls_forward") { moveDegRad(0); }
                else if (key === "controls_right") { moveDegRad(-Math.PI / 2); }
                else if (key === "controls_backward") { moveDegRad(Math.PI); }
                else if (key === "controls_left") { moveDegRad(Math.PI / 2); }
                else if (key === "controls_jump") { jump = true; player.elements.yaw.position.y += player.settings.speed; map.change = true; }
                else if (key === "controls_sprint") { player.settings.speed = 0.8 }
            } else {
                if (key === "controls_sprint") { player.settings.speed = 0.4 }
            }
        });

        // //gravity
        const raycaster = new THREE.Raycaster();
        raycaster.far = 5;//needs to be slightly higher than half of the height of player
        raycaster.set(player.elements.yaw.position, new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(this.maps[mapId].objects)
        if (intersects.length == 0) {
            player.elements.yaw.position.y -= map.settings.gravity;
            map.change = true;
        } else if (jump === false) {
            player.elements.yaw.position.y = intersects[0].point.y + 0.4;
        }
    }

    controlPlayer(playerId, change) {
        const mapId = this.getMapIdOfPlayer(playerId);
        const player = this.maps[mapId].players[playerId];

        if (change.rotation) {
            player.elements.yaw.rotation.y = change.rotation.yaw;
            player.elements.pitch.rotation.x = change.rotation.pitch;
            this.maps[mapId].change = true;
        }

        if (player.controls[change.action]) {
            player.controls[change.action].pressed = change.pressed;
            this.maps[mapId].change = true;
        }

        return true;
    }

    addPlayerToMap(playerId, mapId) {
        //create geometry
        let elements = {};

        const yaw = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
        elements.yaw = yaw;

        const pitch = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
        yaw.add(pitch);
        elements.pitch = pitch;

        yaw.position.set(
            Math.round(Math.random() * 199) - 99,
            20,
            Math.round(Math.random() * 199) - 99);
        yaw.rotation.y = Math.random() * 360;

        pitch.rotation.x = 0;

        //create player object
        this.maps[mapId].players[playerId] = {
            settings: { speed: 0.4 },
            controls: {
                controls_forward: { pressed: false },
                controls_right: { pressed: false },
                controls_backward: { pressed: false },
                controls_left: { pressed: false },
                controls_jump: { pressed: false },
                controls_sprint: { pressed: false },
            },
            elements: elements,
        };
        return this.getMapState(mapId);
    }

    removePlayerFromMap(playerId) {
        const mapOfPlayer = this.getMapIdOfPlayer(playerId);
        if (mapOfPlayer) {
            delete this.maps[mapOfPlayer].players[playerId];
            console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "REMOVED", playerId, "FROM MAP", mapOfPlayer);
        }
        return mapOfPlayer ? this.getMapState(mapOfPlayer) : undefined;
    }

    getPlayers(mapId) {
        const res = {};
        Object.keys(this.maps[mapId].players).forEach(playerId => {
            res[playerId] = this.getPlayer(playerId, mapId);
        });
        return res;
    }

    getPlayer(playerId, mapId) {
        mapId = mapId ? mapId : this.getMapIdOfPlayer(playerId);
        let playerElements = this.maps[mapId].players[playerId].elements;
        return {
            position: playerElements.yaw.position,
            rotation: {
                yaw: playerElements.yaw.rotation.y,
                pitch: playerElements.pitch.rotation.x,
            }
        };
    }

    getMapState(mapId) {
        return {
            id: mapId, players: this.getPlayers(mapId),
            static_objects: this.joinObjects(this.maps[mapId])
        };
    }

    //convert json object to object with textures or
    separateObject(object) {

        let visuals = {
            materials: structuredClone(object.materials),
            images: structuredClone(object.images),
            textures: structuredClone(object.textures),
            object_material: structuredClone(object.object.material)
        }

        delete object.materials;
        delete object.images;
        delete object.textures;
        delete object.object.material;

        return { object: object, visuals: visuals };
    }

    joinObjects(map){
        const mapObjects = [];
        map.objects.forEach(object => {
            mapObjects.push(this.joinObject(object, map.visuals[object.uuid]));
        })
        return mapObjects;
    }

    joinObject(object1, visuals) {
        const object = object1.toJSON();
        object.materials = structuredClone(visuals.materials);
        object.images = structuredClone(visuals.images);
        object.textures = structuredClone(visuals.textures);
        object.object.material = structuredClone(visuals.object_material);
        return object;
    }

    getPlayersIdsOfMap(mapId) { return Object.keys(this.maps[mapId].players); }

    getMapIdOfPlayer(playerId) {
        let res = undefined;
        Object.entries(this.maps).forEach(([mapId, map]) => {
            if (Object.keys(map.players).includes(playerId)) { res = mapId; }
        });
        return res;
    }

    // changePlayer() {
    //     //active abilities of player and other players need to be checked first

    //     //checks if player is moving to fast
    //     // const distance =
    //     //     new THREE.Vector3(posRot.position.x, posRot.position.y, posRot.position.z).distanceTo(
    //     //         new THREE.Vector3(player.posRot.position.x, player.posRot.position.y, player.posRot.position.z));
    //     // if (distance > 0.6) { this.addOffence(player, "pmtf"); }

    //     // //check if player gravity is active
    //     // //needs check if player is jumping or not
    //     // if (posRot.position.y > 0.5 /*player height*/ && distance < 0.6) {
    //     //     this.addOffence(player, "pgna");
    //     // }

    //     // //check if player is outside map bounds (only needs to be checked every second)
    //     // if (posRot.position.x < -250 || posRot.position.x > 250 ||
    //     //     posRot.position.y < -250 || posRot.position.y > 250 ||
    //     //     posRot.position.z < -250 || posRot.position.z > 250
    //     // ) { this.addOffence(player, "pomb"); }

    //     // simplified Gravity
    //     // if (Math.abs(posRot.position.x) > 125 || Math.abs(posRot.position.z) > 125) {
    //     //     posRot.position.y -= this.settings.gravity;
    //     // }
    //     // else if (posRot.position.y < 1) {
    //     //     posRot.position.y = 1;
    //     // }
    //     // else if (posRot.position.y > 1) {
    //     //     posRot.position.y -= this.settings.gravity;
    //     // }


    //     //check if players inside other prohibited Mesh (example: bullt floor etc.)
    //     //could also do the hit detection
    //     /*
    //     getProhibitedMeshesOfMap(mapId).forEach(mesh => {
    //         const point = new THREE.Vector3(posRot.position.x, posRot.position.y, posRot.position.z) // Your point
    //         const geometry = new THREE.BoxBufferGeometry(mesh.x, mesh.y, mesh.z)
    //         const mesh = new THREE.Mesh(geometry)
    //         const raycaster = new THREE.Raycaster()
    //         raycaster.set(point, new THREE.Vector3(1, 1, 1))
    //         if (raycaster.intersectObject(mesh).length % 2 === 1) { // Point is in objet
    //             this.addOffence(player, "pim");
    //         }
    //     })
    //     */

    //     // this.maps[mapId].players[playerId].changeCount++;
    //     // this.maps[mapId].players[playerId].posRot = player.posRot;

    //     //console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", JSON.stringify(this.maps[mapId].players[playerId], null, 1));
    // }

    // offences = {
    //     "tmcps": "too many changes per second",
    //     "pmtf": "player movement to fast",
    //     "pgna": "player gravity not active",
    //     "pomb": "player outside map bounds",
    //     "pim": "player inside Mesh"
    // }

    // addOffence(player, OId) {
    //     player.offences[OId] = player.offences[OId] > 0 ? ++player.offences[OId] : 1;
    //     console.log("\x1b[35m%s\x1b[0m", "SIMULATOR:", "ADDED OFFENCE", player, OId);
    // }

    //checks if players are running higher fps in game
    // startChageCountValidation() {

    //     //set changecount of all palyers 0
    //     this.getPlayers((mapId, playerId) => {
    //         this.maps[mapId].players[playerId].changeCount = 0;
    //     })

    //     this.changeCountInterv = setInterval(() => {
    //         this.getPlayers((mapId, playerId) => {
    //             if (this.maps[mapId].players[playerId].changeCount > 60) {
    //                 this.addOffence(this.maps[mapId].players[playerId], "tmcps");
    //             }
    //             this.maps[mapId].players[playerId].changeCount = 0;
    //         })
    //     }, 1000);
    // }

    // stopChageCountValidation() {
    //     clearInterval(this.changeCountInterv);
    // }

    // removeOffenders() {
    //     let res = [];
    //     this.getPlayers((mapId, playerId) => {
    //         const suspect = this.maps[mapId].players[playerId];
    //         if (Object.keys(suspect.offences).length > 0) {
    //             res.push({ id: playerId, offences: suspect.offences });
    //             delete this.maps[mapId].players[playerId];
    //         }
    //     })
    //     return res;
    // }
}
module.exports = Simulator;