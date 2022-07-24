import { createHTML } from "../ui.js"

class Mainmenu {

    constructor(game) {
        this.game = game;
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.state = { selectedPage: "" };
            const lels = this.createLayout(document.body);
            this.stage = lels[1];
            this.createMenuPage(lels[0]);
            this.loadPage("Lobby");
        });
    }

    createLayout(parent) {
        const elements = createHTML(`
            <div class="mainMenuWrapper">
                <div class="side"></div>
                <div class="stage"></div>
            </div>
            `, parent).children;
        return elements;
    }

    createMenuPage(parent) {

        const menu = createHTML(`
            <h1>Menu</h1>
            <ul>
                <li><input type="submit" value="Lobby" class="selected"></li>
                <li><input type="submit" value="Characters"></li>
                <li><input type="submit" value="Settings"></li>
                <li><input type="submit" value="Logout"></li>
            </ul>
            <div></div>
        `, parent, "all");

        menu[1].addEventListener("click", ev => {
            if (ev.target.tagName === "INPUT") {
                const inputClicked = ev.target;
                if (inputClicked.value === "Logout") {
                    location.reload();
                } else /*if (this.state.selectedPage !== inputClicked.value)*/ {
                    this.state.selectedPage = inputClicked.value;
                    Array.from(menu[1].getElementsByTagName("input")).forEach(input => {
                        input.classList.remove("selected");
                    });
                    inputClicked.classList.add("selected");
                    this.stage.innerHTML = "";
                    this.loadPage(inputClicked.value);
                }
            }
        })
        menu[2].textContent = `Ping: ${this.game.ws.currentPing.roundTrip}/${this.game.ws.currentPing.toServer}/${this.game.ws.currentPing.toClient}`;

        const pingUpdate = setInterval(() => {
            if (menu[2]) {
                menu[2].textContent = `Ping: 
                    ${this.game.ws.currentPing.roundTrip}/${this.game.ws.currentPing.toServer}/${this.game.ws.currentPing.toClient}`;
            } else { clearInterval(pingUpdate); }
        }, 50000);
    }

    async loadPage(pageName) {
        switch (pageName) {
            case "Lobby":
                const Maps = await this.game.loader.load("/ui/mainmenu/maps/maps", 1);
                new Maps(this.game, this.stage);
                break;
            case "Characters":
                const Characters = await this.game.loader.load("/ui/mainmenu/characters/characters")
                new Characters(this.game, this.stage);
                break;
            case "Settings":
                const Settings = await this.game.loader.load("/ui/mainmenu/settings/settings", 1);
                new Settings(this.game, this.stage);
                break;
        }
    }
}

export default Mainmenu