"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyProperty = copyProperty;
exports.copyArray = copyArray;
exports.applyMixins = applyMixins;
/**
 * Copies a property at only if it matches the `type`.
 * @param type - Type expected to match `typeof` on the property.
 * @param from - Source object.
 * @param to - Destination object.
 * @param fromKey - Key of the property in source object.
 * @param toKey - Key of the property in destination object.
 */
// TODO: lint and fix the formatting!
function copyProperty(type, from, to, fromKey, toKey) {
    const value = from[fromKey];
    if (value !== null && typeof value === type) {
        // a type error will occur here, have no idea
        to[toKey] = value;
    }
}
/**
 * Copies an array at `key`, filtering the items that match the `type`.
 * @param type - Type expected to match `typeof` on the items.
 * @param from - Source object.
 * @param to - Destination object.
 * @param fromKey - Key of the array property in source object.
 * @param toKey - Key of the array property in destination object.
 */
function copyArray(type, from, to, fromKey, toKey) {
    const array = from[fromKey];
    if (Array.isArray(array)) {
        to[toKey] = array.filter((item) => item !== null && typeof item === type);
    }
}
/**
 * @see {@link https://www.typescriptlang.org/docs/handbook/mixins.html}
 */
function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            if (name !== "constructor") {
                Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
            }
        });
    });
}
//# sourceMappingURL=obj.js.map