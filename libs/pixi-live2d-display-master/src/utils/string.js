"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderName = folderName;
/**
 * Gets the name of parent folder in a url.
 * @param url - URL of a file.
 * @return Name of the parent folder, or the file itself if it has no parent folder.
 */
function folderName(url) {
    let lastSlashIndex = url.lastIndexOf("/");
    if (lastSlashIndex != -1) {
        url = url.slice(0, lastSlashIndex);
    }
    lastSlashIndex = url.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
        url = url.slice(lastSlashIndex + 1);
    }
    return url;
}
//# sourceMappingURL=string.js.map