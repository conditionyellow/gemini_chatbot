"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTexture = createTexture;
const core_1 = require("@pixi/core");
function createTexture(url, options = {}) {
    const textureOptions = { resourceOptions: { crossorigin: options.crossOrigin } };
    // there's already such a method since Pixi v5.3.0
    if (core_1.Texture.fromURL) {
        return core_1.Texture.fromURL(url, textureOptions).catch((e) => {
            if (e instanceof Error) {
                throw e;
            }
            // assume e is an ErrorEvent, let's convert it to an Error
            const err = new Error("Texture loading error");
            err.event = e;
            throw err;
        });
    }
    // and in order to provide backward compatibility for older Pixi versions,
    // we have to manually implement this method
    // see https://github.com/pixijs/pixi.js/pull/6687/files
    textureOptions.resourceOptions.autoLoad = false;
    const texture = core_1.Texture.from(url, textureOptions);
    if (texture.baseTexture.valid) {
        return Promise.resolve(texture);
    }
    const resource = texture.baseTexture.resource;
    // before Pixi v5.2.2, the Promise will not be rejected when loading has failed,
    // we have to manually handle the "error" event
    // see https://github.com/pixijs/pixi.js/pull/6374
    resource._live2d_load ?? (resource._live2d_load = new Promise((resolve, reject) => {
        const errorHandler = (event) => {
            resource.source.removeEventListener("error", errorHandler);
            // convert the ErrorEvent to an Error
            const err = new Error("Texture loading error");
            err.event = event;
            reject(err);
        };
        resource.source.addEventListener("error", errorHandler);
        resource.load().then(() => resolve(texture)).catch(errorHandler);
    }));
    return resource._live2d_load;
}
//# sourceMappingURL=texture.js.map