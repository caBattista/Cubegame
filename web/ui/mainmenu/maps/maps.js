class Maps extends Mainmenu {

    constructor(game, parent) {
        super();
        this.game = game;
        this.parent = parent;
        this.createPage();
    }

    async createPage() {
        this.parent.innerHTML = "";
        const elements = this.createHTML(`
            <div class="header">
                <h1>Select a Map</h1>
                <input type="submit" value="Add Map">
            </div>
            <div class="list"></div>`, this.parent, "all");

        elements[0].children[1].addEventListener("click", async ev => {
            const els = this.createToolTip(`
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
            const el = this.createHTML(`<div>
                <div title="${map.id}">${this.keyToHR(map.type)}</div>
                <div>${map.players.length}/${map.max_players}</div>
                <input type="submit" value="Join">
                </div>`, elements[1]);
            el.children[2].addEventListener("click", async ev => {
                this.game.joinMap(map.id);
            });
        });
    }
}