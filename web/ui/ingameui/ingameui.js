class Ingameui extends Ui {
    constructor(game) {
        super();
        this.game = game;
        this.createMenu();
        this.createHud();
        this.createCanvas();
    }

    show() {
        setTimeout(() => {
            this.canvas.style.opacity = 1;
            this.ingamemenu.style.opacity = 1;
            this.hud.style.opacity = 1;
        }, 500);
    }

    createProgressBar() {
        this.progressBar = this.game.ui.createHTML(`
        <div class="progressBar">
            <div></div>
            <div></div>
        </div>
        `, document.body);
    }

    removeProgressBar() {
        document.body.removeChild(this.progressBar);
    }

    updateProgressBar(now, total, text) {
        this.progressBar.children[0].style.width = `${now / total * 100}%`;
        this.progressBar.children[1].textContent = text ? text : `${now / total * 100}%`;
    }

    createCanvas() {
        this.canvas = this.createHTML(`<canvas></canvas>`, document.body);
    }

    createMenu() {
        this.ingamemenu = this.createHTML(`
            <div class="ingamemenu">
                <input type="submit" value="Back To Main Menu">
                ${this.game.loader.client_id}
            </div>
            `, document.body);
        this.ingamemenu.children[0].addEventListener("click", ev => {
            this.game.leaveMap();
        })
    }

    createHud() {
        this.hud = this.createHTML(`
        <div class="hud">
            <div class="crosshair"></div>
            <div class="leaderBoard"><h4>Players</h4><table></table></div>
        </div>
        `, document.body);
    }
}
