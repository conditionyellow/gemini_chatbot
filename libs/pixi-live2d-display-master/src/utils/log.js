"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const config_1 = require("@/config");
/**
 * A simple tagged logger.
 *
 * You can replace the methods with your own ones.
 *
 * ```js
 * import { logger } from 'pixi-live2d-display';
 *
 * logger.log = (tag, ...messages) => {
 *     console.log(tag, 'says:', ...messages);
 * };
 * ```
 */
exports.logger = {
    log(tag, ...messages) {
        if (config_1.config.logLevel <= config_1.config.LOG_LEVEL_VERBOSE) {
            console.log(`[${tag}]`, ...messages);
        }
    },
    warn(tag, ...messages) {
        if (config_1.config.logLevel <= config_1.config.LOG_LEVEL_WARNING) {
            console.warn(`[${tag}]`, ...messages);
        }
    },
    error(tag, ...messages) {
        if (config_1.config.logLevel <= config_1.config.LOG_LEVEL_ERROR) {
            console.error(`[${tag}]`, ...messages);
        }
    },
};
//# sourceMappingURL=log.js.map