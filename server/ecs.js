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

    findPlayer(maps, playerId) {
        let res;
        const keys = Object.keys(maps);
        const keysLength = keys.length;
        for (let i = 0; i < keysLength; i++) {
            const map = maps[keys[i]];
            const mapEntities = map.entities;
            const mapEntitiesLength = mapEntities.length;
            for (let j = 0; j < mapEntitiesLength; j++) {
                if (this.getComponent(map, j, "player")?.playerId === playerId) {
                    res = { map: map, entity: mapEntities[j] };
                    i = keysLength;
                    j = mapEntitiesLength;
                }
            }
        }
        return res;
    }
}

export default ECS;