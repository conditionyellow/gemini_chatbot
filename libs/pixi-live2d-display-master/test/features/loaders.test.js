"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Live2DModel_1 = require("@/Live2DModel");
const jszip_1 = require("jszip");
const vitest_1 = require("vitest");
const Live2DFactory_1 = require("../../src/factory/Live2DFactory");
const ZipLoader_1 = require("../../src/factory/ZipLoader");
const env_1 = require("../env");
const utils_1 = require("../utils");
(0, vitest_1.describe)("FileLoader", function () {
    (0, env_1.testEachModel)("loads model from files", async ({ model: { files }, objectURLs }) => {
        const model = await Live2DModel_1.Live2DModel.from(await files(), (0, utils_1.defaultOptions)());
        (0, vitest_1.expect)(model).to.be.instanceOf(Live2DModel_1.Live2DModel);
        model.destroy();
        (0, vitest_1.expect)(objectURLs).to.be.empty;
    });
    (0, env_1.testEachModel)("loads model from files with predefined ModelSettings", async ({ model: { files, modelJsonWithUrl }, objectURLs }) => {
        const settings = Live2DFactory_1.Live2DFactory.findRuntime(modelJsonWithUrl).createModelSettings(modelJsonWithUrl);
        // TODO: remove the need for this
        settings._objectURL = "xxxxxxxxx";
        const filesSrc = (await files()).slice();
        filesSrc.settings = settings;
        const model = await Live2DModel_1.Live2DModel.from(filesSrc, (0, utils_1.defaultOptions)());
        (0, vitest_1.expect)(model).to.be.instanceOf(Live2DModel_1.Live2DModel);
        model.destroy();
        (0, vitest_1.expect)(objectURLs).to.be.empty;
    });
});
(0, env_1.describeEachModel)("ZipLoader", ({ model: { name, files, modelJsonUrl, modelJsonWithUrl } }) => {
    let zipFile;
    let zipFileWithoutSettings;
    (0, vitest_1.beforeAll)(async () => {
        ZipLoader_1.ZipLoader.zipReader = (data, url) => jszip_1.default.loadAsync(data);
        ZipLoader_1.ZipLoader.readText = (jsZip, path) => jsZip.file(path).async("text");
        ZipLoader_1.ZipLoader.getFilePaths = (jsZip) => {
            const paths = [];
            jsZip.forEach((relativePath) => paths.push(relativePath));
            return Promise.resolve(paths);
        };
        ZipLoader_1.ZipLoader.getFiles = (jsZip, paths) => {
            return Promise.all(paths.map(async (path) => {
                const fileName = path.slice(path.lastIndexOf("/") + 1);
                const blob = await jsZip.file(path).async("blob");
                return new File([blob], fileName);
            }));
        };
        const zip = new jszip_1.default();
        let settingsFile;
        for (const file of await files()) {
            if (modelJsonUrl.includes(file.webkitRelativePath)) {
                settingsFile = file;
                continue;
            }
            zip.file(file.webkitRelativePath, file);
        }
        (0, vitest_1.expect)(settingsFile, "found settings file").toBeInstanceOf(File);
        const zipBlobWithoutSettings = await zip.generateAsync({ type: "blob" });
        zipFileWithoutSettings = (0, utils_1.createFile)(zipBlobWithoutSettings, `foo/bar/${name}.zip`);
        zip.file(settingsFile.webkitRelativePath, settingsFile);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        zipFile = (0, utils_1.createFile)(zipBlob, `foo/bar/${name}.zip`);
    });
    (0, env_1.test)("loads model from a zip", async ({ objectURLs }) => {
        const model = await Live2DModel_1.Live2DModel.from([zipFile], (0, utils_1.defaultOptions)());
        (0, vitest_1.expect)(model).to.be.instanceOf(Live2DModel_1.Live2DModel);
        model.destroy();
        (0, vitest_1.expect)(objectURLs).to.be.empty;
    });
    (0, env_1.test)("loads model from a zip with predefined ModelSettings", async ({ objectURLs }) => {
        const files = [zipFileWithoutSettings];
        files.settings =
            Live2DFactory_1.Live2DFactory.findRuntime(modelJsonWithUrl).createModelSettings(modelJsonWithUrl);
        const model = await Live2DModel_1.Live2DModel.from(files, (0, utils_1.defaultOptions)());
        (0, vitest_1.expect)(model).to.be.instanceOf(Live2DModel_1.Live2DModel);
        model.destroy();
        (0, vitest_1.expect)(objectURLs).to.be.empty;
    });
    (0, env_1.test)("loads model from a zip URL", async ({ objectURLs }) => {
        const zipURL = ZipLoader_1.ZipLoader.ZIP_PROTOCOL + URL.createObjectURL(zipFile);
        const model = await Live2DModel_1.Live2DModel.from(zipURL, (0, utils_1.defaultOptions)());
        (0, vitest_1.expect)(model).to.be.instanceOf(Live2DModel_1.Live2DModel);
        model.destroy();
        URL.revokeObjectURL(zipURL);
        (0, vitest_1.expect)(objectURLs).to.be.empty;
    });
});
//# sourceMappingURL=loaders.test.js.map