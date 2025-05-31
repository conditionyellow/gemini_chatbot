"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalModel = void 0;
const FocusController_1 = require("@/cubism-common/FocusController");
const constants_1 = require("@/cubism-common/constants");
const core_1 = require("@pixi/core");
const tempBounds = { x: 0, y: 0, width: 0, height: 0 };
/**
 * A wrapper that manages the states of a Live2D core model, and delegates all operations to it.
 * @emits {@link InternalModelEvents}
 */
class InternalModel extends core_1.utils.EventEmitter {
    constructor() {
        super(...arguments);
        this.focusController = new FocusController_1.FocusController();
        /**
         * Original canvas width of the model. Note this doesn't represent the model's real size,
         * as the model can overflow from its canvas.
         */
        this.originalWidth = 0;
        /**
         * Original canvas height of the model. Note this doesn't represent the model's real size,
         * as the model can overflow from its canvas.
         */
        this.originalHeight = 0;
        /**
         * Canvas width of the model, scaled by the `width` of the model's layout.
         */
        this.width = 0;
        /**
         * Canvas height of the model, scaled by the `height` of the model's layout.
         */
        this.height = 0;
        /**
         * Local transformation, calculated from the model's layout.
         */
        this.localTransform = new core_1.Matrix();
        /**
         * The final matrix to draw the model.
         */
        this.drawingMatrix = new core_1.Matrix();
        // TODO: change structure
        /**
         * The hit area definitions, keyed by their names.
         */
        this.hitAreas = {};
        /**
         * Flags whether `gl.UNPACK_FLIP_Y_WEBGL` should be enabled when binding the textures.
         */
        this.textureFlipY = false;
        /**
         * WebGL viewport when drawing the model. The format is `[x, y, width, height]`.
         */
        this.viewport = [0, 0, 0, 0];
        /**
         * Flags this instance has been destroyed.
         */
        this.destroyed = false;
    }
    /**
     * Should be called in the constructor of derived class.
     */
    init() {
        this.setupLayout();
        this.setupHitAreas();
    }
    /**
     * Sets up the model's size and local transform by the model's layout.
     */
    setupLayout() {
        // cast `this` to be mutable
        const self = this;
        const size = this.getSize();
        self.originalWidth = size[0];
        self.originalHeight = size[1];
        const layout = Object.assign({
            width: constants_1.LOGICAL_WIDTH,
            height: constants_1.LOGICAL_HEIGHT,
        }, this.getLayout());
        this.localTransform.scale(layout.width / constants_1.LOGICAL_WIDTH, layout.height / constants_1.LOGICAL_HEIGHT);
        self.width = this.originalWidth * this.localTransform.a;
        self.height = this.originalHeight * this.localTransform.d;
        // this calculation differs from Live2D SDK...
        const offsetX = (layout.x !== undefined && layout.x - layout.width / 2) ||
            (layout.centerX !== undefined && layout.centerX) ||
            (layout.left !== undefined && layout.left - layout.width / 2) ||
            (layout.right !== undefined && layout.right + layout.width / 2) ||
            0;
        const offsetY = (layout.y !== undefined && layout.y - layout.height / 2) ||
            (layout.centerY !== undefined && layout.centerY) ||
            (layout.top !== undefined && layout.top - layout.height / 2) ||
            (layout.bottom !== undefined && layout.bottom + layout.height / 2) ||
            0;
        this.localTransform.translate(this.width * offsetX, -this.height * offsetY);
    }
    /**
     * Sets up the hit areas by their definitions in settings.
     */
    setupHitAreas() {
        const definitions = this.getHitAreaDefs().filter((hitArea) => hitArea.index >= 0);
        for (const def of definitions) {
            this.hitAreas[def.name] = def;
        }
    }
    /**
     * Hit-test on the model.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x, y) {
        return Object.keys(this.hitAreas).filter((hitAreaName) => this.isHit(hitAreaName, x, y));
    }
    /**
     * Hit-test for a single hit area.
     * @param hitAreaName - The hit area's name.
     * @param x - Position in model canvas.
     * @param y - Position in model canvas.
     * @return True if hit.
     */
    isHit(hitAreaName, x, y) {
        if (!this.hitAreas[hitAreaName]) {
            return false;
        }
        const drawIndex = this.hitAreas[hitAreaName].index;
        const bounds = this.getDrawableBounds(drawIndex, tempBounds);
        return (bounds.x <= x &&
            x <= bounds.x + bounds.width &&
            bounds.y <= y &&
            y <= bounds.y + bounds.height);
    }
    /**
     * Gets a drawable's bounds.
     * @param index - Index of the drawable.
     * @param bounds - Object to store the output values.
     * @return The bounds in model canvas space.
     */
    getDrawableBounds(index, bounds) {
        const vertices = this.getDrawableVertices(index);
        let left = vertices[0];
        let right = vertices[0];
        let top = vertices[1];
        let bottom = vertices[1];
        for (let i = 0; i < vertices.length; i += 2) {
            const vx = vertices[i];
            const vy = vertices[i + 1];
            left = Math.min(vx, left);
            right = Math.max(vx, right);
            top = Math.min(vy, top);
            bottom = Math.max(vy, bottom);
        }
        bounds ?? (bounds = {});
        bounds.x = left;
        bounds.y = top;
        bounds.width = right - left;
        bounds.height = bottom - top;
        return bounds;
    }
    /**
     * Updates the model's transform.
     * @param transform - The world transform.
     */
    updateTransform(transform) {
        this.drawingMatrix.copyFrom(transform).append(this.localTransform);
    }
    /**
     * Updates the model's parameters.
     * @param dt - Elapsed time in milliseconds from last frame.
     * @param now - Current time in milliseconds.
     */
    update(dt, now) {
        this.focusController.update(dt);
    }
    /**
     * Destroys the model and all related resources.
     * @emits {@link InternalModelEvents.destroy | destroy}
     */
    destroy() {
        this.destroyed = true;
        this.emit("destroy");
        this.motionManager.destroy();
        this.motionManager = undefined;
    }
}
exports.InternalModel = InternalModel;
//# sourceMappingURL=InternalModel.js.map