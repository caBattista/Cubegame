class Controls {

    constructor(settings, domElement, ws) {
        this.ws = ws;

        // ################ Mouse (Camera movement) ################

        this.rotation = { x: 0, y: 0 };//needs to be set from sever
        this.rotationPrev = { x: 0, y: 0 };

        //loop to throttle mouse move events sent to Server
        this.controlInterval = setInterval(() => {
            if (this.rotation.x !== this.rotationPrev.x || this.rotation.y !== this.rotationPrev.y) {
                this.ws.request("map", "playerControl", { rotation: this.rotation });
                this.rotationPrev = JSON.parse(JSON.stringify(this.rotation));
            }
        }, Math.abs(1000 / 60));//times per second

        const mouseMoveHandler = ev => {
            this.rotation.x -= ev.movementX * 0.002;
            this.rotation.y += ev.movementY * 0.002;
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

    setStartRotation(rotation){
        this.rotation.x = rotation.x;
        this.rotation.y = rotation.y;
        this.rotationPrev.x = rotation.x;
        this.rotationPrev.y = rotation.y;
    }

    // mapKeysFromSettings(controlSettings) {
    //     let keyMap = {};
    //     Object.entries(controlSettings).forEach(([key, val]) => {
    //         if (key.split("_")[0] === "controls") {
    //             keyMap[val] = { action: key, type: typeMap[key] };
    //         }
    //     });

    //     return keyMap;
    // }

    // checkChange(prevPosRot, curentPosRot) {
    //     return prevPosRot.position.x === curentPosRot.position.x &&
    //         prevPosRot.position.y === curentPosRot.position.y &&
    //         prevPosRot.position.z === curentPosRot.position.z &&
    //         prevPosRot.rotation.x === curentPosRot.rotation.x &&
    //         prevPosRot.rotation.y === curentPosRot.rotation.y &&
    //         prevPosRot.rotation.z === curentPosRot.rotation.z
    //         ? false : true;
    // }
    //Only Send Position and Veloctiy-Vector when changed

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