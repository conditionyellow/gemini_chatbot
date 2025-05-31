"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpc = rpc;
const birpc_1 = require("birpc");
const constants_1 = require("../constants");
let _rpc;
function rpc() {
    if (!_rpc)
        _rpc = createRpc();
    return _rpc;
}
function createRpc() {
    const url = new URL(constants_1.TEST_RPC_ENDPOINT, location.href);
    url.protocol = url.protocol.replace(/^http/, "ws");
    let connectedWebSocket;
    let onMessage;
    function createWebSocket() {
        const maxRetries = 5;
        const retryInterval = 500;
        let retries = 0;
        connectedWebSocket = new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            ws.addEventListener("open", () => {
                retries = 0;
                resolve(ws);
            });
            ws.addEventListener("message", (v) => {
                onMessage(v.data);
            });
            ws.addEventListener("close", () => {
                if (retries++ < maxRetries) {
                    console.log(`RPC disconnected, retrying in ${retryInterval}ms...`);
                    setTimeout(createWebSocket, retryInterval);
                }
                else {
                    console.warn(`RPC disconnected, giving up after ${maxRetries} retries`);
                }
            });
            ws.addEventListener("error", reject);
        });
    }
    createWebSocket();
    const dummy = {};
    return (0, birpc_1.createBirpc)(dummy, {
        post: async (msg) => {
            (await connectedWebSocket).send(msg);
        },
        on: (fn) => (onMessage = fn),
        serialize: JSON.stringify,
        deserialize: JSON.parse,
    });
}
//# sourceMappingURL=rpc-client.js.map