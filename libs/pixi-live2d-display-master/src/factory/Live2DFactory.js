"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DFactory = void 0;
const cubism_common_1 = require("@/cubism-common");
const Live2DLoader_1 = require("@/factory/Live2DLoader");
const model_middlewares_1 = require("@/factory/model-middlewares");
const utils_1 = require("@/utils");
const middleware_1 = require("@/utils/middleware");
const FileLoader_1 = require("./FileLoader");
const ZipLoader_1 = require("./ZipLoader");
/**
 * Handles all the network load tasks.
 *
 * - Model creation: requested by {@link Live2DModel.from}.
 * - Motion loading: implements the load method of MotionManager.
 * - Expression loading: implements the load method of ExpressionManager.
 */
class Live2DFactory {
    /**
     * Registers a Live2DRuntime.
     */
    static registerRuntime(runtime) {
        Live2DFactory.runtimes.push(runtime);
        // higher version as higher priority
        Live2DFactory.runtimes.sort((a, b) => b.version - a.version);
    }
    /**
     * Finds a runtime that matches given source.
     * @param source - Either a settings JSON object or a ModelSettings instance.
     * @return The Live2DRuntime, or undefined if not found.
     */
    static findRuntime(source) {
        for (const runtime of Live2DFactory.runtimes) {
            if (runtime.test(source)) {
                return runtime;
            }
        }
    }
    /**
     * Sets up a Live2DModel, populating it with all defined resources.
     * @param live2dModel - The Live2DModel instance.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the process.
     * @return Promise that resolves when all resources have been loaded, rejects when error occurs.
     */
    static async setupLive2DModel(live2dModel, source, options) {
        const textureLoaded = new Promise((resolve) => live2dModel.once("textureLoaded", resolve));
        const modelLoaded = new Promise((resolve) => live2dModel.once("modelLoaded", resolve));
        // because the "ready" event is supposed to be emitted after
        // both the internal model and textures have been loaded,
        // we should here wrap the emit() in a then() so it'll
        // be executed after all the handlers of "modelLoaded" and "textureLoaded"
        const readyEventEmitted = Promise.all([textureLoaded, modelLoaded]).then(() => live2dModel.emit("ready"));
        await (0, middleware_1.runMiddlewares)(Live2DFactory.live2DModelMiddlewares, {
            live2dModel: live2dModel,
            source,
            options: options || {},
        });
        // the "load" event should never be emitted before "ready"
        await readyEventEmitted;
        live2dModel.emit("load");
    }
    /**
     * Loads a Motion and registers the task to {@link motionTasksMap}. The task will be automatically
     * canceled when its owner - the MotionManager instance - has been destroyed.
     * @param motionManager - MotionManager that owns this Motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     */
    static loadMotion(motionManager, group, index) {
        // errors in this method are always handled
        const handleError = (e) => motionManager.emit("motionLoadError", group, index, e);
        try {
            const definition = motionManager.definitions[group]?.[index];
            if (!definition) {
                return Promise.resolve(undefined);
            }
            if (!motionManager.listeners("destroy").includes(Live2DFactory.releaseTasks)) {
                motionManager.once("destroy", Live2DFactory.releaseTasks);
            }
            let tasks = Live2DFactory.motionTasksMap.get(motionManager);
            if (!tasks) {
                tasks = {};
                Live2DFactory.motionTasksMap.set(motionManager, tasks);
            }
            let taskGroup = tasks[group];
            if (!taskGroup) {
                taskGroup = [];
                tasks[group] = taskGroup;
            }
            const path = motionManager.getMotionFile(definition);
            taskGroup[index] ?? (taskGroup[index] = Live2DLoader_1.Live2DLoader.load({
                url: path,
                settings: motionManager.settings,
                type: motionManager.motionDataType,
                target: motionManager,
            })
                .then((data) => {
                const taskGroup = Live2DFactory.motionTasksMap.get(motionManager)?.[group];
                if (taskGroup) {
                    delete taskGroup[index];
                }
                const motion = motionManager.createMotion(data, group, definition);
                motionManager.emit("motionLoaded", group, index, motion);
                return motion;
            })
                .catch((e) => {
                utils_1.logger.warn(motionManager.tag, `Failed to load motion: ${path}\n`, e);
                handleError(e);
            }));
            return taskGroup[index];
        }
        catch (e) {
            utils_1.logger.warn(motionManager.tag, `Failed to load motion at "${group}"[${index}]\n`, e);
            handleError(e);
        }
        return Promise.resolve(undefined);
    }
    /**
     * Loads an Expression and registers the task to {@link expressionTasksMap}. The task will be automatically
     * canceled when its owner - the ExpressionManager instance - has been destroyed.
     * @param expressionManager - ExpressionManager that owns this Expression.
     * @param index - Index of the Expression.
     * @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
     */
    static loadExpression(expressionManager, index) {
        // errors in this method are always handled
        const handleError = (e) => expressionManager.emit("expressionLoadError", index, e);
        try {
            const definition = expressionManager.definitions[index];
            if (!definition) {
                return Promise.resolve(undefined);
            }
            if (!expressionManager.listeners("destroy").includes(Live2DFactory.releaseTasks)) {
                expressionManager.once("destroy", Live2DFactory.releaseTasks);
            }
            let tasks = Live2DFactory.expressionTasksMap.get(expressionManager);
            if (!tasks) {
                tasks = [];
                Live2DFactory.expressionTasksMap.set(expressionManager, tasks);
            }
            const path = expressionManager.getExpressionFile(definition);
            tasks[index] ?? (tasks[index] = Live2DLoader_1.Live2DLoader.load({
                url: path,
                settings: expressionManager.settings,
                type: "json",
                target: expressionManager,
            })
                .then((data) => {
                const tasks = Live2DFactory.expressionTasksMap.get(expressionManager);
                if (tasks) {
                    delete tasks[index];
                }
                const expression = expressionManager.createExpression(data, definition);
                expressionManager.emit("expressionLoaded", index, expression);
                return expression;
            })
                .catch((e) => {
                utils_1.logger.warn(expressionManager.tag, `Failed to load expression: ${path}\n`, e);
                handleError(e);
            }));
            return tasks[index];
        }
        catch (e) {
            utils_1.logger.warn(expressionManager.tag, `Failed to load expression at [${index}]\n`, e);
            handleError(e);
        }
        return Promise.resolve(undefined);
    }
    static releaseTasks() {
        if (this instanceof cubism_common_1.MotionManager) {
            Live2DFactory.motionTasksMap.delete(this);
        }
        else {
            Live2DFactory.expressionTasksMap.delete(this);
        }
    }
}
exports.Live2DFactory = Live2DFactory;
/**
 * All registered runtimes, sorted by versions in descending order.
 */
