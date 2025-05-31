"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoundManager = exports.VOLUME = void 0;
const utils_1 = require("@/utils");
const TAG = "SoundManager";
exports.VOLUME = 0.5;
const audioListenersWeakMap = new WeakMap();
const audioCanplaythroughWeakMap = new WeakMap();
const audioContextWeakMap = new WeakMap();
const audioAnalyserWeakMap = new WeakMap();
const audioSourceWeakMap = new WeakMap();
/**
 * Manages all the sounds.
 */
class SoundManager {
    /**
     * Global volume that applies to all the sounds.
     */
    static get volume() {
        return this._volume;
    }
    static set volume(value) {
        this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
        this.audios.forEach((audio) => (audio.volume = this._volume));
    }
    // TODO: return an ID?
    /**
     * Creates an audio element and adds it to the {@link audios}.
     * @param file - URL of the sound file.
     * @param onFinish - Callback invoked when the playback has finished.
     * @param onError - Callback invoked when error occurs.
     * @param crossOrigin - Cross origin setting.
     * @return Created audio element.
     */
    static add(file, onFinish, onError, crossOrigin) {
        const audio = new Audio(file);
        audio.volume = this._volume;
        audio.preload = "auto";
        // audio.autoplay = true;
        audio.crossOrigin = crossOrigin;
        audioListenersWeakMap.set(audio, {
            ended: () => {
                this.dispose(audio);
                onFinish?.();
            },
            error: (e) => {
                this.dispose(audio);
                utils_1.logger.warn(TAG, `Error occurred on "${file}"`, e.error);
                onError?.(e.error);
            },
        });
        audio.addEventListener("ended", audioListenersWeakMap.get(audio).ended);
        audio.addEventListener("error", audioListenersWeakMap.get(audio).error);
        this.audios.push(audio);
        return audio;
    }
    /**
     * Plays the sound.
     * @param audio - An audio element.
     * @return Promise that resolves when the audio is ready to play, rejects when error occurs.
     */
    static play(audio) {
        return new Promise((resolve, reject) => {
            // see https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
            audio.play()?.catch((e) => {
                audio.dispatchEvent(new ErrorEvent("error", { error: e }));
                reject(e);
            });
            if (audio.readyState === audio.HAVE_ENOUGH_DATA) {
                resolve();
            }
            else {
                audioCanplaythroughWeakMap.set(audio, resolve);
                audio.addEventListener("canplaythrough", resolve);
            }
        });
    }
    static addContext(audio) {
        /* Create an AudioContext */
        const context = new AudioContext();
        audioContextWeakMap.set(audio, context);
        this.contexts.push(context);
        return context;
    }
    static addAnalyzer(audio, context) {
        /* Create an AnalyserNode */
        const source = context.createMediaElementSource(audio);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;
        source.connect(analyser);
        analyser.connect(context.destination);
        audioSourceWeakMap.set(audio, source);
        audioAnalyserWeakMap.set(audio, analyser);
        this.analysers.push(analyser);
        return analyser;
    }
    /**
     * Get volume for lip sync
     * @param analyser - An analyzer element.
     * @return Returns value to feed into lip sync
     */
    static analyze(analyser) {
        if (analyser != undefined) {
            const pcmData = new Float32Array(analyser.fftSize);
            let sumSquares = 0.0;
            analyser.getFloatTimeDomainData(pcmData);
            for (const amplitude of pcmData) {
                sumSquares += amplitude * amplitude;
            }
            return parseFloat(Math.sqrt((sumSquares / pcmData.length) * 20).toFixed(1));
        }
        else {
            return parseFloat(Math.random().toFixed(1));
        }
    }
    /**
     * Disposes an audio element and removes it from {@link audios}.
     * @param audio - An audio element.
     */
    static dispose(audio) {
        audio.pause();
        audio.removeEventListener("ended", audioListenersWeakMap.get(audio)?.ended);
        audio.removeEventListener("error", audioListenersWeakMap.get(audio)?.error);
        audio.removeEventListener("canplaythrough", audioCanplaythroughWeakMap.get(audio));
        audioListenersWeakMap.delete(audio);
        audioCanplaythroughWeakMap.delete(audio);
        const context = audioContextWeakMap.get(audio);
        audioContextWeakMap.delete(audio);
        context?.close();
        const analyser = audioAnalyserWeakMap.get(audio);
        audioAnalyserWeakMap.delete(audio);
        analyser?.disconnect();
        const source = audioSourceWeakMap.get(audio);
        audioSourceWeakMap.delete(audio);
        source?.disconnect();
        audio.removeAttribute("src");
        (0, utils_1.remove)(this.analysers, analyser);
        (0, utils_1.remove)(this.contexts, context);
        (0, utils_1.remove)(this.audios, audio);
    }
    /**
     * Destroys all managed audios.
     */
    static destroy() {
        // dispose() removes given audio from the array, so the loop must be backward
        for (let i = this.contexts.length - 1; i >= 0; i--) {
            this.contexts[i].close();
        }
        for (let i = this.audios.length - 1; i >= 0; i--) {
            this.dispose(this.audios[i]);
        }
    }
}
exports.SoundManager = SoundManager;
/**
 * Audio elements playing or pending to play. Finished audios will be removed automatically.
 */
SoundManager.audios = [];
SoundManager.analysers = [];
SoundManager.contexts = [];
SoundManager._volume = exports.VOLUME;
//# sourceMappingURL=SoundManager.js.map