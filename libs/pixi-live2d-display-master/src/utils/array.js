"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = remove;
/**
 * Remove an element from array.
 */
function remove(array, item) {
    const index = array.indexOf(item);
    if (index !== -1) {
        array.splice(index, 1);
    }
}
//# sourceMappingURL=array.js.map