import { Vector3, Raycaster, Box3, Matrix4, Quaternion, Euler } from 'three'
import SpacialHashGrid from './spacialHashGrid.js';

class Pysics {

    constructor(stats) {
        this.grid = new SpacialHashGrid([[-5000.0, -5000.0, -5000.0,], [5000.0, 5000.0, 5000.0]], [100, 100, 100]);
        this.stats = stats
        this.stats.addMetric("gravity");
    }

    //########################################## init ##########################################

    initComponents(components) {
        const compLength = components.length;
        for (let i = 0; i < compLength; i++) {
            const component = components[i];
            component.mass = component.mass ? component.mass : 1;
            component.prevIntersects = component.prevIntersects ? component.prevIntersects : 0;
            component.force = component.force ? new Vector3().fromArray(component.force) : new Vector3();
            component.acceleration = component.acceleration ? new Vector3().fromArray(component.acceleration) : new Vector3();
            component.speed = component.speed ? new Vector3().fromArray(component.speed) : new Vector3();
            component.matrix = component.matrix ? new Matrix4().fromArray(component.matrix) : new Matrix4();
            component.dimensions = component.dimensions ? new Vector3().fromArray(component.dimensions) : new Vector3();
            //register component with the spacial hash grid
            this.grid.AddComponent(component);
        }
    }

    //########################################## main function ##########################################

    updateComponents(components) {
        const compLength = components.length;
        for (let i = 0; i < compLength; i++) {
            const component = components[i];
            this.gravitySpacial(component);
            if (component.speed.length() !== 0) {
                //this.collisionIntersect(component);
                //this.airResistance(component);//buggy
                //this.airResistanceBasic(component);
                this.mapBounds(component);
            }
            this.updatePosition(component);

            //update spacial hash grid
            // component.sphgClient.position = new Vector3().setFromMatrixPosition(component.matrix).toArray();
            this.grid.UpdateComponent(component);
        }
    }

    //########################################## updatePosition ##########################################

    updatePosition(component) {
        //a=F/m
        component.acceleration = component.force.divideScalar(component.mass);
        //v=a*t
        component.speed.add(component.acceleration);
        //s=v*t
        component.matrix.setPosition(new Vector3().setFromMatrixPosition(component.matrix).add(component.speed));
    }

    //########################################## changes ##########################################

    getChangedComponentsDecomposed(map, component, far = [2000, 2000, 2000]) {
        let componentsInVacinity = [];
        if (far[0] >= this.grid._gridDimensions[1][0] * 2) {
            componentsInVacinity = map.components.physics;
        } else {
            componentsInVacinity = this.grid.FindNear(component, far);
        }
        let componentsInVacinityLength = componentsInVacinity.length;
        let changedDecomposdComponents = [];
        for (let i = 0; i < componentsInVacinityLength; i++) {
            const component = componentsInVacinity[i];
            //only submit change if moving
            if (component.speed.length() !== 0) {
                changedDecomposdComponents.push({
                    eId: component.eId,
                    decomposed: this.getDecomposedMatrixAsArrays(component)
                });
            }
        }
        return changedDecomposdComponents;
    }

    //########################################## helpers ##########################################

    setPosition(component, position) {
        component.matrix.elements[12] = position[0];
        component.matrix.elements[13] = position[1];
        component.matrix.elements[14] = position[2];
    }

    getDecomposedMatrixAsArrays(component) {
        let position = new Vector3();
        let quaternion = new Quaternion();
        let scale = new Vector3();
        component.matrix.decompose(position, quaternion, scale);
        return { p: position.toArray(), r: new Euler().setFromQuaternion(quaternion).toArray(), s: scale.toArray() }
    }

