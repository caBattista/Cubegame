class Login extends Ui {

    constructor(game) {
        super();
        this.game = game;
    }

    login() {
        return new Promise((resolve, reject) => {
            const el = this.createHTML(`
            <img class="loginLogo"src="main/favicon.png"/>
            <h1>Please log in</h1>
            <div class="login">
                <h3>Username</h3>
                <input type="text" name="username">
                <h3>Password</h3>
                <input type="password" name="password">
                <br>
                <input type="submit" value="Log In">
                <input type="submit" value="Register">
            </div>
            `, document.body, 2);

            const handleSubmit = async (topic, action, data) => {
                //start websocket
                await this.game.loader.load("util/ws");
                this.game.ws = new Ws(this.game);
                this.game.loader.addClientId(await this.game.ws.connect());

                this.game.ws.request(topic, action, data)
                    .then(data => {
                        document.body.innerHTML = "";
                        resolve();
                    })
                    .catch(data => {
                        this.game.ws.close(4000, data);
                        el.previousSibling.textContent = data;
                    });
            }
            el.addEventListener("keyup", ev => {
                if (ev.keyCode !== 13) { return; }
                ev.preventDefault();
                handleSubmit("user", "login", this.formToJSON(el));
            });
            el.children[5].addEventListener("click", ev => {
                handleSubmit("user", "login", this.formToJSON(el));
            });
            el.children[6].addEventListener("click", ev => {
                handleSubmit("user", "register", this.formToJSON(el));
            });

            //animation

            setTimeout(() => {
                el.parentNode.children[0].style.transform =
                    "translate(-50%, -50%) rotate(360deg)";
                el.parentNode.children[0].style.opacity = "1";
                setTimeout(() => {
                    el.parentNode.children[1].style.opacity = "1";
                    el.parentNode.children[2].style.opacity = "0.9";
                }, 500)
            }, 100);
        });
    }

    autoLogin(username, password, action) {
        return new Promise(async (resolve, reject) => {
            await this.game.loader.load("util/ws");
            this.game.ws = new Ws(this.game);
            this.game.loader.addClientId(await this.game.ws.connect());
            await this.game.ws.request("user", action, { username: username, password: password })
            document.body.innerHTML = "";
            resolve();
        });
    }
}