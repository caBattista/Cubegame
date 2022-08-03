import { workerData, parentPort } from 'worker_threads'
import Engine from "../server/engine.js"

parentPort.on("message", data => {
    //console.log("worker got", data.action);
    const action = global.actions[data.action];
    if (typeof action === "function") { action(data.data); }
});

global.actions = {
    startEngine: () => { global.engine = new Engine(); },
    addMapFromJSON: data => { global.engine.addMapFromJSON(data.mapJSON); },
    startMap: data => {
        global.engine.startMap(data.mapId, (playerIds, mapChange) => {
            parentPort.postMessage({ action: "startMap", data: { playerIds: playerIds, mapChange: mapChange } });
        })
    },
    stopMap: data => { console.log(data); parentPort.postMessage({ action: "stopMap", data: global.engine.stopMap(data.mapId) }); },
    getPlayersIdsOfMap: data => { parentPort.postMessage({ action: "getPlayersIdsOfMap", data: global.engine.getPlayersIdsOfMap(data.mapId) }); },
    addPlayerToMap: data => { parentPort.postMessage({ action: "addPlayerToMap", data: global.engine.addPlayerToMap(data.clientId, data.mapId) }); },
    removePlayerFromMap: data => { parentPort.postMessage({ action: "removePlayerFromMap", data: global.engine.removePlayerFromMap(data.clientId) }); },
    controlPlayer: data => { parentPort.postMessage({ action: "controlPlayer", data: global.engine.controlPlayer(data.clientId, data.data) }); },
    getMapsInfo: () => { parentPort.postMessage({ action: "getMapsInfo", data: global.engine.getMapsInfo() }); }
}


