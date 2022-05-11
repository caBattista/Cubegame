class Controls {

    constructor(settings, domElement, ws, player) {
        this.ws = ws;
        this.player = player;

        // ################ Mouse (Camera movement) ################

        //set start rotation
        this.rotation = { yaw: this.player.elements.yaw.rotation.y, pitch: this.player.elements.pitch.rotation.x };
        this.rotationPrev = { yaw: this.player.elements.yaw.rotation.y, pitch: this.player.elements.pitch.rotation.x };

        //loop to throttle mouse move events sent to Server
        this.controlInterval = setInterval(() => {
            if (this.rotation.yaw !== this.rotationPrev.yaw ||
                this.rotation.pitch !== this.rotationPrev.pitch) {
                this.ws.request("map", "playerControl", { rotation: this.rotation });
                this.rotationPrev = JSON.parse(JSON.stringify(this.rotation));
            }
        }, 1000 / 30);

        // setInterval(() => {
        //     this.rotation.yaw -= 1 * 0.002;
        //     this.rotation.pitch += 1 * 0.002;
        // }, 8);

        const mouseMoveHandler = ev => {
            this.rotation.yaw = this.cleanRotation(this.rotation.yaw - ev.movementX * 0.002);
            this.rotation.pitch = this.cleanRotation(this.rotation.pitch + ev.movementY * 0.002);
            //control camera immediately
            // this.player.elements.yaw.rotation.y = this.rotation.yaw;
            // this.player.elements.pitch.rotation.x = this.rotation.pitch;
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

    cleanRotation(rotation) {
        // if (rotation >= 2 * Math.PI) { rotation -= 2 * Math.PI }
        // if (rotation < 0) { rotation += 2 * Math.PI }
        return Math.round(rotation * 100000) / 100000;
    }

    // animate(player) {
    //     let doOrder = { set: [], fion: [], fifo: [] };
    //     Object.keys(this.controlState.pressedKeys).forEach(key => {
    //         if (this.keyMap[key]) {
    //             if (this.keyMap[key].type === "set") {
    //                 doOrder.set.push(this.keyMap[key].action);
    //             } else { doOrder.fifo.push(this.keyMap[key].action); }
    //         }
    //     });
    //     player.do("setDefaults");
    //     //player.do("moveForward");
    //     doOrder.set.forEach(action => { player.do(action); })
    //     doOrder.fion.forEach(action => { player.do(action); })
    //     doOrder.fifo.forEach(action => { player.do(action); })

    //     //Change Ceck
    //     const curentPosRot = player.getPosRot();
    //     this.posRot = this.posRot ? this.posRot : curentPosRot;
    //     const changed = this.checkChange(this.posRot, curentPosRot);
    //     this.posRot = curentPosRot;
    //     return changed;
    // }

}