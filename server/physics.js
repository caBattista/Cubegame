import { Vector3, Raycaster, Box3, Matrix4, Quaternion } from 'three'

class Pysics {

    constructor(stats) {
        this.stats = stats
        this.stats.addMetric("gravity");
    }

    //########################################## init ##########################################

    initComponents(components) {
        const compLength = components.length;
        for (let i = 0; i < compLength; i++) {
            const component = components[i];
            component.mass = component.mass ? component.mass : 1;
            component.prevIntersects = component.prevIntersects ? component.prevIntersects : [];
            component.force = this.vectorFromXYZ(component.force);
            component.acceleration = this.vectorFromXYZ(component.acceleration);
            component.speed = this.vectorFromXYZ(component.speed);
            component.position = this.vectorFromXYZ(component.position);
            component.rotation = component.rotation ? this.vectorFromXYZ(component.rotation) : new Vector3(0, 0, 0);
        }
    }

    //########################################## main function ##########################################

    updateComponents(components) {
        const compLength = components.length;
        for (let i = 0; i < compLength; i++) {
            const component = components[i];
            //this.gravitySpacial(component, components);
            if (component.speed.length() !== 0) {
                this.collisionIntersect(component, components);
                //this.airResistance(component);
                this.airResistanceBasic(component);
                this.mapBounds(component);
            }
            this.updatePosition(component);
        }
    }

    //########################################## updatePosition ##########################################

    updatePosition(component) {
        //a=F/m
        component.acceleration = component.force.divideScalar(component.mass);
        //v=a*t
        component.speed.add(component.acceleration);
        //s=v*t
        component.position.add(component.speed);
    }

    //########################################## changes ##########################################

    getChangedComponents(components) {
        let changedComponents = [];
        const compLength = components.length;
        for (let i = 0; i < compLength; i++) {
            const component = components[i];
            //only submit change if moving
            if (component.speed.length() !== 0) {
                changedComponents.push(component);
            }
        }
        return changedComponents;
    }

    //########################################## helpers ##########################################

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

    gravitySpacial(component, components, far = 2000, near = 5) {//.18
        //this.stats.start("gravity");
        //far needs to be calced in advance on every component or bounding box
        const componentsLength = components.length;
        for (let i = 0; i < componentsLength; i++) {
            const attractor = components[i];
            let distance = component.position.distanceTo(attractor.position);
            if (distance < far) {
                if (distance < far && distance > near) {
                    //revesing these will attract or oppse
                    const directionVector = new Vector3().subVectors(attractor.position, component.position);//.011
                    const forceMagnitude = (component.mass * attractor.mass) / (distance * distance);
                    component.force.add(directionVector.normalize().multiplyScalar(forceMagnitude));//0.02
                } else {
                    component.force = new Vector3();
                    component.acceleration = new Vector3();
                    component.speed = new Vector3();
                }
            }
        }
        //this.stats.end("gravity");

        // if (obectsInVacinity.length > 0) {
        //     let componentPhysics = component.userData.physics;
        //     obectsInVacinity.forEach(attractor => {
        //         if (component.uuid !== attractor.uuid && attractor.userData && attractor.userData.physics &&
        //             attractor.userData.physics.mass) {
        //             //revesing these will attract or oppse
        //             const directionVector = new Vector3().subVectors(attractor.position, component.position);
        //             const distance = directionVector.length();
        //             if (component.position.distanceTo(attractor.position) > near) {
        //                 const forceMagnitude =
        //                     ((componentPhysics.mass * attractor.userData.physics.mass) / (distance * distance));
        //                 componentPhysics.currentForce.add(directionVector.normalize().multiplyScalar(forceMagnitude));
        //             } else {
        //                 component.currentForce = new Vector3();
        //                 component.currentAcceleration = new Vector3();
        //                 component.currentSpeed = new Vector3();
        //             }
        //         }
        //     })
        // }
    }

    //########################################## air resistance ##########################################

    airResistance(component) {
        //apply force to acceleration, speed and position
        let currentSpeedSquared = component.speed.length() * component.speed.length()
        // console.log(currentSpeedSquared);
        let airResistanceForce = component.force.clone()
            .negate().normalize().multiplyScalar(currentSpeedSquared)
        component.force.add(airResistanceForce);
    }

    airResistanceBasic(component) {
        if (component.speed.length() < 0.01) { component.speed.multiplyScalar(0); }
        else { component.speed.multiplyScalar(0.95); }
    }

    //########################################## colisions ##########################################

    createBoundingBox(component, size = new Vector3(1, 1, 1)) {
        let box = new Box3(size.divideScalar(2).clone().negate(), size);
        box.applyMatrix4(new Matrix4().compose(component.position, new Quaternion(), new Vector3(1, 1, 1)));
        return box;
    }

    collisionIntersect(component, components) {
        let far = Math.max(component.speed.length() * 5, 1.5);

        //far needs to be calced in advance on every component or bounding box
        let componentsInVacinity = [];
        let componentsLength = components.length;
        for (let i = 0; i < componentsLength; i++) {
            let otherComponent = components[i];
            if (component.position.distanceTo(otherComponent.position) < far && component !== otherComponent) {
                componentsInVacinity.push(otherComponent);
            }
        }
        let componentsInVacinityLength = componentsInVacinity.length;

        if (componentsInVacinityLength > 0) {
            let componentBoundingBox = this.createBoundingBox(component);
            let intersects = 0;
            for (let i = 0; i < componentsInVacinityLength; i++) {
                if (componentBoundingBox.intersectsBox(this.createBoundingBox(componentsInVacinity[i]))) { intersects++; }
            }
            if (component.prevIntersects < intersects) {
                this.bounce(component);
            }
            component.prevIntersects = intersects;
        }
    }

    collisionBasic(component, mapObjects) {
        let objPhysics = component.userData.physics;
        const raycaster = new Raycaster();
        raycaster.far = 1;
        raycaster.set(component.position.clone(), objPhysics.currentSpeed.clone().normalize());
        const intersects = raycaster.intersectObjects(mapObjects);
        if (intersects.length !== 0) {
            this.bounce(component);
        }
    }

    mapBounds(component) {
        let bounds = 10000;
        if ((component.position.x < bounds && component.position.x > -bounds) &&
            (component.position.y < bounds && component.position.y > -bounds) &&
            (component.position.z < bounds && component.position.z > -bounds)) {
        } else {
            this.bounce(component);
        }
    }

    bounce(component) {
        component.speed.negate();
        // let speedLength = component.speed.length();
        // let speed = component.speed.clone();
        //  = .multiply(new Vector3(Math.random(), Math.random(), Math.random()));
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