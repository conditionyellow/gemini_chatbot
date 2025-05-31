"use strict";
const originalUpdateParam = Live2DMotion.prototype.updateParam;
Live2DMotion.prototype.updateParam = function (model, entry) {
    originalUpdateParam.call(this, model, entry);
    if (entry.isFinished() && this.onFinishHandler) {
        this.onFinishHandler(this);
        delete this.onFinishHandler;
    }
};
//# sourceMappingURL=patch-motion.js.map