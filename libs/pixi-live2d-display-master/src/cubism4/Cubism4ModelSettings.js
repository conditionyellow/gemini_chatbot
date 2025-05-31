"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism4ModelSettings = void 0;
const ModelSettings_1 = require("@/cubism-common/ModelSettings");
const utils_1 = require("@/utils");
const cubismmodelsettingsjson_1 = require("@cubism/settings/cubismmodelsettingsjson");
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Cubism4ModelSettings extends ModelSettings_1.ModelSettings {
    static isValidJSON(json) {
        return (!!json?.FileReferences &&
            typeof json.FileReferences.Moc === "string" &&
            json.FileReferences.Textures?.length > 0 &&
            // textures must be an array of strings
            json.FileReferences.Textures.every((item) => typeof item === "string"));
    }
    constructor(json) {
        super(json);
        if (!Cubism4ModelSettings.isValidJSON(json)) {
            throw new TypeError("Invalid JSON.");
        }
        // this doesn't seem to be allowed in ES6 and above, calling it will cause an error:
        // "Class constructor CubismModelSettingsJson cannot be invoked without 'new'"
        //
        // CubismModelSettingsJson.call(this, json);
        Object.assign(this, new cubismmodelsettingsjson_1.CubismModelSettingsJson(json));
    }
    replaceFiles(replace) {
        super.replaceFiles(replace);
        if (this.motions) {
            for (const [group, motions] of Object.entries(this.motions)) {
                for (let i = 0; i < motions.length; i++) {
                    motions[i].File = replace(motions[i].File, `motions.${group}[${i}].File`);
                    if (motions[i].Sound !== undefined) {
                        motions[i].Sound = replace(motions[i].Sound, `motions.${group}[${i}].Sound`);
                    }
                }
            }
        }
        if (this.expressions) {
            for (let i = 0; i < this.expressions.length; i++) {
                this.expressions[i].File = replace(this.expressions[i].File, `expressions[${i}].File`);
            }
        }
    }
}
exports.Cubism4ModelSettings = Cubism4ModelSettings;
(0, utils_1.applyMixins)(Cubism4ModelSettings, [cubismmodelsettingsjson_1.CubismModelSettingsJson]);
//# sourceMappingURL=Cubism4ModelSettings.js.map