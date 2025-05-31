"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRpcPlugin = testRpcPlugin;
const birpc_1 = require("birpc");
const ws_1 = require("ws");
const constants_1 = require("../constants");
const image_snapshot_server_1 = require("./image-snapshot-server");
const rpcFunctions = {
    hi: () => "Hello my sweetheart!",
    toMatchImageSnapshot: image_snapshot_server_1.handleToMatchImageSnapshot,
};
function testRpcPlugin() {
    return {
        name: "test-rpc",
        configureServer(server) {
            const wss = new ws_1.WebSocketServer({ noServer: true });
            server.httpServer?.on("upgrade", (request, socket, head) => {
                if (!request.url)
                    return;
                const { pathname } = new URL(request.url, `http://${request.headers.host}`);
                if (pathname !== constants_1.TEST_RPC_ENDPOINT)
                    return;
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit("connection", ws, request);
                    (0, birpc_1.createBirpc)(rpcFunctions, {
                        post: (msg) => ws.send(msg),
                        on: (fn) => ws.on("message", fn),
                        serialize: JSON.stringify,
                        deserialize: JSON.parse,
                    });
                });
            });
        },
    };
}
//# sourceMappingURL=rpc-server.js.map