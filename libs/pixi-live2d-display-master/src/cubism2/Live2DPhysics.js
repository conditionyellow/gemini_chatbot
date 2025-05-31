"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DPhysics = void 0;
const SRC_TYPE_MAP = {
    x: PhysicsHair.Src.SRC_TO_X,
    y: PhysicsHair.Src.SRC_TO_Y,
    angle: PhysicsHair.Src.SRC_TO_G_ANGLE,
};
const TARGET_TYPE_MAP = {
    x: PhysicsHair.Src.SRC_TO_X,
    y: PhysicsHair.Src.SRC_TO_Y,
    angle: PhysicsHair.Src.SRC_TO_G_ANGLE,
};
class Live2DPhysics {
    constructor(coreModel, json) {
        this.coreModel = coreModel;
        this.physicsHairs = [];
        if (json.physics_hair) {
            this.physicsHairs = json.physics_hair.map((definition) => {
                const physicsHair = new PhysicsHair();
                physicsHair.setup(definition.setup.length, definition.setup.regist, definition.setup.mass);
                definition.src.forEach(({ id, ptype, scale, weight }) => {
                    const type = SRC_TYPE_MAP[ptype];
                    if (type) {
                        physicsHair.addSrcParam(type, id, scale, weight);
                    }
                });
                definition.targets.forEach(({ id, ptype, scale, weight }) => {
                    const type = TARGET_TYPE_MAP[ptype];
                    if (type) {
                        physicsHair.addTargetParam(type, id, scale, weight);
                    }
                });
                return physicsHair;
            });
        }
    }
    update(elapsed) {
        this.physicsHairs.forEach((physicsHair) => physicsHair.update(this.coreModel, elapsed));
    }
}
exports.Live2DPhysics = Live2DPhysics;
//# sourceMappingURL=Live2DPhysics.js.map