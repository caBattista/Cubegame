class Engine {
    constructor(game, settings, characters) {

        this.game = game;
        this.clientId = this.game.loader.client_id;

        // ############# settings #############
        this.settings = settings;
        this.settings.smoothing = { divider: Math.round((1 / 30) / (this.settings.interval / 1000)) + 1 };

        // ############# characters #############
        this.characters = characters;

        // ############# sound #############
        this.audio = {
            ugh: new Audio(this.game.addCid('maps/mountainwaters/audio/ugh.mp3')),
            hit: new Audio(this.game.addCid('maps/mountainwaters/audio/hit.mp3'))
        };

        // ############# players #############
        this.players = {};

        // ############# init process #############
        this.initLoadingManager();
        this.manager.onLoad = () => {//restarts whenn new player comes
            this.initRenderer();
            this.initResizeHandler();
            this.startRender();
            const waitForRender = setInterval(() => {
                if (this.renderloop) {
                    clearInterval(waitForRender);
                    //remove onload or uexpected behavior when textures are loaded by a new player
                    this.manager.onLoad = () => { };
                    this.game.ingameui.removeProgressBar();
                    this.game.ingameui.show();
                }
            }, 100);
        };

        this.scene = new THREE.Scene();

        //top down Camera
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.rotation.set((Math.PI / 2) - 0.9, Math.PI, 0);
        this.camera.position.set(0, 50, -150);
        this.scene.add(this.camera);
    }

    initLoadingManager() {
        this.manager = THREE.DefaultLoadingManager;
        this.game.ingameui.createProgressBar();
        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.game.ingameui.updateProgressBar(itemsLoaded, itemsTotal, `
                Loading: ${url.replace(/^.*[\\\/]/, '').split("?")[0]} ${itemsLoaded} of ${itemsTotal}`);
        };
        this.objectLoader = new THREE.ObjectLoader(this.manager);//using DefaultLoadingManager
    }

    initRenderer() {
        const renderer = new THREE.WebGLRenderer({
            canvas: this.game.ingameui.canvas,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer = renderer;
    }

    initResizeHandler() {
        window.addEventListener('resize', ev => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    startRender() {
        this.stats = new Stats();
        this.renderloop = setInterval(() => {
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(() => {
                this.stats.start();
                //this.map.animate();
                this.stats.end();
            });
        }, this.settings.interval);
    }

    addObjects(data) {
        data.objects.forEach(object => {
            this.objectLoader.setResourcePath(`maps/${data.type}/textures/`);
            let parsedObject = this.objectLoader.parse(object);
            //players
            if (object.object.userData && object.object.userData.playerId) {
                if (object.object.userData.playerId === this.clientId) {
                    this.camera.rotation.set(0.4, Math.PI, 0);
                    this.camera.position.set(0, 2, -5);
                    parsedObject.children[0].add(this.camera);
                    this.controls = new Controls(this.settings, this.game.ingameui.canvas, this.game.ws, parsedObject);
                }
                this.players[this.clientId] = parsedObject;
            }
            this.scene.add(parsedObject);
        })
    }

    updateMap(mapChange) {
        for (const [key, values] of Object.entries(mapChange)) {
            let object = this.scene.getObjectByProperty("uuid", key);
            if (object !== undefined) { this.moveSmoothed(values, object); }
        }
    }

    removeObjects(objectIds) {
        objectIds.forEach(objectId => {
            const object = this.scene.getObjectByProperty("uuid", objectId);
            object.geometry.dispose();
            object.material.dispose();
            this.scene.remove(object);
            //players
            if (object.userData.playerId !== undefined) { delete this.players[object.userData.playerId]; }
        })
        this.renderer.renderLists.dispose();
    }

    dispose() {
        clearInterval(this.controls.controlInterval);
        clearInterval(this.renderloop);
    }

    moveSmoothed(data, object) {
        //console.log(object.userData.smoothingInterval);//debug
        clearInterval(object.userData.smoothingInterval);

        //calculate step values (distance to move in steps between frames)
        let step = {};
        if (data.position !== undefined) {
            step.position = this.vectorFromXYZ(data.position)
                .sub(object.position).divideScalar(this.settings.smoothing.divider);
        }
        if (data.rotation !== undefined) {//euler
            step.rotation = this.vectorFromXYZ(data.rotation)
                .sub(this.vectorFromXYZ(object.rotation)).divideScalar(this.settings.smoothing.divider);
        }

        let index = this.settings.smoothing.divider - 1;

        if (data.position !== undefined) { object.position.add(step.position); }
        if (data.rotation !== undefined) {
            object.rotation.setFromVector3(this.vectorFromXYZ(object.rotation).add(step.rotation));
        }

        object.userData.smoothingInterval = setInterval(() => {
            if (index <= 0) {
                clearInterval(object.userData.smoothingInterval);
                // object.userData.smoothingInterval = undefined;//debug
                if (step.position !== undefined) { this.vectorFromXYZ(data.position, object.position); }
                if (step.rotation !== undefined) { object.rotation.setFromVector3(data.rotation); }
            } else {
                if (step.position !== undefined) { object.position.add(step.position); }
                if (step.rotation !== undefined) {
                    object.rotation.setFromVector3(this.vectorFromXYZ(object.rotation).add(step.rotation));
                }
                index--;
            }
        }, this.settings.interval);
    }

    vectorFromXYZ(xyz, vector = new THREE.Vector3()) { return vector.set(xyz.x, xyz.y, xyz.z); }
}

/*

    addPlayers(players, withSelf) {
        for (const [key, value] of Object.entries(players)) {
            if (withSelf === true && key === this.clientId) {
                this.players[key] = new Player();
                this.players[key].init(
                    "self",
                    this.settings,
                    this.manager,
                    this.scene);
                this.players[key].set(value);
                this.controls = new Controls(this.settings, this.game.ingameui.canvas, this.game.ws, this.players[key]);
            } else {
                this.players[key] = new Player();
                this.players[key].init(
                    "player",
                    this.settings,
                    this.manager,
                    this.scene);
                this.players[key].set(value);
            }
        }
    }

animate() {
        //despawn whren out of boundsw
        if (this.self.yaw.position.y < -25 ||
            this.self.yaw.position.y > 250 ||
            this.self.yaw.position.x < -250 ||
            this.self.yaw.position.x > 250 ||
            this.self.yaw.position.z < -250 ||
            this.self.yaw.position.z > 250
        ) {
            ws.sendJson({
                hit: {
                    id: ws.playerId
                }
            });
            this.playAudio("ugh");
        }

        //bullets
        const sc = this.scene.children;
        for (let i = 0; i < sc.length; i++) {
            if (sc[i].name && sc[i].name.split("_")[0] === "b") {
                //bullets
                const json = JSON.parse(sc[i].startPos);
                //remove bullets out of bounds
                if (sc[i].position.distanceTo(new THREE.Vector3(json.x, json.y, json.z)) > this.settings.bullet.end) {
                    this.scene.remove(sc[i]);
                }
                else {
                    //check if bullet is near players
                    // for (const player of ws.players) {
                    //     let playerObj = this.scene.getObjectByName(player.id);
                    //     if(sc[i].name.split("_")[1] !== player.id && playerObj && this.colisionDetect(playerObj, sc[i], 5)){
                    //         sc[i].prevPlayerInRange = sc[i].playerInRange;
                    //         sc[i].playerInRange = player.id;
                    //         break;
                    //     }
                    //     else if(sc[i].name.split("_")[1] !== player.id){
                    //         sc[i].prevPlayerInRange = sc[i].playerInRange;
                    //         sc[i].playerInRange = null;
                    //     }
                    // }

                    // if (sc[i].playerInRange !== sc[i].prevPlayerInRange && sc[i].playerInRange) {
                    //     sc[i].lookAt(this.scene.getObjectByName(sc[i].playerInRange).position);
                    //     //sc[i].rotation.set(sc[i].rotation._x, sc[i].rotation._y + Math.PI, sc[i].rotation._z);
                    // }

                    //self hit detection
                    if (!this.waitForSpawn && sc[i].name.split("_")[1] !== ws.playerId && this.colisionDetect(this.self.yaw, sc[i])) {
                        ws.sendJson({
                            hit: {
                                id: ws.playerId,
                                hitter: sc[i].name.split("_")[1]
                            }
                        });
                        this.scene.remove(sc[i]);
                        this.waitForSpawn = true;
                        this.playAudio("ugh");
                    }
                    else {
                        sc[i].position.add(
                            sc[i].getWorldDirection(new THREE.Vector3())
                                .multiplyScalar(this.settings.bullet.speed)
                        );
                        sc[i].position.y -= this.settings.bullet.gravity;
                    }

                    //hits from others
                    for (const player of ws.players) {
                        let playerObj = this.scene.getObjectByName(player.id);
                        //console.log(playerObj.geometry);
                        if (ws.playerId !== player.id && this.colisionDetect(playerObj, sc[i])) {
                            this.lastHitTime = new Date().getTime();
                            // this.scene.remove(sc[i]);
                        }
                    }
                }
            }
        }
    }

colisionDetect(obj1, obj2) {
    //requirement: both objs need to be in same space (no parenting)
    for (var vertexIndex = 0; vertexIndex < obj1.geometry.vertices.length; vertexIndex++) {
        var localVertex = obj1.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(obj1.matrix);
        var directionVector = globalVertex.sub(obj1.position);

        var ray = new THREE.Raycaster(obj1.position.clone(), directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects([obj2]);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            return true;
        }
    }
}

setSelf(obj) {
    this.waitForSpawn = false;
    this.self.yaw.name = obj.id;
    this.self.yaw.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
    if (obj.color) this.self.pitch.material.color.setHex(parseInt(obj.color.substring(1), 16))
    let look = new THREE.Object3D();
    look.position.set(obj.loc.x, obj.loc.y, obj.loc.z);
    look.lookAt(this.scene.getObjectByName("rotateCube").position);
    this.self.yaw.rotation.set(0, look.rotation._y, 0);
}

setPlayer(id, loc) {
    const obj = this.scene.getObjectByName(id);
    if (obj) {
        obj.position.set(loc.x, loc.y, loc.z);
        obj.rotation.set(loc._x, loc._y, loc._z);
    }
}

getPlayer() {
    return {
        position: this.self.pitch.getWorldPosition(new THREE.Vector3()),
        rotation: new THREE.Euler().setFromQuaternion(this.self.pitch.getWorldQuaternion(new THREE.Quaternion()))
    };
}

playAudio(name) {
    this.audio[name].play();
}
*/