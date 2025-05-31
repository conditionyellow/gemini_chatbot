"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism4InternalModel = void 0;
const InternalModel_1 = require("@/cubism-common/InternalModel");
const Cubism4MotionManager_1 = require("@/cubism4/Cubism4MotionManager");
const cubismdefaultparameterid_1 = require("@cubism/cubismdefaultparameterid");
const cubismbreath_1 = require("@cubism/effect/cubismbreath");
const cubismeyeblink_1 = require("@cubism/effect/cubismeyeblink");
const cubismmatrix44_1 = require("@cubism/math/cubismmatrix44");
const cubismrenderer_webgl_1 = require("@cubism/rendering/cubismrenderer_webgl");
const core_1 = require("@pixi/core");
const utils_1 = require("@/utils");
const tempMatrix = new cubismmatrix44_1.CubismMatrix44();
class Cubism4InternalModel extends InternalModel_1.InternalModel {
    constructor(coreModel, settings, options) {
        super();
        this.lipSync = true;
        this.breath = cubismbreath_1.CubismBreath.create();
        this.renderer = new cubismrenderer_webgl_1.CubismRenderer_WebGL();
        this.idParamAngleX = cubismdefaultparameterid_1.ParamAngleX;
        this.idParamAngleY = cubismdefaultparameterid_1.ParamAngleY;
        this.idParamAngleZ = cubismdefaultparameterid_1.ParamAngleZ;
        this.idParamEyeBallX = cubismdefaultparameterid_1.ParamEyeBallX;
        this.idParamEyeBallY = cubismdefaultparameterid_1.ParamEyeBallY;
        this.idParamBodyAngleX = cubismdefaultparameterid_1.ParamBodyAngleX;
        this.idParamBreath = cubismdefaultparameterid_1.ParamBreath;
        this.idParamMouthForm = cubismdefaultparameterid_1.ParamMouthForm;
        /**
         * The model's internal scale, defined in the moc3 file.
         */
        this.pixelsPerUnit = 1;
        /**
         * Matrix that scales by {@link pixelsPerUnit}, and moves the origin from top-left to center.
         *
         * FIXME: This shouldn't be named as "centering"...
         */
        this.centeringTransform = new core_1.Matrix();
        this.coreModel = coreModel;
        this.settings = settings;
        this.motionManager = new Cubism4MotionManager_1.Cubism4MotionManager(settings, options);
        this.init();
    }
    init() {
        super.init();
        if (this.settings.getEyeBlinkParameters()?.length) {
            this.eyeBlink = cubismeyeblink_1.CubismEyeBlink.create(this.settings);
        }
        this.breath.setParameters([
            new cubismbreath_1.BreathParameterData(this.idParamAngleX, 0.0, 15.0, 6.5345, 0.5),
            new cubismbreath_1.BreathParameterData(this.idParamAngleY, 0.0, 8.0, 3.5345, 0.5),
            new cubismbreath_1.BreathParameterData(this.idParamAngleZ, 0.0, 10.0, 5.5345, 0.5),
            new cubismbreath_1.BreathParameterData(this.idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5),
            new cubismbreath_1.BreathParameterData(this.idParamBreath, 0.0, 0.5, 3.2345, 0.5),
        ]);
        this.renderer.initialize(this.coreModel);
        this.renderer.setIsPremultipliedAlpha(true);
    }
    getSize() {
        return [
            this.coreModel.getModel().canvasinfo.CanvasWidth,
            this.coreModel.getModel().canvasinfo.CanvasHeight,
        ];
    }
    getLayout() {
        const layout = {};
        if (this.settings.layout) {
            // un-capitalize each key to satisfy the common layout format
            // e.g. CenterX -> centerX
            for (const [key, value] of Object.entries(this.settings.layout)) {
                const commonKey = key.charAt(0).toLowerCase() + key.slice(1);
                layout[commonKey] = value;
            }
        }
        return layout;
    }
    setupLayout() {
        super.setupLayout();
        this.pixelsPerUnit = this.coreModel.getModel().canvasinfo.PixelsPerUnit;
        // move the origin from top left to center
        this.centeringTransform
            .scale(this.pixelsPerUnit, this.pixelsPerUnit)
            .translate(this.originalWidth / 2, this.originalHeight / 2);
    }
    updateWebGLContext(gl, glContextID) {
        // reset resources that were bound to previous WebGL context
        this.renderer.firstDraw = true;
        this.renderer._bufferData = {
            vertex: null,
            uv: null,
            index: null,
        };
        this.renderer.startUp(gl);
        if (!this.renderer._clippingManager) {
            return;
        }
        this.renderer._clippingManager._currentFrameNo = glContextID;
        this.renderer._clippingManager._maskTexture = undefined;
        cubismrenderer_webgl_1.CubismShader_WebGL.getInstance()._shaderSets = [];
    }
    bindTexture(index, texture) {
        this.renderer.bindTexture(index, texture);
    }
    getHitAreaDefs() {
        return (this.settings.hitAreas?.map((hitArea) => ({
            id: hitArea.Id,
            name: hitArea.Name,
            index: this.coreModel.getDrawableIndex(hitArea.Id),
        })) ?? []);
    }
    getDrawableIDs() {
        return this.coreModel.getDrawableIds();
    }
    getDrawableIndex(id) {
        return this.coreModel.getDrawableIndex(id);
    }
    getDrawableVertices(drawIndex) {
        if (typeof drawIndex === "string") {
            drawIndex = this.coreModel.getDrawableIndex(drawIndex);
            if (drawIndex === -1)
                throw new TypeError("Unable to find drawable ID: " + drawIndex);
        }
        const arr = this.coreModel.getDrawableVertices(drawIndex).slice();
        for (let i = 0; i < arr.length; i += 2) {
            arr[i] = arr[i] * this.pixelsPerUnit + this.originalWidth / 2;
            arr[i + 1] = -arr[i + 1] * this.pixelsPerUnit + this.originalHeight / 2;
        }
        return arr;
    }
    updateTransform(transform) {
        this.drawingMatrix
            .copyFrom(this.centeringTransform)
            .prepend(this.localTransform)
            .prepend(transform);
    }
    update(dt, now) {
        super.update(dt, now);
        // cubism4 uses seconds
        dt /= 1000;
        now /= 1000;
        const model = this.coreModel;
        this.emit("beforeMotionUpdate");
        const motionUpdated = this.motionManager.update(this.coreModel, now);
        this.emit("afterMotionUpdate");
        model.saveParameters();
        this.motionManager.expressionManager?.update(model, now);
        if (!motionUpdated) {
            this.eyeBlink?.updateParameters(model, dt);
        }
        this.updateFocus();
        // revert the timestamps to be milliseconds
        this.updateNaturalMovements(dt * 1000, now * 1000);
        if (this.lipSync && this.motionManager.currentAudio) {
            let value = this.motionManager.mouthSync();
            let min_ = 0;
            const max_ = 1;
            const weight = 1.2;
            if (value > 0) {
                min_ = 0.4;
            }
            value = (0, utils_1.clamp)(value * weight, min_, max_);
            for (let i = 0; i < this.motionManager.lipSyncIds.length; ++i) {
                model.addParameterValueById(this.motionManager.lipSyncIds[i], value, 0.8);
            }
        }
        this.physics?.evaluate(model, dt);
        this.pose?.updateParameters(model, dt);
        this.emit("beforeModelUpdate");
        model.update();
        model.loadParameters();
    }
    updateFocus() {
        this.coreModel.addParameterValueById(this.idParamEyeBallX, this.focusController.x); // -1 ~ 1
        this.coreModel.addParameterValueById(this.idParamEyeBallY, this.focusController.y);
        this.coreModel.addParameterValueById(this.idParamAngleX, this.focusController.x * 30); // -30 ~ 30
        this.coreModel.addParameterValueById(this.idParamAngleY, this.focusController.y * 30);
        this.coreModel.addParameterValueById(this.idParamAngleZ, this.focusController.x * this.focusController.y * -30);
        this.coreModel.addParameterValueById(this.idParamBodyAngleX, this.focusController.x * 10); // -10 ~ 10
    }
    updateFacialEmotion(mouthForm) {
        this.coreModel.addParameterValueById(this.idParamMouthForm, mouthForm); // -1 ~ 1
    }
    updateNaturalMovements(dt, now) {
        this.breath?.updateParameters(this.coreModel, dt / 1000);
    }
    draw(gl) {
        const matrix = this.drawingMatrix;
        const array = tempMatrix.getArray();
        // set given 3x3 matrix into a 4x4 matrix, with Y inverted
        array[0] = matrix.a;
        array[1] = matrix.b;
        array[4] = -matrix.c;
        array[5] = -matrix.d;
        array[12] = matrix.tx;
        array[13] = matrix.ty;
        this.renderer.setMvpMatrix(tempMatrix);
        this.renderer.setRenderState(gl.getParameter(gl.FRAMEBUFFER_BINDING), this.viewport);
        this.renderer.drawModel();
    }
    destroy() {
        super.destroy();
        this.renderer.release();
        this.coreModel.release();
        this.renderer = undefined;
        this.coreModel = undefined;
    }
}
exports.Cubism4InternalModel = Cubism4InternalModel;
//# sourceMappingURL=Cubism4InternalModel.js.map