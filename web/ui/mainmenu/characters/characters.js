import { createHTML, createToolTip } from "../../ui.js"

class Characters {

    constructor(game, parent) {
        this.game = game;
        this.createPage(parent);
    }

    async createPage(parent) {
        parent.innerHTML = "";
        const elements = createHTML(`
            <div class="header">
                <h1>Select a Character</h1>
                <input type="submit" value="Add Character">
            </div>
            <div class="list"></div>`, parent, "all");

        elements[0].children[1].addEventListener("click", async ev => {
            const els = createToolTip(`
                <h1>Name</h1>
                <input type="text" value="John">
                <input type="submit" value="Add">
            `, document.body);
            els.content[2].addEventListener("click", async ev => {
                await this.game.createCharacter(els.content[1].value);
                this.createPage(parent);
                els.tt.remove();
            });
        });

        const res = await this.game.getCharacters();
        res.forEach(character => {
            const el = createHTML(`<div>
                <div title="${character.id}">${character.name}</div>
                <input type="submit" value="Edit">
                </div>`, elements[1]);
            el.children[1].addEventListener("click", async ev => {
                const els = createToolTip(`
                    <h1>Name</h1>
                    <input type="text" value="${character.name}">
                    <input type="submit" value="Save">
                    <input type="submit" value="Delete">
                `, document.body);
                els.content[2].addEventListener("click", async ev => {
                    await this.game.editCharacter({ id: character.id, name: "name", value: els.content[1].value });
                    this.createPage(parent);
                    els.tt.remove();
                });
                els.content[3].addEventListener("click", ev => {
                    this.game.deleteCharacter(character.id)
                        .then(data => {
                            this.createPage(parent);
                            els.tt.remove();
                        })

                });

            });
        });
    }
}

export default Characters