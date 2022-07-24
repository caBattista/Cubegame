import { Vector3, Raycaster, Box3 } from 'three'

class Pysics {

    constructor(stats) {
        this.stats = stats
        this.stats.addMetric("gravity");
    }

    //########################################## gravity ##########################################

    gravitySpacial(object, mapObjects, far = 2000, near = 5) {//.18
        this.stats.start("gravity");

        //far needs to be calced in advance on every object or bounding box
        let objectPhysics = object.userData.physics;
        const mapObjectsLength = mapObjects.length;
        for (let i = 0; i < mapObjectsLength; i++) {
            const attractor = mapObjects[i];
            let distance = object.position.distanceTo(attractor.position);
            if (distance < far) {
                if (distance < far && distance > near) {
                    //revesing these will attract or oppse
                    const directionVector = new Vector3().subVectors(attractor.position, object.position);//.011
                    const forceMagnitude = (objectPhysics.mass * attractor.userData.physics.mass) / (distance * distance);
                    objectPhysics.currentForce.add(directionVector.normalize().multiplyScalar(forceMagnitude));//0.02
                } else {
                    object.currentForce = new Vector3();
                    object.currentAcceleration = new Vector3();
                    object.currentSpeed = new Vector3();
                }
            }
        }
        this.stats.end("gravity");

        // if (obectsInVacinity.length > 0) {
        //     let objectPhysics = object.userData.physics;
        //     obectsInVacinity.forEach(attractor => {
        //         if (object.uuid !== attractor.uuid && attractor.userData && attractor.userData.physics &&
        //             attractor.userData.physics.mass) {
        //             //revesing these will attract or oppse
        //             const directionVector = new Vector3().subVectors(attractor.position, object.position);
        //             const distance = directionVector.length();
        //             if (object.position.distanceTo(attractor.position) > near) {
        //                 const forceMagnitude =
        //                     ((objectPhysics.mass * attractor.userData.physics.mass) / (distance * distance));
        //                 objectPhysics.currentForce.add(directionVector.normalize().multiplyScalar(forceMagnitude));
        //             } else {
        //                 object.currentForce = new Vector3();
        //                 object.currentAcceleration = new Vector3();
        //                 object.currentSpeed = new Vector3();
        //             }
        //         }
        //     })
        // }
    }