    round(value, decimals) {
        //Better than normal Math.round(x*y)/y
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    vectorFromXYZ(xyz = { x: 0, y: 0, z: 0 }) { return new Vector3(xyz.x, xyz.y, xyz.z); }

    vectorToXYZ(vector, decimals) {
        if (decimals !== undefined) {
            return {
                x: this.round(vector.x, decimals),
                y: this.round(vector.y, decimals),
                z: this.round(vector.z, decimals)
            };
        } else { return { x: vector.x, y: vector.y, z: vector.z }; }
    }

    //########################################## physics features ##########################################

    //########################################## gravity ##########################################

    gravitySpacial(component, far = new Vector3(10, 10, 10), near = 2) {//.18
        let componentsInVacinity = this.grid.FindNear(component, far.toArray());
        let componentsInVacinityLength = componentsInVacinity.length;

        //this.stats.start("gravity");
        let position = new Vector3().setFromMatrixPosition(component.matrix);
        for (let i = 0; i < componentsInVacinityLength; i++) {
            let position2 = new Vector3().setFromMatrixPosition(componentsInVacinity[i].matrix);
            let distance = position.distanceTo(position2);
            if (distance > near) {
                //revesing these will attract or oppse
                const directionVector = new Vector3().subVectors(position2, position);//.011
                const forceMagnitude = (component.mass * componentsInVacinity[i].mass) / (distance * distance);
                component.force.add(directionVector.normalize().multiplyScalar(forceMagnitude * 0.3));//0.02
            }
        }
        //this.stats.end("gravity");
    }

    //########################################## air resistance ##########################################

    airResistance(component, reduction = 0.95, minSpeed = 0.05) {
        if (component.speed.length() < minSpeed) { component.speed.multiplyScalar(0); }
        else {
            //apply force to acceleration, speed and position
            let currentSpeedSquared = component.speed.length() * component.speed.length() * reduction;
            // console.log(currentSpeedSquared);
            let airResistanceForce = component.force.clone()
                .negate().normalize().multiplyScalar(currentSpeedSquared)
            component.force.add(airResistanceForce);
        }
    }

    airResistanceBasic(component, reduction = 0.95, minSpeed = 0.05) {
        if (component.speed.length() < minSpeed) { component.speed.multiplyScalar(0); }
        else { component.speed.multiplyScalar(reduction); }
    }

    //########################################## colisions ##########################################

    createBoundingBox(component) {
        return new Box3(component.dimensions.clone().divideScalar(2).negate(), component.dimensions.clone().divideScalar(2)).applyMatrix4(component.matrix);
    }

    collisionIntersect(component, far = new Vector3(10, 10, 10)) {
        //far needs to be calced in advance on every component or bounding box
        //get nearby from spacial hash grid
        let componentsInVacinity = this.grid.FindNear(component, far.toArray());
        let componentsInVacinityLength = componentsInVacinity.length;

        if (componentsInVacinityLength > 0) {
            let componentBoundingBox = this.createBoundingBox(component);
            let intersects = [];
            for (let i = 0; i < componentsInVacinityLength; i++) {
                if (component.eId !== componentsInVacinity[i].eId && componentBoundingBox.intersectsBox(this.createBoundingBox(componentsInVacinity[i]))) {
                    intersects.push(componentsInVacinity[i]);
                }
            }
            if (intersects.length > 0 && component.prevIntersects.length < intersects.length) {
                this.bounce(component, intersects[0]);
            }
            component.prevIntersects = intersects;
        }
    }

    bounce(component, otherComponent) {
        // console.log(component, otherComponent);
        // otherComponent.speed.add(component.speed);
        component.speed.negate();
    }

    mapBounds(component, bounds = 1000) {
        let position = new Vector3().setFromMatrixPosition(component.matrix);
        if ((position.x > bounds || position.x < -bounds) ||
            (position.y > bounds || position.y < -bounds) ||
            (position.z > bounds || position.z < -bounds)) { this.bounce(component); }
    }

}

export default Pysics;

// gravityBasic(component, components) {
//     let objPhysics = component.userData.physics;
//     const raycaster = new Raycaster();
//     raycaster.far = 1;//needs to be slightly higher than half of the height of player
//     raycaster.set(component.position, new Vector3(0, -1, 0));
//     const intersects = raycaster.intersectObjects(components);//will not work!
//     if (intersects.length == 0) {
//         component.speed -= 0.02;
//         component.position.y += component.speed;
//     } else {
//         component.speed = 0;
//         component.position.y = intersects[0].point.y + 1;
//     }
//     if (component.speed !== 0) {
//         moved = true;
//     }
// }