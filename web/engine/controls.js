class Controls {

    constructor(settings, domElement, ws, player) {
        this.ws = ws;
        this.player = player;

        // ################ Mouse (Camera movement) ################

        //set start rotation
        this.rotation = { yaw: this.player.rotation.y, pitch: this.player.children[0].rotation.x };
        this.rotationPrev = { yaw: this.player.rotation.y, pitch: this.player.children[0].rotation.x };

        //loop to throttle mouse move events sent to Server
        this.controlInterval = setInterval(() => {
            if (this.rotation.yaw !== this.rotationPrev.yaw ||
                this.rotation.pitch !== this.rotationPrev.pitch) {
                this.ws.request("map", "playerControl", { rotation: this.rotation });
                this.rotationPrev = JSON.parse(JSON.stringify(this.rotation));
            }
        }, 1000 / 30);
        
        const mouseMoveHandler = ev => {
            this.rotation.yaw = this.rotation.yaw - ev.movementX * 0.002;
            this.rotation.pitch = this.rotation.pitch + ev.movementY * 0.002;
        }

        const lockChange = (ev) => {
            if (this.pointerLocked === true) {
                this.pointerLocked = false;
                domElement.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener('pointerlockchange', lockChange, false);
            }
        }

        domElement.addEventListener("mousedown", () => {
            if (this.pointerLocked === true) { return; }
            this.pointerLocked = true;
            domElement.requestPointerLock();
            domElement.addEventListener("mousemove", mouseMoveHandler, false);
            setTimeout(() => { document.addEventListener('pointerlockchange', lockChange, false); }, 0);
        });

        // ################ Keys ################

        //generate actionKeyMap from settings (to map pressed key to an action)
        this.actionKeyMap = {};
        Object.entries(settings).forEach(([key, val]) => {
            if (key.split("_")[0] === "controls") {
                this.actionKeyMap[val] = key;
            }
        });

        window.addEventListener('keydown', ev => {
            if (ev.repeat !== true) {
                let keyAction = this.actionKeyMap[ev.code];
                if (keyAction !== undefined) { this.ws.request("map", "playerControl", { action: keyAction, pressed: true }); }
            }
        });

        window.addEventListener('keyup', ev => {
            let keyAction = this.actionKeyMap[ev.code];
            if (keyAction !== undefined) { this.ws.request("map", "playerControl", { action: keyAction, pressed: false }); }
        });
    }
}