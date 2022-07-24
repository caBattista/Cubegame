class Stats {
    constructor(roundToDecimals = 5, updateInterval = 2000) {
        this.roundToDecimals = roundToDecimals;
        this.metrics = {};
        this.interv = setInterval(() => {
            let output = "";
            Object.entries(this.metrics).forEach(([key, value]) => {
                output += "(" + key + " => ";

                let avgDelta = BigInt(0);
                value.deltas.forEach(delta => {
                    avgDelta += delta;
                });
                avgDelta = Number(avgDelta) / value.deltas.length;
                value.deltas = [];
                output += "avgDelta: \x1b[46m" + ((avgDelta / 1000000)).toFixed(roundToDecimals) + "ms\x1b[0m";//mills when code is done
                if (value.option === true) {
                    let avgInterv = BigInt(0);
                    value.intervs.forEach(interv => {
                        avgInterv += interv;
                    });
                    avgInterv = Number(avgInterv) / value.intervs.length;
                    value.intervs = [];
                    output += ", avgInterv: \x1b[43m" + ((avgInterv / 1000000)).toFixed(roundToDecimals) + "ms\x1b[0m";//millis between frams (interval)
                    output += ", avgFps: \x1b[42m" + ((1000000000 / avgInterv)).toFixed(roundToDecimals) + "\x1b[0m";//fps
                }
                output += ") ";
            });
            console.log("\x1b[45m%s\x1b[0m", "STATS:", output);

        }, updateInterval);
    }
    addMetric(metricName, option) {
        const now = process.hrtime.bigint()//Date.now();
        this.metrics[metricName] = { option: option, deltas: [], intervs: [], t0: now, t1: now };
    }
    start(metricName) {
        this.metrics[metricName].t0 = process.hrtime.bigint(); //Date.now();
    }
    end(metricName) {
        const now = process.hrtime.bigint()//Date.now();
        let metric = this.metrics[metricName];
        metric.deltas.push(now - metric.t0);
        if (metric.option === true) { metric.intervs.push(now - metric.t1); }
        metric.t1 = now;
    }
    stop() { clearInterval(this.interv); }
}

export default Stats;