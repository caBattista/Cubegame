class Loader {
    constructor() {
        this.loadedFiles = {}
    }

    async load(pathWOE, option = 0) {
        return new Promise(async (resolve, reject) => {
            if (this.checkAlreadyLoaded(pathWOE) === true) {
                if (this.loadedFiles[pathWOE + '.js'].module) {
                    resolve(this.loadedFiles[pathWOE + '.js'].module);
                }
            }
            else {
                if (option === 0) {
                    const { default: def } = await import(pathWOE + '.js');
                    this.loadedFiles[pathWOE + '.js'] = { pathWOE: pathWOE, ext: 'js', module: def };
                    resolve(def);
                }
                if (option === 1) {
                    const { default: def } = await import(pathWOE + '.js');
                    this.loadedFiles[pathWOE + '.js'] = { pathWOE: pathWOE, ext: 'js', module: def };
                    let htmlEl = document.createElement("link");
                    htmlEl.href = pathWOE + '.css' + (this.client_id ? `?client_id=${this.client_id}` : '');
                    htmlEl.rel = "stylesheet";
                    htmlEl.addEventListener("load", () => {
                        this.loadedFiles[pathWOE + '.css'] = { pathWOE: pathWOE, ext: 'js', htmlEl: htmlEl };
                        resolve(def);
                    });
                    document.head.appendChild(htmlEl);
                }
            }
        });
    }

    checkAlreadyLoaded(pathWOE) {
        let res = false;
        Object.keys(this.loadedFiles).forEach(key => {
            const file = this.loadedFiles[key];
            if (file.pathWOE === pathWOE) { res = true }
        });
        return res;
    }

    unload(pathWOE) {
        Object.keys(this.loadedFiles).forEach(key => {
            const file = this.loadedFiles[key];
            if (file.pathWOE === pathWOE) {
                document.head.removeChild(file.htmlEl);
                delete this.loadedFiles[key];
            }
        });
    }
}

export default Loader