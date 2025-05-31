"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const src_1 = require("../../src");
const env_1 = require("../env");
const utils_1 = require("../utils");
(0, env_1.test)("creates Live2DModel", async () => {
    await Promise.all([
        env_1.TEST_MODEL2.modelJsonUrl,
        env_1.TEST_MODEL2.modelJsonWithUrl,
        new src_1.Cubism2ModelSettings(env_1.TEST_MODEL2.modelJsonWithUrl),
        env_1.TEST_MODEL4.modelJsonUrl,
        env_1.TEST_MODEL4.modelJsonWithUrl,
        new src_1.Cubism4ModelSettings(env_1.TEST_MODEL4.modelJsonWithUrl),
    ].map(async (src) => {
        await (0, vitest_1.expect)(src_1.Live2DModel.from(src, (0, utils_1.defaultOptions)())).resolves.toBeInstanceOf(src_1.Live2DModel);
    }));
});
(0, env_1.test)("creates subclassed Live2DModel", async () => {
    class SubLive2DModel extends src_1.Live2DModel {
    }
    const model = SubLive2DModel.from(env_1.TEST_MODEL2.modelJsonWithUrl, (0, utils_1.defaultOptions)());
    await (0, vitest_1.expect)(model).resolves.toBeInstanceOf(SubLive2DModel);
});
(0, env_1.test)("handles error while creating Liv2DModel", async () => {
    src_1.config.logLevel = src_1.config.LOG_LEVEL_ERROR;
    const creation = src_1.Live2DModel.from("badURL", (0, utils_1.defaultOptions)());
    await (0, vitest_1.expect)(creation).rejects.toThrow();
    await (0, vitest_1.expect)(() => src_1.Live2DModel.from({ ...env_1.TEST_MODEL2.modelJsonWithUrl, textures: ["badTexture"] }, (0, utils_1.defaultOptions)())).rejects.toThrow();
});
(0, env_1.test)("creates Live2DModel from a URL without .json extension", async ({ loaderMock }) => {
    const fakeURL = env_1.TEST_MODEL2.modelJsonUrl.replace(".json", "");
    (0, vitest_1.expect)(fakeURL).not.toEqual(env_1.TEST_MODEL2.modelJsonUrl);
    loaderMock.rewrite((url) => url.replace(fakeURL, env_1.TEST_MODEL2.modelJsonUrl));
    await (0, vitest_1.expect)(src_1.Live2DModel.from(fakeURL, (0, utils_1.defaultOptions)())).resolves.toBeInstanceOf(src_1.Live2DModel);
});
(0, env_1.test)("emits events during sync creation", async () => {
    const options = (0, utils_1.defaultOptions)();
    const creation = new Promise((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });
    const listeners = {
        settingsJSONLoaded: vitest_1.vi.fn().mockName("settingsJSONLoaded"),
        settingsLoaded: vitest_1.vi.fn().mockName("settingsLoaded"),
        textureLoaded: vitest_1.vi.fn().mockName("textureLoaded"),
        modelLoaded: vitest_1.vi.fn().mockName("modelLoaded"),
        poseLoaded: vitest_1.vi.fn().mockName("poseLoaded"),
        physicsLoaded: vitest_1.vi.fn().mockName("physicsLoaded"),
        ready: vitest_1.vi.fn().mockName("ready"),
        load: vitest_1.vi.fn().mockName("load"),
    };
    const model = src_1.Live2DModel.fromSync(env_1.TEST_MODEL2.modelJsonUrl, options);
    Object.entries(listeners).forEach(([event, listener]) => {
        model.on(event, listener);
    });
    await creation;
    Object.entries(listeners).forEach(([event, listener]) => {
        (0, vitest_1.expect)(listener).toHaveBeenCalledOnce();
    });
});
(0, env_1.test)("renders correctly when emitting ready during sync creation", async ({ app }) => {
    const options = (0, utils_1.defaultOptions)();
    const creation = new Promise((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });
    const model = src_1.Live2DModel.fromSync(env_1.TEST_MODEL2.modelJsonUrl, options);
    (0, vitest_1.expect)(model).to.be.instanceOf(src_1.Live2DModel);
    const onReady = vitest_1.vi.fn(() => {
        (0, vitest_1.expect)(() => {
            app.stage.addChild(model);
            model.update(100);
            app.render();
        }).not.toThrow();
    });
    const onLoad = vitest_1.vi.fn(() => {
        (0, vitest_1.expect)(() => app.render()).not.toThrow();
    });
    model.on("ready", onReady).on("load", onLoad);
    await creation;
    (0, vitest_1.expect)(onReady).toHaveBeenCalledOnce();
    (0, vitest_1.expect)(onLoad).toHaveBeenCalledOnce();
});
(0, env_1.test)("emits error during sync creation", async () => {
    src_1.config.logLevel = src_1.config.LOG_LEVEL_ERROR;
    const options = (0, utils_1.defaultOptions)();
    const creation = new Promise((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });
    src_1.Live2DModel.fromSync({ ...env_1.TEST_MODEL2.modelJsonWithUrl, model: "badModel" }, options);
    await (0, vitest_1.expect)(creation).rejects.toThrow();
});
(0, env_1.test)("emits texture error during sync creation", async () => {
    src_1.config.logLevel = src_1.config.LOG_LEVEL_ERROR;
    const options = (0, utils_1.defaultOptions)();
    const creation = new Promise((resolve, reject) => {
        options.onLoad = resolve;
        options.onError = reject;
    });
    src_1.Live2DModel.fromSync({ ...env_1.TEST_MODEL2.modelJsonWithUrl, textures: ["badTexture"] }, options);
    await (0, vitest_1.expect)(creation).rejects.toThrow();
});
//# sourceMappingURL=creation.test.js.map