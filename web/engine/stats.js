class Stats {
    constructor(roundToDecimals = 2, updateInterval = 1000) {
        this.roundToDecimals = roundToDecimals;
        this.updateInterval = updateInterval;
        this.vals = [];
        this.data = { fps: 0, msBtFr: 0, msFr: 0 }
    }

    start() { this.t0 = performance.now(); }

    end() {
        let now = performance.now();
        this.vals.push({ msFr: (now - this.t0), msBtFr: (now - this.t1) });
        this.t1 = now;
    }

    stop() { clearInterval(this.interv); }

    getData(callback) {
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

            this.data.fps = Number((1000 / avMsBtFr).toFixed(this.roundToDecimals));
            this.data.msBtFr = Number(avMsBtFr.toFixed(this.roundToDecimals));
            this.data.msFr = Number(avMsFr.toFixed(this.roundToDecimals));

            callback(this.data);
        }, this.updateInterval);
    }
}

export { Stats }