"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cubism2_1 = require("@/cubism2");
const cubism4_1 = require("@/cubism4");
const vitest_1 = require("vitest");
const cubism_common_1 = require("../../src/cubism-common");
const env_1 = require("../env");
async function createModel(testModel, overrideJson) {
    if (testModel === env_1.TEST_MODEL2) {
        return new cubism2_1.Cubism2InternalModel(await env_1.TEST_MODEL2.coreModel(), new cubism2_1.Cubism2ModelSettings({ ...env_1.TEST_MODEL2.modelJson, url: "foo", ...overrideJson }), { motionPreload: cubism_common_1.MotionPreloadStrategy.NONE });
    }
    else {
        return new cubism4_1.Cubism4InternalModel(await env_1.TEST_MODEL4.coreModel(), new cubism4_1.Cubism4ModelSettings({ ...env_1.TEST_MODEL4.modelJson, url: "foo", ...overrideJson }), { motionPreload: cubism_common_1.MotionPreloadStrategy.NONE });
    }
}
(0, env_1.testEachModel)("emits events during update", async ({ model: testModel }) => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    const model = await createModel(testModel);
    model.updateWebGLContext(gl, 0);
    const beforeMotionUpdate = vitest_1.vi.fn();
    const afterMotionUpdate = vitest_1.vi.fn();
    const beforeModelUpdate = vitest_1.vi.fn();
    model.on("beforeMotionUpdate", beforeMotionUpdate);
    model.on("afterMotionUpdate", afterMotionUpdate);
    model.on("beforeModelUpdate", beforeModelUpdate);
    model.update(1000 / 60, performance.now());
    (0, vitest_1.expect)(beforeMotionUpdate).to.toHaveBeenCalled();
    (0, vitest_1.expect)(afterMotionUpdate).to.toHaveBeenCalled();
    (0, vitest_1.expect)(beforeModelUpdate).to.toHaveBeenCalled();
});
(0, vitest_1.test)("reads layout from settings", async () => {
    const model2 = (await createModel(env_1.TEST_MODEL2, {
        layout: {
            center_x: 0,
            y: 1,
            width: 2,
        },
    }));
    (0, vitest_1.expect)(model2["getLayout"]()).to.eql({
        centerX: 0,
        y: 1,
        width: 2,
    });
    const model4 = (await createModel(env_1.TEST_MODEL4, {
        Layout: {
            CenterX: 0,
            Y: 1,
            Width: 2,
        },
    }));
    (0, vitest_1.expect)(model4["getLayout"]()).to.eql({
        centerX: 0,
        y: 1,
        width: 2,
    });
});
(0, env_1.testEachModel)("provides access to drawables", async ({ model: testModel }) => {
    const model = await createModel(testModel);
    const drawableIDs = model.getDrawableIDs();
    (0, vitest_1.expect)(drawableIDs.length).to.be.greaterThan(10);
    (0, vitest_1.expect)(model.getDrawableIndex(drawableIDs[1])).to.equal(1);
    (0, vitest_1.expect)(model.getDrawableVertices(0).length).to.be.greaterThan(0);
});
//# sourceMappingURL=InternalModel.test.js.map