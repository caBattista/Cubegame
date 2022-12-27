import * as THREE from '../../three/three.module.js';

class Map2 {

    init() {
        return new Promise((resolve, reject) => {
            THREE.DefaultLoadingManager.onLoad = () => {
                this.currentGId = -1;
                this.currentEId = -1;
                this.map = {
                    settings: { type: "mountainwaters", max_players: 10, },
                    entities: [],
                    graphicsObjects: [],
                    components: { graphics: [], physics: [] },
                }
                this.createElements({ graphics_quality: "High" });
                this.map.graphicsObjects.forEach(objJSON => {
                    if (objJSON.images) {
                        objJSON.images.forEach(image => {
                            if (this.textureIds[image.uuid]) {
                                image.url = this.textureIds[image.uuid].data.currentSrc.
                                    split(location.href + "maps/" + this.map.settings.type + "/textures/")[1];
                            }
                        })
                    }
                });
                console.log("MAP CREATE:", this.map);
                resolve(this.map);
            };
            this.textureIds = {};
            this.loadTextures();
        });
    }

    createElements(settings) {
        //##################### lights #####################

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        ambientLight.name = "ambientLight";

        this.map.graphicsObjects[++this.currentGId] = ambientLight.toJSON();
        let gid = this.map.components.graphics.length;
        this.map.entities[++this.currentEId] = { graphics: gid };
        this.map.components.graphics[gid] = { gObj: this.currentGId };

        const sun = new THREE.DirectionalLight(0xffffff, 0.95);
        if (settings.graphics_quality === "High") {
            sun.castShadow = true;
            sun.shadow.camera.left = -200;
            sun.shadow.camera.right = 200;
            sun.shadow.camera.top = 200;
            sun.shadow.camera.bottom = -200;
            sun.shadow.mapSize.width = 16384;//32768;
            sun.shadow.mapSize.height = 16384;//32768;
            sun.shadow.camera.near = 0.1;
            sun.shadow.camera.far = 10000;
        }
        sun.position.set(1000, 1000, 1000);
        sun.lookAt(new THREE.Vector3(0, 0, 0));
        // scene.add(new THREE.DirectionalLightHelper( sun ));
        // scene.add(new THREE.CameraHelper( sun.shadow.camera ));
        sun.name = "sun";

        this.map.graphicsObjects[++this.currentGId] = sun.toJSON();
        gid = this.map.components.graphics.length;
        this.map.entities[++this.currentEId] = { graphics: gid };
        this.map.components.graphics[gid] = { gObj: this.currentGId };

        // //##################### skybox #####################         
        // const directions = ["left", "right", "back", "front", "bottom", "top"];
        // let materialArray = [];
        // for (let i = 0; i < 6; i++)
        //     materialArray.push(new THREE.MeshBasicMaterial({
        //         map: this.textures["maps/mountainwaters/textures/skybox/" + directions[i] + ".jpg"],
        //         side: THREE.BackSide
        //     }));
        // const skyGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
        // const skyBox = new THREE.Mesh(skyGeometry, materialArray);
        // skyBox.rotation.x += Math.PI / 2;
        // skyBox.position.set(0, 5, 0);
        // skyBox.name = "skybox";

        // skyBox.updateMatrixWorld(true);
        // this.map.graphicsObjects[++this.currentGId] = skyBox.toJSON();
        // gid = this.map.components.graphics.length;
        // this.map.entities[++this.currentEId] = { graphics: gid };
        // this.map.components.graphics[gid] = { gObj: this.currentGId };

        //##################### floor #####################

        let material;
        if (settings.graphics_quality === "High" && false) {
            material = new THREE.MeshPhongMaterial({
                map: this.textures["maps/mountainwaters/textures/concrete/concrete_d.png"],
                bumpMap: this.textures["maps/mountainwaters/textures/concrete/concrete_b.png"],
                specularMap: this.textures["maps/mountainwaters/textures/concrete/concrete_s.png"],
                side: THREE.DoubleSide
            });
        } else {
            material = new THREE.MeshPhongMaterial({
                color: 0xaaaaaa,
                wireframe: settings.useWireframe,
                side: THREE.DoubleSide
            });
        }

        const meshFloor = new THREE.Mesh(new THREE.PlaneGeometry(250, 250, 10, 10), material);
        meshFloor.name = "floor";
        meshFloor.rotation.x -= Math.PI / 2;
        meshFloor.receiveShadow = settings.graphics_quality === "High";

        meshFloor.updateMatrixWorld(true);
        this.map.graphicsObjects[++this.currentGId] = meshFloor.toJSON();
        gid = this.map.components.graphics.length;
        this.map.entities[++this.currentEId] = { graphics: gid };
        this.map.components.graphics[gid] = { gObj: this.currentGId };

        let instances = 2000;
        const dimensions = [1, 1, 1];
        const geometry = new THREE.BoxBufferGeometry(...dimensions);
        const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false }), instances);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); //what does this do?
        mesh.name = "intancedCubes";

        let matrix = new THREE.Matrix4();
        let rotation = new THREE.Euler();
        let quaternion = new THREE.Quaternion();
        let position = new THREE.Vector3();
        let scale = new THREE.Vector3(1, 1, 1);

        let gOid = ++this.currentGId;
        for (let i = 0; i < instances; i++) {

            //create instances
            position.set(
                (Math.random() - 0.5) * 1000,
                (Math.random()) * 500,
                (Math.random() - 0.5) * 1000);
            quaternion.setFromEuler(rotation);
            matrix.compose(position, quaternion, scale);
            mesh.setMatrixAt(i, matrix);
            mesh.setColorAt(i, new THREE.Color(THREE.MathUtils.randInt(0, 0xffffff)));

            //create ecs components
            let gid = this.map.components.graphics.length;
            let pid = this.map.components.physics.length;
            this.map.entities[++this.currentEId] = { graphics: gid, physics: pid };
            this.map.components.graphics[gid] = { gObj: gOid, inst: i };
            this.map.components.physics[pid] = {
                eId: this.currentEId,
                dimensions: dimensions,
                matrix: matrix.toArray(),
                mass: 100,
                speed: [
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2]
            };
        }

        mesh.updateMatrixWorld(true);
        this.map.graphicsObjects[gOid] = mesh.toJSON();
    }

    textures = {
        "maps/mountainwaters/textures/skybox/left.jpg": { type: "texture" },
        "maps/mountainwaters/textures/skybox/right.jpg": { type: "texture" },
        "maps/mountainwaters/textures/skybox/back.jpg": { type: "texture" },
        "maps/mountainwaters/textures/skybox/front.jpg": { type: "texture" },
        "maps/mountainwaters/textures/skybox/bottom.jpg": { type: "texture" },
        "maps/mountainwaters/textures/skybox/top.jpg": { type: "texture" },
        "maps/mountainwaters/textures/water/waternormals.jpg": {
            type: "texture", fn: texture => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        },
        "maps/mountainwaters/textures/concrete/concrete_b.png": {
            type: "texture", fn: texture => {
                texture.repeat.set(512, 512);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        },
        "maps/mountainwaters/textures/concrete/concrete_d.png": {
            type: "texture", fn: texture => {
                texture.repeat.set(512, 512);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        },
        "maps/mountainwaters/textures/concrete/concrete_s.png": {
            type: "texture", fn: texture => {
                texture.repeat.set(512, 512);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        },
        "skyboxCube": {
            type: "cubeTexture", urls: [
                "maps/mountainwaters/textures/skybox/left.jpg",
                "maps/mountainwaters/textures/skybox/right.jpg",
                "maps/mountainwaters/textures/skybox/back.jpg",
                "maps/mountainwaters/textures/skybox/front.jpg",
                "maps/mountainwaters/textures/skybox/bottom.jpg",
                "maps/mountainwaters/textures/skybox/top.jpg",
            ]
        },

    }

    loadTextures() {
        const tl = new THREE.TextureLoader(THREE.DefaultLoadingManager);
        const ctl = new THREE.CubeTextureLoader(THREE.DefaultLoadingManager);
        for (const key in this.textures) {
            if (this.textures[key].type === "texture") {
                this.textures[key] = tl.load(key, this.textures[key].fn);
                this.textures[key].anisotropy = 16;
                this.textureIds[this.textures[key].source.uuid] = this.textures[key].source;
            }
            else if (this.textures[key].type === "cubeTexture") {
                this.textures[key] = ctl.load(this.textures[key].urls);
                this.textures[key].anisotropy = 16;
                this.textureIds[this.textures[key].source.uuid] = this.textures[key].source;
            }
        }
    }

}

export default Map2

// animate() {
//     // water
//     // this.elements.water.material.uniforms.time.value += 1.0 / 60.0;

//     // center rotating cube
//     // this.elements.centerCube.rotation.x += 0.001;
//     // this.elements.centerCube.rotation.y += 0.002;
// }

// //##################### water #####################
// //not running in this version
// const waterGeometry = new THREE.PlaneBufferGeometry(8000, 8000);
// if (settings.graphics_quality === "High") {
//     const water = new THREE.Water(
//         waterGeometry,
//         {
//             textureWidth: 1024,
//             textureHeight: 1024,
//             waterNormals: this.textures['maps/mountainwaters/textures/water/waternormals.jpg'],
//             alpha: 0.9,
//             sunDirection: new THREE.Vector3(0,0,0),
//             sunColor: 0xffffff,
//             waterColor: 0x00190f,
//             distortionScale: 5,
//             fog: this.scene.fog !== undefined,
//             wireframe: settings.useWireframe
//         }
//     );
//     water.material.uniforms.size.value = 1;
//     //water.position.set(0, -1, 0);
//     //water.rotation.x = - Math.PI / 2;
//     this.scene.add(water);
// }
// else {
//     const water = new THREE.Water(
//         waterGeometry,
//         {
//             alpha: 0.9,
//             sunDirection: sun.position.clone().normalize(),
//             sunColor: 0xffffff,
//             waterColor: 0x00190f,
//             distortionScale: 5,
//             fog: this.scene.fog !== undefined
//         }
//     );
//     water.position.set(0, -1, 0);
//     water.rotation.x = - Math.PI / 2;
//     this.scene.add(water);
// }

//##################### mesh #####################

// for (let i = 0; i < 1000; i++) {
//     let mesh = new THREE.Mesh(
//         new THREE.BoxGeometry(1, 1, 1),
//         new THREE.MeshPhongMaterial({ color: THREE.MathUtils.randInt(0, 0xffffff), wireframe: false })
//     );
//     //mesh.add(new THREE.PointLight( THREE.MathUtils.randInt(0, 0xffffff), 0.1, 0 ));
//     mesh.position.set((Math.random() * 250) - 125, (Math.random() * 125), (Math.random() * 250) - 125);
//     //mesh.receiveShadow = true;
//     //mesh.castShadow = true;
//     //mesh.name = "centerCube";
//     mesh.userData.physics = { mass: (Math.random() * 10), currentSpeed: { x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*5, z: (Math.random()-0.5)*5 }  };
//     this.scene.add(mesh);
// }

// let geometry = new THREE.SphereGeometry(10, 10, 10);
// material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, color: 0xaaaaaa });
// let sphere = new THREE.Mesh(geometry, material);
// //sphere.receiveShadow = true;
// //sphere.castShadow = true;
// sphere.position.set(2000, 0, 2000);
// sphere.name = "sphere";
// sphere.userData.physics = { mass: 1000000 };
// this.scene.add(sphere);

// geometry = new THREE.SphereGeometry(10, 10, 10);
// material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, color: 0xaaaaaa });
// sphere = new THREE.Mesh(geometry, material);
// //sphere.receiveShadow = true;
// //sphere.castShadow = true;
// sphere.position.set(-2000, 0, -2000);
// sphere.name = "sphere2";
// sphere.userData.physics = { mass: 1000000 };
// this.scene.add(sphere);