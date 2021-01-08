class Database {
    constructor(cedentials) {
        const { Client } = require('pg');
        this.pgClient = new Client(cedentials);
        this.pgClient.connect().then(() => {
            this.prepareDatabase();
        }).catch(ex => console.log(ex));
    }

    async prepareDatabase() {
        await this.pgClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await this.pgClient.query(`DELETE FROM characters`);
        await this.pgClient.query(`DELETE FROM settings`);
        await this.pgClient.query(`DELETE FROM users`);
        await this.pgClient.query(`DELETE FROM maps`);
    }

    end() { this.pgClient.end(); }

    handleError(err) {
        console.log("DB:", err);
        return "";
    }

    // ######################### ClientId #########################

    addUserClientId(id, client_id) {
        return new Promise((res, rej) => {
            this.pgClient.query(`UPDATE users SET client_id = $1::text WHERE id = $2::uuid`, [client_id, id]).then(pgRes => {
                res(true)
            }).catch(err => {
                rej(this.handleError(err));
            });
        });
    }

    removeUserClientId(client_id) {
        return new Promise((res, rej) => {
            this.pgClient.query(`UPDATE users SET client_id = NULL WHERE client_id = $1::text`, [client_id]).then(pgRes => {
                res(true)
            }).catch(err => {
                rej(this.handleError(err));
            });
        });
    }

    // ######################### User #########################

    addUser(user) {
        return new Promise((res, rej) => {
            this.pgClient.query(`INSERT INTO users(id, username, password, salt, client_id) 
            VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
                [user.username, user.password, user.salt, user.client_id]).then(pgRes => {
                    res(true);
                }).catch(err => {
                    rej(this.handleError(err));
                })
        });
    }

    getUser(client) {
        return new Promise((res, rej) => {
            const field = client.username ? "username" : client.client_id ? "client_id" : "";
            this.pgClient.query(`SELECT * FROM users WHERE ${field} = $1::text`, [client[field]]).then((pgRes => {
                res(pgRes.rows);
            })).catch(err => {
                rej(this.handleError(err));
            })
        });
    }

    deleteUser(client_id) {
        return new Promise(async (res, rej) => {
            try {
                await this.pgClient.query(`DELETE FROM characters WHERE owner = (SELECT id FROM users WHERE client_id = $1::text)`,
                    [client_id]);
                await this.pgClient.query(`DELETE FROM settings WHERE owner = (SELECT id FROM users WHERE client_id = $1::text)`,
                    [client_id]);
                const pgRes = await this.pgClient.query('DELETE FROM users WHERE client_id = $1::text', [client_id])
                res(pgRes.rows);
            } catch (err) {
                rej(this.handleError(err));
            }
        });
    }

    // ######################### Maps #########################

    addMap(map) {
        return new Promise((res, rej) => {
            this.pgClient.query(`
            INSERT INTO maps(id, type, max_players) 
            VALUES (uuid_generate_v4(), $1, $2)
            RETURNING id`,
                [map.type, map.max_players])
                .then((pgRes => { res(pgRes.rows); }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    getMaps() {
        return new Promise((res, rej) => {
            this.pgClient.query("SELECT * FROM maps")
                .then((pgRes => { res(pgRes.rows); }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    //######################### Characters #########################

    addCharacter(client_id, name) {
        return new Promise((res, rej) => {
            this.pgClient.query(`INSERT INTO characters(id, owner, name) VALUES (uuid_generate_v4(), 
            (SELECT id FROM users WHERE client_id = $1::text), $2::text)`,
                [client_id, name])
                .then((pgRes => {
                    //to do: should get true from db
                    res(true);
                }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    getCharacters(client_id) {
        return new Promise((res, rej) => {
            this.pgClient.query(`SELECT characters.* FROM characters 
            INNER JOIN users ON users.id = characters.owner
            WHERE users.client_id = $1::text
            `, [client_id])
                .then((pgRes => { res(pgRes.rows); }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    editCharacter(client_id, character_id) {
        return new Promise((res, rej) => {
            rej();
        });
    }

    deleteCharacter(client_id, character_id) {
        return new Promise((res, rej) => {
            this.pgClient.query(`DELETE FROM characters 
            WHERE owner = (SELECT id FROM users WHERE client_id = $1::text) AND id = $2::uuid
            `, [client_id, character_id])
                .then((pgRes => { res(true); }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    // ######################### Settings #########################

    addSettings(client_id, settings) {
        return new Promise((res, rej) => {
            Object.keys(settings).join(",");
            this.pgClient.query(`
            INSERT INTO settings(id, owner, ${Object.keys(settings).join(",")}
                ) VALUES (
                uuid_generate_v4(), (SELECT id FROM users WHERE client_id = $1), 
                $2::int, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [client_id].concat(Object.values(settings)))
                .then((pgRes => { res(true); }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    getSettings(client_id) {
        return new Promise((res, rej) => {
            this.pgClient.query(`SELECT settings.* FROM settings 
            INNER JOIN users ON users.id = settings.owner
            WHERE users.client_id = $1
            `, [client_id])
                .then((pgRes => { res(pgRes.rows); }))
                .catch(err => { rej(this.handleError(err)); })
        });
    }

    setSettings(client_id, column_name, value) {
        //first verification and geting type then update column
        return new Promise((res, rej) => {
            this.pgClient.query(`SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'settings'`)
                .then(pgRes1 => {
                    for (let i = 0; i < pgRes1.rows.length; i++) {
                        if (pgRes1.rows[i].column_name === column_name) {
                            this.pgClient.query(`UPDATE settings 
                            SET ${column_name} = $1::${pgRes1.rows[i].data_type} 
                            WHERE owner = (SELECT id FROM users WHERE client_id = $2)
                            `, [value, client_id])
                                .then((pgRes2 => { res(true); }))
                                .catch(err => { rej(this.handleError(err)); })
                            break;
                        }
                    }
                })
                .catch(err => { rej(this.handleError(err)); })
        });
    }
}

module.exports = Database;