class Player {

    constructor() { }

    init(type, settings, manager, scene) {
        this.type = type;
        this.elements = {};
        this.settings = settings.player;
        this.scene = scene;
        //needs count to be as big as div since set timeout waits for execution
        this.smoothing = { interval: 16, div: 3 };
        this.textures = {
            "engine/player/textures/Metal06_nrm.jpg": { type: "texture" },
            "engine/player/textures/Metal06_rgh.jpg": { type: "texture" },
            "engine/player/textures/Metal06_met.jpg": { type: "texture" }
        }
        this.loadTextures(manager);
        this.createElements(scene);
        return this;
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

    createElements(scene) {

        const playerSettings = {
            High: {
                color: "0xffffff ",//playerObj.color,
                roughness: 0.4,
                metalness: 1,
                normalMap: this.textures["engine/player/textures/Metal06_nrm.jpg"],
                normalScale: new THREE.Vector2(1, - 1), // why does the normal map require negation in this case?
                roughnessMap: this.textures["engine/player/textures/Metal06_rgh.jpg"],
                metalnessMap: this.textures["engine/player/textures/Metal06_met.jpg"],
                //envMap: textures["skyboxCube"], // important -- especially for metals!
                envMapIntensity: 2,
                wireframe: this.settings.useWireframe
            }, Low: {
                color: "0xffffff ", //playerObj.color,
                wireframe: this.settings.useWireframe
            }
        }

        const yaw = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial(playerSettings[this.settings.graphics_quality])
        );
        yaw.position.set(0, this.settings.height, 0);
        this.elements.yaw = yaw;

        const pitch = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: this.settings.useWireframe })
        );
        pitch.receiveShadow = true;
        pitch.castShadow = true;
        //pitch.rotation.set(0, Math.PI, 0);
        yaw.add(pitch);
        this.elements.pitch = pitch;

        if (this.type == "self") {
            const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
            //camera.position.set(0,2,-5);
            camera.rotation.set(0, Math.PI, 0);
            //scene.add( new THREE.CameraHelper( camera ) );

            pitch.add(camera);
            this.elements.camera = camera;

            yaw.receiveShadow = this.settings.graphics_quality === "High";
            yaw.castShadow = this.settings.graphics_quality === "High";
        }
        scene.add(yaw)
    }

    //sets the player to the specified position and rotation immediately
    set(data) {
        this.elements.yaw.position.x = data.position.x;
        this.elements.yaw.position.y = data.position.y;
        this.elements.yaw.position.z = data.position.z;
        //if (this.type === "self") { return; }
        this.elements.yaw.rotation.y = data.rotation.yaw;
        this.elements.pitch.rotation.x = data.rotation.pitch;
    }

    //moves the player to the specified position and rotation in a smoothed way
    moveTo(data) {
        clearInterval(this.smoothingInterval);
        //calculate step values (distance to move in steps between frames)
        this.smoothing.step = {
            x: (data.position.x - this.elements.yaw.position.x) / this.smoothing.div,
            y: (data.position.y - this.elements.yaw.position.y) / this.smoothing.div,
            z: (data.position.z - this.elements.yaw.position.z) / this.smoothing.div,
            yaw: (data.rotation.yaw - this.elements.yaw.rotation.y) / this.smoothing.div,
            pitch: (data.rotation.pitch - this.elements.pitch.rotation.x) / this.smoothing.div
        }
        let index = this.smoothing.div;
        this.moveStep();
        index--;
        this.smoothingInterval = setInterval(() => {
            if (index <= 0) {
                clearInterval(this.smoothingInterval);
                this.set(data);
            }
            else {
                this.moveStep();
                index--;
            }
        }, this.smoothing.interval);
    }

    //moves the player one step according to the steps
    moveStep() {
        this.elements.yaw.position.x += this.smoothing.step.x;
        this.elements.yaw.position.y += this.smoothing.step.y;
        this.elements.yaw.position.z += this.smoothing.step.z;
        //if (this.type === "self") { return; }
        this.elements.yaw.rotation.y += this.smoothing.step.yaw;
        this.elements.pitch.rotation.x += this.smoothing.step.pitch;
    }

    //self
    // do(option) {
    //     switch (option) {
    //         case "controls_forward": this.moveDegRad(0); break;
    //         case "controls_backward": this.moveDegRad(Math.PI); break;
    //         case "controls_left": this.moveDegRad(Math.PI / 2); break;
    //         case "controls_right": this.moveDegRad(-Math.PI / 2); break;
    //         case "controls_jump": this.elements.yaw.position.y += this.settings.speed; break;
    //         case "controls_sprint":
    //             this.settings.speed = 2;
    //             break;
    //         case "setDefaults":
    //             this.settings.speed = 0.4;
    //             break;
    //     }
    // }

    //self
    // moveCam(x, y) {
    //     this.elements.yaw.rotation.y -= x * 0.002;
    //     this.elements.pitch.rotation.x += y * 0.002;
    // }

    // //self
    // rndFlt(num, dec = 3) {
    //     return parseFloat(num.toFixed(dec));
    // }

    // //self
    // getPosRot() {
    //     const posRaw = this.elements.pitch.getWorldPosition(new THREE.Vector3());
    //     const rotRaw = new THREE.Euler().setFromQuaternion(this.elements.pitch.getWorldQuaternion(new THREE.Quaternion()));
    //     return {
    //         position: {
    //             x: this.rndFlt(posRaw.x),
    //             y: this.rndFlt(posRaw.y),
    //             z: this.rndFlt(posRaw.z)
    //         },
    //         rotation: {
    //             x: this.rndFlt(rotRaw._x),
    //             y: this.rndFlt(rotRaw._y),
    //             z: this.rndFlt(rotRaw._z)
    //         }
    //     };
    // }


}