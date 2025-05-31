"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DLoader = void 0;
const XHRLoader_1 = require("@/factory/XHRLoader");
const middleware_1 = require("@/utils/middleware");
class Live2DLoader {
    /**
     * Loads a resource.
     * @return Promise that resolves with the loaded data in a format that's consistent with the specified `type`.
     */
    static load(context) {
        return (0, middleware_1.runMiddlewares)(this.middlewares, context).then(() => context.result);
    }
}
exports.Live2DLoader = Live2DLoader;
Live2DLoader.middlewares = [XHRLoader_1.XHRLoader.loader];
//# sourceMappingURL=Live2DLoader.js.map