import { Vector3, Mesh, Matrix4, Euler } from 'three'

class Controller {

    constructor() { }

    updateRotation(physicsComponent, change) {
        physicsComponent.rotation.y = change.rotation.yaw;
        physicsComponent.rotation.x = change.rotation.pitch;
    }

    updateActions(playerComponent, change) {
        if (playerComponent.controls.actions[change.action]) {
            playerComponent.controls.actions[change.action].pressed = change.pressed;
        }
    }

    applyForceFromActions(playerComponent, physicsComponent) {
        const actions = playerComponent.controls.actions;
        const anypressed =
            actions.controls_forward.pressed ||
            actions.controls_right.pressed ||
            actions.controls_backward.pressed ||
            actions.controls_left.pressed ||
            actions.controls_jump.pressed
        if (anypressed === true) {
            const settings = playerComponent.controls.settings;
            const moveForce = actions.controls_sprint.pressed === true ? settings.moveForce * settings.sprintMult : settings.moveForce;

            //calculate world direction from euler YXZ 
            const mat4Els = new Matrix4().makeRotationFromEuler(new Euler().setFromVector3(physicsComponent.rotation, 'YXZ')).elements;
            const worldDirection = new Vector3(mat4Els[8], mat4Els[9], mat4Els[10]).normalize();
            const worldDirectionWithoutY = new Vector3(mat4Els[8], 0, mat4Els[10]).normalize();

            let forceDirection = new Vector3();
            if (actions.controls_forward.pressed === true) { forceDirection.add(worldDirection.clone()); }
            if (actions.controls_right.pressed === true) { forceDirection.add(worldDirectionWithoutY.clone().applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)); }
            if (actions.controls_backward.pressed === true) { forceDirection.add(worldDirection.clone().negate()); }
            if (actions.controls_left.pressed === true) { forceDirection.add(worldDirectionWithoutY.clone().applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)); }
            if (actions.controls_jump.pressed === true) { forceDirection.add(new Vector3(0, moveForce, 0)); }
            physicsComponent.force.add(forceDirection.normalize().multiplyScalar(moveForce));
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