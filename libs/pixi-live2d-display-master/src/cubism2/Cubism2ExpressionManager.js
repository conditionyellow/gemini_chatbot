"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cubism2ExpressionManager = void 0;
const ExpressionManager_1 = require("@/cubism-common/ExpressionManager");
const Live2DExpression_1 = require("./Live2DExpression");
class Cubism2ExpressionManager extends ExpressionManager_1.ExpressionManager {
    constructor(settings, options) {
        super(settings, options);
        this.queueManager = new MotionQueueManager();
        this.definitions = this.settings.expressions ?? [];
        this.init();
    }
    isFinished() {
        return this.queueManager.isFinished();
    }
    getExpressionIndex(name) {
        return this.definitions.findIndex((def) => def.name === name);
    }
    getExpressionFile(definition) {
        return definition.file;
    }
    createExpression(data, definition) {
        return new Live2DExpression_1.Live2DExpression(data);
    }
    _setExpression(motion) {
        return this.queueManager.startMotion(motion);
    }
    stopAllExpressions() {
        this.queueManager.stopAllMotions();
    }
    updateParameters(model, dt) {
        return this.queueManager.updateParam(model);
    }
}
exports.Cubism2ExpressionManager = Cubism2ExpressionManager;
//# sourceMappingURL=Cubism2ExpressionManager.js.map