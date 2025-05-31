"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../env");
const utils_1 = require("../utils");
const make_test_sound_1 = require("../make-test-sound");
const times = 500;
(0, env_1.testEachModel)(`speak ${times} times`, async ({ app, model: { modelJsonWithUrl, hitTests } }) => {
    const model = await (0, utils_1.createModel)(modelJsonWithUrl);
    model.update(100);
    app.stage.addChild(model);
    app.renderer.resize(model.width, model.height);
    app.render();
    for (let i = 0; i < times; i++) {
        await new Promise((resolve, reject) => {
            const duration = Math.random() * 0.01;
            model.speak((0, make_test_sound_1.makeTestSound)(undefined, 0.1, duration), {
                onFinish: resolve,
                onError: reject,
            });
        });
    }
}, 2 * 60 * 1000);
//# sourceMappingURL=stability.test.js.map