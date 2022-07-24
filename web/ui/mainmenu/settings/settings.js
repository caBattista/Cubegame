import { createHTML } from "../../ui.js"

class Settings  {

    constructor(game, parent) {
        this.game = game;
        this.parent = parent;
        this.createPage();
    }

    async createPage() {
        const settings = await this.game.ws.request("settings", "get");

        //create form
        const formEl = createHTML(`
        <form class="settings">
            <h1>Sound</h1>
            <div class="list">
                <div>Global Volume<input type="range" name="sound_global_volume" 
                min="0" max="100" step="1" value="${settings.sound_global_volume}"></div>
            </div>
            <h1>Controls</h1>
            <div class="list">
                <div>Forward<input type="text" name="controls_forward" value="${settings.controls_forward}"></div>
                <div>Backward <input type="text" name="controls_backward" value="${settings.controls_backward}"></div>
                <div>Left <input type="text" name="controls_left" value="${settings.controls_left}"></div>
                <div>Right <input type="text" name="controls_right" value="${settings.controls_right}"></div>
                <div>Jump <input type="text" name="controls_jump" value="${settings.controls_jump}"></div>
                <div>Sprint <input type="text" name="controls_sprint" value="${settings.controls_sprint}"></div>
                <div>Crouch <input type="text" name="controls_crouch" value="${settings.controls_crouch}"></div>
                <div>Interact <input type="text" name="controls_interact" value="${settings.controls_interact}"></div>
                <div>Melee <input type="text" name="controls_melee" value="${settings.controls_melee}"></div>
                <div>Granade <input type="text" name="controls_granade" value="${settings.controls_granade}"></div>
            </div>
            <h1>Graphics</h1>
            <div class="list">
                <div>Quality 
                    <select name="graphics_quality">
                        <option value="Low" ${settings.graphics_quality === "Low" ? "selected" : ""}>Low</option>
                        <option value="Medium" ${settings.graphics_quality === "Medium" ? "selected" : ""}>Medium</option>
                        <option value="High" ${settings.graphics_quality === "High" ? "selected" : ""}>High</option>
                        <option value="Ultra" ${settings.graphics_quality === "Ultra" ? "selected" : ""}>Ultra</option>
                    </select>
                </div>
            </div>
            <h1>Account</h1>
            <div class="list">
                <div>Delete Account<input type="submit" value="Delete"></div>
            </div>
        </form>`, this.parent);

        //Add listeners
        formEl.children[1].addEventListener("change", async ev => {
            this.saveSetting(ev.target.name, ev.target.value);
        });

        formEl.children[3].addEventListener("click", async ev => {
            ev.target.readOnly = true;
            ev.target.value = "Press a Key...";
            const keyListener = async ev2 => {
                ev2.preventDefault();
                document.removeEventListener("keydown", keyListener);
                await this.saveSetting(ev.target.name, ev2.code);
                ev.target.value = ev2.code;
            }
            document.addEventListener("keydown", keyListener);
        });

        formEl.children[5].addEventListener("change", async ev => {
            this.saveSetting(ev.target.name, ev.target.options[ev.target.selectedIndex].value);
        });

        formEl.children[7].addEventListener("click", async ev => {
            await this.game.ws.request("user", "delete");
            //location.reload();
        });
    }
    saveSetting(name, value, type) {
        return new Promise(async (res, rej) => {
            res(await this.game.ws.request("settings", "set",
                { name: name, value: value, type: type }));
        });
    }
}

export default Settings