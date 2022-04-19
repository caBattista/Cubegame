class Engine {
    constructor(game, settings, characters, clientId) {
        this.game = game;

        this.addCid = url => { return url + "?client_id=" + clientId; };

        // ############# settings #############

        this.settings = settings;
        this.settings.useWireframe = false;
        this.settings.physics = { gravity: 0.3 };
        this.settings.self = { height: 0, speed: 0.2, turnSpeed: Math.PI * 0.005 };
        this.settings.player = { height: 0, speed: 0.2, turnSpeed: Math.PI * 0.005 };
        this.settings.bullet = { height: 0.4, speed: 2, end: 500, gravity: 0 };

        // ############# characters #############

        this.characters = characters;

        // ############# sound #############

        this.audio = {
            ugh: new Audio(this.addCid('maps/mountainwaters/audio/ugh.mp3')),
            hit: new Audio(this.addCid('maps/mountainwaters/audio/hit.mp3'))
        };

        // ############# players #############
        this.players = {};

        // ############# init process #############

        this.initLoadingManager();
        this.manager.onLoad = () => {
            this.initRenderer();
            this.initResizeHandler();
            this.startRender();
            const waitForRender = setInterval(() => {
                if (this.renderloop) {
                    clearInterval(waitForRender);
                    this.game.ingameui.removeProgressBar();
                    this.game.ingameui.show();
                }
            }, 100);
        };
        this.initScene();
    }

    initLoadingManager() {
        this.manager = new THREE.LoadingManager();
        this.manager.resolveURL = this.addCid;
        this.game.ingameui.createProgressBar();
        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.game.ingameui.updateProgressBar(itemsLoaded, itemsTotal, `
                Loading: ${url.replace(/^.*[\\\/]/, '').split("?")[0]} ${itemsLoaded} of ${itemsTotal}
            `);
        };
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.physics = new Pysics().init(this.settings);
        this.map = new Map().init(this.settings, this.manager, this.scene, this.physics);
        this.self = new Self().init(this.settings, this.manager, this.scene, this.physics);
        this.controls = new Controls().init(this.settings, this.self, this.game.ingameui.canvas);
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
            this.self.elements.camera.aspect = window.innerWidth / window.innerHeight;
            this.self.elements.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    startRender() {

        this.stats0 = new Stats();

        const renderScene = () => {
            this.stats0.start();

            this.map.animate();

            let changed = false;
            let changes = {};

            if (this.controls.animate(this.self)) {
                changed = true;
                changes.self = this.controls.posRot;
            }
            if (changed === true) { this.handleChanges1(changes); }

            this.physics.animate();

            this.renderer.render(this.scene, this.self.elements.camera);

            this.stats0.end();
        }

        this.renderloop = setInterval(() => {
            requestAnimationFrame(() => { renderScene(); });
        }, 16);
    }

    createMapState(mapState, clientId) {
        this.self.set(mapState.players[clientId]);
        delete mapState.players[clientId];
        this.addPlayers(mapState.players);
    }

    addPlayers(players) {
        for (const [key, values] of Object.entries(players)) {
            this.players[key] = new Player();
            this.players[key].init(
                this.settings,
                this.manager,
                this.scene,
                this.physics);
            this.players[key].set(values);
        }
    }

    updatePlayers(players) {
        for (const [key, values] of Object.entries(players)) {
            this.players[key].set(values);
        }
    }

    removePlayers(players) {
        for (const [key, values] of Object.entries(players)) {
            this.scene.remove(this.players[key].elements.player);
            delete this.players[key];
        }
    }

    handleChanges(callback) {
        this.handleChanges1 = callback;
    }

    dispose() {
        clearInterval(this.renderloop);
    }
}

/*
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