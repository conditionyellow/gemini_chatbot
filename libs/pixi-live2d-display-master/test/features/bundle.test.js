"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const extra_min_js_url_1 = require("../../dist/extra.min.js?url");
const index_min_js_url_1 = require("../../dist/index.min.js?url");
const pixi_min_js_url_1 = require("../../node_modules/pixi.js/dist/pixi.min.js?url");
const utils_1 = require("../utils");
(0, vitest_1.describe)("works when bundled", async () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, utils_1.loadScript)(pixi_min_js_url_1.default);
        await (0, utils_1.loadScript)(index_min_js_url_1.default);
        await (0, utils_1.loadScript)(extra_min_js_url_1.default);
    });
    (0, vitest_1.test)("basic usage", async () => {
        if (!PIXI) {
            throw new Error("PIXI is not defined");
        }
        const app = new PIXI.Application({
            width: 512,
            height: 512,
            autoStart: false,
            autoDensity: true,
        });
        await (0, utils_1.addAllModels)(app, { Class: PIXI.live2d.Live2DModel });
        app.render();
        await (0, vitest_1.expect)(app).toMatchImageSnapshot();
    });
    (0, vitest_1.test)("HitAreaFrames", async () => {
        if (!PIXI) {
            throw new Error("PIXI is not defined");
        }
        const app = new PIXI.Application({
            width: 512,
            height: 512,
            autoStart: false,
            autoDensity: true,
        });
        const models = await (0, utils_1.addAllModels)(app, { Class: PIXI.live2d.Live2DModel });
        for (const model of models) {
            const hitAreaFrames = new PIXI.live2d.HitAreaFrames();
            model.addChild(hitAreaFrames);
        }
        app.render();
        await (0, vitest_1.expect)(app).toMatchImageSnapshot();
    });
});
//# sourceMappingURL=bundle.test.js.map