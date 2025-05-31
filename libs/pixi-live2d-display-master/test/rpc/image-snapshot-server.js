"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleToMatchImageSnapshot = handleToMatchImageSnapshot;
// @ts-expect-error - untyped package
const jest_image_snapshot_1 = require("jest-image-snapshot");
const toMatchImageSnapshot = jest_image_snapshot_1.toMatchImageSnapshot;
// props that I can confirm are accessed by reading the source code of jest-image-snapshot,
// if tests are fucked up, the lists may need to be updated
const KNOWN_ACCESSED_CTX_PROPS = ["testPath", "currentTestName", "isNot", "snapshotState"];
const KNOWN_ACCESSED_SNAPSHOT_STATE_PROPS = [
    "_updateSnapshot",
    "_counters",
    "updated",
    "added",
    "matched",
    "unmatched",
];
function handleToMatchImageSnapshot({ ctx, received, options, }) {
    const fakeThis = {
        ...ctx,
        snapshotState: {
            ...ctx.snapshotState,
            _counters: new Map(Object.entries(ctx.snapshotState._counters)),
        },
    };
    fakeThis.snapshotState = new Proxy(fakeThis.snapshotState, {
        get(target, p) {
            validateSnapshotStateProps(p);
            return target[p];
        },
        set(target, p, value) {
            validateSnapshotStateProps(p);
            target[p] = value;
            return true;
        },
    });
    const fakeThisProxy = new Proxy(fakeThis, {
        get(target, p) {
            validateCtxProps(p);
            return target[p];
        },
        set(target, p, value) {
            validateCtxProps(p);
            target[p] = value;
            return true;
        },
    });
    if (received.slice(0, 10) === "data:image") {
        received = received.slice("data:image/png;base64,".length);
    }
    const result = toMatchImageSnapshot.call(fakeThisProxy, Buffer.from(received, "base64"), options);
    return {
        ...result,
        message: result.message(),
    };
}
function validateCtxProps(p) {
    if (!KNOWN_ACCESSED_CTX_PROPS.includes(p)) {
        throw new Error(`Unexpected prop "this.${String(p)}" accessed by jest-image-snapshot`);
    }
}
function validateSnapshotStateProps(p) {
    if (!KNOWN_ACCESSED_SNAPSHOT_STATE_PROPS.includes(p)) {
        throw new Error(`Unexpected prop "snapshotState.${String(p)}" accessed by jest-image-snapshot`);
    }
}
//# sourceMappingURL=image-snapshot-server.js.map