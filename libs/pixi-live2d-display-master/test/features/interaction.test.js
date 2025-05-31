"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const env_1 = require("../env");
const utils_1 = require("../utils");
// simulates a pointertap event, copied from the tests in @pixi/event
function tap(app, x, y) {
    app.renderer.events["onPointerDown"](new PointerEvent("pointerdown", { clientX: x, clientY: y }));
    const e = new PointerEvent("pointerup", { clientX: x, clientY: y });
    // so it isn't a pointerupoutside
    Object.defineProperty(e, "target", {
        writable: false,
        value: app.view,
    });
    app.renderer.events["onPointerUp"](e);
}
(0, env_1.testEachModel)("handles tapping", async ({ app, model: { modelJsonWithUrl, hitTests } }) => {
    const model = await (0, utils_1.createModel)(modelJsonWithUrl);
    model.update(100);
    app.stage.addChild(model);
    app.renderer.resize(model.width, model.height);
    app.render();
    const onHit = vitest_1.vi.fn();
    model.on("hit", onHit);
    model.tap(-1000, -1000);
    (0, vitest_1.expect)(onHit).not.toHaveBeenCalled();
    tap(app, 100, 100);
    for (const { hitArea, x, y } of hitTests) {
        model.tap(x, y);
        (0, vitest_1.expect)(onHit).toHaveBeenCalledWith(hitArea);
        onHit.mockClear();
        tap(app, x, y);
        (0, vitest_1.expect)(onHit).toHaveBeenCalledWith(hitArea);
        onHit.mockClear();
    }
});
//# sourceMappingURL=interaction.test.js.map