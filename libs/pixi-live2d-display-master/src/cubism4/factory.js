"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cubism4InternalModel_1 = require("@/cubism4/Cubism4InternalModel");
const Cubism4ModelSettings_1 = require("@/cubism4/Cubism4ModelSettings");
const setup_1 = require("@/cubism4/setup");
const Live2DFactory_1 = require("@/factory/Live2DFactory");
const cubismpose_1 = require("@cubism/effect/cubismpose");
const cubismmoc_1 = require("@cubism/model/cubismmoc");
const cubismphysics_1 = require("@cubism/physics/cubismphysics");
Live2DFactory_1.Live2DFactory.registerRuntime({
    version: 4,
    ready: setup_1.cubism4Ready,
    test(source) {
        return source instanceof Cubism4ModelSettings_1.Cubism4ModelSettings || Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON(source);
    },
    isValidMoc(modelData) {
        if (modelData.byteLength < 4) {
            return false;
        }
        const view = new Int8Array(modelData, 0, 4);
        return String.fromCharCode(...view) === "MOC3";
    },
    createModelSettings(json) {
        return new Cubism4ModelSettings_1.Cubism4ModelSettings(json);
    },
    createCoreModel(data, options) {
        const moc = cubismmoc_1.CubismMoc.create(data, !!options?.checkMocConsistency);
        try {
            const model = moc.createModel();
            // store the moc instance so we can reference it later
            model.__moc = moc;
            return model;
        }
        catch (e) {
            try {
                moc.release();
            }
            catch {
                // TODO: handle this error
            }
            throw e;
        }
    },
    createInternalModel(coreModel, settings, options) {
        const model = new Cubism4InternalModel_1.Cubism4InternalModel(coreModel, settings, options);
        const coreModelWithMoc = coreModel;
        if (coreModelWithMoc.__moc) {
            // transfer the moc to InternalModel, because the coreModel will
            // probably have been set to undefined when we receive the "destroy" event
            model.__moc = coreModelWithMoc.__moc;
            delete coreModelWithMoc.__moc;
            // release the moc when destroying
            model.once("destroy", releaseMoc);
        }
        return model;
    },
    createPhysics(coreModel, data) {
        return cubismphysics_1.CubismPhysics.create(data);
    },
    createPose(coreModel, data) {
        return cubismpose_1.CubismPose.create(data);
    },
});
function releaseMoc() {
    this.__moc?.release();
}
//# sourceMappingURL=factory.js.map