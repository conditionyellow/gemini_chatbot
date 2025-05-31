"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cubism2ModelSettings_1 = require("@/cubism2/Cubism2ModelSettings");
const Cubism4ModelSettings_1 = require("@/cubism4/Cubism4ModelSettings");
const lodash_es_1 = require("lodash-es");
const vitest_1 = require("vitest");
const env_1 = require("../env");
const minimalCubism2Json = Object.freeze({
    model: "foo.moc",
    textures: ["foo.png"],
});
const minimalCubism4Json = Object.freeze({
    Version: 3,
    FileReferences: {
        Moc: "foo.moc",
        Textures: ["foo.png"],
    },
});
(0, vitest_1.test)("validates model JSON", () => {
    (0, vitest_1.expect)(Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON(env_1.TEST_MODEL2.modelJson)).to.be.true;
    (0, vitest_1.expect)(Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON(minimalCubism2Json)).to.be.true;
    (0, vitest_1.expect)(Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON({})).to.be.false;
    (0, vitest_1.expect)(Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON({ model: "foo", textures: [] })).to.be.false;
    (0, vitest_1.expect)(Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON({ model: "foo", textures: [1] })).to.be.false;
    (0, vitest_1.expect)(Cubism2ModelSettings_1.Cubism2ModelSettings.isValidJSON(undefined)).to.be.false;
    (0, vitest_1.expect)(Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON(env_1.TEST_MODEL4.modelJson)).to.be.true;
    (0, vitest_1.expect)(Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON(minimalCubism4Json)).to.be.true;
    (0, vitest_1.expect)(Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON({})).to.be.false;
    (0, vitest_1.expect)(Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON({ FileReferences: { Moc: "foo", Textures: [] } })).to.be
        .false;
    (0, vitest_1.expect)(Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON({ FileReferences: { Moc: "foo", Textures: [1] } })).to
        .be.false;
    (0, vitest_1.expect)(Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON(undefined)).to.be.false;
});
(0, vitest_1.test)("copies and validates properties", () => {
    const settings2 = new Cubism2ModelSettings_1.Cubism2ModelSettings({
        ...minimalCubism2Json,
        url: "foo",
        pose: 1,
        hit_areas: ["foo-string", { id: "foo", name: "foo" }],
    });
    (0, vitest_1.expect)(settings2).to.have.property("moc").that.equals(minimalCubism2Json.model);
    (0, vitest_1.expect)(settings2).to.have.property("textures").that.eql(minimalCubism2Json.textures);
    (0, vitest_1.expect)(settings2.pose).to.be.undefined;
    (0, vitest_1.expect)(settings2)
        .to.have.property("hitAreas")
        .that.is.an("array")
        .with.deep.members([{ id: "foo", name: "foo" }]);
    const settings4 = new Cubism4ModelSettings_1.Cubism4ModelSettings({ ...minimalCubism4Json, url: "foo" });
    (0, vitest_1.expect)(settings4).to.have.property("moc").that.equals(minimalCubism4Json.FileReferences.Moc);
    (0, vitest_1.expect)(settings4)
        .to.have.property("textures")
        .that.eql(minimalCubism4Json.FileReferences.Textures);
});
(0, vitest_1.test)("handles URL", () => {
    const url = "foo/bar/baz.model.json";
    const settings = new Cubism2ModelSettings_1.Cubism2ModelSettings({
        ...minimalCubism2Json,
        url: url,
    });
    (0, vitest_1.expect)(settings.url).to.equal(url);
    (0, vitest_1.expect)(settings.name).to.equal("bar");
});
function colletFiles(fn) {
    const definedFiles = [];
    const json = fn((file) => {
        definedFiles.push(file);
        return file;
    });
    definedFiles.sort();
    return { json, definedFiles };
}
vitest_1.describe.each([
    {
        name: "cubism2",
        ...colletFiles((make) => {
            return {
                model: make("moc"),
                pose: make("pose"),
                physics: make("physic"),
                textures: [make("texture1"), make("texture2")],
                motions: {
                    a: [{ file: make("motion1"), sound: make("sound1") }],
                    b: [
                        { file: make("motion2"), sound: make("sound2") },
                        { file: make("motion3") },
                    ],
                },
                expressions: [{ file: make("expression"), name: "foo" }],
            };
        }),
    },
    {
        name: "cubism4",
        ...colletFiles((make) => {
            return {
                Version: 3,
                FileReferences: {
                    Moc: make("moc"),
                    Pose: make("pose"),
                    Physics: make("physic"),
                    Textures: [make("texture1"), make("texture2")],
                    Motions: {
                        a: [{ File: make("motion1"), Sound: make("sound1") }],
                        b: [
                            { File: make("motion2"), Sound: make("sound2") },
                            { File: make("motion3") },
                        ],
                    },
                    Expressions: [{ File: make("expression"), Name: "foo" }],
                },
            };
        }),
    },
])("handles defined files", function ({ name, json, definedFiles }) {
    function createModelSettings(json) {
        return Cubism4ModelSettings_1.Cubism4ModelSettings.isValidJSON(json)
            ? new Cubism4ModelSettings_1.Cubism4ModelSettings((0, lodash_es_1.cloneDeep)({ ...json, url: "foo" }))
            : new Cubism2ModelSettings_1.Cubism2ModelSettings((0, lodash_es_1.cloneDeep)({ ...json, url: "foo" }));
    }
    function expectSameAsDefinedFiles(files) {
        (0, vitest_1.expect)(files.sort()).to.have.same.members(definedFiles);
    }
    (0, vitest_1.test)("collects defined files", () => {
        const settings = createModelSettings(json);
        expectSameAsDefinedFiles(settings.getDefinedFiles());
    });
    (0, vitest_1.test)("replaces files", () => {
        const settings = createModelSettings(json);
        const iteratedFiles = [];
        settings.replaceFiles((file, path) => {
            (0, vitest_1.expect)((0, lodash_es_1.get)(settings, path)).to.equal(file);
            iteratedFiles.push(file);
            return file + ".replaced";
        });
        expectSameAsDefinedFiles(iteratedFiles);
        for (const definedFile of settings.getDefinedFiles()) {
            (0, vitest_1.expect)(definedFile).to.include(".replaced");
        }
    });
    (0, vitest_1.test)("validates files", () => {
        const settings = createModelSettings(json);
        (0, vitest_1.expect)(() => settings.validateFiles(definedFiles)).to.not.throw();
        (0, vitest_1.expect)(() => settings.validateFiles(definedFiles.filter((file) => file.match(/moc|texture/)))).to.not.throw();
        (0, vitest_1.expect)(() => settings.validateFiles(["bar"])).to.throw();
        const validFiles = settings.validateFiles([...definedFiles, "xyz"]);
        (0, vitest_1.expect)(validFiles).to.not.include("xyz");
        expectSameAsDefinedFiles(validFiles);
    });
});
//# sourceMappingURL=ModelSettings.test.js.map