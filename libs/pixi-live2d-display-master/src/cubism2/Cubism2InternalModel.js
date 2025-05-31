"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism2InternalModel = void 0;
const InternalModel_1 = require("@/cubism-common/InternalModel");
const utils_1 = require("../utils");
const Cubism2MotionManager_1 = require("./Cubism2MotionManager");
const Live2DEyeBlink_1 = require("./Live2DEyeBlink");
const utils_2 = require("@/utils");
// prettier-ignore
const tempMatrixArray = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);
class Cubism2InternalModel extends InternalModel_1.InternalModel {
    constructor(coreModel, settings, options) {
        super();
        // mouthFormIndex: number;
        this.textureFlipY = true;
        this.lipSync = true;
        /**
         * Number of the drawables in this model.
         */
        this.drawDataCount = 0;
        /**
         * If true, the face culling will always be disabled when drawing the model,
         * regardless of the model's internal flags.
         */
        this.disableCulling = false;
        this.hasDrawn = false;
        this.coreModel = coreModel;
        this.settings = settings;
        this.motionManager = new Cubism2MotionManager_1.Cubism2MotionManager(settings, options);
        this.eyeBlink = new Live2DEyeBlink_1.Live2DEyeBlink(coreModel);
        this.eyeballXParamIndex = coreModel.getParamIndex("PARAM_EYE_BALL_X");
        this.eyeballYParamIndex = coreModel.getParamIndex("PARAM_EYE_BALL_Y");
        this.angleXParamIndex = coreModel.getParamIndex("PARAM_ANGLE_X");
        this.angleYParamIndex = coreModel.getParamIndex("PARAM_ANGLE_Y");
        this.angleZParamIndex = coreModel.getParamIndex("PARAM_ANGLE_Z");
        this.bodyAngleXParamIndex = coreModel.getParamIndex("PARAM_BODY_ANGLE_X");
        this.breathParamIndex = coreModel.getParamIndex("PARAM_BREATH");
        // this.mouthFormIndex = coreModel.getParamIndex("PARAM_MOUTH_FORM");
        this.init();
    }
    init() {
        super.init();
        if (this.settings.initParams) {
            this.settings.initParams.forEach(({ id, value }) => this.coreModel.setParamFloat(id, value));
        }
        if (this.settings.initOpacities) {
            this.settings.initOpacities.forEach(({ id, value }) => this.coreModel.setPartsOpacity(id, value));
        }
        this.coreModel.saveParam();
        const arr = this.coreModel.getModelContext()._$aS;
        if (arr?.length) {
            this.drawDataCount = arr.length;
        }
        let culling = this.coreModel.drawParamWebGL.culling;
        Object.defineProperty(this.coreModel.drawParamWebGL, "culling", {
            set: (v) => (culling = v),
            // always return false when disabled
            get: () => (this.disableCulling ? false : culling),
        });
        const clipManager = this.coreModel.getModelContext().clipManager;
        const originalSetupClip = clipManager.setupClip;
        // after setupClip(), the GL viewport will be set to [0, 0, canvas.width, canvas.height],
        // so we have to set it back
        clipManager.setupClip = (modelContext, drawParam) => {
            originalSetupClip.call(clipManager, modelContext, drawParam);
            drawParam.gl.viewport(...this.viewport);
        };
    }
    getSize() {
        return [this.coreModel.getCanvasWidth(), this.coreModel.getCanvasHeight()];
    }
    getLayout() {
        const layout = {};
        if (this.settings.layout) {
            for (const [key, value] of Object.entries(this.settings.layout)) {
                let commonKey = key;
                if (key === "center_x") {
                    commonKey = "centerX";
                }
                else if (key === "center_y") {
                    commonKey = "centerY";
                }
                layout[commonKey] = value;
            }
        }
        return layout;
    }
    updateWebGLContext(gl, glContextID) {
        const drawParamWebGL = this.coreModel.drawParamWebGL;
        drawParamWebGL.firstDraw = true;
        drawParamWebGL.setGL(gl);
        drawParamWebGL.glno = glContextID;
        // reset WebGL buffers
        for (const [key, value] of Object.entries(drawParamWebGL)) {
            if (value instanceof WebGLBuffer) {
                drawParamWebGL[key] = null;
            }
        }
        const clipManager = this.coreModel.getModelContext().clipManager;
        clipManager.curFrameNo = glContextID;
        const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        // force Live2D to re-create the framebuffer
        clipManager.getMaskRenderTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    }
    bindTexture(index, texture) {
        this.coreModel.setTexture(index, texture);
    }
    getHitAreaDefs() {
        return (this.settings.hitAreas?.map((hitArea) => ({
            id: hitArea.id,
            name: hitArea.name,
            index: this.coreModel.getDrawDataIndex(hitArea.id),
        })) || []);
    }
    getDrawableIDs() {
        const modelContext = this.coreModel.getModelContext();
        const ids = [];
        for (let i = 0; i < this.drawDataCount; i++) {
            const drawData = modelContext.getDrawData(i);
            if (drawData) {
                ids.push(drawData.getDrawDataID().id);
            }
        }
        return ids;
    }
    getDrawableIndex(id) {
        return this.coreModel.getDrawDataIndex(id);
    }
    getDrawableVertices(drawIndex) {
        if (typeof drawIndex === "string") {
            drawIndex = this.coreModel.getDrawDataIndex(drawIndex);
            if (drawIndex === -1)
                throw new TypeError("Unable to find drawable ID: " + drawIndex);
        }
        return this.coreModel.getTransformedPoints(drawIndex).slice();
    }
    hitTest(x, y) {
        if (!this.hasDrawn) {
            utils_1.logger.warn("Trying to hit-test a Cubism 2 model that has not been rendered yet. The result will always be empty since the draw data is not ready.");
        }
        return super.hitTest(x, y);
    }
    update(dt, now) {
        super.update(dt, now);
        const model = this.coreModel;
        this.emit("beforeMotionUpdate");
        const motionUpdated = this.motionManager.update(this.coreModel, now);
        this.emit("afterMotionUpdate");
        model.saveParam();
        this.motionManager.expressionManager?.update(model, now);
        if (!motionUpdated) {
            this.eyeBlink?.update(dt);
        }
        this.updateFocus();
        this.updateNaturalMovements(dt, now);
        if (this.lipSync && this.motionManager.currentAudio) {
            let value = this.motionManager.mouthSync();
            let min_ = 0;
            const max_ = 1;
            const bias_weight = 1.2;
            const bias_power = 0.7;
            if (value > 0.0) {
                min_ = 0.4;
            }
            value = Math.pow(value, bias_power);
            value = (0, utils_2.clamp)(value * bias_weight, min_, max_);
            for (let i = 0; i < this.motionManager.lipSyncIds.length; ++i) {
                this.coreModel.setParamFloat(this.coreModel.getParamIndex(this.motionManager.lipSyncIds[i]), value);
            }
        }
        this.physics?.update(now);
        this.pose?.update(dt);
        this.emit("beforeModelUpdate");
        model.update();
        model.loadParam();
    }
    updateFocus() {
        this.coreModel.addToParamFloat(this.eyeballXParamIndex, this.focusController.x);
        this.coreModel.addToParamFloat(this.eyeballYParamIndex, this.focusController.y);
        this.coreModel.addToParamFloat(this.angleXParamIndex, this.focusController.x * 30);
        this.coreModel.addToParamFloat(this.angleYParamIndex, this.focusController.y * 30);
        this.coreModel.addToParamFloat(this.angleZParamIndex, this.focusController.x * this.focusController.y * -30);
        this.coreModel.addToParamFloat(this.bodyAngleXParamIndex, this.focusController.x * 10);
    }
    updateNaturalMovements(dt, now) {
        const t = (now / 1000) * 2 * Math.PI;
        this.coreModel.addToParamFloat(this.angleXParamIndex, 15 * Math.sin(t / 6.5345) * 0.5);
        this.coreModel.addToParamFloat(this.angleYParamIndex, 8 * Math.sin(t / 3.5345) * 0.5);
        this.coreModel.addToParamFloat(this.angleZParamIndex, 10 * Math.sin(t / 5.5345) * 0.5);
        this.coreModel.addToParamFloat(this.bodyAngleXParamIndex, 4 * Math.sin(t / 15.5345) * 0.5);
        this.coreModel.setParamFloat(this.breathParamIndex, 0.5 + 0.5 * Math.sin(t / 3.2345));
    }
    draw(gl) {
        const disableCulling = this.disableCulling;
        // culling must be disabled to get this cubism2 model drawn properly on a framebuffer
        if (gl.getParameter(gl.FRAMEBUFFER_BINDING)) {
            this.disableCulling = true;
        }
        const matrix = this.drawingMatrix;
        // set given 3x3 matrix into a 4x4 matrix
        tempMatrixArray[0] = matrix.a;
        tempMatrixArray[1] = matrix.b;
        tempMatrixArray[4] = matrix.c;
        tempMatrixArray[5] = matrix.d;
        tempMatrixArray[12] = matrix.tx;
        tempMatrixArray[13] = matrix.ty;
        this.coreModel.setMatrix(tempMatrixArray);
        this.coreModel.draw();
        this.hasDrawn = true;
        this.disableCulling = disableCulling;
    }
    destroy() {
        super.destroy();
        // cubism2 core has a super dumb memory management so there's basically nothing much to do to release the model
        this.coreModel = undefined;
    }
}
exports.Cubism2InternalModel = Cubism2InternalModel;
//# sourceMappingURL=Cubism2InternalModel.js.map