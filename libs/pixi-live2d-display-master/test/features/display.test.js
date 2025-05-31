"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_es_1 = require("lodash-es");
const vitest_1 = require("vitest");
const src_1 = require("../../src");
const env_1 = require("../env");
const utils_1 = require("../utils");
(0, env_1.testEachModel)("has correct size", async ({ model: { modelJsonUrl, width, height } }) => {
    const model = await (0, utils_1.createModel)(modelJsonUrl);
    (0, vitest_1.expect)(model.width).to.equal(width);
    (0, vitest_1.expect)(model.height).to.equal(height);
    model.scale.set(10, 0.1);
    (0, vitest_1.expect)(model.width).to.equal(width * 10);
    (0, vitest_1.expect)(model.height).to.equal(height * 0.1);
    (0, vitest_1.expect)(model.internalModel.originalWidth).to.equal(width);
    (0, vitest_1.expect)(model.internalModel.originalHeight).to.equal(height);
});
(0, env_1.testEachModel)("respects transformations and layout", async ({ model: { cubismVersion, modelJsonUrl, width, height } }) => {
    const LAYOUT = Object.freeze({
        width: 2,
        height: 3,
        centerX: 4,
        centerY: 5,
        // ... the rest are not tested because they behave so strangely and I'm just YOLOing it
    });
    const model = await (0, utils_1.createModel)(modelJsonUrl, {
        listeners: {
            settingsJSONLoaded(json) {
                if (cubismVersion === 2) {
                    json.layout = LAYOUT;
                }
                else if (cubismVersion === 4) {
                    json.Layout = (0, lodash_es_1.mapKeys)(LAYOUT, (v, k) => k.charAt(0).toLowerCase() + k.slice(1));
                }
            },
        },
    });
    const layoutScaleX = LAYOUT.width / src_1.LOGICAL_WIDTH;
    const layoutScaleY = LAYOUT.height / src_1.LOGICAL_HEIGHT;
    const initialBounds = model.getBounds();
    (0, vitest_1.expect)(initialBounds.x).to.equal(0);
    (0, vitest_1.expect)(initialBounds.y).to.equal(0);
    (0, vitest_1.expect)(initialBounds.width).to.equal(width * layoutScaleX);
    (0, vitest_1.expect)(initialBounds.height).to.equal(height * layoutScaleY);
    const TRANSFORM = Object.freeze({
        x: 1,
        y: 2,
        scaleX: 3,
        scaleY: 4,
        anchorX: 5,
        anchorY: 6,
        // rotation: 7,
    });
    model.position.set(TRANSFORM.x, TRANSFORM.y);
    model.scale.set(TRANSFORM.scaleX, TRANSFORM.scaleY);
    model.anchor.set(TRANSFORM.anchorX, TRANSFORM.anchorY);
    const bounds = model.getBounds();
    (0, vitest_1.expect)(bounds.x).to.equal(TRANSFORM.x - width * layoutScaleX * TRANSFORM.scaleX * TRANSFORM.anchorX);
    (0, vitest_1.expect)(bounds.y).to.equal(TRANSFORM.y - height * layoutScaleY * TRANSFORM.scaleY * TRANSFORM.anchorY);
    (0, vitest_1.expect)(bounds.width).to.equal(width * layoutScaleX * TRANSFORM.scaleX);
    (0, vitest_1.expect)(bounds.height).to.equal(height * layoutScaleY * TRANSFORM.scaleY);
});
//# sourceMappingURL=display.test.js.map