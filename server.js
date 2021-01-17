//Debug
//console.log = function() {}

//Load config file
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

//Database start
const Database = require("./server/database.js");
const db = new Database(config.database_settings);

//Server start
const express = require('express');
const app = express();
const port = process.env.PORT || config.express_settings.port;

const server = app.listen(port, () => {
  require('dns').lookup(require('os').hostname(), (err, add, fam) => {
    console.log('EX: Webserver started on ' + add + ':' + port);
  });
});

//Host files
app.use('/', async (req, res) => {

  let path = req.originalUrl.split('?')[0];
  path = path === '/' ? '/main/index.html' : path;

  console.log("EX: requested file ", req.query.client_id, " ", path);

  if (config.file_settings.public_files.includes(path)) {
    res.sendFile(path, { root: __dirname + config.file_settings.root_dir });
  }
  else if (req.query.client_id) {
    //Check message
    const valRes = Joi.validate(req.query.client_id, Joi.string().alphanum().required());
    if (valRes.error !== null) { res.status(403).send('Invalid Message'); return; }

    //Check if WSServer knows Client
    if (!wss.clients[req.query.client_id]) { res.status(403).send('Sorry! You cant see that.'); return; }

    //Check if DB knows Client
    const dbRes = await db.getUser({ client_id: req.query.client_id });
    if (dbRes.length !== 1) { res.status(403).send('Sorry! You cant see that.'); return; }
    res.sendFile(path, { root: __dirname + config.file_settings.root_dir });
  }
  else { res.status(404).send('404'); }
});

//Websocket start
const WSServer = require("./server/wsserver.js");
const wss = new WSServer(server);

//Request Validation
const Joi = require('joi');

//Native csprng
const crypto = require('crypto');

//Modern Hashing
const argon2 = require('argon2');
const pepper = "|>3|>|>3|2";

//Request handeling

//Handle login
wss.on("user", "login", async (data, client, send) => {
  //Check message
  const valRes = Joi.validate(data, Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(30),
  }), { presence: "required", stripUnknown: true });
  if (valRes.error !== null) { send("error", "Validation failed"); return; }

  //Check db for user
  const dbRes = await db.getUser({ username: data.username });
  if (dbRes.length !== 1) { send("error", "User not found"); return; }

  //Check password
  const pswRes = await argon2.verify(dbRes[0].password, dbRes[0].salt + data.password + pepper)
  if (pswRes !== true) { send("error", "Password verification failed"); return; }

  //close connection if same client is logged in //doesnt work on heroku
  console.log("client_id: ", dbRes[0].client_id);
  //const dbRes = await db.removeUserClientId(dbRes[0].client_id);
  await wss.closeConnection(dbRes[0].client_id, 4010,
    "Someone logged into your accout. There can only be one session per account.");

  //Add client_id to db
  const dbRes2 = await db.addUserClientId(dbRes[0].id, client.id);
  if (dbRes2 !== true) { send("error", "Could not add client_id to user"); return; }

  send("success");
});

wss.on("user", "register", async (data, client, send) => {
  console.log(data)
  //Check message
  const valRes = Joi.validate(data, Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(30),
  }), { presence: "required", stripUnknown: true });
  if (valRes.error !== null) { send("error", "Validation failed"); return; }

  //Check DB for user (prevent two users with same username)
  const dbRes = await db.getUser({ username: data.username });
  if (dbRes.length !== 0) { send("error", "User alredy exists"); return; }

  //Create default User
  const user = {
    username: data.username,
    password: data.password,
    salt: crypto.randomBytes(16).toString('hex'),
    client_id: client.id
  }
  user.password = await argon2.hash(user.salt + user.password + pepper);

  // Add user to db
  const dbRes2 = await db.addUser(user);
  if (dbRes2 !== true) { send("error", "Could not add user"); return; }

  // Add default settings to db
  const dbRes3 = await db.addSettings(client.id, config.user_default_settings);
  if (dbRes3 !== true) { send("error", "Could not add settings"); return; }

  // // Add default characters to db
  const dbRes4 = await db.addCharacter(client.id, config.user_default_character.display_name);
  if (dbRes4 !== true) { send("error", "Could not add character"); return; }

  send("success");
});

wss.on("user", "delete", async (data, client, send) => {
  const dbRes = await db.deleteUser(client.id);
  if (dbRes !== true) { send("error", "Could not delete user from Database"); return; }
  send("success");
});

