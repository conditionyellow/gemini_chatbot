"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@/config");
const utils_1 = require("@/utils");
const middleware_1 = require("@/utils/middleware");
const vitest_1 = require("vitest");
(0, vitest_1.test)("middlewares", async () => {
    const numbers = [];
    await (0, middleware_1.runMiddlewares)([
        async (ctx, next) => {
            (0, vitest_1.expect)(ctx.foo).to.equal(1);
            numbers.push(1);
            await next();
            numbers.push(4);
        },
        (ctx, next) => {
            numbers.push(2);
            return next();
        },
        () => {
            numbers.push(3);
        },
    ], { foo: 1 });
    (0, vitest_1.expect)(numbers).to.eql([1, 2, 3, 4]);
    const err = new Error("wtf");
    await (0, vitest_1.expect)((0, middleware_1.runMiddlewares)([
        async () => {
            throw err;
        },
    ], {})).rejects.toThrow(err);
    await (0, vitest_1.expect)((0, middleware_1.runMiddlewares)([
        () => {
            throw err;
        },
    ], {})).rejects.toThrow(err);
    (0, vitest_1.expect)((0, middleware_1.runMiddlewares)([(ctx, next) => next(err)], {})).rejects.toThrow(err);
});
(0, vitest_1.test)("logger", () => {
    const consoleLog = vitest_1.vi.spyOn(console, "log");
    const consoleWarn = vitest_1.vi.spyOn(console, "warn");
    const consoleError = vitest_1.vi.spyOn(console, "error");
    config_1.config.logLevel = config_1.config.LOG_LEVEL_ERROR;
    utils_1.logger.error("foo", "bar");
    (0, vitest_1.expect)(consoleError).toHaveBeenCalledWith("[foo]", "bar");
    config_1.config.logLevel = config_1.config.LOG_LEVEL_WARNING;
    utils_1.logger.warn("foo", "bar");
    (0, vitest_1.expect)(consoleWarn).toHaveBeenCalledWith("[foo]", "bar");
    config_1.config.logLevel = config_1.config.LOG_LEVEL_VERBOSE;
    utils_1.logger.log("foo", "bar");
    (0, vitest_1.expect)(consoleLog).toHaveBeenCalledWith("[foo]", "bar");
    consoleLog.mockReset();
    config_1.config.logLevel = config_1.config.LOG_LEVEL_NONE;
    utils_1.logger.log("foo", "bar");
    (0, vitest_1.expect)(console.log).not.toHaveBeenCalled();
});
(0, vitest_1.test)("copyProperty", () => {
    const clone = {};
    (0, utils_1.copyProperty)("number", { n: 1 }, clone, "n", "num");
    (0, vitest_1.expect)(clone).to.have.property("num", 1);
});
(0, vitest_1.test)("copyArray", () => {
    const clone = {};
    (0, utils_1.copyArray)("number", { a: [1] }, clone, "a", "arr");
    (0, vitest_1.expect)(clone).to.have.nested.property("arr[0]", 1);
});
(0, vitest_1.test)("string", () => {
    (0, vitest_1.expect)((0, utils_1.folderName)("foo/bar/baz.js")).to.equal("bar");
    (0, vitest_1.expect)((0, utils_1.folderName)("bar/baz.js")).to.equal("bar");
    (0, vitest_1.expect)((0, utils_1.folderName)("bar/")).to.equal("bar");
    (0, vitest_1.expect)((0, utils_1.folderName)("/bar/")).to.equal("bar");
    (0, vitest_1.expect)((0, utils_1.folderName)("baz.js")).to.equal("baz.js");
});
//# sourceMappingURL=utils.test.js.map