"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./load-cores");
const display_1 = require("@pixi/display");
require("@pixi/events");
require("@pixi/extract");
const lodash_es_1 = require("lodash-es");
const vitest_1 = require("vitest");
const config_1 = require("../src/config");
require("./rpc/image-snapshot-client");
display_1.Container.defaultSortableChildren = true;
(0, vitest_1.beforeEach)(async function () {
    // declaring the context as an argument will cause a strange error, so we have to use arguments
    // eslint-disable-next-line prefer-rest-params
    const context = arguments[0];
    context.__originalConfig = (0, lodash_es_1.cloneDeep)(config_1.config);
    config_1.config.sound = false;
});
(0, vitest_1.afterEach)(async function () {
    // eslint-disable-next-line prefer-rest-params
    const context = arguments[0];
    Object.assign(config_1.config, context.__originalConfig);
    vitest_1.vi.restoreAllMocks();
});
//# sourceMappingURL=setup.js.map