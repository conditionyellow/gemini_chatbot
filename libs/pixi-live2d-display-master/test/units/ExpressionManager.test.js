"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@/config");
const Cubism4ModelSettings_1 = require("@/cubism4/Cubism4ModelSettings");
require("@/factory");
const vitest_1 = require("vitest");
const src_1 = require("../../src");
const F01_exp3_json_1 = require("../assets/haru/expressions/F01.exp3.json");
const env_1 = require("../env");
(0, env_1.test)("updates parameters", async ({ timer }) => {
    const epsilon = 1e-5;
    const coreModel = await env_1.TEST_MODEL4.coreModel();
    const expManager = new src_1.Cubism4ExpressionManager(new Cubism4ModelSettings_1.Cubism4ModelSettings(env_1.TEST_MODEL4.modelJsonWithUrl));
    const expParamId = F01_exp3_json_1.default.Parameters[0].Id;
    const expParamValue = F01_exp3_json_1.default.Parameters[0].Value;
    await expManager.setExpression("f00");
    expManager.update(coreModel, performance.now());
    (0, vitest_1.expect)(coreModel.getParameterValueById(expParamId)).to.not.closeTo(expParamValue, epsilon);
    vitest_1.vi.advanceTimersByTime(config_1.config.expressionFadingDuration);
    const updated = expManager.update(coreModel, performance.now());
    (0, vitest_1.expect)(updated).to.be.true;
    (0, vitest_1.expect)(coreModel.getParameterValueById(expParamId)).to.closeTo(expParamValue, epsilon);
});
//# sourceMappingURL=ExpressionManager.test.js.map