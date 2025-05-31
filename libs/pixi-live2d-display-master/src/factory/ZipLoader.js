"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipLoader = void 0;
const Live2DLoader_1 = require("@/factory/Live2DLoader");
const core_1 = require("@pixi/core");
/**
 * Experimental loader to load resources from a zip file.
 *
 * Though named as a "Loader", this class has nothing to do with Live2DLoader,
 * it only contains a middleware for the Live2DFactory.
 */
class ZipLoader {
    static async unzip(reader, settings) {
        const filePaths = await _a.getFilePaths(reader);
        const requiredFilePaths = [];
        // only consume the files defined in settings
        for (const definedFile of settings.getDefinedFiles()) {
            // FIXME: deprecated API
            const actualPath = decodeURI(core_1.utils.url.resolve(settings.url, definedFile));
            if (filePaths.includes(actualPath)) {
                requiredFilePaths.push(actualPath);
            }
        }
        const files = await _a.getFiles(reader, requiredFilePaths);
        for (let i = 0; i < files.length; i++) {
            const path = requiredFilePaths[i];
            const file = files[i];
            // let's borrow this property...
            Object.defineProperty(file, "webkitRelativePath", {
                value: path,
            });
        }
        return files;
    }
    static async createSettings(reader) {
        const filePaths = await _a.getFilePaths(reader);
        const settingsFilePath = filePaths.find((path) => path.endsWith("model.json") || path.endsWith("model3.json"));
        if (!settingsFilePath) {
            throw new Error("Settings file not found");
        }
        const settingsText = await _a.readText(reader, settingsFilePath);
        if (!settingsText) {
            throw new Error("Empty settings file: " + settingsFilePath);
        }
        const settingsJSON = JSON.parse(settingsText);
        settingsJSON.url = settingsFilePath;
        const runtime = _a.live2dFactory.findRuntime(settingsJSON);
        if (!runtime) {
            throw new Error("Unknown settings JSON");
        }
        return runtime.createModelSettings(settingsJSON);
    }
    static async zipReader(data, url) {
        throw new Error("Not implemented");
    }
    static async getFilePaths(reader) {
        throw new Error("Not implemented");
    }
    static async getFiles(reader, paths) {
        throw new Error("Not implemented");
    }
    static async readText(reader, path) {
        throw new Error("Not implemented");
    }
    static releaseReader(reader) {
        // this method is optional
    }
}
exports.ZipLoader = ZipLoader;
_a = ZipLoader;
ZipLoader.ZIP_PROTOCOL = "zip://";
ZipLoader.uid = 0;
ZipLoader.factory = async (context, next) => {
    const source = context.source;
    let sourceURL;
    let zipBlob;
    let settings;
    if (typeof source === "string" &&
        (source.endsWith(".zip") || source.startsWith(_a.ZIP_PROTOCOL))) {
        if (source.startsWith(_a.ZIP_PROTOCOL)) {
            sourceURL = source.slice(_a.ZIP_PROTOCOL.length);
        }
        else {
            sourceURL = source;
        }
        zipBlob = await Live2DLoader_1.Live2DLoader.load({
            url: sourceURL,
            type: "blob",
            target: context.live2dModel,
        });
    }
    else if (Array.isArray(source) &&
        source.length === 1 &&
        source[0] instanceof File &&
        source[0].name.endsWith(".zip")) {
        zipBlob = source[0];
        sourceURL = URL.createObjectURL(zipBlob);
        settings = source.settings;
    }
    if (zipBlob) {
        if (!zipBlob.size) {
            throw new Error("Empty zip file");
        }
        const reader = await _a.zipReader(zipBlob, sourceURL);
        if (!settings) {
            settings = await _a.createSettings(reader);
        }
        // a fake URL, the only requirement is it should be unique,
        // as FileLoader will use it as the ID of all uploaded files
        settings._objectURL = _a.ZIP_PROTOCOL + _a.uid + "/" + settings.url;
        const files = await _a.unzip(reader, settings);
        files.settings = settings;
        // pass files to the FileLoader
        context.source = files;
        // clean up when destroying the model
        if (sourceURL.startsWith("blob:")) {
            context.live2dModel.once("modelLoaded", (internalModel) => {
                internalModel.once("destroy", function () {
                    URL.revokeObjectURL(sourceURL);
                });
            });
        }
        _a.releaseReader(reader);
    }
    return next();
};
//# sourceMappingURL=ZipLoader.js.map