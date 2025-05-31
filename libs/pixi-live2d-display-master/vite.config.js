"use strict";
/// <reference types="vitest" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const vite_1 = require("vite");
const vite_plugin_node_polyfills_1 = require("vite-plugin-node-polyfills");
const node_1 = require("vitest/node");
const package_json_1 = require("./package.json");
const rpc_server_1 = require("./test/rpc/rpc-server");
const cubismSubmodule = path_1.default.resolve(__dirname, "cubism");
const cubism2Core = path_1.default.resolve(__dirname, "core/live2d.min.js");
const cubism4Core = path_1.default.resolve(__dirname, "core/live2dcubismcore.js");
if (!(0, fs_1.existsSync)(cubismSubmodule) || !(0, fs_1.existsSync)(path_1.default.resolve(cubismSubmodule, "package.json"))) {
    throw new Error("Cubism submodule not found. Please run `git submodule update --init` to download them. If you have trouble downloading the submodule, please check out DEVELOPMENT.md for possible solutions.");
}
if (!(0, fs_1.existsSync)(cubism2Core) || !(0, fs_1.existsSync)(cubism4Core)) {
    throw new Error("Cubism Core not found. Please run `npm run setup` to download them.");
}
exports.default = (0, vite_1.defineConfig)(({ command, mode }) => {
    const isDev = command === "serve";
    const isTest = mode === "test";
    return {
        define: {
            __DEV__: isDev,
            __VERSION__: JSON.stringify(package_json_1.default.version),
            // test env
            __HEADLESS__: process.env.CI === "true",
        },
        resolve: {
            alias: {
                "@": path_1.default.resolve(__dirname, "src"),
                "@cubism": path_1.default.resolve(__dirname, "cubism/src"),
            },
        },
        server: {
            open: !isTest && "/playground/index.html",
        },
        build: {
            target: "es6",
            lib: {
                entry: "",
                name: "PIXI.live2d",
            },
            rollupOptions: {
                external(id, parentId, isResolved) {
                    if (id === "pixi.js") {
                        throw new Error("do not import pixi.js, import @pixi/* instead");
                    }
                    return id.startsWith("@pixi/");
                },
                output: {
                    extend: true,
                    globals(id) {
                        if (id.startsWith("@pixi/")) {
                            const packageJsonPath = path_1.default.resolve(__dirname, `./node_modules/${id}/package.json`);
                            const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, "utf-8"));
                            return packageJson.namespace || "PIXI";
                        }
                    },
                },
            },
            minify: false,
        },
        plugins: [
            // pixi.js imports a polyfill package named "url", which breaks Vitest
            // see https://github.com/vitest-dev/vitest/issues/4535
            isTest && (0, vite_plugin_node_polyfills_1.nodePolyfills)(),
            isTest && (0, rpc_server_1.testRpcPlugin)(),
            isTest && {
                name: "load-cubism-core",
                enforce: "post",
                transform(code, id) {
                    if (id.includes("test/load-cores.ts")) {
                        code = code.replace("__CUBISM2_CORE_SOURCE__", (0, fs_1.readFileSync)(cubism2Core, "utf-8"));
                        code = code.replace("__CUBISM4_CORE_SOURCE__", (0, fs_1.readFileSync)(cubism4Core, "utf-8"));
                        return { code };
                    }
                },
            },
        ],
        test: {
            include: ["**/*.test.ts", "**/*.test.js"],
            testTimeout: 10 * 1000,
            fileParallelism: false,
            browser: {
                enabled: true,
                name: "chrome",
                slowHijackESM: false,
                providerOptions: {
                    capabilities: {
                        "goog:chromeOptions": {
                            args: ["--autoplay-policy=no-user-gesture-required"],
                        },
                    },
                },
            },
            setupFiles: ["./test/setup.ts"],
            sequence: {
                sequencer: class MySequencer extends node_1.BaseSequencer {
                    // use the default sorting, then put bundle tests at the end
                    // to make sure they will not pollute the environment for other tests
                    async sort(files) {
                        files = await super.sort(files);
                        // stability tests are slow, it will drag others leg behind
                        // so we put them at the last
                        const stabilityTestFiles = [];
                        files = files.filter(([project, file]) => {
                            if (file.includes("stability")) {
                                stabilityTestFiles.push([project, file]);
                                return false;
                            }
                            return true;
                        });
                        const bundleTestFiles = [];
                        files = files.filter(([project, file]) => {
                            if (file.includes("bundle")) {
                                bundleTestFiles.push([project, file]);
                                return false;
                            }
                            return true;
                        });
                        return [...files, ...stabilityTestFiles, ...bundleTestFiles];
                    }
                },
            },
        },
    };
});
//# sourceMappingURL=vite.config.js.map