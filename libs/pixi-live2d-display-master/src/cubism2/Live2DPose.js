"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DPose = void 0;
const utils_1 = require("@/utils");
class Live2DPartsParam {
    constructor(id) {
        this.id = id;
        this.paramIndex = -1;
        this.partsIndex = -1;
        this.link = [];
    }
    initIndex(model) {
        this.paramIndex = model.getParamIndex("VISIBLE:" + this.id);
        this.partsIndex = model.getPartsDataIndex(PartsDataID.getID(this.id));
        model.setParamFloat(this.paramIndex, 1);
    }
}
class Live2DPose {
    constructor(coreModel, json) {
        this.coreModel = coreModel;
        this.opacityAnimDuration = 500;
        this.partsGroups = [];
        if (json.parts_visible) {
            this.partsGroups = json.parts_visible.map(({ group }) => group.map(({ id, link }) => {
                const parts = new Live2DPartsParam(id);
                if (link) {
                    parts.link = link.map((l) => new Live2DPartsParam(l));
                }
                return parts;
            }));
            this.init();
        }
    }
    init() {
        this.partsGroups.forEach((group) => {
            group.forEach((parts) => {
                parts.initIndex(this.coreModel);
                if (parts.paramIndex >= 0) {
                    const visible = this.coreModel.getParamFloat(parts.paramIndex) !== 0;
                    this.coreModel.setPartsOpacity(parts.partsIndex, visible ? 1 : 0);
                    this.coreModel.setParamFloat(parts.paramIndex, visible ? 1 : 0);
                    if (parts.link.length > 0) {
                        parts.link.forEach((p) => p.initIndex(this.coreModel));
                    }
                }
            });
        });
    }
    normalizePartsOpacityGroup(partsGroup, dt) {
        const model = this.coreModel;
        const phi = 0.5;
        const maxBackOpacity = 0.15;
        let visibleOpacity = 1;
        let visibleIndex = partsGroup.findIndex(({ paramIndex, partsIndex }) => partsIndex >= 0 && model.getParamFloat(paramIndex) !== 0);
        if (visibleIndex >= 0) {
            const originalOpacity = model.getPartsOpacity(partsGroup[visibleIndex].partsIndex);
            visibleOpacity = (0, utils_1.clamp)(originalOpacity + dt / this.opacityAnimDuration, 0, 1);
        }
        else {
            visibleIndex = 0;
            visibleOpacity = 1;
        }
        partsGroup.forEach(({ partsIndex }, index) => {
            if (partsIndex >= 0) {
                if (visibleIndex == index) {
                    model.setPartsOpacity(partsIndex, visibleOpacity);
                }
                else {
                    let opacity = model.getPartsOpacity(partsIndex);
                    // I can't understand this part, so just leave it original
                    let a1;
                    if (visibleOpacity < phi) {
                        a1 = (visibleOpacity * (phi - 1)) / phi + 1;
                    }
                    else {
                        a1 = ((1 - visibleOpacity) * phi) / (1 - phi);
                    }
                    const backOp = (1 - a1) * (1 - visibleOpacity);
                    if (backOp > maxBackOpacity) {
                        a1 = 1 - maxBackOpacity / (1 - visibleOpacity);
                    }
                    if (opacity > a1) {
                        opacity = a1;
                    }
                    model.setPartsOpacity(partsIndex, opacity);
                }
            }
        });
    }
    copyOpacity(partsGroup) {
        const model = this.coreModel;
        partsGroup.forEach(({ partsIndex, link }) => {
            if (partsIndex >= 0 && link) {
                const opacity = model.getPartsOpacity(partsIndex);
                link.forEach(({ partsIndex }) => {
                    if (partsIndex >= 0) {
                        model.setPartsOpacity(partsIndex, opacity);
                    }
                });
            }
        });
    }
    update(dt) {
        this.partsGroups.forEach((partGroup) => {
            this.normalizePartsOpacityGroup(partGroup, dt);
            this.copyOpacity(partGroup);
        });
    }
}
exports.Live2DPose = Live2DPose;
//# sourceMappingURL=Live2DPose.js.map