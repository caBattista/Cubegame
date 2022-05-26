class Map2 {

    constructor() { }

    init(settings, manager, scene) {
        this.loadTextures(manager);
        this.elements = {};
        this.createElements(settings, scene);
        return this;
    }

    textures = {
        // "maps/mountainwaters/textures/skybox/left.jpg": { type: "texture" },
        // "maps/mountainwaters/textures/skybox/right.jpg": { type: "texture" },
        // "maps/mountainwaters/textures/skybox/back.jpg": { type: "texture" },
        // "maps/mountainwaters/textures/skybox/front.jpg": { type: "texture" },
        // "maps/mountainwaters/textures/skybox/bottom.jpg": { type: "texture" },
        // "maps/mountainwaters/textures/skybox/top.jpg": { type: "texture" },
        // "maps/mountainwaters/textures/water/waternormals.jpg": {
        //     type: "texture", fn: texture => {
        //         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //     }
        // },
        // "maps/mountainwaters/textures/concrete/concrete_b.png": {
        //     type: "texture", fn: texture => {
        //         texture.repeat.set(512, 512);
        //         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //     }
        // },
        // "maps/mountainwaters/textures/concrete/concrete_d.png": {
        //     type: "texture", fn: texture => {
        //         texture.repeat.set(512, 512);
        //         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //     }
        // },
        // "maps/mountainwaters/textures/concrete/concrete_s.png": {
        //     type: "texture", fn: texture => {
        //         texture.repeat.set(512, 512);
        //         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //     }
        // },
        // "skyboxCube": {
        //     type: "cubeTexture", urls: [
        //         "maps/mountainwaters/textures/skybox/left.jpg",
        //         "maps/mountainwaters/textures/skybox/right.jpg",
        //         "maps/mountainwaters/textures/skybox/back.jpg",
        //         "maps/mountainwaters/textures/skybox/front.jpg",
        //         "maps/mountainwaters/textures/skybox/bottom.jpg",
        //         "maps/mountainwaters/textures/skybox/top.jpg",
        //     ]
        // },

    }

    loadTextures(manager) {
        const tl = new THREE.TextureLoader(manager);
        const ctl = new THREE.CubeTextureLoader(manager);
        for (const key in this.textures) {
            if (this.textures[key].type === "texture") {
                this.textures[key] = tl.load(key, this.textures[key].fn);
                this.textures[key].anisotropy = 16;
            }
            else if (this.textures[key].type === "cubeTexture") {
                this.textures[key] = ctl.load(this.textures[key].urls);
                this.textures[key].anisotropy = 16;
            }
        }
    }

    createElements(settings, scene) {

        // const geometry = new THREE.SphereGeometry(100, 100, 100);
        // const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, color: 0xaaaaaa });
        // const sphere = new THREE.Mesh(geometry, material);
        // sphere.receiveShadow = true;
        // sphere.name = "sphere";
        // scene.add(sphere);

        // //##################### lights #####################
        // const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        // ambientLight.name = "ambientLight";
        // scene.add(ambientLight);

        // const sun = new THREE.DirectionalLight(0xffffff, 0.5);
        // if (settings.graphics_quality === "High") {
        //     sun.castShadow = true;
        //     sun.shadow.camera.left = -200;
        //     sun.shadow.camera.right = 200;
        //     sun.shadow.camera.top = 200;
        //     sun.shadow.camera.bottom = -200;
        //     sun.shadow.mapSize.width = 2048;//32768;
        //     sun.shadow.mapSize.height = 2048;//32768;
        //     sun.shadow.camera.near = 0.1;
        //     sun.shadow.camera.far = 1000;
        // }
        // sun.position.set(170, 130, 280);
        // sun.lookAt(new THREE.Vector3(0, 1, 0));
        // // scene.add(new THREE.DirectionalLightHelper( sun ));
        // // scene.add(new THREE.CameraHelper( sun.shadow.camera ));
        // sun.name = "sun";
        // scene.add(sun);

        // //##################### skybox #####################         
        // const directions = ["left", "right", "back", "front", "bottom", "top"];
        // let materialArray = [];
        // for (let i = 0; i < 6; i++)
        //     materialArray.push(new THREE.MeshBasicMaterial({
        //         map: this.textures["maps/mountainwaters/textures/skybox/" + directions[i] + ".jpg"],
        //         side: THREE.BackSide,
        //         wireframe: settings.useWireframe
        //     }));
        // const skyGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
        // const skyBox = new THREE.Mesh(skyGeometry, materialArray);
        // skyBox.rotation.x += Math.PI / 2;
        // skyBox.position.set(0, 5, 0);
        // skyBox.name = "skybox";
        // scene.add(skyBox);
        // this.elements.skyBox = skyBox;

        // //##################### floor #####################
        // let material;
        // if (settings.graphics_quality === "High") {
        //     material = new THREE.MeshPhongMaterial({
        //         map: this.textures["maps/mountainwaters/textures/concrete/concrete_d.png"],
        //         bumpMap: this.textures["maps/mountainwaters/textures/concrete/concrete_b.png"],
        //         specularMap: this.textures["maps/mountainwaters/textures/concrete/concrete_s.png"],
        //         wireframe: settings.useWireframe
        //     });
        // } else {
        //     material = new THREE.MeshPhongMaterial({
        //         color: 0xCCCCCC,
        //         wireframe: settings.useWireframe
        //     });
        // }

        // const meshFloor = new THREE.Mesh(new THREE.PlaneGeometry(250, 250, 10, 10), material);
        // meshFloor.name = "floor";
        // meshFloor.rotation.x -= Math.PI / 2;
        // meshFloor.receiveShadow = settings.graphics_quality === "High";
        // scene.add(meshFloor);
        // this.elements.meshFloor = meshFloor;

        //##################### water #####################
        //not running in this version
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
        //             fog: scene.fog !== undefined,
        //             wireframe: settings.useWireframe
        //         }
        //     );
        //     water.material.uniforms.size.value = 1;
        //     //water.position.set(0, -1, 0);
        //     //water.rotation.x = - Math.PI / 2;
        //     this.elements.water = water;
        //     scene.add(water);
    }
    // else {
    //     const water = new THREE.Water(
    //         waterGeometry,
    //         {
    //             alpha: 0.9,
    //             sunDirection: sun.position.clone().normalize(),
    //             sunColor: 0xffffff,
    //             waterColor: 0x00190f,
    //             distortionScale: 5,
    //             fog: scene.fog !== undefined,
    //             wireframe: settings.useWireframe
    //         }
    //     );
    //     water.position.set(0, -1, 0);
    //     water.rotation.x = - Math.PI / 2;
    //     this.elements.water = water;
    //     scene.add(water);
    // }

    //##################### mesh #####################
    // const mesh = new THREE.Mesh(
    //     new THREE.BoxGeometry(1, 1, 1),
    //     new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: settings.useWireframe })
    // );
    // mesh.position.set(0, 1, 0);
    // mesh.receiveShadow = true;
    // mesh.castShadow = true;
    // this.elements.mesh = mesh;
    // mesh.name = "centerCube";
    // scene.add(mesh);

    animate() {
        //water
        //this.elements.water.material.uniforms.time.value += 1.0 / 60.0;

        //center rotating cube
        // this.elements.centerCube.rotation.x += 0.001;
        // this.elements.centerCube.rotation.y += 0.002;
    }

}