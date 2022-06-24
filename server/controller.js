class Controller {

    constructor(THREE) {
        this.THREE = THREE;
    }

    updateRotation(map, object, change, callback) {
        if (change.rotation) {
            object.rotation.y = change.rotation.yaw;
            object.children[0].rotation.x = change.rotation.pitch;
            callback(map, object.uuid, {
                rotation: this.vectorToXYZ(object.rotation)
            });
            callback(map, object.children[0].uuid, {
                rotation: this.vectorToXYZ(object.children[0].rotation)
            });
        }
    }

    updateActions(object, change) {
        if (object.userData.controls.actions[change.action]) {
            object.userData.controls.actions[change.action].pressed = change.pressed;
        }
    }

    applyForceFromActions(object) {
        const THREE = this.THREE;
        const objPhysics = object.userData.physics;
        const settings = object.userData.controls.settings;
        const actions = object.userData.controls.actions;
        const moveForce =
            actions.controls_sprint.pressed === true ? settings.moveForce * settings.sprintMult : settings.moveForce;

        const worldDirection = object.getWorldDirection(new THREE.Vector3())
        let forceDirection = new THREE.Vector3();
        function moveDegRad(degRad) {
            forceDirection.add(worldDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), degRad));
        }
        let move = false;
        if (actions.controls_forward.pressed === true) { moveDegRad(0); move = true; }
        if (actions.controls_right.pressed === true) { moveDegRad(-Math.PI / 2); move = true; }
        if (actions.controls_backward.pressed === true) { moveDegRad(Math.PI); move = true; }
        if (actions.controls_left.pressed === true) { moveDegRad(Math.PI / 2); move = true; }
        if (actions.controls_jump.pressed === true) { forceDirection.add(new THREE.Vector3(0, moveForce, 0)); move = true; }

        if (move === true) { objPhysics.currentForce.add(forceDirection.normalize().multiplyScalar(moveForce)); }
    }

    vectorToXYZ(vector) {
        return { x: vector.x, y: vector.y, z: vector.z, };
    }

    roundVector(vector) {
        return new THREE.Vector3(
            Math.round(vector.x * 10000) / 10000,
            Math.round(vector.y * 10000) / 10000,
            Math.round(vector.z * 10000) / 10000)
    }
}

module.exports = Controller;