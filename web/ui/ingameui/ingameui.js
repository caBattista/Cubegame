import { createHTML } from "../ui.js"

class Ingameui{
    constructor(game) {
        this.game = game;
        this.createMenu();
        this.createHud();
        this.createCanvas();
        //this.handleCanvasResize();
    }

    show() {
        setTimeout(() => {
            this.canvas.style.opacity = 1;
            this.ingamemenu.style.opacity = 1;
            this.hud.style.opacity = 1;
        }, 500);
    }

    createProgressBar() {
        this.progressBar = createHTML(`
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
        this.canvas = createHTML(`<canvas height="${window.innerHeight}" width="${window.innerWidth}"></canvas>`, document.body);
    }

    handleCanvasResize() {
        let reisizeWait;
        window.addEventListener('resize', ev => {
            this.canvas.style.opacity = 0;
            clearTimeout(reisizeWait);
            reisizeWait = setTimeout(() => {
                this.canvas.height = window.innerHeight;
                this.canvas.width = window.innerWidth;
                setTimeout(() => { this.canvas.style.opacity = 1; }, 250);
            }, 100);
        })
    }

    createMenu() {
        this.ingamemenu = createHTML(`
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
        this.hud = createHTML(`
        <div class="hud">
            <div class="crosshair"></div>
            <div class="leaderBoard"><h4>Players</h4><table></table></div>
        </div>
        `, document.body);
    }
}

export default Ingameui