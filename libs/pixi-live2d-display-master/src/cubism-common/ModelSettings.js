"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSettings = void 0;
const utils_1 = require("@/utils");
const core_1 = require("@pixi/core");
/**
 * Parses, and provides access to the settings JSON.
 */
class ModelSettings {
    /**
     * @param json - The settings JSON object.
     * @param json.url - The `url` field must be defined to specify the settings file's URL.
     */
    constructor(json) {
        this.json = json;
        const url = json.url;
        if (typeof url !== "string") {
            // this is not allowed because it'll typically result in errors, including a
            // fatal error - an OOM that crashes the browser while initializing this cubism2 model,
            // I'm not kidding!
            throw new TypeError("The `url` field in settings JSON must be defined as a string.");
        }
        this.url = url;
        // set default name to folder's name
        this.name = (0, utils_1.folderName)(this.url);
    }
    /**
     * Resolves a relative path using the {@link url}. This is used to resolve the resource files
     * defined in the settings.
     * @param path - Relative path.
     * @return Resolved path.
     */
    resolveURL(path) {
        // FIXME: deprecated API
        return core_1.utils.url.resolve(this.url, path);
    }
    /**
     * Replaces the resource files by running each file through the `replacer`.
     * @param replacer - Invoked with two arguments: `(file, path)`, where `file` is the file definition,
     * and `path` is its property path in the ModelSettings instance. A string must be returned to be the replacement.
     *
     * ```js
     * modelSettings.replaceFiles((file, path) => {
     *     // file = "foo.moc", path = "moc"
     *     // file = "foo.png", path = "textures[0]"
     *     // file = "foo.mtn", path = "motions.idle[0].file"
     *     // file = "foo.motion3.json", path = "motions.idle[0].File"
     *
     *     return "bar/" + file;
     * });
     * ```
     */
    replaceFiles(replacer) {
        this.moc = replacer(this.moc, "moc");
        if (this.pose !== undefined) {
            this.pose = replacer(this.pose, "pose");
        }
        if (this.physics !== undefined) {
            this.physics = replacer(this.physics, "physics");
        }
        for (let i = 0; i < this.textures.length; i++) {
            this.textures[i] = replacer(this.textures[i], `textures[${i}]`);
        }
    }
    /**
     * Retrieves all resource files defined in the settings.
     * @return A flat array of the paths of all resource files.
     *
     * ```js
     * modelSettings.getDefinedFiles();
     * // returns: ["foo.moc", "foo.png", ...]
     * ```
     */
    getDefinedFiles() {
        const files = [];
        this.replaceFiles((file) => {
            files.push(file);
            return file;
        });
        return files;
    }
    /**
     * Validates that the files defined in the settings exist in given files. Each file will be
     * resolved by {@link resolveURL} before comparison.
     * @param files - A flat array of file paths.
     * @return All the files which are defined in the settings and also exist in given files,
     * *including the optional files*.
     * @throws Error if any *essential* file is defined in settings but not included in given files.
     */
    validateFiles(files) {
        const assertFileExists = (expectedFile, shouldThrow) => {
            const actualPath = this.resolveURL(expectedFile);
            if (!files.includes(actualPath)) {
                if (shouldThrow) {
                    throw new Error(`File "${expectedFile}" is defined in settings, but doesn't exist in given files`);
                }
                return false;
            }
            return true;
        };
        const essentialFiles = [this.moc, ...this.textures];
        essentialFiles.forEach((texture) => assertFileExists(texture, true));
        const definedFiles = this.getDefinedFiles();
        return definedFiles.filter((file) => assertFileExists(file, false));
    }
}
exports.ModelSettings = ModelSettings;
//# sourceMappingURL=ModelSettings.js.map