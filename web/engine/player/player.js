class Player {

    constructor() { }

    init(type, settings, manager, scene, physics) {
        this.type = type;
        this.elements = {};
        this.settings = settings.player;
        this.textures = {
            "engine/player/textures/Metal06_nrm.jpg": { type: "texture" },
            "engine/player/textures/Metal06_rgh.jpg": { type: "texture" },
            "engine/player/textures/Metal06_met.jpg": { type: "texture" }
        }
        this.prevPos = { x: 0, y: 0, z: 0 };
        this.timer = new Date('Jan 1, 1970, 00:00:00.000 GMT');
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

    //player
    set(data) {
        // clearInterval(this.smoothingInterval);      

        // let deltas = {
        //     x: data.position.x - this.prevPos.x,
        //     y: data.position.y - this.prevPos.y,
        //     z: data.position.z - this.prevPos.z,
        // }

        // //for smoothing
        // this.prevPos = {
        //     x: data.position.x,
        //     y: data.position.y,
        //     z: data.position.z,
        // }

        // this.elements.yaw.position.set(data.position.x, data.position.y, data.position.z);

        // if (window.smoothing) {
        //     let count = window.smoothing.count;
        //     this.smoothingInterval = setInterval(() => {
        //         this.elements.yaw.position.set(
        //             this.elements.yaw.position.x + deltas.x / window.smoothing.div,
        //             this.elements.yaw.position.y + deltas.y / window.smoothing.div,
        //             this.elements.yaw.position.z + deltas.z / window.smoothing.div);
        //         count--;
        //         if (count-- <= 0) { clearInterval(this.smoothingInterval); }
        //     }, window.smoothing.interval);
        // }
        window.smoothing = {count: 13, interval: 8, div : 13};
        if (window.smoothing) {

            let deltas = {
                x: data.position.x - this.elements.yaw.position.x,
                y: data.position.y - this.elements.yaw.position.y,
                z: data.position.z - this.elements.yaw.position.z,
            }
            let count = window.smoothing.count;

            clearInterval(this.smoothingInterval);

            this.smoothingInterval = setInterval(() => {
                this.elements.yaw.position.set(
                    this.elements.yaw.position.x + deltas.x / window.smoothing.div,
                    this.elements.yaw.position.y + deltas.y / window.smoothing.div,
                    this.elements.yaw.position.z + deltas.z / window.smoothing.div);
                count--;
                if (count <= 0) { clearInterval(this.smoothingInterval); }
            }, window.smoothing.interval);
        }
        else { this.elements.yaw.position.set(data.position.x, data.position.y, data.position.z); }

        if (this.type === "player") {
            this.elements.yaw.rotation.y = data.rotation.yaw;
            this.elements.pitch.rotation.x = data.rotation.pitch;
        }
        //because pitch element was not defined for player
    }

    // moveDegRad(degRad, speed) {
    //     this.elements.yaw.position.add(
    //         this.elements.camera.getWorldDirection(new THREE.Vector3())
    //             .applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad)
    //             .multiply(new THREE.Vector3(speed, 0, speed))
    //     );
    // }

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