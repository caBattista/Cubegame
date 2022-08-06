class ECS {

    createComponent(map, eId, compName, compData = {}) {
        const compsLength = map.components[compName].length;
        map.components[compName][compsLength] = { eId: eId, ...compData };
        map.entities[eId][compName] = compsLength;
    }

    getComponent(map, eId, compName) {
        return map?.components[compName]?.[map?.entities?.[eId]?.[compName]];
    }

    getComponents(map, compName) {
        return map?.components[compName];
    }

    getGraphicsObject(map, eId) {
        return map?.graphicsObjects?.[this.getComponent(map, eId, "graphics")?.gObj];
    }

    getPlayerIds(map) {
        return map?.components?.player?.map(comp => comp?.playerId)
    }

    getPlayer(maps, playerId) {
        const keys = Object.keys(maps);
        const keysLength = keys.length;
        for (let i = 0; i < keysLength; i++) {
            let map = maps[keys[i]];
            return { map: map, entity: map.entities[this.getPlayerComponentByPlayerId(map, playerId).eId] };
        }
    }

    getPlayerComponentByPlayerId(map, playerId) {
        const playerComponents = this.getComponents(map, "player");
        const playerComponentsLength = playerComponents.length;
        for (let i = 0; i < playerComponentsLength; i++) {
            if (playerComponents[i].playerId === playerId) {
                return playerComponents[i];
            }
        }
    }
}

export default ECS;