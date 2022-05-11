class Ws {

    constructor(game) {
        this.game = game;
        this.handlers = {};
    }

    async connect() {
        return new Promise((res, rej) => {

            //register connect handler
            this.on("websocket", "connect", (status, data) => {
                this.removeHandler("websocket", "connect");
                status === "success" ? res(data) : rej(data);
            });

            //open websocket
            this.ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
            this.ws.onopen = () => {
                this.ws.onmessage = e => {
                    const msg = JSON.parse(e.data);
                    if (["map"].indexOf(msg.topic) === -1 || true) { console.log("WS GOT: ", msg); }
                    const handler = this.handlers[msg.topic] ? this.handlers[msg.topic][msg.action] : null;
                    if (typeof handler === "function") { handler(msg.status, msg.data); }
                    else { console.log(`WS: Message handler for topic '${msg.topic}' action '${msg.action}' not found`) }
                };
                this.ws.onclose = ev => {
                    try { this.game.engine.dispose(); } catch (e) { }
                    clearInterval(this.pingInterv);
                    if (ev.code !== 4000) {
                        document.body.innerHTML = `
                        <style>body{ text-align: center; }</style>
                        <h1>Your websocket connection has closed.</h1>
                        <h1>Status Code: ${ev.code} ${ev.reason ? ", Reason: " + ev.reason : ""}</h1>
                        <h1><input type="submit" value="Reload" onclick="location.reload()"/></h1>`;
                    }
                };

                //set up ping
                this.on("websocket", "ping", (status, data) => {
                    const now = Date.now();
                    this.currentPing = {
                        lastPingRecieved: now,
                        roundTrip: now - this.timeSent,
                        toServer: data - this.timeSent,
                        toClient: now - data
                    }
                    console.log(this.currentPing);
                });
                this.pingInterv = setInterval(() => {
                    this.timeSent = Date.now();
                    this.send("websocket", "ping");
                }, 50000);
                this.timeSent = Date.now();
                this.send("websocket", "ping");
            };
        });
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

    send(topic, action, data) {
        const request = { topic: topic, action: action };
        if (data) { request.data = data; }
        if (["map"].indexOf(topic) === -1) { console.log("WS SENT:", request) }
        this.ws.send(JSON.stringify(request));
    }

    close(code, reason) {
        clearInterval(this.pingInterv);
        this.ws.close(code, reason);
    }
}