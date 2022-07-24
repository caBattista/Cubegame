import { Vector3 } from 'three'

class Controller {

    constructor() { }

    updateRotation(map, object, change, callback) {
        if (change.rotation) {
            object.rotation.y = change.rotation.yaw;
            object.children[0].rotation.x = change.rotation.pitch;
            callback(map, object.uuid, {
                r: this.vectorToXYZ(object.rotation)
            });
            callback(map, object.children[0].uuid, {
                r: this.vectorToXYZ(object.children[0].rotation)
            });
        }
    }

    updateActions(object, change) {
        if (object.userData.controls.actions[change.action]) {
            object.userData.controls.actions[change.action].pressed = change.pressed;
        }
    }

    applyForceFromActions(object) {
        const actions = object.userData.controls.actions;
        const anypressed =
            actions.controls_forward.pressed ||
            actions.controls_right.pressed ||
            actions.controls_backward.pressed ||
            actions.controls_left.pressed ||
            actions.controls_jump.pressed
        if (anypressed === true) {
            const objPhysics = object.userData.physics;
            const settings = object.userData.controls.settings;
            const moveForce = actions.controls_sprint.pressed === true ? settings.moveForce * settings.sprintMult : settings.moveForce;

            const worldDirection = object.getWorldDirection(new Vector3());
            let forceDirection = new Vector3();
            function moveDegRad(degRad) {
                forceDirection.add(worldDirection.clone().applyAxisAngle(new Vector3(0, 1, 0), degRad));
            }
            if (actions.controls_forward.pressed === true) { moveDegRad(0); }
            if (actions.controls_right.pressed === true) { moveDegRad(-Math.PI / 2); }
            if (actions.controls_backward.pressed === true) { moveDegRad(Math.PI); }
            if (actions.controls_left.pressed === true) { moveDegRad(Math.PI / 2); }
            if (actions.controls_jump.pressed === true) { forceDirection.add(new Vector3(0, moveForce, 0)); }
            objPhysics.currentForce.add(forceDirection.normalize().multiplyScalar(moveForce));
        }
    }

    vectorToXYZ(vector) {
        return { x: vector.x, y: vector.y, z: vector.z, };
    }

    roundVector(vector) {
        return new Vector3(
            Math.round(vector.x * 10000) / 10000,
            Math.round(vector.y * 10000) / 10000,
            Math.round(vector.z * 10000) / 10000)
    }
}

export default Controller;