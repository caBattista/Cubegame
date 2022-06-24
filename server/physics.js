class Pysics {

    constructor(THREE) {
        this.THREE = THREE;
    }

    getChanges(object) {
        let res = [];
        //only submit change if moving
        if (object.userData.physics.currentSpeed.length() !== 0) {
            res.push({ position: this.vectorToXYZ(object.position) });
        }
        return res;
    }

    isPhysicsObject(object) {
        return object.userData !== undefined ? object.userData.physics !== undefined ? true : false : false;
    }

    prepareObject(object) {
        let objPhysics = object.userData.physics;
        objPhysics.currentForce = new this.THREE.Vector3();
        if (objPhysics.currentAcceleration === undefined) { objPhysics.currentAcceleration = new this.THREE.Vector3(); }
        if (objPhysics.currentSpeed === undefined) { objPhysics.currentSpeed = new this.THREE.Vector3(); }
        if (objPhysics.prevIntersects === undefined) { objPhysics.prevIntersects = []; }
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

    spacialGravity(object, mapObjects) {
        let objectPhysics = object.userData.physics;
        mapObjects.forEach(attractor => {
            if (object.uuid !== attractor.uuid && attractor.userData && attractor.userData.physics &&
                attractor.userData.physics.mass) {
                //revesing these will attract or oppse
                const directionVector = new this.THREE.Vector3().subVectors(attractor.position, object.position);
                const distance = directionVector.length();
                const forceMagnitude =
                    ((objectPhysics.mass * attractor.userData.physics.mass) / (distance * distance)) * 0.1;
                objectPhysics.currentForce.add(directionVector.normalize().multiplyScalar(forceMagnitude));
            }
        })
    }

    verticalGravity(object, mapObjects) {
        let objPhysics = object.userData.physics;
        const raycaster = new this.THREE.Raycaster();
        raycaster.far = 1;//needs to be slightly higher than half of the height of player
        raycaster.set(object.position, new this.THREE.Vector3(0, -1, 0));
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

    airResistance(object) {
        let objPhysics = object.userData.physics;
        //apply force to acceleration, speed and position
        let currentSpeedSquared = objPhysics.currentSpeed.length() * objPhysics.currentSpeed.length()
        // console.log(currentSpeedSquared);
        let airResistanceForce = objPhysics.currentForce.clone()
            .negate().normalize().multiplyScalar(currentSpeedSquared)
        objPhysics.currentForce.add(airResistanceForce);
    }

    airResistanceSimple(object) {
        let objPhysics = object.userData.physics;
        if (objPhysics.currentSpeed.length() < 0.001) { objPhysics.currentSpeed.multiplyScalar(0); }
        else if (objPhysics.currentSpeed.length() < 0.3) { objPhysics.currentSpeed.multiplyScalar(0.9); }
    }

    collision(object, mapObjects) {
        let objPhysics = object.userData.physics;
        let objectBoundingBox = new this.THREE.Box3(new this.THREE.Vector3(), new this.THREE.Vector3());
        objectBoundingBox.setFromObject(object);

        let intersects = [];
        mapObjects.forEach(iterateObject => {
            if (iterateObject.userData.physics !== undefined) {
                let iterateObjecttBoundingBox = new this.THREE.Box3(new this.THREE.Vector3(), new this.THREE.Vector3());
                iterateObjecttBoundingBox.setFromObject(iterateObject);
                if (objectBoundingBox.intersectsBox(iterateObjecttBoundingBox)) { intersects.push(iterateObject.uuid); }
            }
        })

        if (objPhysics.prevIntersects.length < intersects.length) {
            objPhysics.currentSpeed.negate();
        }
        objPhysics.prevIntersects = intersects;
    }

    collisionOld(object, mapObjects) {
        let objPhysics = object.userData.physics;
        const raycaster = new this.THREE.Raycaster();
        raycaster.far = 1;
        raycaster.set(object.position.clone(), objPhysics.currentSpeed.clone().normalize());
        const intersects = raycaster.intersectObjects(mapObjects);
        if (intersects.length !== 0) {
            intersects.forEach(intersect => console.log(intersect.object.name));
            objPhysics.currentForce.add(objPhysics.currentSpeed.clone().normalize().negate().multiplyScalar(5));
        }
    }

    vectorToXYZ(vector) {
        return { x: vector.x, y: vector.y, z: vector.z, };
    }
}

module.exports = Pysics;