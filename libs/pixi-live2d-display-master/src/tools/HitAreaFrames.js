"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitAreaFrames = void 0;
const core_1 = require("@pixi/core");
const graphics_1 = require("@pixi/graphics");
const text_1 = require("@pixi/text");
const tempBounds = new core_1.Rectangle();
class HitAreaFrames extends graphics_1.Graphics {
    constructor() {
        super();
        this.initialized = false;
        this.texts = [];
        this.strokeWidth = 4;
        this.normalColor = 0xe31a1a;
        this.activeColor = 0x1ec832;
        this.eventMode = "static";
        this.on("added", this.init).on("globalpointermove", this.onPointerMove);
    }
    init() {
        const internalModel = this.parent.internalModel;
        const textStyle = new text_1.TextStyle({
            fontSize: 24,
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
        });
        this.texts = Object.keys(internalModel.hitAreas).map((hitAreaName) => {
            const text = new text_1.Text(hitAreaName, textStyle);
            text.visible = false;
            this.addChild(text);
            return text;
        });
    }
    onPointerMove(e) {
        const hitAreaNames = this.parent.hitTest(e.data.global.x, e.data.global.y);
        this.texts.forEach((text) => {
            text.visible = hitAreaNames.includes(text.text);
        });
    }
    /** @override */
    _render(renderer) {
        const internalModel = this.parent.internalModel;
        // extract scale from the transform matrix, and invert it to ease following calculation
        // https://math.stackexchange.com/a/13165
        const scale = 1 /
            Math.sqrt(this.transform.worldTransform.a ** 2 + this.transform.worldTransform.b ** 2);
        this.texts.forEach((text) => {
            this.lineStyle({
                width: this.strokeWidth * scale,
                color: text.visible ? this.activeColor : this.normalColor,
            });
            const bounds = internalModel.getDrawableBounds(internalModel.hitAreas[text.text].index, tempBounds);
            const transform = internalModel.localTransform;
            bounds.x = bounds.x * transform.a + transform.tx;
            bounds.y = bounds.y * transform.d + transform.ty;
            bounds.width = bounds.width * transform.a;
            bounds.height = bounds.height * transform.d;
            this.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
            text.x = bounds.x + this.strokeWidth * scale;
            text.y = bounds.y + this.strokeWidth * scale;
            text.scale.set(scale);
        });
        super._render(renderer);
        this.clear();
    }
}
exports.HitAreaFrames = HitAreaFrames;
//# sourceMappingURL=HitAreaFrames.js.map