"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism2ModelSettings = void 0;
const ModelSettings_1 = require("@/cubism-common/ModelSettings");
const utils_1 = require("../utils");
class Cubism2ModelSettings extends ModelSettings_1.ModelSettings {
    /**
     * Checks if a JSON object is valid model settings.
     * @param json
     */
    static isValidJSON(json) {
        // should always return a boolean
        return (!!json &&
            typeof json.model === "string" &&
            json.textures?.length > 0 &&
            // textures must be an array of strings
            json.textures.every((item) => typeof item === "string"));
    }
    constructor(json) {
        super(json);
        this.motions = {};
        if (!Cubism2ModelSettings.isValidJSON(json)) {
            throw new TypeError("Invalid JSON.");
        }
        this.moc = json.model;
        // copy textures array
        (0, utils_1.copyArray)("string", json, this, "textures", "textures");
        this.copy(json);
    }
    /**
     * Validates and copies *optional* properties from raw JSON.
     */
    copy(json) {
        (0, utils_1.copyProperty)("string", json, this, "name", "name");
        (0, utils_1.copyProperty)("string", json, this, "pose", "pose");
        (0, utils_1.copyProperty)("string", json, this, "physics", "physics");
        (0, utils_1.copyProperty)("object", json, this, "layout", "layout");
        (0, utils_1.copyProperty)("object", json, this, "motions", "motions");
        (0, utils_1.copyArray)("object", json, this, "hit_areas", "hitAreas");
        (0, utils_1.copyArray)("object", json, this, "expressions", "expressions");
        (0, utils_1.copyArray)("object", json, this, "init_params", "initParams");
        (0, utils_1.copyArray)("object", json, this, "init_opacities", "initOpacities");
    }
    replaceFiles(replace) {
        super.replaceFiles(replace);
        for (const [group, motions] of Object.entries(this.motions)) {
            for (let i = 0; i < motions.length; i++) {
                motions[i].file = replace(motions[i].file, `motions.${group}[${i}].file`);
                if (motions[i].sound !== undefined) {
                    motions[i].sound = replace(motions[i].sound, `motions.${group}[${i}].sound`);
                }
            }
        }
        if (this.expressions) {
            for (let i = 0; i < this.expressions.length; i++) {
                this.expressions[i].file = replace(this.expressions[i].file, `expressions[${i}].file`);
            }
        }
    }
}
exports.Cubism2ModelSettings = Cubism2ModelSettings;
//# sourceMappingURL=Cubism2ModelSettings.js.map