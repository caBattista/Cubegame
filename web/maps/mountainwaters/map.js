import * as THREE from '../../three/three.module.js';

class Map2 {

    constructor() { }

    init() {
        return new Promise((resolve, reject) => {
            THREE.DefaultLoadingManager.onLoad = () => {
                let mapJSON = {
                    type: "mountainwaters",
                    max_players: 10,
                    players: 0,
                    settings: {
                        gravity: 0.1
                    },
                    static_objects: []
                };
                this.scene.children.forEach(object => {
                    object.updateMatrixWorld(true);
                    let objJSON = object.toJSON();
                    if (objJSON.images) {
                        objJSON.images.forEach(image => {
                            if (this.textureIds[image.uuid]) {
                                image.url = this.textureIds[image.uuid].data.currentSrc.
                                    split(location.href + "maps/" + mapJSON.type + "/textures/")[1].split("?")[0];
                            }
                        })
                    }
                    mapJSON.static_objects.push(objJSON);
                });
                resolve(mapJSON);
            };
            this.textureIds = {}
            this.loadTextures();
            this.scene = new THREE.Scene();
            this.createElements({
                graphics_quality: "High"
            });
        });
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

    createElements(settings) {

        let material;

        //##################### lights #####################
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        ambientLight.name = "ambientLight";

        this.scene.add(ambientLight);

        const sun = new THREE.DirectionalLight(0xffffff, 0.5);
        // if (settings.graphics_quality === "High") {
            sun.castShadow = true;
            sun.shadow.camera.left = -200;
            sun.shadow.camera.right = 200;
            sun.shadow.camera.top = 200;
            sun.shadow.camera.bottom = -200;
            sun.shadow.mapSize.width = 2048;//32768;
            sun.shadow.mapSize.height = 2048;//32768;
            sun.shadow.camera.near = 0.1;
            sun.shadow.camera.far = 1000;
        // }
        sun.position.set(170, 130, 280);
        sun.lookAt(new THREE.Vector3(0, 1, 0));
        // scene.add(new THREE.DirectionalLightHelper( sun ));
        // scene.add(new THREE.CameraHelper( sun.shadow.camera ));
        sun.name = "sun";

        this.scene.add(sun);

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

        // this.scene.add(skyBox);

        //##################### floor #####################

        // if (settings.graphics_quality === "High") {
        //     material = new THREE.MeshPhongMaterial({
        //         map: this.textures["maps/mountainwaters/textures/concrete/concrete_d.png"],
        //         bumpMap: this.textures["maps/mountainwaters/textures/concrete/concrete_b.png"],
        //         specularMap: this.textures["maps/mountainwaters/textures/concrete/concrete_s.png"]
        //     });
        // } else {
        //     material = new THREE.MeshPhongMaterial({
        //         color: 0x33323,
        //         wireframe: settings.useWireframe
        //     });
        // }

        // const meshFloor = new THREE.Mesh(new THREE.PlaneGeometry(250, 250, 10, 10), new THREE.MeshPhongMaterial({
        //     color: 0xffffff,
        //     wireframe: settings.useWireframe
        // }));
        // meshFloor.name = "floor";
        // meshFloor.rotation.x -= Math.PI / 2;
        // meshFloor.receiveShadow = settings.graphics_quality === "High";
        // this.scene.add(meshFloor);

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

        let instances = 10000;
        const matrix = new THREE.Matrix4();
        const mesh = new THREE.InstancedMesh(new THREE.BoxBufferGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false }), instances);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); //what does this do?

        // const position = new THREE.Vector3();
        // const rotation = new THREE.Euler();
        // const quaternion = new THREE.Quaternion();
        // const scale = new THREE.Vector3();
        for (let i = 0; i < instances; i++) {
            // position.x = Math.round(Math.random() * 100 - 50);
            // position.y = Math.round(Math.random() * 100 - 50);
            // position.z = Math.round(Math.random() * 100 - 50);
            // rotation.x = Math.round(Math.random() * 2 * Math.PI);
            // rotation.y = Math.round(Math.random() * 2 * Math.PI);
            // rotation.z = Math.round(Math.random() * 2 * Math.PI);
            // quaternion.setFromEuler(rotation);
            // scale.x = scale.y = scale.z = 1;
            // matrix.compose(position, new THREE.Quaternion(), new THREE.Vector3(1,1,1));
            // mesh.setMatrixAt(i, matrix);
            mesh.setColorAt (i, new THREE.Color(THREE.MathUtils.randInt(0, 0xffffff)));
        }

        mesh.name = "instanced";
        mesh.userData.physics = { mass: (Math.random() * 10), currentSpeed: { x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*5, z: (Math.random()-0.5)*5 }  };
        this.scene.add(mesh);


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
    }

    animate() {
        //water
        //this.elements.water.material.uniforms.time.value += 1.0 / 60.0;

        //center rotating cube
        // this.elements.centerCube.rotation.x += 0.001;
        // this.elements.centerCube.rotation.y += 0.002;
    }

}

export default Map2