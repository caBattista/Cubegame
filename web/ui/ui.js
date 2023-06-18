const createHTML = (htmlString, parent, siblings = 0) => {
    const template = document.createElement('template');
    template.innerHTML = htmlString.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, ' ').trim();
    const children = Array.from(template.content.children);
    if (parent) {
        children.forEach(child => {
            parent.appendChild(child);
        });
    }
    return siblings === "all" ? children : children[siblings];
}

const createToolTip = htmlString => {
    const tt = createHTML(`
        <div class="tooltipModalOverlay">
            <div class="tooltipModal">
                <div class="tooltipClose">X</div>
                <div class="tooltipScroll">
                    <div class="tooltipContent"></div>
                </div>
            </div>
        </div>`, document.body);
    tt.children[0].children[0].addEventListener("click", () => tt.remove());
    const content = createHTML(htmlString, tt.children[0].children[1].children[0], "all");
    return { tt: tt, content: content };
}

const formToJSON = parent => {
    const res = {};
    parent.querySelectorAll('[name]').forEach(el => {
        res[el.name] = el.value;
    })
    return res;
}

const keyToHR = key => {
    //Add Space before every uppercase char and remove Space at beginning and end
    key = key.replace(/([A-Z])/g, ' $1').trim();
    //Make first char uppercase
    key = key.charAt(0).toUpperCase() + key.slice(1);
    return key;
}

export { createHTML, createToolTip, formToJSON, keyToHR }