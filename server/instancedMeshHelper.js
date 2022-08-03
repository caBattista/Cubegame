import { Matrix4, Vector3 } from 'three'

class InstancedMeshHelper {
    constructor() {}

    objectsFromInstancedMesh(iMeshObj) {
        let instanceObjects = [];
        let count = iMeshObj.count;
        for (let i = 0; i < count; i++) {
            //get position from intance
            let mat = new Matrix4();
            iMeshObj.getMatrixAt(i, mat);
            let vec = new Vector3();
            vec.setFromMatrixPosition(mat);

            instanceObjects.push({
                position: vec,
                userData: iMeshObj.userData.instancesData[i]
            })
        }
        return instanceObjects;
    }
}

export default InstancedMeshHelper;