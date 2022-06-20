const THREE = require("./three.js");
class Simulator {

    constructor() {
        this.maps = {};
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
            map.objects.forEach(object => this.moveObject(map, object));
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

    submitChange(map, uuid, change) {
        if (map.change[uuid] !== undefined) {
            Object.entries(change).forEach(([key, values]) => {
                map.change[uuid][key] = values;
            });
        } else { map.change[uuid] = change; }
    }

    moveObject(map, object) {
        if (object.userData === undefined ||
            object.userData.physics === undefined ||
            object.userData.physics.mass === undefined) { return; }

        const physics = object.userData.physics;
        if (physics.currentForce === undefined) { physics.currentForce = new THREE.Vector3(); }
        if (physics.currentAcceleration === undefined) { physics.currentAcceleration = new THREE.Vector3(); }
        if (physics.currentSpeed === undefined) { physics.currentSpeed = new THREE.Vector3(); }

        if (object.userData.playerId) {
            const settings = object.userData.controls.settings;
            const actions = object.userData.controls.actions;
            const moveForce =
                actions.controls_sprint.pressed === true ? settings.sprintSpeed : settings.speed;

            function moveDegRad(degRad) {
                physics.currentForce.add(object.getWorldDirection(new THREE.Vector3())
                    .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
                    .multiply(new THREE.Vector3(moveForce, 1, moveForce)))
            }

            if (actions.controls_forward.pressed === true) { moveDegRad(0); }
            if (actions.controls_right.pressed === true) { moveDegRad(-Math.PI / 2); }
            if (actions.controls_backward.pressed === true) { moveDegRad(Math.PI); }
            if (actions.controls_left.pressed === true) { moveDegRad(Math.PI / 2); }
            if (actions.controls_jump.pressed === true) { physics.currentForce.add(new THREE.Vector3(0, moveForce, 0)) }

            // //gravity vertical
            // const raycaster = new THREE.Raycaster();
            // raycaster.far = 1;//needs to be slightly higher than half of the height of player
            // raycaster.set(object.position, new THREE.Vector3(0, -1, 0));
            // const intersects = raycaster.intersectObjects(map.objects);
            // if (intersects.length == 0) {
            //     physics.currentSpeed -= 0.02;
            //     object.position.y += physics.currentSpeed;
            // } else {
            //     physics.currentSpeed = 0;
            //     object.position.y = intersects[0].point.y + 1;
            // }
            // if (physics.currentSpeed !== 0) {
            //     moved = true;
            // }

            // air resistance
        }

        // //gravity
        // map.objects.forEach(attractor => {
        //     if (object.uuid !== attractor.uuid && attractor.userData && attractor.userData.physics &&
        //         attractor.userData.physics.mass) {
        //         //revesing these will attract or oppse
        //         const directionVector = new THREE.Vector3().subVectors(attractor.position, object.position);
        //         const distance = directionVector.length();
        //         const forceMagnitude =
        //             ((physics.mass * attractor.userData.physics.mass) / (distance * distance)) * 0.1;
        //         physics.currentForce.add(directionVector.normalize().multiplyScalar(forceMagnitude));
        //     }
        // })

        // //get colission and stop movement
        // const raycaster = new THREE.Raycaster();
        // raycaster.far = 0.5;
        // raycaster.set(
        //     object.position.clone().add(
        //         physics.currentForce.clone().normalize().multiplyScalar(0.5))
        //     , physics.currentForce.clone().normalize());
        // const intersects = raycaster.intersectObjects(map.objects);
        // if (intersects.length !== 0) {
        //     intersects.forEach(intersect => console.log(intersect.object.name));
        //     physics.currentForce = new THREE.Vector3();
        //     physics.currentAcceleration = new THREE.Vector3();
        //     physics.currentSpeed = new THREE.Vector3();
        // }

        //apply force to acceleration, speed and position

        function roundVector(vec) {
            return new THREE.Vector3(
                Math.round(vec.x * 10000) / 10000,
                Math.round(vec.y * 10000) / 10000,
                Math.round(vec.z * 10000) / 10000)
        }

        let currentSpeedSquared = physics.currentSpeed.length() * physics.currentSpeed.length()
        // console.log(currentSpeedSquared);
        let airResistanceForce = physics.currentForce.clone()
            .negate().normalize().multiplyScalar(currentSpeedSquared)
        physics.currentForce.add(airResistanceForce);

        //a=F/m
        physics.currentAcceleration = physics.currentForce.divideScalar(physics.mass);

        //v=a*t
        physics.currentSpeed.add(physics.currentAcceleration);

        // //air resistance
        if (physics.currentSpeed.length() < 0.001) { physics.currentSpeed.multiplyScalar(0); }
        else if (physics.currentSpeed.length() < 0.3) { physics.currentSpeed.multiplyScalar(0.9); }

        if (isNaN(physics.currentForce.length()) || isNaN(physics.currentAcceleration.length()) || isNaN(physics.currentSpeed.length())) {
            physics.currentForce = new THREE.Vector3();
            physics.currentAcceleration = new THREE.Vector3();
            physics.currentSpeed = new THREE.Vector3();
        } else {
            //s=v*t
            object.position.add(physics.currentSpeed);
        }

        object.updateMatrixWorld(true);

        //only submit change if moving
        if (physics.currentSpeed.length() !== 0) {
            this.submitChange(map, object.uuid, {
                position: this.vectorToXYZ(object.position)
            });
        }
    }

    controlPlayer(playerId, change) {
        const mapId = this.getMapIdOfPlayer(playerId);
        const object = this.maps[mapId].players[playerId];

        if (change.rotation) {
            object.rotation.y = change.rotation.yaw;
            object.children[0].rotation.x = change.rotation.pitch;
            this.submitChange(this.maps[mapId], object.uuid, {
                rotation: this.vectorToXYZ(object.rotation)
            });
            this.submitChange(this.maps[mapId], object.children[0].uuid, {
                rotation: this.vectorToXYZ(object.children[0].rotation)
            });
        }

        if (object.userData.controls.actions[change.action]) {
            object.userData.controls.actions[change.action].pressed = change.pressed;
        }
    }

    addPlayerToMap(playerId, mapId) {
        const map = this.maps[mapId];
        const yaw = new THREE.Mesh();
        yaw.name = "player";
        yaw.position.set(
            Math.round(Math.random() * 199) - 99,
            1,
            Math.round(Math.random() * 199) - 99);
        //yaw.rotation.y = Math.random() * 360;
        yaw.userData = {
            physics: {
                currentForce: new THREE.Vector3(0, 0, 0),
                currentAcceleration: new THREE.Vector3(0, 0, 0),
                currentSpeed: new THREE.Vector3(0, 0, 0),
                mass: 10
            },
            playerId: playerId,
            controls: {
                settings: {
                    speed: 0.4,
                    sprintSpeed: 1,
                },
                actions: {
                    controls_forward: { pressed: false },
                    controls_right: { pressed: false },
                    controls_backward: { pressed: false },
                    controls_left: { pressed: false },
                    controls_jump: { pressed: false },
                    controls_sprint: { pressed: false },
                }
            },
        };//other stuff should go in here

        const pitch = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: false })
        );

        pitch.rotation.x = 0;
        yaw.add(pitch);
        yaw.updateMatrixWorld(true);
        const playerObj = this.addAsSeparatedObjectToMap(map, yaw);
        playerObj.updateMatrixWorld(true);
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

    vectorToXYZ(vector) {
        return { x: vector.x, y: vector.y, z: vector.z, };
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