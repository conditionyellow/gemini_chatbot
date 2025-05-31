"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLoader = void 0;
const factory_1 = require("@/factory");
const core_1 = require("@pixi/core");
/**
 * Experimental loader to load resources from uploaded files.
 *
 * This loader relies on
 * [webkitRelativePath](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath)
 * to recognize the file path.
 *
 * Though named as a "Loader", this class has nothing to do with Live2DLoader,
 * it only contains a middleware for the Live2DFactory.
 */
class FileLoader {
    /**
     * Resolves the path of a resource file to the object URL.
     * @param settingsURL - Object URL of the settings file.
     * @param filePath - Resource file path.
     * @return Resolved object URL.
     */
    static resolveURL(settingsURL, filePath) {
        const resolved = _a.filesMap[settingsURL]?.[filePath];
        if (resolved === undefined) {
            throw new Error("Cannot find this file from uploaded files: " + filePath);
        }
        return resolved;
    }
    /**
     * Consumes the files by storing their object URLs. Files not defined in the settings will be ignored.
     */
    static async upload(files, settings) {
        const fileMap = {};
        // only consume the files defined in settings
        for (const definedFile of settings.getDefinedFiles()) {
            // FIXME: deprecated API
            const actualPath = decodeURI(core_1.utils.url.resolve(settings.url, definedFile));
            const actualFile = files.find((file) => file.webkitRelativePath === actualPath);
            if (actualFile) {
                fileMap[definedFile] = URL.createObjectURL(actualFile);
            }
        }
        _a.filesMap[settings._objectURL] = fileMap;
    }
    /**
     * Creates a ModelSettings by given files.
     * @return Promise that resolves with the created ModelSettings.
     */
    static async createSettings(files) {
        const settingsFile = files.find((file) => file.name.endsWith("model.json") || file.name.endsWith("model3.json"));
        if (!settingsFile) {
            throw new TypeError("Settings file not found");
        }
        const settingsText = await _a.readText(settingsFile);
        const settingsJSON = JSON.parse(settingsText);
        settingsJSON.url = settingsFile.webkitRelativePath;
        const runtime = factory_1.Live2DFactory.findRuntime(settingsJSON);
        if (!runtime) {
            throw new Error("Unknown settings JSON");
        }
        const settings = runtime.createModelSettings(settingsJSON);
        settings._objectURL = URL.createObjectURL(settingsFile);
        return settings;
    }
    /**
     * Reads a file as text in UTF-8.
     */
    static async readText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file, "utf8");
        });
    }
}
exports.FileLoader = FileLoader;
_a = FileLoader;
/**
 * Stores all the object URLs of uploaded files.
 */
FileLoader.filesMap = {};
/**
 * Middleware for Live2DFactory.
 */
FileLoader.factory = async (context, next) => {
    if (Array.isArray(context.source) && context.source[0] instanceof File) {
        const files = context.source;
        let settings = files.settings;
        if (!settings) {
            settings = await _a.createSettings(files);
        }
        else if (!settings._objectURL) {
            throw new Error('"_objectURL" must be specified in ModelSettings');
        }
        settings.validateFiles(files.map((file) => encodeURI(file.webkitRelativePath)));
        await _a.upload(files, settings);
        // override the default method to resolve URL from uploaded files
        settings.resolveURL = function (url) {
            return _a.resolveURL(this._objectURL, url);
        };
        context.source = settings;
        // clean up when destroying the model
        context.live2dModel.once("modelLoaded", (internalModel) => {
            internalModel.once("destroy", function () {
                const objectURL = this.settings._objectURL;
                URL.revokeObjectURL(objectURL);
                if (_a.filesMap[objectURL]) {
                    for (const resourceObjectURL of Object.values(_a.filesMap[objectURL])) {
                        URL.revokeObjectURL(resourceObjectURL);
                    }
                }
                delete _a.filesMap[objectURL];
            });
        });
    }
    return next();
};
//# sourceMappingURL=FileLoader.js.map