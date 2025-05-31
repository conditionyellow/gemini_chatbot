"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cubism4Ready = cubism4Ready;
exports.startUpCubism4 = startUpCubism4;
const utils_1 = require("@/utils");
const live2dcubismframework_1 = require("@cubism/live2dcubismframework");
let startupPromise;
let startupRetries = 20;
/**
 * Promises that the Cubism 4 framework is ready to work.
 * @return Promise that resolves if the startup has succeeded, rejects if failed.
 */
function cubism4Ready() {
    if (live2dcubismframework_1.CubismFramework.isStarted()) {
        return Promise.resolve();
    }
    startupPromise ?? (startupPromise = new Promise((resolve, reject) => {
        function startUpWithRetry() {
            try {
                startUpCubism4();
                resolve();
            }
            catch (e) {
                startupRetries--;
                if (startupRetries < 0) {
                    const err = new Error("Failed to start up Cubism 4 framework.");
                    err.cause = e;
                    reject(err);
                    return;
                }
                utils_1.logger.log("Cubism4", "Startup failed, retrying 10ms later...");
                setTimeout(startUpWithRetry, 10);
            }
        }
        startUpWithRetry();
    }));
    return startupPromise;
}
/**
 * Starts up Cubism 4 framework.
 */
function startUpCubism4(options) {
    options = Object.assign({
        logFunction: console.log,
        loggingLevel: live2dcubismframework_1.LogLevel.LogLevel_Verbose,
    }, options);
    live2dcubismframework_1.CubismFramework.startUp(options);
    live2dcubismframework_1.CubismFramework.initialize();
}
//# sourceMappingURL=setup.js.map