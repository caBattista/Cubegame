class Player {

    constructor(playerId, THREE) { 
        this.playerId = playerId;
        this.THREE = THREE;
        this.objects = {};
        this.createObject();
    }

    createObject(){
        this.objects.yaw = new this.THREE.Mesh();
        this.objects.yaw.name = "player";
        this.objects.yaw.position.set(
            Math.round(Math.random() * 199) - 99,
            1,
            Math.round(Math.random() * 199) - 99);
        //this.objects.yaw.rotation.y = Math.random() * 360;
        this.objects.yaw.userData = {
            physics: {
                currentForce: new this.THREE.Vector3(0, 0, 0),
                currentAcceleration: new this.THREE.Vector3(0, 0, 0),
                currentSpeed: new this.THREE.Vector3(0, 0, 0),
                mass: 10
            },
            playerId: this.playerId,
            controls: {
                settings: {
                    moveForce: 0.4,
                    sprintMult: 2,
                },
                actions: {
                    controls_forward: { pressed: false },
                    controls_right: { pressed: false },
                    controls_backward: { pressed: false },
                    controls_left: { pressed: false },
                    controls_jump: { pressed: false },
                    controls_sprint: { pressed: false },
                }
            },
        };//other stuff should go in here
        this.objects.yaw.updateMatrixWorld(true);


        this.objects.pitch = new this.THREE.Mesh(
            new this.THREE.BoxGeometry(1, 1, 1),
            new this.THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: false })
        );
        this.objects.pitch.rotation.x = 0;
        this.objects.pitch.receiveShadow = true;
        this.objects.pitch.castShadow = true;
        this.objects.pitch.updateMatrixWorld(true);

        this.objects.yaw.add(this.objects.pitch);
    }

}

module.exports = Player;