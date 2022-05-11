class WSServer {
  constructor(server) {

    //For client identification
    this.crypto = require('crypto');
    this.clients = {};
    this.handlers = {};

    const WebSocket = require('ws');

    //same port as express
    this.wss = new WebSocket.Server({ server: server, clientTracking: false });

    //for debug
    this.debug = { bytesSent: 0, bytesRecieved: 0, bytesSentPrev : 0, bytesRecievedPrev : 0 };
    this.getDebug();

    console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "STARTED");

    //Handle Ping to keep websockets open
    this.on("websocket", "ping", (data, client, send) => {
      send("success", Date.now());
    })

    this.wss.on('connection', (ws, req) => {
      //add client
      const client = {
        id: this.crypto.randomBytes(16).toString("hex"),
        ws: ws
      };
      this.clients[client.id] = client;

      //send client id
      this.send(client, "websocket", "connect", "success", client.id);

      //on message
      ws.on('message', RawData => {
        this.updateDebug("", RawData);
        RawData = JSON.parse(RawData);
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
      ws.on('close', RawData => {
        this.updateDebug("", RawData);
        RawData = JSON.parse(RawData);
        console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", `CLIENT ${client.id} DISCONNECTED: ${RawData}`);
        const handler = this.handlers["websocket"]["disconnect"];
        if (typeof handler === 'function') {
          handler(RawData.msg, client, (status, data) => {
            this.send(client, RawData.topic, RawData.action, status, data);
          });
        }
        delete this.clients[client.id];
      });

    });
  }

  on(topic, action, handler) {
    if (!this.handlers[topic]) { this.handlers[topic] = {}; }
    this.handlers[topic][action] = handler;
  }

  send(client, topic, action, status, data) {
    const response = { topic: topic, action: action, status: status };
    if (data) { response.data = data; }
    var toSend = JSON.stringify(response);
    client.ws.send(toSend);
    if (["map"].indexOf(topic) === -1) {
      console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "SEND TO ", client.id, "\n", response);
    }
    this.updateDebug(toSend);
  }

  closeConnection(id, code, reason) {
    return new Promise((res, rej) => {
      if (!this.clients[id]) { res(0); return; }
      this.clients[id].closedByServer = true;
      this.clients[id].ws.close(code, reason);
      res();
    });
  }

  updateDebug(dataSent = "", dataRecieved = "") {
    this.debug.bytesSent += Buffer.byteLength(String(dataSent), "utf-8");
    this.debug.bytesRecieved += Buffer.byteLength(String(dataRecieved), "utf-8");
  }

  getDebug(){
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
        formatBytes(this.debug.dataPerSecondRecieved),"/S");
    }, 1000);
  }

}
module.exports = WSServer;