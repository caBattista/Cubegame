(async () => {//to be able to use await to define init order
  //#################################### Heroku ####################################################
  const heroku = process.env.PORT ? true : false;

  //#################################### Debug ####################################################
  //deactivate when run on heroku
  //if (heroku) { console.log = function () { } }

  //#################################### Dependancies #############################################

  //Request Validation
  const joi = require('joi');
  //Modern Hashing
  const argon2 = require('argon2');
  const pepper = "|>3|>|>3|2";

  //#################################### Config ##################################################

  //Load config file
  const config = JSON.parse(require('fs').readFileSync('config.json'));

  //#################################### Init main components ####################################

  //Database init
  const Database = require("./server/database.js");
  const db = new Database(heroku ? config.database : config.database_dev);
  await db.init();

  //Webserver init
  const Webserver = require("./server/webserver.js");
  const webserver = new Webserver(config.webserver);
  await webserver.init();

  //Websocket init
  const WSServer = require("./server/wsserver.js");
  const wss = new WSServer(webserver.server);

  //Webserver (complete init)
  webserver.hostFiles({ joi: joi, db: db, wss: wss });

  //Simulator
  const Simulator = require("./server/simulator.js");
  //const { settings } = require('cluster');
  const sim = new Simulator();

  //load maps into Sim
  db.getMaps().then(dbRes => {
    if (typeof (dbRes) === "object") { dbRes.forEach(map => { sim.addMap(map); }); }
  });

  //#################################### Request handling #######################################

  //Login
  wss.on("user", "login", async (data, client, send) => {
    //Check message for invalid inputs
    const valRes = joi.validate(data, joi.object().keys({
      username: joi.string().alphanum().min(3).max(30),
      password: joi.string().alphanum().min(3).max(30),
    }), { presence: "required", stripUnknown: true });
    if (valRes.error !== null) { send("error", "Validation failed"); return; }

    //Check database for user
    const dbRes = await db.getUser({ username: data.username });
    if (dbRes.length !== 1) { send("error", "User not found"); return; }

    //Check password
    const pswRes = await argon2.verify(dbRes[0].password, dbRes[0].salt + data.password + pepper)
    if (pswRes !== true) { send("error", "Password verification failed"); return; }

    //close connection if same client is logged in //doesnt work on heroku
    console.log("\x1b[33m%s\x1b[0m", "REQHANDLE:", "client_id: ", dbRes[0].client_id);
    //const dbRes = await db.removeUserClientId(dbRes[0].client_id);
    await wss.closeConnection(dbRes[0].client_id, 4010,
      "Someone logged into your accout. There can only be one session per account.");

    //Add client_id to db
    const dbRes2 = await db.addUserClientId(dbRes[0].id, client.id);
    if (dbRes2 !== true) { send("error", "Could not add client_id to user"); return; }

    send("success");
  });

  //Register
  wss.on("user", "register", async (data, client, send) => {
    console.log("\x1b[33m%s\x1b[0m", "REQHANDLE:", data)
    //Check message
    const valRes = joi.validate(data, joi.object().keys({
      username: joi.string().alphanum().min(3).max(30),
      password: joi.string().alphanum().min(3).max(30),
    }), { presence: "required", stripUnknown: true });
    if (valRes.error !== null) { send("error", "Validation failed"); return; }

    //Check DB for user (prevent two users with same username)
    const dbRes = await db.getUser({ username: data.username });
    if (dbRes.length !== 0) { send("error", "User alredy exists"); return; }

    //Create default User
    const user = {
      username: data.username,
      password: data.password,
      salt: wss.crypto.randomBytes(16).toString('hex'),
      client_id: client.id
    }
    user.password = await argon2.hash(user.salt + user.password + pepper);

    // Add user to db
    const dbRes2 = await db.addUser(user);
    if (dbRes2 !== true) { send("error", "Could not add user"); return; }

    // Add default settings to db
    const dbRes3 = await db.addSettings(client.id, config.user_default);
    if (dbRes3 !== true) { send("error", "Could not add settings"); return; }

    // // Add default characters to db
    const dbRes4 = await db.addCharacter(client.id, config.user_default_character.display_name);
    if (dbRes4 !== true) { send("error", "Could not add character"); return; }

    send("success");
  });

  //User delete
  wss.on("user", "delete", async (data, client, send) => {
    const dbRes = await db.deleteUser(client.id);
    if (dbRes !== true) { send("error", "Could not delete user from Database"); return; }
    send("success");
  });

  //Websocket disconnect
  wss.on("websocket", "disconnect", async (data, client) => {
    const { mapId, playerIds, removedObjectIds } = sim.removePlayerFromMap(client.id);
    if (mapId !== undefined) {
      if (playerIds.length > 0) {
        //send info to other clients
        playerIds.forEach(playerId => {
          wss.send(wss.clients[playerId], "map", "removeObjects", "success", removedObjectIds)
        })
      } else {
        //stop map if last one
        db.updateMap(sim.stopMap(mapId));
      }
    }
    const dbRes = await db.removeUserClientId(client.id);
    if (dbRes !== true) { console.log("\x1b[33m%s\x1b[0m", "REQHANDLE:", "err deleting client_id"); return; }
  });

  // ######################################## Main Menu ########################################

  wss.on("maps", "create", (data, client, send) => {
    db.addMap(JSON.parse(require('fs').readFileSync(`server/maps/${data.type}.json`))).then(dbRes => {
      if (dbRes.length !== 1) { wss.send(client, { err: { data: "error creating map" } }); return; }
      sim.addMap(dbRes[0]);
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

  // Characters ########################################

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

  // Settings ########################################

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

  //map (ingame) ########################################

  wss.on("map", "join", (data, client, send) => {
    //Add client to map in simulator
    const { type, objects, playerIds, newPlayerObjects } = sim.addPlayerToMap(client.id, data.mapId);
    //send map state to everyone but client
    playerIds.forEach(playerId => {
      if (playerId !== client.id) {
        wss.send(wss.clients[playerId], "map", "addObjects", "success", { type: type, objects: newPlayerObjects })
      }
    })
    //start map if first one
    if (playerIds.length == 1) {
      sim.startMap(data.mapId, (playerIds, mapChange) => {
        //send update to every player on change (including self)
        playerIds.forEach(playerId => {
          wss.send(wss.clients[playerId], "map", "updateMap", "success", mapChange);
        })
      });
    }
    //Send map state to client
    send("success", { type: type, objects: objects });
  });

  wss.on("map", "leave", (data, client, send) => {
    //remove client from map in sim
    const { mapId, playerIds, removedObjectIds } = sim.removePlayerFromMap(client.id);
    if (playerIds.length > 0) {
      //send info to other clients
      playerIds.forEach(playerId => {
        wss.send(wss.clients[playerId], "map", "removeObjects", "success", removedObjectIds)
      })
    } else {
      //stop map if last one
      db.updateMap(sim.stopMap(mapId));
    }
    //send success to client
    send("success");
  });

  wss.on("map", "playerControl", (data, client, send) => {
    sim.controlPlayer(client.id, data);
  });

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

})();