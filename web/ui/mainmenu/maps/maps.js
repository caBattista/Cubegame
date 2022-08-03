import { createHTML, createToolTip, keyToHR } from "../../ui.js"

class Maps {

    constructor(game, parent) {
        this.game = game;
        this.parent = parent;
        this.createPage();
    }

    async createPage() {
        this.parent.innerHTML = "";
        const elements = createHTML(`
            <div class="header">
                <h1>Select a Map</h1>
                <input type="submit" value="Add Map">
            </div>
            <div class="list"></div>`, this.parent, "all");

        elements[0].children[1].addEventListener("click", async ev => {
            const els = createToolTip(`
                <h1>Name</h1>
                <select name="map_name">
                    <option value="mountainwaters" selected>Mountainwaters</option>
                    <option value="space">Space</option>
                  </select>
                <input type="submit" value="Add">
            `, document.body);
            els.content[2].addEventListener("click", async ev => {
                await this.game.createMap(els.content[1].options[els.content[1].selectedIndex].value);
                this.createPage(this.parent);
                els.tt.remove();
            });
        });
        const res = await this.game.getMaps();
        res.forEach(map => {
            console.log(map)
            const el = createHTML(`<div>
                <div title="${map.id}">${keyToHR(map.type)}</div>
                <div>${map.players}/${map.max_players}</div>
                <input type="submit" value="Join">
                </div>`, elements[1]);
            el.children[2].addEventListener("click", async ev => {
                this.game.joinMap(map.id);
            });
        });
    }
}

export default Maps