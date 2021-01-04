const THREE = require("./three.js");
class Simulator {

    constructor() {
        this.maps = {};
        this.startChageCountValidation();
    }

    offences = {
        "tmcps": "too many changes per second",
        "pmtf": "player movement to fast",
        "pgna": "player gravity not active",
        "pomb": "player outside map bounds",
        "pim": "player inside Mesh"
    }

    addMap(mapId) {
        this.maps[mapId] = { players: {} };
    }

    addPlayerToMap(playerId, mapId) {
        this.maps[mapId].players[playerId] = { offences: {} };
    }

    removePlayer() {
        this.getPlayers((mapId, playerId) => {
            delete this.maps[mapId].players[playerId];
        })
    }

    addOffence(player, OId) {
        player.offences[OId] = player.offences[OId] > 0 ? ++player.offences[OId] : 1;
    }

    getPlayers(callback) {
        const mapIds = Object.keys(this.maps);
        for (let i = 0; i < mapIds.length; i++) {
            const playerIds = Object.keys(this.maps[mapIds[i]].players);
            for (let j = 0; j < playerIds.length; j++) {
                callback(mapIds[i], playerIds[j]);
            }
        }
    }

    getPlayersIdsOfMap(mapId) {
        return Object.keys(this.maps[mapId].players);
    }

    getMapOfPlayer(currentPlayerId) {
        let res;
        this.getPlayers((mapId, playerId) => {
            if (currentPlayerId === playerId) { res = mapId; }
        })
        return res;
    }

    changePlayer(playerId, posRot) {
        const mapId = this.getMapOfPlayer(playerId);
        if (!mapId) { return; }
        const player = this.maps[mapId].players[playerId];

        if (player.posRot && player.posRot.position) {

            //active abilities of player and other players need to be checked first

            //checks if player is moving to fast
            const distance =
                new THREE.Vector3(posRot.position.x, posRot.position.y, posRot.position.z).distanceTo(
                    new THREE.Vector3(player.posRot.position.x, player.posRot.position.y, player.posRot.position.z));
            if (distance > 0.6) { this.addOffence(player, "pmtf"); }

            //check if player gravity is active
            //needs check if player is jumping or not
            if (posRot.position.y > 0.5 /*player height*/ && distance < 0.6) {
                this.addOffence(player, "pgna");
            }

            //check if player is outside map bounds (only needs to be checked every second)
            if (posRot.position.x < -250 || posRot.position.x > 250 ||
                posRot.position.y < -250 || posRot.position.y > 250 ||
                posRot.position.z < -250 || posRot.position.z > 250
            ) { this.addOffence(player, "pomb"); }

            //check if players inside other prohibited Mesh (example: bullt floor etc.)
            //could also do the hit detection
            /*
            getProhibitedMeshesOfMap(mapId).forEach(mesh => {
                const point = new THREE.Vector3(posRot.position.x, posRot.position.y, posRot.position.z) // Your point
                const geometry = new THREE.BoxBufferGeometry(mesh.x, mesh.y, mesh.z)
                const mesh = new THREE.Mesh(geometry)
                const raycaster = new THREE.Raycaster()
                raycaster.set(point, new THREE.Vector3(1, 1, 1))
                if (raycaster.intersectObject(mesh).length % 2 === 1) { // Point is in objet
                    this.addOffence(player, "pim");
                }
            })
            */
        }

        this.maps[mapId].players[playerId].changeCount++;
        this.maps[mapId].players[playerId].posRot = posRot;
        console.log("SM: ", JSON.stringify(this.maps, null, 1))
    }

    //checks if players are running higher fps in game
    startChageCountValidation() {

        //set changecount of all palyers 0
        this.getPlayers((mapId, playerId) => {
            this.maps[mapId].players[playerId].changeCount = 0;
        })

        this.changeCountInterv = setInterval(() => {
            this.getPlayers((mapId, playerId) => {
                if (this.maps[mapId].players[playerId].changeCount > 60) {
                    this.addOffence(this.maps[mapId].players[playerId], "tmcps");
                }
                this.maps[mapId].players[playerId].changeCount = 0;
            })
        }, 1000);
    }

    stopChageCountValidation() {
        clearInterval(this.changeCountInterv);
    }

    removeOffenders() {
        let res = [];
        this.getPlayers((mapId, playerId) => {
            const suspect = this.maps[mapId].players[playerId];
            if (Object.keys(suspect.offences).length > 0) {
                res.push({ id: playerId, offences: suspect.offences });
                delete this.maps[mapId].players[playerId];
            }
        })
        return res;
    }
}
module.exports = Simulator;