Live2DFactory.runtimes = [];
Live2DFactory.urlToJSON = model_middlewares_1.urlToJSON;
Live2DFactory.jsonToSettings = model_middlewares_1.jsonToSettings;
Live2DFactory.waitUntilReady = model_middlewares_1.waitUntilReady;
Live2DFactory.setupOptionals = model_middlewares_1.setupOptionals;
Live2DFactory.setupEssentials = model_middlewares_1.setupEssentials;
Live2DFactory.createInternalModel = model_middlewares_1.createInternalModel;
/**
 * Middlewares to run through when setting up a Live2DModel.
 */
Live2DFactory.live2DModelMiddlewares = [
    ZipLoader_1.ZipLoader.factory,
    FileLoader_1.FileLoader.factory,
    model_middlewares_1.urlToJSON,
    model_middlewares_1.jsonToSettings,
    model_middlewares_1.waitUntilReady,
    model_middlewares_1.setupOptionals,
    model_middlewares_1.setupEssentials,
    model_middlewares_1.createInternalModel,
];
/**
 * load tasks of each motion. The structure of each value in this map
 * is the same as respective {@link MotionManager.definitions}.
 */
Live2DFactory.motionTasksMap = new WeakMap();
/**
 * Load tasks of each expression.
 */
Live2DFactory.expressionTasksMap = new WeakMap();
cubism_common_1.MotionManager.prototype["_loadMotion"] = function (group, index) {
    return Live2DFactory.loadMotion(this, group, index);
};
cubism_common_1.ExpressionManager.prototype["_loadExpression"] = function (index) {
    return Live2DFactory.loadExpression(this, index);
};
FileLoader_1.FileLoader["live2dFactory"] = Live2DFactory;
ZipLoader_1.ZipLoader["live2dFactory"] = Live2DFactory;
//# sourceMappingURL=Live2DFactory.js.map