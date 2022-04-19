class Webserver {
    constructor(config) {
        this.config = config;
        this.config.port = process.env.PORT || this.config.port;
        this.express = require('express');
        this.app = this.express();
    }

    async init() {
        return new Promise((res, rej) => {
            this.server = this.app.listen(this.config.port, () => {
                require('dns').lookup(require('os').hostname(), (err, add, fam) => {
                    console.log("\x1b[31m%s\x1b[0m", "WEBSERVER:", 'STARTED ' + add + ':' + this.config.port);
                    res(true);
                });
            });
        });
    }

    hostFiles(deps) {
        this.deps = deps;
        this.app.use('/', async (req, res) => {

            let path = req.originalUrl.split('?')[0];
            path = path === '/' ? '/main/index.html' : path;

            console.log("\x1b[31m%s\x1b[0m", "WEBSERVER:", req.query.client_id, "REQUESTED", path);

            //check if requested file is public then send
            if (this.config.public_files.includes(path)) {
                res.sendFile(path, { root: this.config.root_dir });
            }
            //if client_id is given
            else if (req.query.client_id) {
                //Check message
                const valRes = this.deps.joi.validate(req.query.client_id, this.deps.joi.string().alphanum().required());
                if (valRes.error !== null) { res.status(403).send('Invalid Message'); return; }

                //Check if WSServer knows Client
                if (!this.deps.wss.clients[req.query.client_id]) { res.status(403).send('Sorry! You cant see that.'); return; }

                //Check if DB knows Client
                const dbRes = await this.deps.db.getUser({ client_id: req.query.client_id });
                if (dbRes.length !== 1) { res.status(403).send('Sorry! You cant see that.'); return; }
                res.sendFile(path, { root: this.config.root_dir });
            }
            else { res.status(404).send('404'); }
        });
        console.log("\x1b[31m%s\x1b[0m", "WEBSERVER:", 'INIT COMPLETE');
    }
}

module.exports = Webserver;