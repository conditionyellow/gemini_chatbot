"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cubism2InternalModel_1 = require("@/cubism2/Cubism2InternalModel");
const Cubism2ModelSettings_1 = require("@/cubism2/Cubism2ModelSettings");
const Live2DPhysics_1 = require("@/cubism2/Live2DPhysics");
const Live2DPose_1 = require("@/cubism2/Live2DPose");
const Live2DFactory_1 = require("@/factory/Live2DFactory");
Live2DFactory_1.Live2DFactory.registerRuntime({
    version: 2,
    test(source) {
        return source instanceof Cubism2ModelSettings_1.Cubism2ModelSettings || Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON(source);
    },
    ready() {
        return Promise.resolve();
    },
    isValidMoc(modelData) {
        if (modelData.byteLength < 3) {
            return false;
        }
        const view = new Int8Array(modelData, 0, 3);
        return String.fromCharCode(...view) === "moc";
    },
    createModelSettings(json) {
        return new Cubism2ModelSettings_1.Cubism2ModelSettings(json);
    },
    createCoreModel(data) {
        const model = Live2DModelWebGL.loadModel(data);
        const error = Live2D.getError();
        if (error)
            throw error;
        return model;
    },
    createInternalModel(coreModel, settings, options) {
        return new Cubism2InternalModel_1.Cubism2InternalModel(coreModel, settings, options);
    },
    createPose(coreModel, data) {
        return new Live2DPose_1.Live2DPose(coreModel, data);
    },
    createPhysics(coreModel, data) {
        return new Live2DPhysics_1.Live2DPhysics(coreModel, data);
    },
});
//# sourceMappingURL=factory.js.map