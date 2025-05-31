"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMiddlewares = runMiddlewares;
/**
 * Run middlewares with given context.
 * @see https://github.com/koajs/compose/blob/master/index.js
 *
 * @param middleware
 * @param context
 */
function runMiddlewares(middleware, context) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i, err) {
        if (err)
            return Promise.reject(err);
        if (i <= index)
            return Promise.reject(new Error("next() called multiple times"));
        index = i;
        const fn = middleware[i];
        if (!fn)
            return Promise.resolve();
        try {
            return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}
//# sourceMappingURL=middleware.js.map