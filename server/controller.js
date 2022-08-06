import { Vector3, Matrix4, Euler, Quaternion } from 'three'

class Controller {

    updateRotation(physicsComponent, change) {
        let euler = new Euler(change.rotation.pitch, change.rotation.yaw, 0, 'YXZ');

        let position = new Vector3();
        let quaternion = new Quaternion();
        let scale = new Vector3();
        physicsComponent.matrix.decompose(position, quaternion, scale);
        quaternion.setFromEuler(euler);
        physicsComponent.matrix.compose(position, quaternion, scale);

        return euler.toArray();
    }

    updateActions(playerComponent, change) {
        if (playerComponent.controls.actions[change.action]) {
            playerComponent.controls.actions[change.action].pressed = change.pressed;
        }
    }

    applyForceFromActions(playerComponent, physicsComponent) {
        const actions = playerComponent.controls.actions;
        if (actions.controls_forward.pressed || actions.controls_right.pressed || actions.controls_backward.pressed ||
            actions.controls_left.pressed || actions.controls_jump.pressed
        ) {
            const settings = playerComponent.controls.settings;
            const moveForce = actions.controls_sprint.pressed === true ? settings.moveForce * settings.sprintMult : settings.moveForce;

            //calculate world direction from euler YXZ 
            const mat4Els = physicsComponent.matrix.elements;
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
}

export default Controller;