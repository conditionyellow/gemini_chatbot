"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInternalModel = exports.setupEssentials = exports.setupOptionals = exports.waitUntilReady = exports.jsonToSettings = exports.urlToJSON = void 0;
const cubism_common_1 = require("@/cubism-common");
const Live2DFactory_1 = require("@/factory/Live2DFactory");
const Live2DLoader_1 = require("@/factory/Live2DLoader");
const texture_1 = require("@/factory/texture");
const utils_1 = require("@/utils");
const lodash_es_1 = require("lodash-es");
const TAG = "Live2DFactory";
/**
 * A middleware that converts the source from a URL to a settings JSON object.
 */
const urlToJSON = async (context, next) => {
    if (typeof context.source === "string") {
        const data = await Live2DLoader_1.Live2DLoader.load({
            url: context.source,
            type: "json",
            target: context.live2dModel,
        });
        data.url = context.source;
        context.source = data;
        context.live2dModel.emit("settingsJSONLoaded", data);
    }
    return next();
};
exports.urlToJSON = urlToJSON;
/**
 * A middleware that converts the source from a settings JSON object to a ModelSettings instance.
 */
const jsonToSettings = async (context, next) => {
    if (context.source instanceof cubism_common_1.ModelSettings) {
        context.settings = context.source;
        return next();
    }
    else if (typeof context.source === "object") {
        const runtime = Live2DFactory_1.Live2DFactory.findRuntime(context.source);
        if (runtime) {
            const settings = runtime.createModelSettings(context.source);
            context.settings = settings;
            context.live2dModel.emit("settingsLoaded", settings);
            return next();
        }
    }
    throw new TypeError("Unknown settings format.");
};
exports.jsonToSettings = jsonToSettings;
const waitUntilReady = (context, next) => {
    if (context.settings) {
        const runtime = Live2DFactory_1.Live2DFactory.findRuntime(context.settings);
        if (runtime) {
            return runtime.ready().then(next);
        }
    }
    return next();
};
exports.waitUntilReady = waitUntilReady;
/**
 * A middleware that populates the Live2DModel with optional resources.
 * Requires InternalModel in context when all the subsequent middlewares have finished.
 */
const setupOptionals = async (context, next) => {
    // wait until all has finished
    await next();
    const internalModel = context.internalModel;
    if (internalModel) {
        const settings = context.settings;
        const runtime = Live2DFactory_1.Live2DFactory.findRuntime(settings);
        if (runtime) {
            const tasks = [];
            if (settings.pose) {
                tasks.push(Live2DLoader_1.Live2DLoader.load({
                    settings,
                    url: settings.pose,
                    type: "json",
                    target: internalModel,
                })
                    .then((data) => {
                    internalModel.pose = runtime.createPose(internalModel.coreModel, data);
                    context.live2dModel.emit("poseLoaded", internalModel.pose);
                })
                    .catch((e) => {
                    context.live2dModel.emit("poseLoadError", e);
                    utils_1.logger.warn(TAG, "Failed to load pose.", e);
                }));
            }
            if (settings.physics) {
                tasks.push(Live2DLoader_1.Live2DLoader.load({
                    settings,
                    url: settings.physics,
                    type: "json",
                    target: internalModel,
                })
                    .then((data) => {
                    internalModel.physics = runtime.createPhysics(internalModel.coreModel, data);
                    context.live2dModel.emit("physicsLoaded", internalModel.physics);
                })
                    .catch((e) => {
                    context.live2dModel.emit("physicsLoadError", e);
                    utils_1.logger.warn(TAG, "Failed to load physics.", e);
                }));
            }
            if (tasks.length) {
                await Promise.all(tasks);
            }
        }
    }
};
exports.setupOptionals = setupOptionals;
/**
 * A middleware that populates the Live2DModel with essential resources.
 * Requires ModelSettings in context immediately, and InternalModel in context
 * when all the subsequent middlewares have finished.
 */
const setupEssentials = async (context, next) => {
    if (context.settings) {
        const live2DModel = context.live2dModel;
        const loadingTextures = Promise.all(context.settings.textures.map((tex) => {
            const url = context.settings.resolveURL(tex);
            return (0, texture_1.createTexture)(url, { crossOrigin: context.options.crossOrigin });
        }));
        // we'll handle the error later (using await), this catch() is to suppress the unhandled rejection warning
        loadingTextures.catch(lodash_es_1.noop);
        // wait for the internal model to be created
        await next();
        if (context.internalModel) {
            live2DModel.internalModel = context.internalModel;
            live2DModel.emit("modelLoaded", context.internalModel);
        }
        else {
            throw new TypeError("Missing internal model.");
        }
        live2DModel.textures = await loadingTextures;
        live2DModel.emit("textureLoaded", live2DModel.textures);
    }
    else {
        throw new TypeError("Missing settings.");
    }
};
exports.setupEssentials = setupEssentials;
/**
 * A middleware that creates the InternalModel. Requires ModelSettings in context.
 */
const createInternalModel = async (context, next) => {
    const settings = context.settings;
    if (settings instanceof cubism_common_1.ModelSettings) {
        const runtime = Live2DFactory_1.Live2DFactory.findRuntime(settings);
        if (!runtime) {
            throw new TypeError("Unknown model settings.");
        }
        const modelData = await Live2DLoader_1.Live2DLoader.load({
            settings,
            url: settings.moc,
            type: "arraybuffer",
            target: context.live2dModel,
        });
        if (!runtime.isValidMoc(modelData)) {
            throw new Error("Invalid moc data");
        }
        const coreModel = runtime.createCoreModel(modelData);
        context.internalModel = runtime.createInternalModel(coreModel, settings, context.options);
        return next();
    }
    throw new TypeError("Missing settings.");
};
exports.createInternalModel = createInternalModel;
//# sourceMappingURL=model-middlewares.js.map