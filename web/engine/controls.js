class Controls {

    constructor(settings, domElement, ws) {
        this.ws = ws;

        // ################ Mouse (Camera movement) ################

        this.rotation = { yaw: 0, pitch: 0 };
        this.rotationPrev = { yaw: 0, pitch: 0 };

        //loop to throttle mouse move events sent to Server
        this.controlInterval = setInterval(() => {
            if (this.rotation.yaw !== this.rotationPrev.yaw ||
                this.rotation.pitch !== this.rotationPrev.pitch) {
                this.ws.request("map", "playerControl", { rotation: this.rotation });
                this.rotationPrev = JSON.parse(JSON.stringify(this.rotation));
            }
        }, Math.abs(1000 / 10));//times per second

        const mouseMoveHandler = ev => {
            this.rotation.yaw -= ev.movementX * 0.002;
            this.rotation.pitch += ev.movementY * 0.002;
            this.player.elements.yaw.rotation.y = this.rotation.yaw;
            this.player.elements.pitch.rotation.x = this.rotation.pitch;
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

    setStartRotation(rotation, player) {
        this.player = player;
        this.rotation.yaw = rotation.yaw;
        this.rotation.pitch = rotation.pitch;
        this.rotationPrev.yaw = rotation.yaw;
        this.rotationPrev.pitch = rotation.pitch;
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