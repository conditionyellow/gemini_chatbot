"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FocusController_1 = require("@/cubism-common/FocusController");
const vitest_1 = require("vitest");
const env_1 = require("../env");
(0, env_1.test)("focuses on position with interpolation", function () {
    const controller = new FocusController_1.FocusController();
    controller.focus(0.5, -0.5);
    (0, vitest_1.expect)(controller.x).to.not.equal(0.5);
    (0, vitest_1.expect)(controller.y).to.not.equal(-0.5);
    for (let i = 0; i < 100; i++) {
        controller.update(100);
    }
    (0, vitest_1.expect)(controller.x).to.be.approximately(0.5, 0.01);
    (0, vitest_1.expect)(controller.y).to.be.approximately(-0.5, 0.01);
});
(0, env_1.test)("focuses on position instantly", function () {
    const controller = new FocusController_1.FocusController();
    controller.focus(0.5, -0.5, true);
    (0, vitest_1.expect)(controller.x).to.equal(0.5);
    (0, vitest_1.expect)(controller.y).to.equal(-0.5);
});
//# sourceMappingURL=FocusController.test.js.map