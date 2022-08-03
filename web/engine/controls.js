class Controls {

    constructor(settings, canvas, ws, initialRotation) {
        this.ws = ws;
        // ################ Mouse (Camera movement) ################

        //set start rotation
        this.rotation = { yaw: initialRotation.yaw, pitch: initialRotation.pitch };
        this.rotationPrev = { yaw: this.rotation.yaw, pitch: this.rotation.pitch };
        // this.rotation = { yaw: this.playerData.rotation.y, pitch: this.playerData.children[0].rotation.x };
        // this.rotationPrev = { yaw: this.playerData.rotation.y, pitch: this.playerData.children[0].rotation.x };

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
            this.rotation.pitch = Math.min(Math.max(this.rotation.pitch + ev.movementY * 0.002, -Math.PI / 2), Math.PI / 2);
        }

        const lockChange = (ev) => {
            if (this.pointerLocked === true) {
                this.pointerLocked = false;
                canvas.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener('pointerlockchange', lockChange, false);
            }
        }

        canvas.addEventListener("mousedown", () => {
            if (this.pointerLocked === true) { return; }
            this.pointerLocked = true;
            canvas.requestPointerLock();
            canvas.addEventListener("mousemove", mouseMoveHandler, false);
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

    updatePlayerData(playerData) { this.playerData = playerData; }
}

export default Controls