"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DEyeBlink = void 0;
const utils_1 = require("@/utils");
class Live2DEyeBlink {
    constructor(coreModel) {
        this.coreModel = coreModel;
        this.blinkInterval = 4000;
        this.closingDuration = 100;
        this.closedDuration = 50;
        this.openingDuration = 150;
        this.eyeState = 0 /* EyeState.Idle */;
        this.eyeParamValue = 1;
        this.closedTimer = 0;
        this.nextBlinkTimeLeft = this.blinkInterval;
        this.leftParam = coreModel.getParamIndex("PARAM_EYE_L_OPEN");
        this.rightParam = coreModel.getParamIndex("PARAM_EYE_R_OPEN");
    }
    setEyeParams(value) {
        this.eyeParamValue = (0, utils_1.clamp)(value, 0, 1);
        this.coreModel.setParamFloat(this.leftParam, this.eyeParamValue);
        this.coreModel.setParamFloat(this.rightParam, this.eyeParamValue);
    }
    update(dt) {
        switch (this.eyeState) {
            case 0 /* EyeState.Idle */:
                this.nextBlinkTimeLeft -= dt;
                if (this.nextBlinkTimeLeft < 0) {
                    this.eyeState = 1 /* EyeState.Closing */;
                    this.nextBlinkTimeLeft =
                        this.blinkInterval +
                            this.closingDuration +
                            this.closedDuration +
                            this.openingDuration +
                            (0, utils_1.rand)(0, 2000);
                }
                break;
            case 1 /* EyeState.Closing */:
                this.setEyeParams(this.eyeParamValue + dt / this.closingDuration);
                if (this.eyeParamValue <= 0) {
                    this.eyeState = 2 /* EyeState.Closed */;
                    this.closedTimer = 0;
                }
                break;
            case 2 /* EyeState.Closed */:
                this.closedTimer += dt;
                if (this.closedTimer >= this.closedDuration) {
                    this.eyeState = 3 /* EyeState.Opening */;
                }
                break;
            case 3 /* EyeState.Opening */:
                this.setEyeParams(this.eyeParamValue + dt / this.openingDuration);
                if (this.eyeParamValue >= 1) {
                    this.eyeState = 0 /* EyeState.Idle */;
                }
        }
    }
}
exports.Live2DEyeBlink = Live2DEyeBlink;
//# sourceMappingURL=Live2DEyeBlink.js.map