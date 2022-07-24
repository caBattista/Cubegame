import { createHTML, formToJSON } from "../ui.js"
class Login {

    constructor() { }

    login(handleSubmit) {
        const el = createHTML(`
            <img class="loginLogo"src="favicon.png"/>
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
        el.addEventListener("keypress", ev => {
            if (ev.keyCode !== 13) { return; }
            ev.preventDefault();
            handleSubmit("user", "login", formToJSON(el));
        });
        el.children[5].addEventListener("click", ev => {
            handleSubmit("user", "login", formToJSON(el));
        });
        el.children[6].addEventListener("click", ev => {
            handleSubmit("user", "register", formToJSON(el));
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
    }
}

export default Login