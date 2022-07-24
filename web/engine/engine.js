import * as THREE from '../three/three.module.js';
import { OBJLoader } from '../three/OBJLoader.js';
import { Stats } from '../engine/stats.js';

class Engine {
    constructor(clientId, canvas, settings, characters) {
        this.clientId = clientId;

        // ############# settings #############
        this.settings = settings;
        this.settings.interval = 1000 / 30;
        this.settings.smoothing = { divider: Math.round((1000 / 30) / (this.settings.interval)), smoothingHandlers: {} };
        console.log(this.settings);

        // ############# characters #############
        this.characters = characters;

        // ############# sound #############
        // this.audio = {
        //     ugh: new Audio('maps/mountainwaters/audio/ugh.mp3'),
        //     hit: new Audio('maps/mountainwaters/audio/hit.mp3')
        // };

        // ############# players #############
        this.players = {};

        // ############# init process #############
        this.initLoadingManager();
        this.manager.onLoad = () => {//restarts whenn new player comes
        };

        //init renderer
        this.canvas = {
            object: canvas,
            height: canvas.height,
            width: canvas.width,
            aspect: canvas.width / canvas.height
        };
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas.object,
            antialias: true
        });
        console.log(this.renderer.capabilities.isWebGL2);
        this.renderer.setSize(this.canvas.width, this.canvas.height, false);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.startRender();
        const waitForRender = setInterval(() => {
            if (this.renderloop) {
                clearInterval(waitForRender);
                //remove onload or uexpected behavior when textures are loaded by a new player
                this.manager.onLoad = () => { };
            }
        }, 100);

        this.scene = new THREE.Scene();

        //top down Camera
        this.camera = new THREE.PerspectiveCamera(90, this.canvas.aspect, 0.1, 10000000);
        this.camera.rotation.set((Math.PI / 2), Math.PI, 0);
        this.camera.position.set(0, 500, 0);
        this.scene.add(this.camera);

        // //detect Canvas resize and fix aspect ratio
        // setInterval(() => {
        //     if (this.canvas.object.width !== this.canvas.width || this.canvas.object.height !== this.canvas.height) {
        //         this.canvas.width = this.canvas.object.width;
        //         this.canvas.height = this.canvas.object.height;
        //         this.canvas.aspect = this.canvas.width / this.canvas.height;
        //         this.camera.aspect = this.canvas.aspect;
        //         this.camera.updateProjectionMatrix();
        //         this.renderer.setSize(this.canvas.width, this.canvas.height, false);
        //     }
        // }, 250);
    }

    initLoadingManager() {
        this.manager = THREE.DefaultLoadingManager;
        // this.game.ingameui.createProgressBar();
        // this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
        //     this.game.ingameui.updateProgressBar(itemsLoaded, itemsTotal, `
        //         Loading: ${url.replace(/^.*[\\\/]/, '').split("?")[0]} ${itemsLoaded} of ${itemsTotal}`);
        // };
        this.objectLoader = new THREE.ObjectLoader(this.manager);//using DefaultLoadingManager
    }

    startRender() {
        this.stats = new Stats();

        // this.stats2 = new Stats();
        // this.stats2.getData(data => { console.log(data); });

        //this.renderloop = setInterval(this.render.bind(this), this.settings.interval);

        setInterval(() => { console.log(this.renderer.info); }, 1000);

        function loop() {
            this.render();
            requestAnimationFrame(loop.bind(this));
        }
        requestAnimationFrame(loop.bind(this));
    }

    render() {
        this.stats.start();
        for (const [uuid, obj] of Object.entries(this.settings.smoothing.smoothingHandlers)) {
            obj.handler(obj);
            if (obj.index < 0) { delete this.settings.smoothing.smoothingHandlers[uuid]; }
        }
        // const time = performance.now();
        // const object = this.scene.children[this.scene.children.length - 1];
        // object.rotation.y = time * 0.0005;
        // object.material.uniforms['time'].value = time * 0.005;
        // object.material.uniforms['sineTime'].value = Math.sin(object.material.uniforms['time'].value * 0.05);

        this.renderer.render(this.scene, this.camera);
        this.stats.end();
    }

    addObjects(data) {

        data.objects.forEach(object => {
            this.objectLoader.setResourcePath(`maps/${data.type}/textures/`);
            let parsedObject = this.objectLoader.parse(object);
            //players
            if (object.object.userData && object.object.userData.playerId) {
                if (object.object.userData.playerId === this.clientId) {
                    this.camera.rotation.set(0.4, Math.PI, 0);
                    this.camera.position.set(0, 4, -8);
                    //this.camera.rotation.set(0, Math.PI, 0);
                    //this.camera.position.set(0, 0, 0);
                    parsedObject.children[0].add(this.camera);
                }
                this.players[this.clientId] = parsedObject;
            }
            this.scene.add(parsedObject);
        });

        // // geometry

        // const vector = new THREE.Vector4();
        // const instances = 50000;
        // const positions = [];
        // const offsets = [];
        // const colors = [];
        // const orientationsStart = [];
        // const orientationsEnd = [];
        // positions.push(0.025, - 0.025, 0);
        // positions.push(- 0.025, 0.025, 0);
        // positions.push(0, 0, 0.025);

        // // instanced attributes

        // for (let i = 0; i < instances; i++) {
        //     // offsets
        //     offsets.push(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        //     // colors
        //     colors.push(Math.random(), Math.random(), Math.random(), Math.random());
        //     // orientation start
        //     vector.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        //     vector.normalize();
        //     orientationsStart.push(vector.x, vector.y, vector.z, vector.w);
        //     // orientation end
        //     vector.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        //     vector.normalize();
        //     orientationsEnd.push(vector.x, vector.y, vector.z, vector.w);
        // }

        // const geometry = new THREE.InstancedBufferGeometry();
        // geometry.instanceCount = instances; // set so its initalized for dat.GUI, will be set in first draw otherwise

        // geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
        // geometry.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(colors), 4));
        // geometry.setAttribute('orientationStart', new THREE.InstancedBufferAttribute(new Float32Array(orientationsStart), 4));
        // geometry.setAttribute('orientationEnd', new THREE.InstancedBufferAttribute(new Float32Array(orientationsEnd), 4));

        // // material

        // const material = new THREE.RawShaderMaterial({

        //     uniforms: {
        //         'time': { value: 1.0 },
        //         'sineTime': { value: 1.0 }
        //     },
        //     vertexShader: `precision highp float;

        //     uniform float sineTime;

        //     uniform mat4 modelViewMatrix;
        //     uniform mat4 projectionMatrix;

        //     attribute vec3 position;
        //     attribute vec3 offset;
        //     attribute vec4 color;
        //     attribute vec4 orientationStart;
        //     attribute vec4 orientationEnd;

        //     varying vec3 vPosition;
        //     varying vec4 vColor;

        //     void main(){

        //         vPosition = offset * max( abs( sineTime * 2.0 + 1.0 ), 0.5 ) + position;
        //         vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );
        //         vec3 vcV = cross( orientation.xyz, vPosition );
        //         vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );

        //         vColor = color;

        //         gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );

        //     }`,
        //     fragmentShader: `precision highp float;

        //     uniform float time;

        //     varying vec3 vPosition;
        //     varying vec4 vColor;

        //     void main() {

        //         vec4 color = vec4( vColor );
        //         color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

        //         gl_FragColor = color;

        //     }`,
        //     side: THREE.DoubleSide,
        //     transparent: true

        // });

        // const mesh = new THREE.Mesh(geometry, material);
        // mesh.scale.set(100,100,100)
        // this.scene.add(mesh);

        // let instances = 2000000;
        // const matrix = new THREE.Matrix4();
        // const material = new THREE.ShaderMaterial({
        //     uniforms: {
        //         time: { value: 1.0 },
        //         resolution: { value: new THREE.Vector2() }
        //     },
        //     /*vertexShader: `
        //     void main() {
        //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        //     }`,*/
        //     fragmentShader: `
        //     void main() {
        //         gl_FragColor = vec4(0.5, 0.0, 0.0, 0.5);
        //     }`
        // });
        // const mesh = new THREE.InstancedMesh(new THREE.BoxBufferGeometry(1, 1, 1),
        //     /*material*/new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false }), instances);
        // mesh.receiveShadow = true;
        // mesh.castShadow = true;

        // const position = new THREE.Vector3();
        // const rotation = new THREE.Euler();
        // const quaternion = new THREE.Quaternion();
        // const scale = new THREE.Vector3();
        // for (let i = 0; i < instances; i++) {
        //     position.x = Math.round(Math.random() * 1000 - 500);
        //     position.y = Math.round(Math.random() * 1000 - 500);
        //     position.z = Math.round(Math.random() * 1000 - 500);
        //     rotation.x = Math.round(Math.random() * 2 * Math.PI);
        //     rotation.y = Math.round(Math.random() * 2 * Math.PI);
        //     rotation.z = Math.round(Math.random() * 2 * Math.PI);
        //     quaternion.setFromEuler(rotation);
        //     scale.x = scale.y = scale.z = Math.random() * 1;
        //     matrix.compose(position, quaternion, scale);
        //     mesh.setMatrixAt(i, matrix);
        //     mesh.setColorAt(i, new THREE.Color(THREE.MathUtils.randInt(0, 0xffffff)));
        //     //mesh.setUniformsAt("time", i, Math.random())
        // }
        // this.scene.add(mesh);

        // var particles = 10000000;
        // var geometry = new THREE.BufferGeometry();
        // var positions = [];
        // var n = 100000,
        //     n2 = n / 2; // particles spread in the cube
        // for (var i = 0; i < particles; i++) {
        //     // positions
        //     var x = Math.random() * n - n2;
        //     var y = Math.random() * n - n2;
        //     var z = Math.random() * n - n2;
        //     positions.push(x, y, z);
        // }
        // geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        // geometry.computeBoundingSphere();
        // var material = new THREE.PointsMaterial({
        //     size: 1,
        //     color: 0x00aa00
        // });
        // let p = new THREE.Points(geometry, material);
        // this.scene.add(p);

        // // // instantiate a loader
        // const loader = new OBJLoader();
        // // // load a resource
        // loader.load(`/maps/${data.type}/Triss_V1.obj`,
        //     function (object) {
        //         let instances = 1000;
        //         const matrix = new THREE.Matrix4();
        //         const mesh = new THREE.InstancedMesh(object.children[0].geometry,
        //             new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false }), instances);
        //         const position = new THREE.Vector3();
        //         const rotation = new THREE.Euler();
        //         const quaternion = new THREE.Quaternion();
        //         const scale = new THREE.Vector3();
        //         for (let i = 0; i < instances; i++) {
        //             position.x = Math.round(Math.random() * 10000 - 5000);
        //             position.y = Math.round(Math.random() * 10000 - 5000);
        //             position.z = Math.round(Math.random() * 10000 - 5000);
        //             //rotation.x = Math.round(Math.random() * 2 * Math.PI);
        //             //rotation.y = Math.round(Math.random() * 2 * Math.PI);
        //             //rotation.z = Math.round(Math.random() * 2 * Math.PI);
        //             quaternion.setFromEuler(rotation);
        //             scale.x = scale.y = scale.z = 1;//Math.random() * 10;
        //             matrix.compose(position, quaternion, scale);
        //             mesh.setMatrixAt(i, matrix);
        //             mesh.setColorAt(i, new THREE.Color(THREE.MathUtils.randInt(0, 0xffffff)));
        //         }
        //         mesh.receiveShadow = true;
        //         mesh.castShadow = true;
        //         this.scene.add(mesh);
        //     }.bind(this),
        //     function (xhr) { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
        //     function (error) { console.log('An error happened', error); }
        // );
    }

    updateObjects(mapChange) {

        //this.stats2.start();
        //kinda slow
        // for (const [objectId, change] of Object.entries(mapChange)) {
        //     let object = this.scene.getObjectByProperty("uuid", objectId);
        //     if (object !== undefined) {
        //         this.moveNormal(change, object);
        //         //this.moveSmoothed(change, object);
        //     }
        // }

        //8x faster
        // const keys = Object.keys(mapChange);
        // this.scene.traverse(object => {
        //     const index = keys.indexOf(object.uuid);
        //     if (index !== -1) { this.moveNormal(mapChange[keys[index]], object); }
        // });

        //fastest 10x faster
        this.scene.traverse(object => {
            const objectChange = mapChange[object.uuid];
            if (objectChange !== undefined) {
                if (object.isInstancedMesh === true) {
                    const matrix = new THREE.Matrix4();
                    const position = new THREE.Vector3();
                    const rotation = new THREE.Euler();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    for (let i = 0; i < objectChange.length; i += 3) {
                        position.x = objectChange[i];
                        position.y = objectChange[i+1];
                        position.z = objectChange[i+2];
                        rotation.x = Math.round(Math.random() * 2 * Math.PI);
                        rotation.y = Math.round(Math.random() * 2 * Math.PI);
                        rotation.z = Math.round(Math.random() * 2 * Math.PI);
                        quaternion.setFromEuler(rotation);
                        scale.x = scale.y = scale.z = 1;
                        matrix.compose(position, quaternion, scale);
                        object.setMatrixAt(i, matrix);
                        object.instanceMatrix.needsUpdate = true;
                    }
                } else {
                    this.moveSmoothed(objectChange, object);
                }
            }
        });

        // // interesting for server
        // const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
        // this.scene.traverse(object => {
        //     const objectChange = mapChange[object.uuid];
        //     if (objectChange !== undefined) {
        //         if (object.userData.playerId || object.parent.userData.playerId) {
        //             this.moveSmoothed(objectChange, object);
        //         } else if (frustum.containsPoint(this.vectorFromXYZ(object.position)) || frustum.containsPoint(this.vectorFromXYZ(objectChange.p))) {
        //             this.moveSmoothed(objectChange, object);
        //         }
        //     }
        // })
        //this.stats2.end();
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

    moveNormal(data, object) {
        if (data.p !== undefined) { object.position.set(data.p.x, data.p.y, data.p.z); }
        if (data.r !== undefined) { object.rotation.setFromVector3(this.vectorFromXYZ(data.r)); }
    }

    moveSmoothed(data, object) {
        //calculate step values (distance to move in steps between frames)
        let step = {};
        if (data.p !== undefined) {
            step.position = this.vectorFromXYZ(data.p)
                .sub(object.position).divideScalar(this.settings.smoothing.divider);
        }
        if (data.r !== undefined) {//euler
            step.rotation = this.vectorFromXYZ(data.r)
                .sub(this.vectorFromXYZ(object.rotation)).divideScalar(this.settings.smoothing.divider);
        }

        this.settings.smoothing.smoothingHandlers[object.uuid] = {
            index: this.settings.smoothing.divider - 1,
            handler: (obj) => {
                if (obj.index <= 0) {
                    if (step.position !== undefined) { this.vectorFromXYZ(data.p, object.position); }
                    if (step.rotation !== undefined) { object.rotation.setFromVector3(data.r); }
                } else {
                    if (step.position !== undefined) { object.position.add(step.position); }
                    if (step.rotation !== undefined) {
                        object.rotation.setFromVector3(this.vectorFromXYZ(object.rotation).add(step.rotation));
                    }
                }
                obj.index--;
            }
        };
    }

    // moveSmoothed(data, object) {
    //     //console.log(object.userData.smoothingInterval);//debug
    //     clearInterval(object.userData.smoothingInterval);

    //     //calculate step values (distance to move in steps between frames)
    //     let step = {};
    //     if (data.p !== undefined) {
    //         step.position = this.vectorFromXYZ(data.p)
    //             .sub(object.position).divideScalar(this.settings.smoothing.divider);
    //     }
    //     if (data.r !== undefined) {//euler
    //         step.rotation = this.vectorFromXYZ(data.r)
    //             .sub(this.vectorFromXYZ(object.rotation)).divideScalar(this.settings.smoothing.divider);
    //     }

    //     let index = this.settings.smoothing.divider - 1;

    //     if (data.p !== undefined) { object.position.add(step.position); }
    //     if (data.r !== undefined) {
    //         object.rotation.setFromVector3(this.vectorFromXYZ(object.rotation).add(step.rotation));
    //     }

    //     object.userData.smoothingInterval = setInterval(() => {
    //         if (index <= 0) {
    //             clearInterval(object.userData.smoothingInterval);
    //             // object.userData.smoothingInterval = undefined;//debug
    //             if (step.position !== undefined) { this.vectorFromXYZ(data.p, object.position); }
    //             if (step.rotation !== undefined) { object.rotation.setFromVector3(data.r); }
    //         } else {
    //             if (step.position !== undefined) { object.position.add(step.position); }
    //             if (step.rotation !== undefined) {
    //                 object.rotation.setFromVector3(this.vectorFromXYZ(object.rotation).add(step.rotation));
    //             }
    //             index--;
    //         }
    //     }, this.settings.interval);
    //   }

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

export default Engine 