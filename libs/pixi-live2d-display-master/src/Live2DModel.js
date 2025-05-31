"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DModel = void 0;
const SoundManager_1 = require("@/cubism-common/SoundManager");
const Live2DFactory_1 = require("@/factory/Live2DFactory");
const core_1 = require("@pixi/core");
const display_1 = require("@pixi/display");
const Automator_1 = require("./Automator");
const Live2DTransform_1 = require("./Live2DTransform");
const utils_1 = require("./utils");
const tempPoint = new core_1.Point();
const tempMatrix = new core_1.Matrix();
/**
 * A wrapper that allows the Live2D model to be used as a DisplayObject in PixiJS.
 *
 * ```js
 * const model = await Live2DModel.from('shizuku.model.json');
 * container.add(model);
 * ```
 * @emits {@link Live2DModelEvents}
 */
class Live2DModel extends display_1.Container {
    /**
     * Creates a Live2DModel from given source.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the creation.
     * @return Promise that resolves with the Live2DModel.
     */
    static from(source, options) {
        const model = new this(options);
        return Live2DFactory_1.Live2DFactory.setupLive2DModel(model, source, options).then(() => model);
    }
    /**
     * Synchronous version of `Live2DModel.from()`. This method immediately returns a Live2DModel instance,
     * whose resources have not been loaded. Therefore this model can't be manipulated or rendered
     * until the "load" event has been emitted.
     *
     * ```js
     * // no `await` here as it's not a Promise
     * const model = Live2DModel.fromSync('shizuku.model.json');
     *
     * // these will cause errors!
     * // app.stage.addChild(model);
     * // model.motion('tap_body');
     *
     * model.once('load', () => {
     *     // now it's safe
     *     app.stage.addChild(model);
     *     model.motion('tap_body');
     * });
     * ```
     */
    static fromSync(source, options) {
        const model = new this(options);
        Live2DFactory_1.Live2DFactory.setupLive2DModel(model, source, options)
            .then(options?.onLoad)
            .catch(options?.onError);
        return model;
    }
    /**
     * Registers the class of `PIXI.Ticker` for auto updating.
     * @deprecated Use {@link Live2DModelOptions.ticker} instead.
     */
    static registerTicker(tickerClass) {
        Automator_1.Automator["defaultTicker"] = tickerClass.shared;
    }
    constructor(options) {
        super();
        /**
         * Tag for logging.
         */
        this.tag = "Live2DModel(uninitialized)";
        /**
         * Pixi textures.
         */
        this.textures = [];
        /** @override */
        this.transform = new Live2DTransform_1.Live2DTransform();
        /**
         * The anchor behaves like the one in `PIXI.Sprite`, where `(0, 0)` means the top left
         * and `(1, 1)` means the bottom right.
         */
        this.anchor = new core_1.ObservablePoint(this.onAnchorChange, this, 0, 0); // cast the type because it breaks the casting of Live2DModel
        /**
         * An ID of Gl context that syncs with `renderer.CONTEXT_UID`. Used to check if the GL context has changed.
         */
        this.glContextID = -1;
        /**
         * Elapsed time in milliseconds since created.
         */
        this.elapsedTime = 0;
        /**
         * Elapsed time in milliseconds from last frame to this frame.
         */
        this.deltaTime = 0;
        this.automator = new Automator_1.Automator(this, options);
        this.once("modelLoaded", () => this.init(options));
    }
    // TODO: rename
    /**
     * A handler of the "modelLoaded" event, invoked when the internal model has been loaded.
     */
    init(options) {
        this.tag = `Live2DModel(${this.internalModel.settings.name})`;
    }
    /**
     * A callback that observes {@link anchor}, invoked when the anchor's values have been changed.
     */
    onAnchorChange() {
        this.pivot.set(this.anchor.x * this.internalModel.width, this.anchor.y * this.internalModel.height);
    }
    /**
     * Shorthand to start a motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied. (0: No priority, 1: IDLE, 2:NORMAL, 3:FORCE) (default: 2)
     * ### OPTIONAL: `{name: value, ...}`
     * @param sound - The audio url to file or base64 content
     * @param volume - Volume of the sound (0-1) (default: 0.5)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset the expression to default after the motion is finished (default: true)
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    motion(group, index, priority, { sound = undefined, volume = SoundManager_1.VOLUME, expression = undefined, resetExpression = true, crossOrigin, onFinish, onError, } = {}) {
        return index === undefined
            ? this.internalModel.motionManager.startRandomMotion(group, priority, {
                sound: sound,
                volume: volume,
                expression: expression,
                resetExpression: resetExpression,
                crossOrigin: crossOrigin,
                onFinish: onFinish,
                onError: onError,
            })
            : this.internalModel.motionManager.startMotion(group, index, priority, {
                sound: sound,
                volume: volume,
                expression: expression,
                resetExpression: resetExpression,
                crossOrigin: crossOrigin,
                onFinish: onFinish,
                onError: onError,
            });
    }
    /**
     * Stops all playing motions as well as the sound.
     */
    stopMotions() {
        return this.internalModel.motionManager.stopAllMotions();
    }
    /**
     * Shorthand to start speaking a sound with an expression.
     * @param sound - The audio url to file or base64 content
     * ### OPTIONAL: {name: value, ...}
     * @param volume - Volume of the sound (0-1)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset the expression to default after the motion is finished (default: true)
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    speak(sound, { volume = SoundManager_1.VOLUME, expression, resetExpression = true, crossOrigin, onFinish, onError, } = {}) {
        return this.internalModel.motionManager.speak(sound, {
            volume: volume,
            expression: expression,
            resetExpression: resetExpression,
            crossOrigin: crossOrigin,
            onFinish: onFinish,
            onError: onError,
        });
    }
    /**
     * Stop current audio playback and lipsync
     */
    stopSpeaking() {
        return this.internalModel.motionManager.stopSpeaking();
    }
    /**
     * Shorthand to set an expression.
     * @param id - Either the index, or the name of the expression. If not presented, a random expression will be set.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    expression(id) {
        if (this.internalModel.motionManager.expressionManager) {
            return id === undefined
                ? this.internalModel.motionManager.expressionManager.setRandomExpression()
                : this.internalModel.motionManager.expressionManager.setExpression(id);
        }
        return Promise.resolve(false);
    }
    /**
     * Updates the focus position. This will not cause the model to immediately look at the position,
     * instead the movement will be interpolated.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param instant - Should the focus position be instantly applied.
     */
    focus(x, y, instant = false) {
        tempPoint.x = x;
        tempPoint.y = y;
        // we can pass `true` as the third argument to skip the update transform
        // because focus won't take effect until the model is rendered,
        // and a model being rendered will always get transform updated
        this.toModelPosition(tempPoint, tempPoint, true);
        const tx = (tempPoint.x / this.internalModel.originalWidth) * 2 - 1;
        const ty = (tempPoint.y / this.internalModel.originalHeight) * 2 - 1;
        const radian = Math.atan2(ty, tx);
        this.internalModel.focusController.focus(Math.cos(radian), -Math.sin(radian), instant);
    }
    /**
     * Tap on the model. This will perform a hit-testing, and emit a "hit" event
     * if at least one of the hit areas is hit.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @emits {@link Live2DModelEvents.hit}
     */
    tap(x, y) {
        const hitAreaNames = this.hitTest(x, y);
        if (hitAreaNames.length) {
            utils_1.logger.log(this.tag, `Hit`, hitAreaNames);
            this.emit("hit", hitAreaNames);
        }
    }
    /**
     * Hit-test on the model.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x, y) {
        tempPoint.x = x;
        tempPoint.y = y;
        this.toModelPosition(tempPoint, tempPoint);
        return this.internalModel.hitTest(tempPoint.x, tempPoint.y);
    }
    /**
     * Calculates the position in the canvas of original, unscaled Live2D model.
     * @param position - A Point in world space.
     * @param result - A Point to store the new value. Defaults to a new Point.
     * @param skipUpdate - True to skip the update transform.
     * @return The Point in model canvas space.
     */
    toModelPosition(position, result = position.clone(), skipUpdate) {
        if (!skipUpdate) {
            this._recursivePostUpdateTransform();
            if (!this.parent) {
                this.parent = this._tempDisplayObjectParent;
                this.displayObjectUpdateTransform();
                this.parent = null;
            }
            else {
                this.displayObjectUpdateTransform();
            }
        }
        this.transform.worldTransform.applyInverse(position, result);
        this.internalModel.localTransform.applyInverse(result, result);
        return result;
    }
    /**
     * A method required by `PIXI.InteractionManager` to perform hit-testing.
     * @param point - A Point in world space.
     * @return True if the point is inside this model.
     */
    containsPoint(point) {
        return this.getBounds(true).contains(point.x, point.y);
    }
    /** @override */
    _calculateBounds() {
        this._bounds.addFrame(this.transform, 0, 0, this.internalModel.width, this.internalModel.height);
    }
    /**
     * Updates the model. Note this method just updates the timer,
     * and the actual update will be done right before rendering the model.
     * @param dt - The elapsed time in milliseconds since last frame.
     */
    update(dt) {
        this.deltaTime += dt;
        this.elapsedTime += dt;
        // don't call `this.internalModel.update()` here, because it requires WebGL context
    }
    _render(renderer) {
        // reset certain systems in renderer to make Live2D's drawing system compatible with Pixi
        renderer.batch.reset();
        renderer.geometry.reset();
        renderer.shader.reset();
        renderer.state.reset();
        let shouldUpdateTexture = false;
        // when the WebGL context has changed
        if (this.glContextID !== renderer.CONTEXT_UID) {
            this.glContextID = renderer.CONTEXT_UID;
            this.internalModel.updateWebGLContext(renderer.gl, this.glContextID);
            shouldUpdateTexture = true;
        }
        for (let i = 0; i < this.textures.length; i++) {
            const texture = this.textures[i];
            if (!texture.valid) {
                continue;
            }
            if (shouldUpdateTexture ||
                !texture.baseTexture._glTextures[this.glContextID]) {
                renderer.gl.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, this.internalModel.textureFlipY);
                // let the TextureSystem generate corresponding WebGLTexture, and bind to an arbitrary location
                renderer.texture.bind(texture.baseTexture, 0);
            }
            // bind the WebGLTexture into Live2D core.
            // because the Texture in Pixi can be shared between multiple DisplayObjects,
            // it's unable to know if the WebGLTexture in this Texture has been destroyed (GCed) and regenerated,
            // and therefore we always bind the texture at this moment no matter what
            this.internalModel.bindTexture(i, texture.baseTexture._glTextures[this.glContextID].texture);
            // manually update the GC counter so they won't be GCed while using this model
            texture.baseTexture.touched = renderer.textureGC.count;
        }
        const viewport = renderer.framebuffer.viewport;
        this.internalModel.viewport = [viewport.x, viewport.y, viewport.width, viewport.height];
        // update only if the time has changed, as the model will possibly be updated once but rendered multiple times
        if (this.deltaTime) {
            this.internalModel.update(this.deltaTime, this.elapsedTime);
            this.deltaTime = 0;
        }
        const internalTransform = tempMatrix
            .copyFrom(renderer.globalUniforms.uniforms.projectionMatrix)
            .append(this.worldTransform);
        this.internalModel.updateTransform(internalTransform);
        this.internalModel.draw(renderer.gl);
        // reset WebGL state and texture bindings
        renderer.state.reset();
        renderer.texture.reset();
    }
    /**
     * Destroys the model and all related resources. This takes the same options and also
     * behaves the same as `PIXI.Container#destroy`.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param [options.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'options' will be passed on to those calls.
     * @param [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    destroy(options) {
        this.emit("destroy");
        if (options?.texture) {
            this.textures.forEach((texture) => texture.destroy(options.baseTexture));
        }
        this.automator.destroy();
        this.internalModel.destroy();
        super.destroy(options);
    }
}
exports.Live2DModel = Live2DModel;
//# sourceMappingURL=Live2DModel.js.map