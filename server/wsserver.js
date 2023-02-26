import WebSocket from "ws"
import crypto from "crypto"

class WSServer {
  constructor(config, server) {

    this.config = config;
    this.crypto = crypto;
    //config.compression = undefined;

    this.clients = {};
    this.handlers = {};

    //status messages for close
    this.statusMessages = {
      1000: "Normal Closure", 1001: "Going Away", 1002: "Protocol error", 1003: "Unsupported Data",
      1004: "Reserved", 1005: "No Status Rcvd", 1006: "Abnormal Closure", 1007: "Invalid frame payload data",
      1008: "Policy Violation", 1009: "Message Too Big", 1010: "Mandatory Ext.", 1011: "Internal Error",
      1012: "Service Restart", 1013: "Try Again Later",
      1014: "The server was acting as a gateway or proxy and received an invalid response from the upstream server.",
      1015: "TLS handshake",
    }

    //same port as express 
    //note: perMessageDeflate did not work in wireshark
    this.wss = new WebSocket.Server({ server: server, clientTracking: false });

    //for debug
    this.debug = { bytesSent: 0, bytesRecieved: 0, bytesSentPrev: 0, bytesRecievedPrev: 0 };
    this.getDebug();

    console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "STARTED", "COMPRESSION", this.config.compression);

    //Handle Ping to keep websockets open
    this.on("websocket", "ping", (data, client, send) => {
      send("success", Date.now());
    })

    //register handlers for connection
    this.wss.on('connection', (ws, req) => {
      //add client
      const client = { id: crypto.randomBytes(16).toString("hex"), ws: ws };
      this.clients[client.id] = client;

      //send client id
      this.send(client, "websocket", "connect", "success", { compression: this.config.compression }, false);

      //on message
      ws.on('message', async RawData => {
        this.updateDebug(undefined, RawData);
        RawData = JSON.parse(this.config.compression ? await this.decompress(RawData) : RawData);
        if (["map"].indexOf(RawData.topic) === -1) {
          console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "RECIEVED FROM ", client.id, "\n", RawData);
        }
        const handler = this.handlers[RawData.topic][RawData.action];
        if (typeof handler === 'function') {
          handler(RawData.data, client, (status, data, clientsIds = [client.id]) => {
            clientsIds.forEach(clientId => {
              this.send(this.clients[clientId], RawData.topic, RawData.action, status, data);
            })
          });
        }
        else {
          const errMsg = `Message handler for topic "${RawData.topic}" and action "${RawData.action}" not found`
          this.send(client, RawData.topic, RawData.action, "error", errMsg);
          console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", errMsg);
        }
      });

      //on close
      ws.on('close', statusCode => {
        console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:",
          `CLIENT ${client.id} DISCONNECTED: ${statusCode} ( ${this.statusMessages[statusCode]} )`);
        const handler = this.handlers["websocket"]["disconnect"];
        if (typeof handler === 'function') { handler(client); }
        delete this.clients[client.id];
      });
    });
  }

  on(topic, action, handler) {
    if (!this.handlers[topic]) { this.handlers[topic] = {}; }
    this.handlers[topic][action] = handler;
  }

  async send(client, topic, action, status, data, compression = this.config.compression) {
    const response = { topic: topic, action: action, status: status };
    if (data !== undefined) { response.data = data; }
    let toSend = compression ? await this.compress(JSON.stringify(response)) : JSON.stringify(response);
    if (client.ws.readyState !== WebSocket.OPEN) {
      console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "SEND FAILED", client.id);
      return;
    }
    client.ws.send(toSend);
    this.updateDebug(toSend);
    if (["map"].indexOf(topic) === -1) {
      console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "SEND TO ", client.id, "\n", response);
    }
  }

  closeConnection(id, code, reason) {
    return new Promise((res, rej) => {
      if (this.clients[id] === undefined) { res(0); return; }
      this.clients[id].closedByServer = true;
      this.clients[id].ws.close(code, reason);
      res();
    });
  }

  async compress(data) {
    const cs = new CompressionStream(this.config.compression);
    const writer = cs.writable.getWriter();
    writer.write(new TextEncoder().encode(data));
    writer.close();
    return await new Response(cs.readable).arrayBuffer();
  }

  async decompress(data) {
    const cs = new DecompressionStream(this.config.compression);
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();
    return new TextDecoder().decode(await new Response(cs.readable).arrayBuffer())
  }

  updateDebug(dataSent, dataRecieved) {
    if (typeof (dataSent) === "string") { this.debug.bytesSent += Buffer.byteLength(String(dataSent), "utf-8"); }
    else if (dataSent instanceof ArrayBuffer) { this.debug.bytesSent += dataSent.byteLength; }

    if (typeof (dataRecieved) === "string") { this.debug.bytesRecieved += Buffer.byteLength(String(dataRecieved), "utf-8"); }
    else if (dataRecieved instanceof ArrayBuffer) { this.debug.bytesRecieved += dataRecieved.byteLength; }
  }

  getDebug() {
    setInterval(() => {
      function formatBytes(bytes, decimals = 3) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      }

      this.debug.dataPerSecondSent = this.debug.bytesSent - this.debug.bytesSentPrev;
      this.debug.dataPerSecondRecieved = this.debug.bytesRecieved - this.debug.bytesRecievedPrev;
      this.debug.bytesSentPrev = this.debug.bytesSent;
      this.debug.bytesRecievedPrev = this.debug.bytesRecieved;

      console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:",
        "SENT", formatBytes(this.debug.bytesSent), formatBytes(this.debug.dataPerSecondSent),
        "/S RECIEVED", formatBytes(this.debug.bytesRecieved),
        formatBytes(this.debug.dataPerSecondRecieved), "/S");
    }, 1000);
  }

}
export default WSServer;