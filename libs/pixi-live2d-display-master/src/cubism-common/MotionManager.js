"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionManager = exports.MotionPreloadStrategy = void 0;
const config_1 = require("@/config");
const MotionState_1 = require("@/cubism-common/MotionState");
const SoundManager_1 = require("@/cubism-common/SoundManager");
const utils_1 = require("@/utils");
const core_1 = require("@pixi/core");
const lodash_es_1 = require("lodash-es");
/**
 * Indicates how the motions will be preloaded.
 */
var MotionPreloadStrategy;
(function (MotionPreloadStrategy) {
    /** Preload all the motions. */
    MotionPreloadStrategy["ALL"] = "ALL";
    /** Preload only the idle motions. */
    MotionPreloadStrategy["IDLE"] = "IDLE";
    /** No preload. */
    MotionPreloadStrategy["NONE"] = "NONE";
})(MotionPreloadStrategy || (exports.MotionPreloadStrategy = MotionPreloadStrategy = {}));
/**
 * Handles the motion playback.
 * @emits {@link MotionManagerEvents}
 */
class MotionManager extends core_1.utils.EventEmitter {
    constructor(settings, options) {
        super();
        /**
         * The Motions. The structure is the same as {@link definitions}, initially each group contains
         * an empty array, which means all motions will be `undefined`. When a Motion has been loaded,
         * it'll fill the place in which it should be; when it fails to load, the place will be filled
         * with `null`.
         */
        this.motionGroups = {};
        /**
         * Maintains the state of this MotionManager.
         */
        this.state = new MotionState_1.MotionState();
        /**
         * Flags there's a motion playing.
         */
        this.playing = false;
        /**
         * Flags the instances has been destroyed.
         */
        this.destroyed = false;
        this.settings = settings;
        this.tag = `MotionManager(${settings.name})`;
        this.state.tag = this.tag;
    }
    /**
     * Should be called in the constructor of derived class.
     */
    init(options) {
        if (options?.idleMotionGroup) {
            this.groups.idle = options.idleMotionGroup;
        }
        this.setupMotions(options);
        this.stopAllMotions();
    }
    /**
     * Sets up motions from the definitions, and preloads them according to the preload strategy.
     */
    setupMotions(options) {
        for (const group of Object.keys(this.definitions)) {
            // init with the same structure of definitions
            this.motionGroups[group] = [];
        }
        // preload motions
        let groups;
        switch (options?.motionPreload) {
            case MotionPreloadStrategy.NONE:
                return;
            case MotionPreloadStrategy.ALL:
                groups = Object.keys(this.definitions);
                break;
            case MotionPreloadStrategy.IDLE:
            default:
                groups = [this.groups.idle];
                break;
        }
        for (const group of groups) {
            if (this.definitions[group]) {
                for (let i = 0; i < this.definitions[group].length; i++) {
                    this.loadMotion(group, i).then();
                }
            }
        }
    }
    /**
     * Loads a Motion in a motion group. Errors in this method will not be thrown,
     * but be emitted with a "motionLoadError" event.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     * @emits {@link MotionManagerEvents.motionLoaded}
     * @emits {@link MotionManagerEvents.motionLoadError}
     */
    async loadMotion(group, index) {
        if (!this.definitions[group]?.[index]) {
            utils_1.logger.warn(this.tag, `Undefined motion at "${group}"[${index}]`);
            return undefined;
        }
        if (this.motionGroups[group][index] === null) {
            utils_1.logger.warn(this.tag, `Cannot start motion at "${group}"[${index}] because it's already failed in loading.`);
            return undefined;
        }
        if (this.motionGroups[group][index]) {
            return this.motionGroups[group][index];
        }
        const motion = await this._loadMotion(group, index);
        if (this.destroyed) {
            return;
        }
        this.motionGroups[group][index] = motion ?? null;
        return motion;
    }
    /**
     * Loads the Motion. Will be implemented by Live2DFactory in order to avoid circular dependency.
     * @ignore
     */
    _loadMotion(group, index) {
        throw new Error("Not implemented.");
    }
    /**
     * Only play sound with lip sync
     * @param sound - The audio url to file or base64 content
     * ### OPTIONAL: {name: value, ...}
     * @param volume - Volume of the sound (0-1)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset expression before and after playing sound (default: true)
     * @param crossOrigin - Cross origin setting.
     * @returns Promise that resolves with true if the sound is playing, false if it's not
     */
    async speak(sound, { volume = SoundManager_1.VOLUME, expression, resetExpression = true, crossOrigin, onFinish, onError, } = {}) {
        if (!config_1.config.sound) {
            return false;
        }
        let audio;
        let analyzer;
        let context;
        if (this.currentAudio) {
            if (!this.currentAudio.ended) {
                return false;
            }
        }
        let soundURL;
        const isBase64Content = sound && sound.startsWith("data:");
        if (sound && !isBase64Content) {
            const A = document.createElement("a");
            A.href = sound;
            sound = A.href; // This should be the absolute url
            // since resolveURL is not working for some reason
            soundURL = sound;
        }
        else {
            soundURL = "data:audio/"; // This is a dummy url to avoid showing the entire base64 content in logger.warn
        }
        const file = sound;
        if (file) {
            try {
                // start to load the audio
                audio = SoundManager_1.SoundManager.add(file, (that = this) => {
                    console.log("Audio finished playing"); // Add this line
                    onFinish?.();
                    resetExpression &&
                        expression &&
                        that.expressionManager &&
                        that.expressionManager.resetExpression();
                    that.currentAudio = undefined;
                }, // reset expression when audio is done
                (e, that = this) => {
                    console.log("Error during audio playback:", e); // Add this line
                    onError?.(e);
                    resetExpression &&
                        expression &&
                        that.expressionManager &&
                        that.expressionManager.resetExpression();
                    that.currentAudio = undefined;
                }, // on error
                crossOrigin);
                this.currentAudio = audio;
                SoundManager_1.SoundManager.volume = volume;
                // Add context
                context = SoundManager_1.SoundManager.addContext(this.currentAudio);
                this.currentContext = context;
                // Add analyzer
                analyzer = SoundManager_1.SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
                this.currentAnalyzer = analyzer;
            }
            catch (e) {
                utils_1.logger.warn(this.tag, "Failed to create audio", soundURL, e);
                return false;
            }
        }
        if (audio) {
            let playSuccess = true;
            const readyToPlay = SoundManager_1.SoundManager.play(audio).catch((e) => {
                utils_1.logger.warn(this.tag, "Failed to play audio", audio.src, e);
                playSuccess = false;
            });
            if (config_1.config.motionSync) {
                // wait until the audio is ready
                await readyToPlay;
                if (!playSuccess) {
                    return false;
                }
            }
        }
        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }
        if (expression && this.expressionManager) {
            this.expressionManager.setExpression(expression);
        }
        this.playing = true;
        return true;
    }
    /**
     * Starts a motion as given priority.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied. default: 2 (NORMAL)
     * ### OPTIONAL: {name: value, ...}
     * @param sound - The audio url to file or base64 content
     * @param volume - Volume of the sound (0-1)
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @param resetExpression - Reset expression before and after playing sound (default: true)
     * @param crossOrigin - Cross origin setting.
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    async startMotion(group, index, priority = MotionState_1.MotionPriority.NORMAL, { sound = undefined, volume = SoundManager_1.VOLUME, expression = undefined, resetExpression = true, crossOrigin, onFinish, onError, } = {}) {
        if (!this.state.reserve(group, index, priority)) {
            return false;
        }
        // Does not start a new motion if audio is still playing
        if (this.currentAudio) {
            if (!this.currentAudio.ended && priority != MotionState_1.MotionPriority.FORCE) {
                return false;
            }
        }
        const definition = this.definitions[group]?.[index];
        if (!definition) {
            return false;
        }
        if (this.currentAudio) {
            // TODO: reuse the audio?
            SoundManager_1.SoundManager.dispose(this.currentAudio);
        }
        let audio;
        let analyzer;
        let context;
        let soundURL;
        const isBase64Content = sound && sound.startsWith("data:");
        if (sound && !isBase64Content) {
            const A = document.createElement("a");
            A.href = sound;
            sound = A.href; // This should be the absolute url
            // since resolveURL is not working for some reason
            soundURL = sound;
        }
        else {
            soundURL = this.getSoundFile(definition);
            if (soundURL) {
                soundURL = this.settings.resolveURL(soundURL);
            }
        }
        const file = soundURL;
        if (file) {
            try {
                // start to load the audio
                audio = SoundManager_1.SoundManager.add(file, (that = this) => {
                    console.log("Audio finished playing"); // Add this line
                    onFinish?.();
                    resetExpression &&
                        expression &&
                        that.expressionManager &&
                        that.expressionManager.resetExpression();
                    that.currentAudio = undefined;
                }, // reset expression when audio is done
                (e, that = this) => {
                    console.log("Error during audio playback:", e); // Add this line
                    onError?.(e);
                    resetExpression &&
                        expression &&
                        that.expressionManager &&
                        that.expressionManager.resetExpression();
                    that.currentAudio = undefined;
                }, // on error
                crossOrigin);
                this.currentAudio = audio;
                SoundManager_1.SoundManager.volume = volume;
                // Add context
                context = SoundManager_1.SoundManager.addContext(this.currentAudio);
                this.currentContext = context;
                // Add analyzer
                analyzer = SoundManager_1.SoundManager.addAnalyzer(this.currentAudio, this.currentContext);
                this.currentAnalyzer = analyzer;
            }
            catch (e) {
                utils_1.logger.warn(this.tag, "Failed to create audio", soundURL, e);
            }
        }
        const motion = await this.loadMotion(group, index);
        // audio may be dispose in test case "handles race conditions"
        if (audio && !(0, lodash_es_1.isEmpty)(audio.src)) {
            const readyToPlay = SoundManager_1.SoundManager.play(audio).catch((e) => utils_1.logger.warn(this.tag, "Failed to play audio", audio.src, e));
            if (config_1.config.motionSync) {
                // wait until the audio is ready
                await readyToPlay;
            }
        }
        if (!this.state.start(motion, group, index, priority)) {
            // audio could be dispose in test case "handles race conditions"
            if (audio && !(0, lodash_es_1.isEmpty)(audio.src)) {
                SoundManager_1.SoundManager.dispose(audio);
                this.currentAudio = undefined;
            }
            return false;
        }
        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }
        utils_1.logger.log(this.tag, "Start motion:", this.getMotionName(definition));
        this.emit("motionStart", group, index, audio);
        if (expression && this.expressionManager && this.state.shouldOverrideExpression()) {
            this.expressionManager.setExpression(expression);
        }
        this.playing = true;
        this._startMotion(motion);
        return true;
    }
    /**
     * Starts a random Motion as given priority.
     * @param group - The motion group.
     * @param priority - The priority to be applied. (default: 1 `IDLE`)
     * ### OPTIONAL: {name: value, ...}
     * @param sound - The wav url file or base64 content+
     * @param volume - Volume of the sound (0-1) (default: 1)
     * @param expression - In case you want to mix up a expression while playing sound (name/index)
     * @param resetExpression - Reset expression before and after playing sound (default: true)
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    async startRandomMotion(group, priority, { sound, volume = SoundManager_1.VOLUME, expression, resetExpression = true, crossOrigin, onFinish, onError, } = {}) {
        const groupDefs = this.definitions[group];
        if (groupDefs?.length) {
            const availableIndices = [];
            for (let i = 0; i < groupDefs.length; i++) {
                if (this.motionGroups[group][i] !== null && !this.state.isActive(group, i)) {
                    availableIndices.push(i);
                }
            }
            if (availableIndices.length) {
                const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                return this.startMotion(group, index, priority, {
                    sound: sound,
                    volume: volume,
                    expression: expression,
                    resetExpression: resetExpression,
                    crossOrigin: crossOrigin,
                    onFinish: onFinish,
                    onError: onError,
                });
            }
        }
        return false;
    }
    /**
     * Stop current audio playback and lipsync
     */
    stopSpeaking() {
        if (this.currentAudio) {
            SoundManager_1.SoundManager.dispose(this.currentAudio);
            this.currentAudio = undefined;
        }
    }
    /**
     * Stops all playing motions as well as the sound.
     */
    stopAllMotions() {
        this._stopAllMotions();
        this.state.reset();
        this.stopSpeaking();
    }
    /**
     * Updates parameters of the core model.
     * @param model - The core model.
     * @param now - Current time in milliseconds.
     * @return True if the parameters have been actually updated.
     */
    update(model, now) {
        if (this.isFinished()) {
            if (this.playing) {
                this.playing = false;
                this.emit("motionFinish");
            }
            if (this.state.shouldOverrideExpression()) {
                this.expressionManager?.restoreExpression();
            }
            this.state.complete();
            if (this.state.shouldRequestIdleMotion()) {
                // noinspection JSIgnoredPromiseFromCall
                this.startRandomMotion(this.groups.idle, MotionState_1.MotionPriority.IDLE);
            }
        }
        return this.updateParameters(model, now);
    }
    /**
     * Move the mouth
     *
     */
    mouthSync() {
        if (this.currentAnalyzer) {
            return SoundManager_1.SoundManager.analyze(this.currentAnalyzer);
        }
        else {
            return 0;
        }
    }
    /**
     * Destroys the instance.
     * @emits {@link MotionManagerEvents.destroy}
     */
    destroy() {
        this.destroyed = true;
        this.emit("destroy");
        this.stopAllMotions();
        this.expressionManager?.destroy();
        const self = this;
        self.definitions = undefined;
        self.motionGroups = undefined;
    }
}
exports.MotionManager = MotionManager;
//# sourceMappingURL=MotionManager.js.map