"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XHRLoader = void 0;
const utils_1 = require("@/utils");
const TAG = "XHRLoader";
class NetworkError extends Error {
    constructor(message, url, status, aborted = false) {
        super(message);
        this.url = url;
        this.status = status;
        this.aborted = aborted;
    }
}
/**
 * The basic XHR loader.
 *
 * A network error will be thrown with the following properties:
 * - `url` - The request URL.
 * - `status` - The HTTP status.
 * - `aborted` - True if the error is caused by aborting the XHR.
 */
class XHRLoader {
    /**
     * Creates a managed XHR.
     * @param target - If provided, the XHR will be canceled when receiving an "destroy" event from the target.
     * @param url - The URL.
     * @param type - The XHR response type.
     * @param onload - Load listener.
     * @param onerror - Error handler.
     */
    static createXHR(target, url, type, onload, onerror) {
        const xhr = new XMLHttpRequest();
        XHRLoader.allXhrSet.add(xhr);
        if (target) {
            let xhrSet = XHRLoader.xhrMap.get(target);
            if (!xhrSet) {
                xhrSet = new Set([xhr]);
                XHRLoader.xhrMap.set(target, xhrSet);
            }
            else {
                xhrSet.add(xhr);
            }
            // TODO: properly type this
            if (!target.listeners("destroy").includes(XHRLoader.cancelXHRs)) {
                target.once("destroy", XHRLoader.cancelXHRs);
            }
        }
        xhr.open("GET", url);
        xhr.responseType = type;
        xhr.onload = () => {
            if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
                onload(xhr.response);
            }
            else {
                xhr.onerror();
            }
        };
        xhr.onerror = () => {
            utils_1.logger.warn(TAG, `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url}`);
            onerror(new NetworkError("Network error.", url, xhr.status));
        };
        xhr.onabort = () => onerror(new NetworkError("Aborted.", url, xhr.status, true));
        xhr.onloadend = () => {
            XHRLoader.allXhrSet.delete(xhr);
            if (target) {
                XHRLoader.xhrMap.get(target)?.delete(xhr);
            }
        };
        return xhr;
    }
    /**
     * Cancels all XHRs related to this target.
     */
    static cancelXHRs() {
        XHRLoader.xhrMap.get(this)?.forEach((xhr) => {
            xhr.abort();
            XHRLoader.allXhrSet.delete(xhr);
        });
        XHRLoader.xhrMap.delete(this);
    }
    /**
     * Release all XHRs.
     */
    static release() {
        XHRLoader.allXhrSet.forEach((xhr) => xhr.abort());
        XHRLoader.allXhrSet.clear();
        XHRLoader.xhrMap = new WeakMap();
    }
}
exports.XHRLoader = XHRLoader;
/**
 * All the created XHRs, keyed by their owners respectively.
 */
XHRLoader.xhrMap = new WeakMap();
/**
 * All the created XHRs as a flat array.
 */
XHRLoader.allXhrSet = new Set();
/**
 * Middleware for Live2DLoader.
 */
XHRLoader.loader = (context, next) => {
    return new Promise((resolve, reject) => {
        const xhr = XHRLoader.createXHR(context.target, context.settings ? context.settings.resolveURL(context.url) : context.url, context.type, (data) => {
            context.result = data;
            resolve();
        }, reject);
        xhr.send();
    });
};
//# sourceMappingURL=XHRLoader.js.map