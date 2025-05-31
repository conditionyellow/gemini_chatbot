"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.TEST_SOUND = exports.TEST_TEXTURE = exports.ALL_TEST_MODELS = exports.TEST_MODEL4 = exports.TEST_MODEL2 = void 0;
exports.testEachModel = testEachModel;
exports.describeEachModel = describeEachModel;
/* eslint-disable no-empty-pattern */
const circle_png_url_1 = require("./assets/circle.png?url");
const haru_greeter_t03_moc3_url_1 = require("./assets/haru/haru_greeter_t03.moc3?url");
const haru_greeter_t03_model3_json_1 = require("./assets/haru/haru_greeter_t03.model3.json");
const haru_greeter_t03_model3_json_url_1 = require("./assets/haru/haru_greeter_t03.model3.json?url");
const shizuku_moc_url_1 = require("./assets/shizuku/shizuku.moc?url");
const shizuku_model_json_1 = require("./assets/shizuku/shizuku.model.json");
const shizuku_model_json_url_1 = require("./assets/shizuku/shizuku.model.json?url");
const shake_00_mp3_url_1 = require("./assets/shizuku/sounds/shake_00.mp3?url");
const app_1 = require("@pixi/app");
const lodash_es_1 = require("lodash-es");
const vitest_1 = require("vitest");
const csm4_1 = require("../src/csm4");
const utils_1 = require("./utils");
if ("layout" in shizuku_model_json_1.default) {
    throw new Error("Test model should not have a layout, but found in shizuku");
}
if ("Layout" in haru_greeter_t03_model3_json_1.default) {
    throw new Error("Test model should not have a layout, but found in haru");
}
const shizuku = Object.freeze({
    name: "shizuku",
    cubismVersion: 2,
    modelJsonUrl: shizuku_model_json_url_1.default,
    modelJson: shizuku_model_json_1.default,
    modelJsonWithUrl: { ...shizuku_model_json_1.default, url: shizuku_model_json_url_1.default },
    files: (0, lodash_es_1.memoize)(() => {
        const urlMap = import.meta.glob("./assets/shizuku/**/*", { as: "url" });
        return (0, utils_1.loadAsFiles)(urlMap, (path) => path.replace("./assets", "/test/assets"));
    }),
    width: 1280,
    height: 1380,
    layout: {
        center_x: 0,
        y: 1.2,
        width: 2.4,
    },
    hitTests: [
        { x: 600, y: 550, hitArea: ["head"] },
        { x: 745, y: 670, hitArea: ["head", "mouth"] },
        { x: 780, y: 710, hitArea: ["body"] },
    ],
    interaction: {
        exp: "head",
        motion: {
            body: "tap_body",
        },
    },
    ...(() => {
        const mocData = (0, lodash_es_1.memoize)(() => fetch(shizuku_moc_url_1.default).then((res) => res.arrayBuffer()));
        const coreModel = () => mocData().then((moc) => Live2DModelWebGL.loadModel(moc));
        return { mocData, coreModel };
    })(),
});
const haru = Object.freeze({
    name: "haru",
    cubismVersion: 4,
    modelJsonUrl: haru_greeter_t03_model3_json_url_1.default,
    modelJson: haru_greeter_t03_model3_json_1.default,
    modelJsonWithUrl: { ...haru_greeter_t03_model3_json_1.default, url: haru_greeter_t03_model3_json_url_1.default },
    files: (0, lodash_es_1.memoize)(() => {
        const urlMap = import.meta.glob("./assets/haru/**/*", { as: "url" });
        return (0, utils_1.loadAsFiles)(urlMap, (path) => path.replace("./assets", "/test/assets"));
    }),
    width: 2400,
    height: 4500,
    layout: {
        Width: 1.8,
        X: 0.9,
    },
    hitTests: [
        { x: 1166, y: 834, hitArea: ["Head"] },
        { x: 910, y: 981, hitArea: ["Body"] },
    ],
    interaction: {
        exp: "Head",
        motion: {
            Body: "Tap",
        },
    },
    ...(() => {
        const mocData = (0, lodash_es_1.memoize)(() => fetch(haru_greeter_t03_moc3_url_1.default).then((res) => res.arrayBuffer()));
        const coreModel = () => mocData().then((moc) => csm4_1.CubismMoc.create(moc, true).createModel());
        return { mocData, coreModel };
    })(),
});
exports.TEST_MODEL2 = shizuku;
exports.TEST_MODEL4 = haru;
exports.ALL_TEST_MODELS = [exports.TEST_MODEL2, exports.TEST_MODEL4];
function testEachModel(name, fn, options) {
    for (const model of exports.ALL_TEST_MODELS) {
        exports.test.extend({ model })(`${name} (${model.name})`, fn, options);
    }
}
function describeEachModel(name, fn) {
    for (const model of exports.ALL_TEST_MODELS) {
        (0, vitest_1.describe)(`${name} (${model.name})`, () => fn({ model }));
    }
}
exports.TEST_TEXTURE = circle_png_url_1.default;
exports.TEST_SOUND = shake_00_mp3_url_1.default;
exports.test = vitest_1.test.extend({
    async loaderMock({ task }, use) {
        let rewrite = (url) => url;
        let blockFilter = () => false;
        const allXHRs = [];
        const blockedXHRs = [];
        const waiters = [];
        const restore = (0, utils_1.overrideValue)(csm4_1.XHRLoader, "createXHR", (originalCreateXHR) => {
            return function createXHR(target, url, type, onload, onerror) {
                if (rewrite) {
                    url = rewrite(url);
                }
                const xhr = { url, loaded: false };
                allXHRs.push(xhr);
                let blockedXHR;
                if (blockFilter(url)) {
                    console.log("[loaderMock] blocked", url);
                    blockedXHR = {
                        url,
                        unblock: (transformData) => {
                            blockedXHR = undefined;
                            if (transformData)
                                throw new Error("XHR is not loaded yet");
                        },
                    };
                    blockedXHRs.push(blockedXHR);
                }
                const originalOnload = onload;
                onload = (data) => {
                    if (blockedXHR) {
                        blockedXHR.unblock = (transformData) => {
                            if (transformData) {
                                const originalData = data;
                                data = transformData(originalData);
                                if (data === undefined)
                                    data = originalData;
                            }
                            originalOnload(data);
                        };
                    }
                    else {
                        originalOnload(data);
                    }
                    xhr.loaded = true;
                    waiters.forEach((waiter) => waiter({ url }));
                };
                return originalCreateXHR(target, url + "?test=" + task.name.replaceAll(" ", "-"), type, onload, onerror);
            };
        });
        const loaderMock = {
            getAll: () => allXHRs,
            block: (filter) => {
                if (blockedXHRs.length > 0) {
                    throw new Error(`Some XHRs are still blocked: [${blockedXHRs.map(({ url }) => url)}]`);
                }
                blockFilter = (0, utils_1.normalizeFilter)(filter);
            },
            unblock: (_filter, data) => {
                const filter = (0, utils_1.normalizeFilter)(_filter);
                const filtered = blockedXHRs.filter(({ url }) => filter(url));
                if (filtered.length === 0) {
                    throw new Error(`No blocked XHRs matched the filter (${_filter}): [${blockedXHRs.map((x) => x.url)}]`);
                }
                console.log("[loaderMock] unblocked", filtered.map(({ url }) => url));
                filtered.forEach(({ unblock }) => unblock(data));
                (0, lodash_es_1.pullAll)(blockedXHRs, filtered);
            },
            blockAll: () => {
                loaderMock.block(() => true);
            },
            unblockAll: () => {
                loaderMock.unblock(() => true);
            },
            onLoaded: (_filter) => {
                const filter = (0, utils_1.normalizeFilter)(_filter);
                allXHRs.forEach((x) => {
                    if (x.loaded && filter(x.url)) {
                        throw new Error(`XHR ${x.url} is already loaded`);
                    }
                });
                return new Promise((resolve) => {
                    waiters.push((xhr) => {
                        if (filter(xhr.url)) {
                            resolve();
                        }
                    });
                });
            },
            rewrite: (fn) => {
                rewrite = fn;
            },
        };
        await use(loaderMock);
        restore();
    },
    async app({}, use) {
        const app = new app_1.Application({
            width: 512,
            height: 512,
            autoStart: false,
            autoDensity: true,
        });
        await use(app);
        app.destroy(true, { children: true });
    },
    async timer({}, use) {
        vitest_1.vi.useFakeTimers({
            // https://github.com/vitest-dev/vitest/issues/3863
            toFake: undefined,
        });
        await use();
        vitest_1.vi.useRealTimers();
    },
    async objectURLs({}, use) {
        const objectURLs = [];
        const originalCreateObjectUrl = URL.createObjectURL;
        const originalRevokeObjectURL = URL.revokeObjectURL;
        vitest_1.vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
            const url = originalCreateObjectUrl(blob);
            objectURLs.push(url);
            return url;
        });
        vitest_1.vi.spyOn(URL, "revokeObjectURL").mockImplementation((url) => {
            originalRevokeObjectURL(url);
            (0, lodash_es_1.pull)(objectURLs, url);
        });
        await use(objectURLs);
    },
});
//# sourceMappingURL=env.js.map