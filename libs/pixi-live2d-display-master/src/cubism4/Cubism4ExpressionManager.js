"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism4ExpressionManager = void 0;
const ExpressionManager_1 = require("@/cubism-common/ExpressionManager");
const cubismexpressionmotion_1 = require("@cubism/motion/cubismexpressionmotion");
const cubismmotionqueuemanager_1 = require("@cubism/motion/cubismmotionqueuemanager");
class Cubism4ExpressionManager extends ExpressionManager_1.ExpressionManager {
    constructor(settings, options) {
        super(settings, options);
        this.queueManager = new cubismmotionqueuemanager_1.CubismMotionQueueManager();
        this.definitions = settings.expressions ?? [];
        this.init();
    }
    isFinished() {
        return this.queueManager.isFinished();
    }
    getExpressionIndex(name) {
        return this.definitions.findIndex((def) => def.Name === name);
    }
    getExpressionFile(definition) {
        return definition.File;
    }
    createExpression(data, definition) {
        return cubismexpressionmotion_1.CubismExpressionMotion.create(data);
    }
    _setExpression(motion) {
        return this.queueManager.startMotion(motion, false, performance.now());
    }
    stopAllExpressions() {
        this.queueManager.stopAllMotions();
    }
    updateParameters(model, now) {
        return this.queueManager.doUpdateMotion(model, now);
    }
}
exports.Cubism4ExpressionManager = Cubism4ExpressionManager;
//# sourceMappingURL=Cubism4ExpressionManager.js.map