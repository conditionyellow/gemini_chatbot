"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-empty-pattern */
const config_1 = require("@/config");
const cubism_common_1 = require("@/cubism-common");
const SoundManager_1 = require("@/cubism-common/SoundManager");
const Cubism4ModelSettings_1 = require("@/cubism4/Cubism4ModelSettings");
const Cubism4MotionManager_1 = require("@/cubism4/Cubism4MotionManager");
require("@/factory");
const vitest_1 = require("vitest");
const csm4_1 = require("../../src/csm4");
const env_1 = require("../env");
const defaultOptions = { motionPreload: cubism_common_1.MotionPreloadStrategy.NONE };
const test = env_1.test.extend({
    async manager({}, use) {
        const manager = new Cubism4MotionManager_1.Cubism4MotionManager(new Cubism4ModelSettings_1.Cubism4ModelSettings(env_1.TEST_MODEL4.modelJsonWithUrl), defaultOptions);
        await use(manager);
        manager.destroy();
    },
    async createManager({}, use) {
        let manager;
        const createManager = (options) => {
            if (manager)
                throw new Error("manager already created");
            manager = new Cubism4MotionManager_1.Cubism4MotionManager(new Cubism4ModelSettings_1.Cubism4ModelSettings(env_1.TEST_MODEL4.modelJsonWithUrl), options);
            return manager;
        };
        await use({
            run: createManager,
            get: () => manager,
        });
        manager?.destroy();
    },
    async coreModel({}, use) {
        const coreModel = await env_1.TEST_MODEL4.coreModel();
        await use(coreModel);
        coreModel.release();
    },
    async assertStartedMotion({ manager, createManager }, use) {
        const assertStartedMotion = async (group, indexOrFn, fn) => {
            let index;
            if (typeof indexOrFn === "function") {
                fn = indexOrFn;
            }
            else {
                index = indexOrFn;
            }
            manager = createManager.get() || manager;
            const startMotion = vitest_1.vi.spyOn(manager.queueManager, "startMotion");
            try {
                const [startedMotion] = await Promise.all([
                    new Promise((resolve) => startMotion.mockImplementation((m) => (resolve(m), 0))),
                    fn(),
                ]);
                const actualGroup = Object.entries(manager.motionGroups).find(([group, motions]) => motions?.includes(startedMotion))?.[0];
                (0, vitest_1.expect)(group).toBe(actualGroup);
                if (index !== undefined) {
                    (0, vitest_1.expect)(manager.motionGroups[group].indexOf(startedMotion)).toBe(index);
                }
            }
            finally {
                startMotion.mockRestore();
            }
        };
        await use({ run: assertStartedMotion });
    },
});
(0, vitest_1.beforeEach)(() => {
    config_1.config.logLevel = config_1.config.LOG_LEVEL_WARNING;
    config_1.config.sound = false;
});
(0, vitest_1.describe)("preloads motions", () => {
    test("NONE", async ({ createManager, loaderMock }) => {
        createManager.run({ motionPreload: cubism_common_1.MotionPreloadStrategy.NONE });
        (0, vitest_1.expect)(loaderMock.getAll()).toHaveLength(0);
    });
    test("IDLE", async ({ createManager, loaderMock }) => {
        createManager.run({ motionPreload: cubism_common_1.MotionPreloadStrategy.IDLE });
        (0, vitest_1.expect)(loaderMock.getAll().map((x) => x.url.split("/").at(-1))).toEqual(vitest_1.expect.arrayContaining(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Idle.map((m) => m.File.split("/").at(-1))));
    });
    test("ALL", async ({ createManager, loaderMock }) => {
        createManager.run({ motionPreload: cubism_common_1.MotionPreloadStrategy.ALL });
        (0, vitest_1.expect)(loaderMock.getAll().map((x) => x.url.split("/").at(-1))).toEqual(vitest_1.expect.arrayContaining(Object.values(env_1.TEST_MODEL4.modelJson.FileReferences.Motions).flatMap((M) => M.map((m) => m.File.split("/").at(-1)))));
    });
});
test("uses custom idle group", async ({ loaderMock, createManager, coreModel, assertStartedMotion, }) => {
    const manager = createManager.run({
        motionPreload: cubism_common_1.MotionPreloadStrategy.IDLE,
        idleMotionGroup: "Tap",
    });
    (0, vitest_1.expect)(loaderMock.getAll().map((x) => x.url.split("/").at(-1))).toEqual(vitest_1.expect.arrayContaining(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap.map((m) => m.File.split("/").at(-1))));
    await assertStartedMotion.run("Tap", async () => {
        manager.update(coreModel, 0);
    });
});
test("loads motions", async ({ manager }) => {
    (0, vitest_1.expect)(manager.loadMotion("Tap", 0)).resolves.toBeInstanceOf(csm4_1.CubismMotion);
    config_1.config.logLevel = config_1.config.LOG_LEVEL_NONE;
    (0, vitest_1.expect)(manager.loadMotion("asdfasdf", 0)).resolves.toBeUndefined();
});
test("starts an idle motion when no motion playing", async ({ manager, coreModel, assertStartedMotion, }) => {
    await assertStartedMotion.run("Idle", async () => {
        manager.update(coreModel, 0);
    });
});
test("starts an idle motion when current motion has finished", async ({ manager, coreModel, assertStartedMotion, }) => {
    await manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.IDLE);
    manager.update(coreModel, 0);
    manager.update(coreModel, 30 * 1000);
    (0, vitest_1.expect)(manager.isFinished()).to.be.true;
    await assertStartedMotion.run("Idle", async () => {
        manager.update(coreModel, 60 * 1000);
    });
});
test("starts a random motion", async ({ manager, assertStartedMotion }) => {
    await assertStartedMotion.run("Tap", async () => {
        (0, vitest_1.expect)(manager.startRandomMotion("Tap")).resolves.toBe(true);
    });
});
test("starts an idle motion when the reserved motion has not yet been loaded", async ({ loaderMock, manager, coreModel, assertStartedMotion, }) => {
    await assertStartedMotion.run("Idle", async () => {
        manager.update(coreModel, 0);
    });
    manager.update(coreModel, 0);
    manager.update(coreModel, 30 * 1000);
    await assertStartedMotion.run("Tap", async () => {
        loaderMock.block(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0].File);
        void manager.startMotion("Tap", 0, cubism_common_1.MotionPriority.NORMAL);
        await assertStartedMotion.run("Idle", async () => {
            manager.update(coreModel, 60 * 1000);
        });
        loaderMock.unblockAll();
    });
});
(0, vitest_1.describe)("refuses to play the same motion when it's already pending or playing", async () => {
    test("playing", async ({ manager }) => {
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.IDLE)).resolves.toBe(true);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.IDLE)).resolves.toBe(false);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.NORMAL)).resolves.toBe(false);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.FORCE)).resolves.toBe(false);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 1, cubism_common_1.MotionPriority.NORMAL)).resolves.toBe(true);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 1, cubism_common_1.MotionPriority.NORMAL)).resolves.toBe(false);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 2, cubism_common_1.MotionPriority.FORCE)).resolves.toBe(true);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 2, cubism_common_1.MotionPriority.FORCE)).resolves.toBe(false);
    });
    test("pending as IDLE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const startMotionPromise = manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.IDLE);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.IDLE)).resolves.toBe(false);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.NORMAL)).resolves.toBe(false);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.FORCE)).resolves.toBe(false);
        loaderMock.unblockAll();
        await (0, vitest_1.expect)(startMotionPromise).resolves.toBe(true);
    });
    test("pending as NORMAL", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const startMotionPromise = manager.startMotion("Idle", 1, cubism_common_1.MotionPriority.NORMAL);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 1, cubism_common_1.MotionPriority.NORMAL)).resolves.toBe(false);
        loaderMock.unblockAll();
        await (0, vitest_1.expect)(startMotionPromise).resolves.toBe(true);
    });
    test("pending as FORCE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const startMotionPromise = manager.startMotion("Idle", 2, cubism_common_1.MotionPriority.FORCE);
        await (0, vitest_1.expect)(manager.startMotion("Idle", 2, cubism_common_1.MotionPriority.FORCE)).resolves.toBe(false);
        loaderMock.unblockAll();
        await (0, vitest_1.expect)(startMotionPromise).resolves.toBe(true);
    });
});
(0, vitest_1.describe)("handles race conditions", async () => {
    test("IDLE -> NORMAL", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const idle = manager.startMotion("Idle", 0, cubism_common_1.MotionPriority.IDLE);
        const normal = manager.startMotion("Tap", 0, cubism_common_1.MotionPriority.NORMAL);
        loaderMock.unblock(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0].File);
        await (0, vitest_1.expect)(normal).resolves.toBe(true);
        loaderMock.unblock(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Idle[0].File);
        await (0, vitest_1.expect)(idle).resolves.toBe(false);
    });
    test("NORMAL -> FORCE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const normal = manager.startMotion("Tap", 0, cubism_common_1.MotionPriority.NORMAL);
        const force = manager.startMotion("Tap", 1, cubism_common_1.MotionPriority.FORCE);
        loaderMock.unblock(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[1].File);
        await (0, vitest_1.expect)(force).resolves.toBe(true);
        loaderMock.unblock(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0].File);
        await (0, vitest_1.expect)(normal).resolves.toBe(false);
    });
    test("FORCE -> FORCE", async ({ manager, loaderMock }) => {
        loaderMock.blockAll();
        const force0 = manager.startMotion("Tap", 0, cubism_common_1.MotionPriority.FORCE);
        const force1 = manager.startMotion("Tap", 1, cubism_common_1.MotionPriority.FORCE);
        loaderMock.unblock(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[1].File);
        await (0, vitest_1.expect)(force1).resolves.toBe(true);
        loaderMock.unblock(env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0].File);
        await (0, vitest_1.expect)(force0).resolves.toBe(false);
    });
});
test("does not break the motion when its sound file fails to play", async ({ manager }) => {
    config_1.config.sound = true;
    const play = vitest_1.vi
        .spyOn(SoundManager_1.SoundManager, "play")
        .mockImplementation(() => Promise.reject(new Error("foo")));
    await (0, vitest_1.expect)(manager.startMotion("Tap", 0)).resolves.toBe(true);
    (0, vitest_1.expect)(play).toHaveBeenCalled();
});
test("startRandomMotion() does not try to start a motion that already failed to load", async ({ manager, loaderMock, }) => {
    loaderMock.rewrite((url) => url.replace("Idle", "asdfasdf"));
    for (let i = 0; i < env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Idle.length; i++) {
        await manager.startMotion("Idle", i);
    }
    const loadMotion = vitest_1.vi.spyOn(manager, "loadMotion");
    await (0, vitest_1.expect)(manager.startRandomMotion("Idle")).resolves.toBe(false);
    (0, vitest_1.expect)(loadMotion).not.toHaveBeenCalled();
});
test("handles user events", async ({ manager, coreModel, loaderMock }) => {
    const motionFile = env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Idle[0].File;
    loaderMock.block(motionFile);
    const emittedEvent = new Promise((resolve) => manager.on("motion:test", resolve));
    await Promise.all([
        manager.startMotion("Idle", 0),
        loaderMock.onLoaded(motionFile).then(() => {
            loaderMock.unblock(motionFile, (data) => {
                data.Meta.UserDataCount = 1;
                data.UserData = [{ Time: 0.0, Value: "test" }];
            });
        }),
    ]);
    manager.update(coreModel, 100);
    await emittedEvent;
});
(0, vitest_1.describe)("uses fading durations", () => {
    test("falls back to fading durations in the config", async ({ createManager, coreModel }) => {
        config_1.config.motionFadingDuration = 1000 * 100;
        config_1.config.idleMotionFadingDuration = 1000 * 200;
        const manager = createManager.run({ idleMotionGroup: "non-existent" });
        manager.definitions["Tap"][0].FadeInTime = undefined;
        manager.definitions["Tap"][0].FadeOutTime = undefined;
        manager.definitions["Idle"][0].FadeInTime = undefined;
        manager.definitions["Idle"][0].FadeOutTime = undefined;
        await (0, vitest_1.expect)(manager.startMotion("Tap", 0)).resolves.toBe(true);
        manager.update(coreModel, 0);
        manager.update(coreModel, 1000 * 50);
        (0, vitest_1.expect)(manager.playing).to.be.true;
        manager.update(coreModel, 1000 * 50 + 100);
        (0, vitest_1.expect)(manager.playing).to.be.false;
        // waiting for previous motion to finish
        await new Promise((resolve) => setTimeout(resolve, 4000));
        await (0, vitest_1.expect)(manager.startMotion("Idle", 0)).resolves.toBe(true);
        manager.update(coreModel, 0);
        manager.update(coreModel, 1000 * 100);
        (0, vitest_1.expect)(manager.playing).to.be.true;
        manager.update(coreModel, 1000 * 100 + 100);
        (0, vitest_1.expect)(manager.playing).to.be.false;
    });
    test("uses fading duration defined in Cubism 4 motion json", async ({ manager, coreModel, loaderMock, }) => {
        const motionFile = env_1.TEST_MODEL4.modelJson.FileReferences.Motions.Tap[0].File;
        loaderMock.block(motionFile);
        await Promise.all([
            manager.startMotion("Tap", 0),
            loaderMock.onLoaded(motionFile).then(() => {
                loaderMock.unblock(motionFile, (data) => {
                    data.Meta.FadeInTime = 1000 * 100;
                    data.Meta.FadeOutTime = 1000 * 200;
                });
            }),
        ]);
        manager.update(coreModel, 0);
        manager.update(coreModel, 1000 * 100);
        (0, vitest_1.expect)(manager.playing).to.be.true;
        manager.update(coreModel, 1000 * 100 + 100);
        (0, vitest_1.expect)(manager.playing).to.be.false;
    });
});
//# sourceMappingURL=MotionManager.test.js.map