"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism2MotionManager = void 0;
const config_1 = require("@/config");
const MotionManager_1 = require("@/cubism-common/MotionManager");
const Cubism2ExpressionManager_1 = require("@/cubism2/Cubism2ExpressionManager");
require("./patch-motion");
class Cubism2MotionManager extends MotionManager_1.MotionManager {
    constructor(settings, options) {
        super(settings, options);
        this.groups = { idle: "idle" };
        this.motionDataType = "arraybuffer";
        this.queueManager = new MotionQueueManager();
        this.definitions = this.settings.motions;
        this.init(options);
        this.lipSyncIds = ["PARAM_MOUTH_OPEN_Y"];
    }
    init(options) {
        super.init(options);
        if (this.settings.expressions) {
            this.expressionManager = new Cubism2ExpressionManager_1.Cubism2ExpressionManager(this.settings, options);
        }
    }
    isFinished() {
        return this.queueManager.isFinished();
    }
    createMotion(data, group, definition) {
        const motion = Live2DMotion.loadMotion(data);
        const defaultFadingDuration = group === this.groups.idle
            ? config_1.config.idleMotionFadingDuration
            : config_1.config.motionFadingDuration;
        motion.setFadeIn(definition.fade_in > 0 ? definition.fade_in : defaultFadingDuration);
        motion.setFadeOut(definition.fade_out > 0 ? definition.fade_out : defaultFadingDuration);
        return motion;
    }
    getMotionFile(definition) {
        return definition.file;
    }
    getMotionName(definition) {
        return definition.file;
    }
    getSoundFile(definition) {
        return definition.sound;
    }
    _startMotion(motion, onFinish) {
        motion.onFinishHandler = onFinish;
        this.queueManager.stopAllMotions();
        return this.queueManager.startMotion(motion);
    }
    _stopAllMotions() {
        this.queueManager.stopAllMotions();
    }
    updateParameters(model, now) {
        return this.queueManager.updateParam(model);
    }
    destroy() {
        super.destroy();
        this.queueManager = undefined;
    }
}
exports.Cubism2MotionManager = Cubism2MotionManager;
//# sourceMappingURL=Cubism2MotionManager.js.map