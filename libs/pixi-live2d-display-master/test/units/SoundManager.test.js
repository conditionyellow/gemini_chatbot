"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_1 = require("../../src/config");
const SoundManager_1 = require("../../src/cubism-common/SoundManager");
const env_1 = require("../env");
(0, env_1.test)("plays sound", async () => {
    let onFinish;
    let onError;
    const playback = new Promise((resolve, reject) => {
        onFinish = resolve;
        onError = reject;
    });
    const audio = SoundManager_1.SoundManager.add(env_1.TEST_SOUND, onFinish, onError);
    (0, vitest_1.expect)(audio, "added to the audios array").to.be.oneOf(SoundManager_1.SoundManager.audios);
    await SoundManager_1.SoundManager.play(audio).then(() => {
        (0, vitest_1.expect)(audio.readyState, "ready to play").to.gte(audio.HAVE_ENOUGH_DATA);
        // seek to the end so we don't have to wait for the playback
        audio.currentTime = audio.duration;
    });
    await playback;
    (0, vitest_1.expect)(audio, "removed from the audios array when finished").to.not.be.oneOf(SoundManager_1.SoundManager.audios);
});
(0, env_1.test)("handles error when trying to play sound", async () => {
    config_1.config.logLevel = config_1.config.LOG_LEVEL_NONE;
    const playback = new Promise((resolve, reject) => {
        const audio = SoundManager_1.SoundManager.add(env_1.TEST_SOUND, resolve, reject);
        vitest_1.vi.spyOn(audio, "play").mockImplementation(() => Promise.reject(new Error("expected error")));
        (0, vitest_1.expect)(SoundManager_1.SoundManager.play(audio)).rejects.toThrow("expected error");
    });
    await (0, vitest_1.expect)(playback).rejects.toThrow("expected error");
});
(0, env_1.test)("should destroy", async () => {
    const audios = [SoundManager_1.SoundManager.add(env_1.TEST_SOUND), SoundManager_1.SoundManager.add(env_1.TEST_SOUND)];
    await Promise.all(audios.map((audio) => SoundManager_1.SoundManager.play(audio)));
    SoundManager_1.SoundManager.destroy();
    (0, vitest_1.expect)(SoundManager_1.SoundManager.audios).to.be.empty;
    audios.forEach((audio) => {
        (0, vitest_1.expect)(audio).toHaveProperty("paused", true);
    });
});
//# sourceMappingURL=SoundManager.test.js.map