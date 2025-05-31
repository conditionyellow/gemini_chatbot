"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DExpression = void 0;
const config_1 = require("@/config");
class Live2DExpression extends AMotion {
    constructor(json) {
        super();
        this.params = [];
        this.setFadeIn(json.fade_in > 0 ? json.fade_in : config_1.config.expressionFadingDuration);
        this.setFadeOut(json.fade_out > 0 ? json.fade_out : config_1.config.expressionFadingDuration);
        if (Array.isArray(json.params)) {
            json.params.forEach((param) => {
                const calc = param.calc || "add";
                if (calc === "add") {
                    const defaultValue = param.def || 0;
                    param.val -= defaultValue;
                }
                else if (calc === "mult") {
                    const defaultValue = param.def || 1;
                    param.val /= defaultValue;
                }
                this.params.push({
                    calc,
                    val: param.val,
                    id: param.id,
                });
            });
        }
    }
    /** @override */
    updateParamExe(model, time, weight, motionQueueEnt) {
        this.params.forEach((param) => {
            // this algorithm seems to be broken for newer Neptunia series models, have no idea
            //
            // switch (param.type) {
            //     case ParamCalcType.Set:
            //         model.setParamFloat(param.id, param.value, weight);
            //         break;
            //     case ParamCalcType.Add:
            //         model.addToParamFloat(param.id, param.value * weight);
            //         break;
            //     case ParamCalcType.Mult:
            //         model.multParamFloat(param.id, param.value, weight);
            //         break;
            // }
            // this works fine for any model
            model.setParamFloat(param.id, param.val * weight);
        });
    }
}
exports.Live2DExpression = Live2DExpression;
//# sourceMappingURL=Live2DExpression.js.map