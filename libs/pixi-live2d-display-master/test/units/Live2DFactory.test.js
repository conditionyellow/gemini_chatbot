"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const texture_1 = require("@/factory/texture");
const core_1 = require("@pixi/core");
const vitest_1 = require("vitest");
const env_1 = require("../env");
(0, env_1.test)("creates Texture", async () => {
    await (0, vitest_1.expect)((0, texture_1.createTexture)(env_1.TEST_TEXTURE)).resolves.toBeInstanceOf(core_1.Texture);
    await (0, vitest_1.expect)((0, texture_1.createTexture)("foo")).rejects.toThrow();
});
//# sourceMappingURL=Live2DFactory.test.js.map