"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_es_1 = require("lodash-es");
const vitest_1 = require("vitest");
const rpc_client_1 = require("./rpc-client");
vitest_1.expect.extend({
    async toMatchImageSnapshot(received, options) {
        if (!(received instanceof ArrayBuffer || isPixiApp(received))) {
            return {
                pass: false,
                message: () => "toMatchImageSnapshot can only be used with ArrayBuffers or PIXI.Application",
            };
        }
        const receivedAsB64 = isPixiApp(received)
            ? await received.renderer.extract.base64(undefined, "image/png")
            : btoa(String.fromCharCode(...new Uint8Array(received)));
        const ctx = {
            testPath: this.testPath,
            currentTestName: this.currentTestName,
            isNot: this.isNot,
            snapshotState: {
                updated: this.snapshotState.updated,
                added: this.snapshotState.added,
                matched: this.snapshotState.matched,
                unmatched: this.snapshotState.unmatched,
                _updateSnapshot: this.snapshotState["_updateSnapshot"],
                _counters: Object.fromEntries(Object.entries(this.snapshotState["_counters"])),
            },
        };
        const result = await (0, rpc_client_1.rpc)().toMatchImageSnapshot({
            ctx,
            received: receivedAsB64,
            options: {
                // images are a bit different (~1% from observation) when rendered in CI,
                // and probably also in other platforms, so we have to set a higher threshold
                failureThreshold: 3,
                failureThresholdType: "percent",
            },
        });
        return {
            pass: result.pass,
            message: () => result.message,
        };
    },
});
function isPixiApp(v) {
    return (0, lodash_es_1.isObject)(v) && "stage" in v && "renderer" in v;
}
//# sourceMappingURL=image-snapshot-client.js.map