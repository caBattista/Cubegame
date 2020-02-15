
// wss.on('connection', function (ws) {
//   let client = initClient(ws);

//   ws.on('message', function (msg) {
//     var msg = JSON.parse(msg);
//     //console.log(msg);

//     if (msg.lTest) { sendJson(ws, msg); return; }
//     else if (msg.rp) {
//       client.nick = msg.rp.nick ? msg.rp.nick : client.id;

//       //assign id to new player
//       sendJson(ws, { ns: { id: client.id, nick: client.nick, color: client.color, loc: client.loc } });

//       //load players to new player
//       for (var key in clients) {
//         if (key !== client.id) {
//           sendJson(ws, { np: { id: clients[key].id, nick: clients[key].nick, color: clients[key].color, loc: clients[key].loc } });
//         }
//       }

//       //notify other players of new player
//       broadcast({ np: { id: client.id, nick: client.nick, color: client.color, loc: client.loc } }, client.id);

//       updateLB();
//       return;
//     }
//     else if (msg.udp) client.loc = msg.udp.loc;
//     else if (msg.hit) {
//       sendJson(ws, { sp: { loc: getRndLoc(125) } });
//       if (msg.hit.hitter) clients[msg.hit.hitter].k++;
//       clients[msg.hit.id].d++;
//       updateLB();
//     }

//     broadcast(msg, client.id);
//   });

//   ws.on('close', function (msg) {
//     broadcast({ dc: { id: client.id } }, client.id);
//     delete clients[client.id];
//     updateLB();
//   });
// });

// //##################################  helper functions ###########################################
// const updateLB = () => {
//   let sortedIds = Object.keys(clients).sort((a, b) => {
//     return (clients[b].k - clients[b].d) - (clients[a].k - clients[a].d)
//   });
//   let lb = { lb: {} }
//   let i = 0;
//   for (const key of sortedIds) {
//     lb.lb[key] = { k: clients[key].k, d: clients[key].d };
//     i++;
//     if (i >= 10) break;
//   }
//   broadcast(lb);
// }

// const getRandomColor = () => {
//   var letters = '0123456789ABCDEF';
//   var color = '#';
//   for (var i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * 16)];
//   }
//   return color;
// }

// const getRnd = (min, max) => {
//   return Math.random() * (max - min) + min;
// }

// const getRndLoc = (range) => {
//   return { x: getRnd(-range, range), y: 1, z: getRnd(-range, range), _x: 0, _y: 0, _z: 0 };
// }