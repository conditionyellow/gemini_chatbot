"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.config = void 0;
const config_1 = require("@cubism/config");
const LOG_LEVEL_VERBOSE = 0;
const LOG_LEVEL_WARNING = 1;
const LOG_LEVEL_ERROR = 2;
const LOG_LEVEL_NONE = 999;
/**
 * Global configs.
 */
exports.config = {
    LOG_LEVEL_VERBOSE,
    LOG_LEVEL_WARNING,
    LOG_LEVEL_ERROR,
    LOG_LEVEL_NONE,
    /**
     * Global log level.
     * @default config.LOG_LEVEL_WARNING
     */
    logLevel: __DEV__ ? LOG_LEVEL_VERBOSE : LOG_LEVEL_WARNING,
    /**
     * Enabling sound for motions.
     */
    sound: true,
    /**
     * Deferring motion and corresponding sound until both are loaded.
     */
    motionSync: true,
    /**
     * Default fading duration for motions without such value specified.
     */
    motionFadingDuration: 500,
    /**
     * Default fading duration for idle motions without such value specified.
     */
    idleMotionFadingDuration: 2000,
    /**
     * Default fading duration for expressions without such value specified.
     */
    expressionFadingDuration: 500,
    /**
     * If false, expression will be reset to default when playing non-idle motions.
     */
    preserveExpressionOnMotion: true,
    cubism4: config_1.CubismConfig,
};
/**
 * Consistent with the `version` in package.json.
 */
exports.VERSION = __VERSION__;
//# sourceMappingURL=config.js.map