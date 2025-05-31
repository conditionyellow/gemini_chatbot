"use strict";
// run this to tell git not to track this file
// git update-index --skip-worktree test/playground/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
const pixi_js_1 = require("pixi.js");
const src_1 = require("../src");
src_1.Live2DModel.registerTicker(pixi_js_1.Ticker);
const canvas = document.getElementById("canvas");
const modelURL = "https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json";
async function main() {
    const app = new pixi_js_1.Application({
        resizeTo: window,
        view: canvas,
    });
    window.app = app;
    const model = await src_1.Live2DModel.from(modelURL);
    app.stage.addChild(model);
}
main().then();
function checkbox(name, onChange) {
    const id = name.replace(/\W/g, "").toLowerCase();
    document.getElementById("control").innerHTML += `
<p>
  <input type="checkbox" id="${id}">
  <label for="${id}">${name}</label>
</p>`;
    const checkbox = document.getElementById(id);
    checkbox.addEventListener("change", (ev) => {
        onChange(checkbox.checked);
    });
    onChange(checkbox.checked);
}
//# sourceMappingURL=index.js.map