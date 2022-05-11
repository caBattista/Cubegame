class Stats {
    constructor(roundToDecimals = 2, updateInterval = 500) {

        //Add to Dom
        this.statsCont = document.createElement("div");
        this.statsCont.className = "stats";
        document.body.appendChild(this.statsCont);

        this.textCont = document.createElement("div");
        this.statsCont.appendChild(this.textCont);

        this.barCont = document.createElement("div");
        this.statsCont.appendChild(this.barCont);

        this.bar = document.createElement("div");
        this.barCont.appendChild(this.bar);

        this.roundToDecimals = roundToDecimals;
        this.vals = [];
        this.msFr = 0;
        this.msBtFr = 0;
        this.interv = setInterval(() => {
            let avMsFr = 0;
            let avMsBtFr = 0;
            this.vals.forEach(val => {
                avMsFr += val.msFr;
                avMsBtFr += val.msBtFr;
            });
            avMsFr /= this.vals.length;
            avMsBtFr /= this.vals.length;
            this.vals = [];

            const fps = Number((1000 / avMsBtFr).toFixed(roundToDecimals));
            const msBtFr = Number(avMsBtFr.toFixed(roundToDecimals));
            const msFr = Number(avMsFr.toFixed(roundToDecimals));

            this.textCont.innerHTML = `FPS: ${fps} <br> msBtFr: ${msBtFr} <br> msFr: ${msFr} <br>`;
            this.barCont.style.width = msBtFr * 5 + "px";
            this.bar.style.width = msFr * 5 + "px";

        }, updateInterval);
    }
    start() { this.t0 = window.performance.now(); }
    end() {
        let now = window.performance.now();
        this.vals.push({ msFr: (now - this.t0), msBtFr: (now - this.t1) });
        this.t1 = now;
    }
    stop() {
        clearInterval(this.interv);
    }
}