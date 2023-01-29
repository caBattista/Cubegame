import ECS from './ecs.js'
import Physics from './physics.js'
import Controller from './controller.js'
import Stats from './stats.js'
import InstancedMeshHelper from './instancedMeshHelper.js'

class Engine {

    //public
    constructor() {
        this.maps = {};

        //Entity ComponentSystem
        this.ecs = new ECS();

        //systems
        this.controller = new Controller();
        this.stats = new Stats();
        this.physics = new Physics(this.stats);
        this.iMeshHelper = new InstancedMeshHelper();

        console.log("\x1b[35m%s\x1b[0m", "ENGINE:", "STARTED");
    }

    //public
    addMapFromJSON(map) {
        //create map object
        this.maps[map.id] = {
            settings: map.json.settings,
            graphicsObjects: map.json.graphicsObjects,
            entities: map.json.entities,
            components: {
                graphics: map.json.components.graphics,
                physics: map.json.components.physics,
                player: []
            },
            changes: {}
        };

        this.physics.initComponents(this.ecs.getComponents(this.maps[map.id], "physics"));

        console.log("\x1b[35m%s\x1b[0m", "ENGINE:", "CREATED MAP", map.id);
    }

    //public
    startMap(mapId, callback) {
        const map = this.maps[mapId];
        this.stats.addMetric("loop", true);
        map.frameCount = 0;
        map.loop = setInterval(() => {
            this.stats.start("loop");

            //Controller System
            const playerComponents = map.components.player;
            for (let i = 0; i < playerComponents.length; i++) {
                this.controller.applyForceFromActions(
                    playerComponents[i],
                    this.ecs.getComponent(map, playerComponents[i]?.eId, "physics"));
            }

            //Physics System
            this.physics.updateComponents(map.components.physics);


            this.ecs.getPlayerIds(map).forEach(playerId => {
                let playerComponent = this.ecs.getPlayerComponentByPlayerId(map, playerId);
                let physicsComponent = this.ecs.getComponent(map, playerComponent.eId, "physics");

                let updateRadius = 1000;
                // if (map.frameCount % 2 === 0) { updateRadius *= 100; }
                // if (map.frameCount % 4 === 0) { updateRadius *= 200; }
                // if (map.frameCount % 8 === 0) { updateRadius *= 400; }
                // if (map.frameCount % 16 === 0) { updateRadius *= 800; }
                // if (map.frameCount % 32 === 0) { updateRadius *= 1600; }
                if (map.frameCount % 64 === 0) { updateRadius = 10000; }

                this.physics.getChangedComponentsDecomposed(map, physicsComponent, [updateRadius, updateRadius, updateRadius]).forEach(({ eId, decomposed }) => {
                    this.submitGraphicsObjectChange(map, eId, decomposed)
                });
                if (Object.keys(map.changes).length !== 0) {//needs to be individual to player
                    // console.log(map.changes);
                    callback(playerId, map.changes);
                    map.changes = {};
                }
            })
            map.frameCount++;
            this.stats.end("loop");
        }, 31); //-> 30fps more or less 31
        console.log("\x1b[35m%s\x1b[0m", "ENGINE:", "STARTED MAP", mapId);
    }

    //public
    stopMap(mapId) {
        clearInterval(this.maps[mapId].loop);
        console.log("\x1b[35m%s\x1b[0m", "ENGINE:", "STOPPED MAP", mapId, mapId);
        return { id: mapId, objects: this.maps[mapId].graphicsObjects };
    }

    //public
    controlPlayer(playerId, change) {
        const { map, entity } = this.ecs.getPlayer(this.maps, playerId);
        const playerComponent = map.components.player[entity.player];
        const physicsComponent = map.components.physics[entity.physics];
        if (change.rotation) {
            const rotation = this.controller.updateRotation(physicsComponent, change);
            this.submitGraphicsObjectChange(map, physicsComponent.eId, { r: rotation })
        }
        this.controller.updateActions(playerComponent, change);
    }

    submitGraphicsObjectChange(map, eId, change) {
        const graphicsComponent = this.ecs.getComponent(map, eId, "graphics");
        const graphicsObject = map.graphicsObjects[graphicsComponent.gObj];
        const graphicsObjectId = graphicsObject.object.uuid;
        if (graphicsObject.object.type === "InstancedMesh") {
            change.i = graphicsComponent.inst;
        }
        if (map.changes[graphicsObjectId] === undefined) {
            map.changes[graphicsObjectId] = [change];
        } else {
            map.changes[graphicsObjectId].push(change);
        }
    }

    //public
    addPlayerToMap(playerId, mapId) {
        const map = this.maps[mapId];

        //get first imesh entity without player component
        let entityId;
        for (let i = 0; i < map.entities.length; i++) {
            if (this.ecs.getGraphicsObject(map, i).object.name === "intancedCubes" &&
                this.ecs.getComponent(map, i, "player") === undefined) {
                entityId = i;
                break;
            }
        }

        //setposition
        let physicsComponent = this.ecs.getComponent(map, entityId, "physics");
        physicsComponent.speed.x = 0;
        physicsComponent.speed.y = 0;
        physicsComponent.speed.z = 0;
        this.physics.setPosition(physicsComponent, [0, 0.5, 0]);


        //create the player component
        this.ecs.createComponent(map, entityId, "player", {
            playerId: playerId,
            controls: {
                settings: {
                    moveForce: 0.5,
                    sprintMult: 10,
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
        });

        return {
            settings: map.settings,
            graphicsObjects: map.graphicsObjects,
            playerIds: this.ecs.getPlayerIds(map),
            playerGrpahicsObjectInstance: {
                graphicsObjectId: this.ecs.getGraphicsObject(map, entityId).object.uuid,
                instanceId: this.ecs.getComponent(map, entityId, "graphics").inst
            }
        };
    }

    //public
    removePlayerFromMap(playerToRemoveId) {
        let res = { mapId: undefined, playerIds: [], removedObjectIds: [] };
        Object.entries(this.maps).forEach(([mapId, map]) => {
            Object.entries(map.players).forEach(([playerId, playerObject]) => {
                if (playerToRemoveId === playerId) {
                    delete map.players[playerId];
                    res.mapId = mapId;
                    res.playerIds = Object.keys(map.players);
                    res.removedObjectIds = [playerObject.uuid];
                    map.graphicsObjects.splice(map.graphicsObjects.indexOf(playerObject), 1);
                    console.log("\x1b[35m%s\x1b[0m", "ENGINE:", "REMOVED", playerId, "FROM MAP", mapId);
                }
            })
        });
        return res;
    }

    //for ui
    getMapsInfo() {
        let maps = [];
        let mapIds = Object.keys(this.maps);
        for (let i = 0; i < mapIds.length; i++) {
            const map = this.maps[mapIds[i]];
            maps.push({
                id: mapIds[i],
                type: map.settings.type,
                max_players: map.settings.max_players,
                players: map.components.player.length,
            });
        }
        return maps;
    }
}
export default Engine;