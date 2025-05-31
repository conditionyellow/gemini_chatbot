"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism4MotionManager = void 0;
const config_1 = require("@/config");
const MotionManager_1 = require("@/cubism-common/MotionManager");
const Cubism4ExpressionManager_1 = require("@/cubism4/Cubism4ExpressionManager");
const cubismmotion_1 = require("@cubism/motion/cubismmotion");
const cubismmotionjson_1 = require("@cubism/motion/cubismmotionjson");
const cubismmotionqueuemanager_1 = require("@cubism/motion/cubismmotionqueuemanager");
class Cubism4MotionManager extends MotionManager_1.MotionManager {
    constructor(settings, options) {
        super(settings, options);
        this.groups = { idle: "Idle" };
        this.motionDataType = "json";
        this.queueManager = new cubismmotionqueuemanager_1.CubismMotionQueueManager();
        this.lipSyncIds = ["ParamMouthOpenY"];
        this.definitions = settings.motions ?? {};
        this.eyeBlinkIds = settings.getEyeBlinkParameters() || [];
        const lipSyncIds = settings.getLipSyncParameters();
        if (lipSyncIds?.length) {
            this.lipSyncIds = lipSyncIds;
        }
        this.init(options);
    }
    init(options) {
        super.init(options);
        if (this.settings.expressions) {
            this.expressionManager = new Cubism4ExpressionManager_1.Cubism4ExpressionManager(this.settings, options);
        }
        this.queueManager.setEventCallback((caller, eventValue, customData) => {
            this.emit("motion:" + eventValue);
        });
    }
    isFinished() {
        return this.queueManager.isFinished();
    }
    _startMotion(motion, onFinish) {
        motion.setFinishedMotionHandler(onFinish);
        this.queueManager.stopAllMotions();
        return this.queueManager.startMotion(motion, false, performance.now());
    }
    _stopAllMotions() {
        this.queueManager.stopAllMotions();
    }
    createMotion(data, group, definition) {
        const motion = cubismmotion_1.CubismMotion.create(data);
        const json = new cubismmotionjson_1.CubismMotionJson(data);
        const defaultFadingDuration = (group === this.groups.idle
            ? config_1.config.idleMotionFadingDuration
            : config_1.config.motionFadingDuration) / 1000;
        // fading duration priorities: model.json > motion.json > config (default)
        // overwrite the fading duration only when it's not defined in the motion JSON
        if (json.getMotionFadeInTime() === undefined) {
            motion.setFadeInTime(definition.FadeInTime > 0 ? definition.FadeInTime : defaultFadingDuration);
        }
        if (json.getMotionFadeOutTime() === undefined) {
            motion.setFadeOutTime(definition.FadeOutTime > 0 ? definition.FadeOutTime : defaultFadingDuration);
        }
        motion.setEffectIds(this.eyeBlinkIds, this.lipSyncIds);
        return motion;
    }
    getMotionFile(definition) {
        return definition.File;
    }
    getMotionName(definition) {
        return definition.File;
    }
    getSoundFile(definition) {
        return definition.Sound;
    }
    updateParameters(model, now) {
        return this.queueManager.doUpdateMotion(model, now);
    }
    destroy() {
        super.destroy();
        this.queueManager.release();
        this.queueManager = undefined;
    }
}
exports.Cubism4MotionManager = Cubism4MotionManager;
//# sourceMappingURL=Cubism4MotionManager.js.map