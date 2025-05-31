"use strict";
/**
 * These functions can be slightly faster than the ones in Lodash.
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.rand = rand;
function clamp(num, lower, upper) {
    return num < lower ? lower : num > upper ? upper : num;
}
function rand(min, max) {
    return Math.random() * (max - min) + min;
}
//# sourceMappingURL=math.js.map