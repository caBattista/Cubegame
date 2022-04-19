class Player {

    constructor() {}

    init(settings, manager, scene, physics) {
        this.settings = settings.player;
        this.elements = {};
        this.textures = {
            "engine/player/textures/Metal06_nrm.jpg": { type: "texture" },
            "engine/player/textures/Metal06_rgh.jpg": { type: "texture" },
            "engine/player/textures/Metal06_met.jpg": { type: "texture" }
        }
        this.loadTextures(manager);
        this.createElements(scene);
        //physics.addMesh(this.elements.yaw);
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
    
    createElements(scene, textures) {
        const playerSettings = {
            High: {
                color:  "0xffffff ",//playerObj.color,
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

        const player = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial(playerSettings[this.settings.graphics_quality])
        );

        player.receiveShadow = this.settings.graphics_quality === "High";
        player.castShadow = this.settings.graphics_quality === "High";

        scene.add(player);
        this.elements.player = player;
    }

    set(palyerObj) {
        this.elements.player.position.set(
            palyerObj.posRot.position.x,
            palyerObj.posRot.position.y,
            palyerObj.posRot.position.z,
        );
        this.elements.player.rotation.y = palyerObj.posRot.rotation.y;
    }
}