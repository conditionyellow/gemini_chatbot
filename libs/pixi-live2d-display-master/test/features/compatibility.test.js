"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const texture_1 = require("@/factory/texture");
const core_1 = require("@pixi/core");
const filter_alpha_1 = require("@pixi/filter-alpha");
const graphics_1 = require("@pixi/graphics");
const sprite_1 = require("@pixi/sprite");
const vitest_1 = require("vitest");
const env_1 = require("../env");
const utils_1 = require("../utils");
(0, env_1.test)("works with PIXI.Sprite", async ({ app }) => {
    const sprite = sprite_1.Sprite.from(await (0, texture_1.createTexture)(env_1.TEST_TEXTURE));
    sprite.x = app.view.width / 4;
    sprite.y = app.view.height / 4;
    sprite.width = app.view.width / 2;
    sprite.height = app.view.height / 2;
    sprite.zIndex = 100;
    const sprite2 = sprite_1.Sprite.from(sprite.texture);
    sprite2.width = app.view.width;
    sprite2.height = app.view.height;
    sprite2.zIndex = -100;
    await (0, utils_1.addAllModels)(app);
    app.stage.addChild(sprite);
    app.stage.addChild(sprite2);
    app.render();
    await (0, vitest_1.expect)(app).toMatchImageSnapshot();
}, 10000);
(0, env_1.test)("works with PIXI.Graphics", async ({ app }) => {
    // https://github.com/guansss/pixi-live2d-display/issues/5
    const graphics = new graphics_1.Graphics();
    graphics.beginFill(0x00aa00);
    graphics.drawRect(0, 0, app.view.width / 2, app.view.height / 2);
    graphics.x = app.view.width / 4;
    graphics.y = app.view.height / 4;
    graphics.zIndex = 1001;
    const graphics2 = graphics.clone();
    graphics2.scale.set(2);
    graphics2.zIndex = -100;
    await (0, utils_1.addAllModels)(app);
    app.stage.addChild(graphics);
    app.stage.addChild(graphics2);
    app.render();
    await (0, vitest_1.expect)(app).toMatchImageSnapshot();
});
(0, env_1.test)("works with PIXI.RenderTexture", async ({ app }) => {
    const models = await Promise.all(env_1.ALL_TEST_MODELS.map((M) => (0, utils_1.createModel)(M.modelJsonWithUrl)));
    models.forEach((model) => {
        model.update(100);
        const renderTexture = new core_1.RenderTexture(new core_1.BaseRenderTexture({
            width: model.width,
            height: model.height,
            resolution: 0.5,
        }));
        const sprite = new sprite_1.Sprite(renderTexture);
        sprite.scale.set(app.view.width / sprite.width);
        app.renderer.render(model, { renderTexture });
        app.stage.addChild(sprite);
    });
    app.render();
    await (0, vitest_1.expect)(app).toMatchImageSnapshot();
});
(0, env_1.test)("works with PIXI.Filter", async ({ app }) => {
    const models = await (0, utils_1.addAllModels)(app);
    models.forEach((model) => {
        model.filters = [new filter_alpha_1.AlphaFilter(0.6)];
    });
    app.render();
    await (0, vitest_1.expect)(app).toMatchImageSnapshot();
});
(0, env_1.test)("works after losing and restoring WebGL context", async ({ app }) => {
    await (0, utils_1.addAllModels)(app);
    app.render();
    await (0, utils_1.delay)(50);
    const ext = app.renderer.gl.getExtension("WEBGL_lose_context");
    ext.loseContext();
    app.render();
    await (0, utils_1.delay)(100);
    app.render();
    ext.restoreContext();
    await (0, utils_1.delay)(100);
    app.render();
    (0, vitest_1.expect)(app).toMatchImageSnapshot();
});
//# sourceMappingURL=compatibility.test.js.map