wss.on("websocket", "disconnect", async (data, client) => {
  sim.removePlayer(client.id);
  const dbRes = await db.removeUserClientId(client.id);
  if (dbRes !== true) { console.log("err deleting client_id"); return; }
});

const Simulator = require("./server/simulator.js");
//const { settings } = require('cluster');
const sim = new Simulator();

// Main Menu

wss.on("maps", "create", (data, client, send) => {
  db.addMap({ type: data.type, max_players: 10 })
    .then(dbRes => {
      if (dbRes.length !== 1) { wss.send(client, { err: { data: "error creating map" } }); return; }
      sim.addMap(dbRes[0].id);
      send("success");
    });
});
wss.on("maps", "get", (data, client, send) => {
  db.getMaps()
    .then(dbRes => {
      if (typeof (dbRes) === "object") {
        dbRes.forEach(map => { map.players = sim.getPlayersIdsOfMap(map.id) });
        send("success", dbRes);
      }
    });
});

wss.on("characters", "create", (data, client, send) => {
  db.addCharacter(client.id, data.name)
    .then(dbRes => { send("success"); })
    .catch(err => { send("error", err); });
});
wss.on("characters", "get", (data, client, send) => {
  db.getCharacters(client.id)
    .then(dbRes => { send("success", dbRes); })
    .catch(err => { send("error", err); });
});
wss.on("characters", "edit", (data, client, send) => {
  db.editCharacter(client.id, data.id, data.name, data.value)
    .then(dbRes => { send("success", dbRes); })
    .catch(err => { send("error", err); });
});
wss.on("characters", "delete", (data, client, send) => {
  db.deleteCharacter(client.id, data.id)
    .then(dbRes => { send("success"); })
    .catch(err => { send("error", err); });
});

wss.on("settings", "get", (data, client, send) => {
  db.getSettings(client.id)
    .then(rows => { send("success", rows[0]); })
    .catch(err => { send("error", err); })
});
wss.on("settings", "set", (data, client, send) => {
  db.setSettings(client.id, data.name, data.value)
    .then(dbRes => { send("success"); })
    .catch(err => { send("error", err); })
});

wss.on("map", "join", (data, client, send) => {
  sim.addPlayerToMap(client.id, data.mapId);
  const players = sim.getPlayersIdsOfMap(sim.getMapOfPlayer(client.id));
  players.splice(players.indexOf(client.id), 1);
  players.forEach(playerId => {
    wss.send(wss.clients[playerId], "map", "addPlayers", "success", sim.getPlayer(client.id))
  })
  send("success", sim.getMapState(data.mapId));
});
wss.on("map", "change", (data, client, send) => {
  if (data.changes.self) {
    const res = sim.changePlayer(client.id, data.changes.self);
    if (res === true) {
      wss.closeConnection(client.id, 4100, "Violation");
    } else {
      const players = sim.getPlayersIdsOfMap(sim.getMapOfPlayer(client.id));
      players.splice(players.indexOf(client.id), 1);
      players.forEach(playerId => {
        wss.send(wss.clients[playerId], "map", "updatePlayers", "success", sim.getPlayer(client.id))
      })
    }
  }
});
wss.on("map", "leave", (data, client, send) => {
  const players = sim.getPlayersIdsOfMap(sim.getMapOfPlayer(client.id));
  players.splice(players.indexOf(client.id), 1);
  players.forEach(playerId => {
    wss.send(wss.clients[playerId], "map", "removePlayers", "success", sim.getPlayer(client.id))
  })
  sim.removePlayer(client.id);
  send("success");
});

// //Anti Cheat System
// setInterval(() => {
//   const offenders = sim.removeOffenders();
//   offenders.forEach(offender => {
//     wss.send(wss.clients[offender.id], { offences: offender.offences })
//     wss.closeConnection(offender.id, 4100, "Violation");
//   })
// }, 10000);

/*
//On Close
const exitHandler = () => {
  db.end();
  process.exit();
}
//so the program will not close instantly
process.stdin.resume();
//do something when app is closing
process.on('exit', exitHandler);
//catches ctrl+c event
process.on('SIGINT', exitHandler);
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
//catches uncaught exceptions
process.on('uncaughtException', exitHandler);
*/