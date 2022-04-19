class WSServer {
  constructor(server) {

    //For client identification
    this.crypto = require('crypto');
    this.clients = {};
    this.handlers = {};

    const WebSocket = require('ws');

    //same port as express
    this.wss = new WebSocket.Server({ server: server, clientTracking: false });

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
        RawData = JSON.parse(RawData);
        console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "RECIEVED FROM ", client.id, "\n", RawData);
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
    client.ws.send(JSON.stringify(response));
    console.log("\x1b[36m%s\x1b[0m", "WEBSOCKET:", "SEND TO ", client.id, "\n", response);
  }

  closeConnection(id, code, reason) {
    return new Promise((res, rej) => {
      if (!this.clients[id]) { res(0); return; }
      this.clients[id].closedByServer = true;
      this.clients[id].ws.close(code, reason);
      res();
    });
  }

}
module.exports = WSServer;