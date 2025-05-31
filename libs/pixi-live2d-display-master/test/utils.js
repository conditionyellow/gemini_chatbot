"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualPromise = exports.BASE_PATH = void 0;
exports.delay = delay;
exports.loadScript = loadScript;
exports.defaultOptions = defaultOptions;
exports.loadAsFiles = loadAsFiles;
exports.createFile = createFile;
exports.createModel = createModel;
exports.addAllModels = addAllModels;
exports.overrideDescriptor = overrideDescriptor;
exports.overrideValue = overrideValue;
exports.asDisposable = asDisposable;
exports.normalizeFilter = normalizeFilter;
exports.messageQueue = messageQueue;
exports.createBox = createBox;
const lodash_es_1 = require("lodash-es");
const src_1 = require("../src");
const env_1 = require("./env");
exports.BASE_PATH = "../../../test/";
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
function defaultOptions(options = {}) {
    return {
        motionPreload: src_1.MotionPreloadStrategy.NONE,
        autoUpdate: false,
        ...(0, lodash_es_1.cloneDeep)(options),
    };
}
async function loadAsFiles(urlMap, convertPath) {
    return Promise.all(Object.entries(urlMap).map(async ([path, url]) => {
        const blob = await fetch(await url()).then((res) => res.blob());
        return createFile(blob, convertPath(path));
    }));
}
function createFile(blob, relativePath) {
    const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
    const file = new File([blob], name);
    Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
    return file;
}
function createModel(src, { Class = src_1.Live2DModel, listeners, ...options } = {}) {
    options = defaultOptions(options);
    const creation = new Promise((resolve, reject) => {
        options.onLoad = () => resolve(model);
        options.onError = reject;
    });
    const model = Class.fromSync(src, defaultOptions(options));
    if (listeners)
        Object.entries(listeners).forEach(([key, value]) => {
            console.log("on", key);
            if (typeof value === "function")
                model.on(key, value);
        });
    return creation;
}
async function addAllModels(app, options) {
    const models = await Promise.all(env_1.ALL_TEST_MODELS.map((M) => createModel(M.modelJsonWithUrl, {
        autoUpdate: false,
        autoFocus: false,
        idleMotionGroup: "non-existent",
        ...options,
    })));
    models.forEach((model) => {
        model.scale.set(app.view.width / model.width);
        model.update(1);
        app.stage.addChild(model);
    });
    return models;
}
// inspired by Playwright's source code
class ManualPromise extends Promise {
    constructor() {
        super((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    // return a native Promise for then/catch/finally
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/@@species
    static get [Symbol.species]() {
        return Promise;
    }
}
exports.ManualPromise = ManualPromise;
function overrideDescriptor(obj, prop, getDescriptor) {
    const value = obj[prop];
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    const restore = () => {
        if (descriptor) {
            Object.defineProperty(obj, prop, descriptor);
        }
        else {
            // we may have defined a new own property, then we need to delete it
            // so that the prototype's property descriptor will take effect
            delete obj[prop];
            obj[prop] = value;
        }
    };
    const newDescriptor = getDescriptor({ value, descriptor }, restore);
    // if not configurable, we just let it throw
    Object.defineProperty(obj, prop, newDescriptor);
    return restore;
}
function overrideValue(obj, prop, getValue) {
    return overrideDescriptor(obj, prop, ({ value, descriptor }, restore) => ({
        configurable: true,
        enumerable: descriptor?.enumerable ?? true,
        writable: descriptor?.writable ?? true,
        value: getValue(value, restore),
    }));
}
function asDisposable(dispose) {
    return { [Symbol.dispose]: dispose };
}
function normalizeFilter(filter) {
    if (typeof filter === "string") {
        return (src) => src.includes(filter);
    }
    else if (filter instanceof RegExp) {
        return (src) => filter.test(src);
    }
    else {
        return filter;
    }
}
function messageQueue(waitTimeoutMS = 1000) {
    // usually a test will finish or timeout in a few seconds, but we still set a lifetime limit in case something goes wrong
    const maxLifetime = 1000 * 60;
    const messages = [];
    let produce = (item) => messages.push(item);
    let abort = lodash_es_1.noop;
    const consumer = (async function* () {
        const lifetimeTimerId = setTimeout(() => {
            abort(`lifetime exceeded (${maxLifetime}ms)`);
        }, maxLifetime);
        let timerId;
        const resetControllers = () => {
            clearTimeout(timerId);
            abort = lodash_es_1.noop;
            produce = (item) => messages.push(item);
        };
        try {
            while (true) {
                while (messages.length > 0) {
                    yield messages.shift();
                }
                yield await new Promise((resolve, reject) => {
                    timerId = setTimeout(() => {
                        abort(`timeout reached waiting for next message (${waitTimeoutMS}ms)`);
                    }, waitTimeoutMS);
                    produce = (item) => {
                        resetControllers();
                        resolve(item);
                    };
                    abort = (reason) => {
                        resetControllers();
                        reject(new Error("Message queue aborted: " + reason));
                    };
                });
            }
        }
        finally {
            resetControllers();
            clearTimeout(lifetimeTimerId);
            consumer.ended = true;
        }
    })();
    consumer.ended = false;
    const waitFor = async (check) => {
        for await (const request of consumer) {
            if (check(request)) {
                return request;
            }
        }
        // the queue is not supposed to end while waiting for a particular message
        throw new Error("Unexpected end of waitFor(), the message queue must be broken");
    };
    const stop = () => {
        abort("stop() called");
        consumer.return();
    };
    return {
        produce: (item) => produce(item),
        consumer,
        waitFor,
        stop,
    };
}
function createBox({ onPut, waitTimeoutMS = 1000 } = {}) {
    const items = new Map();
    const deferredTakers = new Set();
    const put = (item) => {
        if (items.has(item)) {
            throw new Error("Cannot put the same item twice");
        }
        onPut?.(item);
        for (const deferredTaker of deferredTakers) {
            if (deferredTaker(item)) {
                return Promise.resolve();
            }
        }
        return new Promise((resolve) => {
            items.set(item, resolve);
        });
    };
    const take = async (check) => {
        for (const [item] of items) {
            if (check(item)) {
                items.delete(item);
                return item;
            }
        }
        return new Promise((resolve, reject) => {
            let rejected = false;
            const deferredTaker = (item) => {
                if (!rejected && check(item)) {
                    items.delete(item);
                    deferredTakers.delete(deferredTaker);
                    resolve(item);
                    return true;
                }
                return false;
            };
            deferredTakers.add(deferredTaker);
            delay(waitTimeoutMS).then(() => {
                rejected = true;
                deferredTakers.delete(deferredTaker);
                reject(new Error(`timed out waiting for item (${waitTimeoutMS}ms)`));
            });
        });
    };
    const peek = () => items.keys();
    return { put, take, peek };
}
//# sourceMappingURL=utils.js.map