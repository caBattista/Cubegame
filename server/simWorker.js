const { workerData, parentPort } = require('worker_threads')

parentPort.on("message", data => {
    //console.log("worker got", data.action);
    const action = global.actions[data.action];
    if (typeof action === "function") { action(data.data); }
});

global.actions = {
    startSim: data => {
        //Simulator
        const Simulator = require("../server/simulator.js");
        global.sim = new Simulator();
    },
    addMapFromJSON: data => { global.sim.addMapFromJSON(data.mapJSON); },
    startMap: data => {
        global.sim.startMap(data.mapId, (playerIds, mapChange) => {
            parentPort.postMessage({ action: "startMap", data: { playerIds: playerIds, mapChange: mapChange } });
        })
    },
    stopMap: data => {console.log(data); parentPort.postMessage({ action: "stopMap", data: global.sim.stopMap(data.mapId) }); },
    getPlayersIdsOfMap: data => { parentPort.postMessage({ action: "getPlayersIdsOfMap", data: global.sim.getPlayersIdsOfMap(data.mapId) }); },
    addPlayerToMap: data => { parentPort.postMessage({ action: "addPlayerToMap", data: global.sim.addPlayerToMap(data.clientId, data.mapId) }); },
    removePlayerFromMap: data => { parentPort.postMessage({ action: "removePlayerFromMap", data: global.sim.removePlayerFromMap(data.clientId) }); },
    controlPlayer: data => { parentPort.postMessage({ action: "controlPlayer", data: global.sim.controlPlayer(data.clientId, data.data) }); }
}
