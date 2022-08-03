import Engine from '../engine/engine.js';
self.onmessage = function (e) {
    //console.log("worker got", e.data);
    const action = self.actions[e.data.action];
    if (typeof action === "function") { action(e.data.data); }
}
self.actions = {
    startEngine: async data => {
        self.engine = new Engine(data.clientId, data.offscreenCanvas, data.mapData.settings, data.settings, data.characters);
        self.engine.stats.getData(data => { self.postMessage({ action: "stats", data: data }); });
        self.engine.addGraphicsObjects(data.mapData.graphicsObjects);
        self.engine.setPlayerToGraphicsObjectIntance(data.mapData.playerGrpahicsObjectInstance);
    },
    addObjects: data => { self.engine.addObjects(data); },
    updateObjects: data => { self.engine.updateObjects(data); },
    removeObjects: data => { self.engine.removeObjects(data); }
}