    gravityBasic(object, mapObjects) {
        let objPhysics = object.userData.physics;
        const raycaster = new Raycaster();
        raycaster.far = 1;//needs to be slightly higher than half of the height of player
        raycaster.set(object.position, new Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(mapObjects);
        if (intersects.length == 0) {
            objPhysics.currentSpeed -= 0.02;
            object.position.y += objPhysics.currentSpeed;
        } else {
            objPhysics.currentSpeed = 0;
            object.position.y = intersects[0].point.y + 1;
        }
        if (objPhysics.currentSpeed !== 0) {
            moved = true;
        }
    }

    //########################################## air resistance ##########################################

    airResistance(object) {
        let objPhysics = object.userData.physics;
        //apply force to acceleration, speed and position
        let currentSpeedSquared = objPhysics.currentSpeed.length() * objPhysics.currentSpeed.length()
        // console.log(currentSpeedSquared);
        let airResistanceForce = objPhysics.currentForce.clone()
            .negate().normalize().multiplyScalar(currentSpeedSquared)
        objPhysics.currentForce.add(airResistanceForce);
    }

    airResistanceBasic(object) {
        let objPhysics = object.userData.physics;
        if (objPhysics.currentSpeed.length() < 0.01) { objPhysics.currentSpeed.multiplyScalar(0); }
        else { objPhysics.currentSpeed.multiplyScalar(0.98); }
    }

    //########################################## colisions ##########################################

    collisionIntersect(object, mapObjects, far = 4) {
        //far needs to be calced in advance on every object or bounding box
        let obectsInVacinity = [];
        mapObjects.forEach(otherObject => {
            if (object.position.distanceTo(otherObject.position) < far && object.uuid !== otherObject.uuid) {
                obectsInVacinity.push(otherObject);
            }
        })

        if (obectsInVacinity.length > 0) {
            let objPhysics = object.userData.physics;
            let objectBoundingBox = new Box3(new Vector3(), new Vector3());
            objectBoundingBox.setFromObject(object);
            let intersects = [];
            obectsInVacinity.forEach(otherObject => {
                if (otherObject.userData.physics !== undefined) {
                    let otherObjectBoundingBox = new Box3(new Vector3(), new Vector3());
                    otherObjectBoundingBox.setFromObject(otherObject);
                    if (objectBoundingBox.intersectsBox(otherObjectBoundingBox)) { intersects.push(otherObject.uuid); }
                }
            })

            if (objPhysics.prevIntersects.length < intersects.length) {
                this.bounce(object);
            }
            objPhysics.prevIntersects = intersects;
        }
    }

    collisionBasic(object, mapObjects) {
        let objPhysics = object.userData.physics;
        const raycaster = new Raycaster();
        raycaster.far = 1;
        raycaster.set(object.position.clone(), objPhysics.currentSpeed.clone().normalize());
        const intersects = raycaster.intersectObjects(mapObjects);
        if (intersects.length !== 0) {
            this.bounce(object);
        }
    }

    //########################################## helpers ##########################################

    mapBounds(object) {
        if ((object.position.x < 1250 && object.position.x > -1250) &&
            (object.position.y < 1250 && object.position.y > 0) &&
            (object.position.z < 1250 && object.position.z > -1250)) {
        } else {
            this.bounce(object);
        }
        if ((object.position.x < 2500 && object.position.x > -2500) &&
            (object.position.y < 2500 && object.position.y >= 0) &&
            (object.position.z < 2500 && object.position.z > -2500)) {
        } else {
            this.bounce(object);
        }
    }

    bounce(object) {
        let objPhysics = object.userData.physics;
        objPhysics.currentSpeed.negate();
        // let currentSpeedLength = objPhysics.currentSpeed.length();
        // let currentSpeed = objPhysics.currentSpeed.clone();
        //  = .multiply(new Vector3(Math.random(), Math.random(), Math.random()));
    }

    prepareObject(object) {
        let physics = object.userData.physics;
        physics.currentForce = this.vectorFromXYZ(physics.currentForce);
        physics.currentAcceleration = this.vectorFromXYZ(physics.currentAcceleration);
        physics.currentSpeed = this.vectorFromXYZ(physics.currentSpeed);
        physics.prevIntersects = [];
    }

    isPhysicsObject(object) {
        if (object.userData !== undefined &&
            object.userData.physics !== undefined &&
            object.userData.physics.mass !== undefined) {
            return true;
        }
        return false;
    }

    updatePosition(object) {
        let objPhysics = object.userData.physics;
        //a=F/m
        objPhysics.currentAcceleration = objPhysics.currentForce.divideScalar(objPhysics.mass);
        //v=a*t
        objPhysics.currentSpeed.add(objPhysics.currentAcceleration);
        //s=v*t
        object.position.add(objPhysics.currentSpeed);
        object.updateMatrixWorld(true);
    }

    getChanges(object, updatePosition = true) {
        if (updatePosition === true) { this.updatePosition(object); }
        let res = [];
        //only submit change if moving
        if (object.userData.physics.currentSpeed.length() !== 0) {
            res.push({ p: this.vectorToXYZ(object.position, 3) });
        }
        return res;
    }

    vectorToXYZ(vector, decimals) {
        if (decimals !== undefined) {
            return {
                x: this.round(vector.x, decimals),
                y: this.round(vector.y, decimals),
                z: this.round(vector.z, decimals)
            };
        } else {
            return {
                x: vector.x,
                y: vector.y,
                z: vector.z
            };
        }
    }

    round(value, decimals) {
        //Better than normal Math.round(x*y)/y
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    vectorFromXYZ(xyz = { x: 0, y: 0, z: 0 }) { return new Vector3(xyz.x, xyz.y, xyz.z); }
}

export default Pysics;