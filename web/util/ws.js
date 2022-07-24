class Ws {

    constructor(game) {
        this.game = game;
        this.compression;
        this.currentPing = { lastPingRecieved: 0, roundTrip: 0, toServer: 0, toClient: 0 }
        this.handlers = {};
        this.msgCount = 0;
    }

    async connect(action) {
        return new Promise((res, rej) => {
            //start websocket
            this.ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

            //register onmessage handler
            this.ws.onmessage = async e => {
                this.msgCount++;
                //console.log("WS GOT RAW: ", e.data);
                const decompressed = this.compression !== undefined ? await this.decompressBlob(e.data) : e.data;
                //console.log("WS GOT DECOMPRESSED: ", decompressed);
                const msg = JSON.parse(decompressed);
                if (this.msgCount % 30 === 0 && msg.action === "updateObjects" && msg.topic === "map") {
                    console.log("WS GOT: ", this.msgCount, msg);
                }
                const handler = this.handlers[msg.topic] ? this.handlers[msg.topic][msg.action] : null;
                if (typeof handler === "function") { handler(msg.status, msg.data); }
                else { console.log(`WS: Message handler for topic '${msg.topic}' action '${msg.action}' not found`) }
            };

            //register onclose handler
            this.ws.onclose = ev => {
                // try { this.game.engine.dispose(); } catch (e) { }
                clearInterval(this.pingInterv);
                if (ev.code !== 4000) {
                    document.body.innerHTML = `
                    <style>body{ text-align: center; }</style>
                    <h1>Your websocket connection has closed.</h1>
                    <h1>Status Code: ${ev.code} ${ev.reason ? ", Reason: " + ev.reason : ""}</h1>
                    <h1><input type="submit" value="Reload" onclick="location.reload()"/></h1>`;
                }
            };

            //register connect handler
            this.on("websocket", "connect", (status, data) => {
                this.removeHandler("websocket", "connect");
                if (status === "success") {
                    //set compression
                    this.compression = data.compression;
                    //set up ping
                    this.startPing();
                    res(data.clientId)
                } else { rej(data) }
            });
        });
    }

    startPing() {
        this.on("websocket", "ping", (status, data) => {
            const now = Date.now();
            this.currentPing.lastPingRecieved = now;
            this.currentPing.roundTrip = now - this.timeSent;
            this.currentPing.toServer = data - this.timeSent;
            this.currentPing.toClient = now - data;
            console.log(this.currentPing);
        });
        this.pingInterv = setInterval(() => {
            this.timeSent = Date.now();
            this.send("websocket", "ping");
        }, 10000);
        this.timeSent = Date.now();
        this.send("websocket", "ping");
    }

    on(topic, action, handler) {
        if (!this.handlers[topic]) { this.handlers[topic] = {}; }
        this.handlers[topic][action] = handler;
    }

    request(topic, action, data) {
        return new Promise((res, rej) => {
            //register handler
            this.on(topic, action, (status, data) => {
                this.removeHandler(topic, action);
                status === "success" ? res(data) : rej(data);
            })
            this.send(topic, action, data);
        });
    }

    removeHandler(topic, action) {
        delete this.handlers[topic][action];
        if (Object.keys(this.handlers[topic]).length === 0) {
            delete this.handlers[topic];
        }
    }

    async send(topic, action, data) {
        const request = { topic: topic, action: action };
        if (data) { request.data = data; }
        if (["map"].indexOf(topic) === -1) { console.log("WS SENT:", request) }
        let send = this.compression !== undefined ? await this.compress(JSON.stringify(request)) : JSON.stringify(request);
        this.ws.send(send);
    }

    // close(code, reason) {//unused
    //     console.log(code, reason);
    //     clearInterval(this.pingInterv);
    //     this.ws.close(code, reason);
    // }

    async compress(data) {
        const cs = new CompressionStream(this.compression);
        const writer = cs.writable.getWriter();
        writer.write(new TextEncoder().encode(data));
        writer.close();
        return await new Response(cs.readable).arrayBuffer();
    }

    async decompressBlob(data) {
        const cs = new DecompressionStream(this.compression);
        const writer = cs.writable.getWriter();
        writer.write(await data.arrayBuffer());
        writer.close();
        return new TextDecoder().decode(await new Response(cs.readable).arrayBuffer())
    }
}

export default Ws