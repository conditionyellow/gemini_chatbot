"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Automator = void 0;
const utils_1 = require("./utils");
class Automator {
    get ticker() {
        return this._ticker;
    }
    set ticker(ticker) {
        if (this._ticker) {
            this._ticker.remove(onTickerUpdate, this);
        }
        this._ticker = ticker;
        if (this._autoUpdate) {
            this._ticker?.add(onTickerUpdate, this);
        }
    }
    /**
     * @see {@link AutomatorOptions.autoUpdate}
     */
    get autoUpdate() {
        return this._autoUpdate;
    }
    set autoUpdate(autoUpdate) {
        if (this.destroyed) {
            return;
        }
        if (autoUpdate) {
            if (this._ticker) {
                this._ticker.add(onTickerUpdate, this);
                this._autoUpdate = true;
            }
            else {
                utils_1.logger.warn(this.model.tag, "No Ticker to be used for automatic updates. Either set option.ticker when creating Live2DModel, or expose PIXI to global scope (window.PIXI = PIXI).");
            }
        }
        else {
            this._ticker?.remove(onTickerUpdate, this);
            this._autoUpdate = false;
        }
    }
    /**
     * @see {@link AutomatorOptions.autoHitTest}
     */
    get autoHitTest() {
        return this._autoHitTest;
    }
    set autoHitTest(autoHitTest) {
        if (autoHitTest !== this.autoHitTest) {
            if (autoHitTest) {
                this.model.on("pointertap", onTap, this);
            }
            else {
                this.model.off("pointertap", onTap, this);
            }
            this._autoHitTest = autoHitTest;
        }
    }
    /**
     * @see {@link AutomatorOptions.autoFocus}
     */
    get autoFocus() {
        return this._autoFocus;
    }
    set autoFocus(autoFocus) {
        if (autoFocus !== this.autoFocus) {
            if (autoFocus) {
                this.model.on("globalpointermove", onPointerMove, this);
            }
            else {
                this.model.off("globalpointermove", onPointerMove, this);
            }
            this._autoFocus = autoFocus;
        }
    }
    /**
     * @see {@link AutomatorOptions.autoInteract}
     */
    get autoInteract() {
        return this._autoHitTest && this._autoFocus;
    }
    set autoInteract(autoInteract) {
        this.autoHitTest = autoInteract;
        this.autoFocus = autoInteract;
    }
    constructor(model, { autoUpdate = true, autoHitTest = true, autoFocus = true, autoInteract, ticker, } = {}) {
        this.destroyed = false;
        this._autoUpdate = false;
        this._autoHitTest = false;
        this._autoFocus = false;
        if (!ticker) {
            if (Automator.defaultTicker) {
                ticker = Automator.defaultTicker;
            }
            else if (typeof PIXI !== "undefined") {
                ticker = PIXI.Ticker.shared;
            }
        }
        if (autoInteract !== undefined) {
            autoHitTest = autoInteract;
            autoFocus = autoInteract;
            utils_1.logger.warn(model.tag, "options.autoInteract is deprecated since v0.5.0, use autoHitTest and autoFocus instead.");
        }
        this.model = model;
        this.ticker = ticker;
        this.autoUpdate = autoUpdate;
        this.autoHitTest = autoHitTest;
        this.autoFocus = autoFocus;
        if (autoHitTest || autoFocus) {
            this.model.eventMode = "static";
        }
    }
    onTickerUpdate() {
        // the delta time can only be obtained from the ticker instead from the listener's argument
        // because the argument is not the delta time, but the delta frame count
        const deltaMS = this.ticker.deltaMS;
        this.model.update(deltaMS);
    }
    onTap(event) {
        this.model.tap(event.global.x, event.global.y);
    }
    onPointerMove(event) {
        this.model.focus(event.global.x, event.global.y);
    }
    destroy() {
        // call setters to clean up
        this.autoFocus = false;
        this.autoHitTest = false;
        this.autoUpdate = false;
        this.ticker = undefined;
        this.destroyed = true;
    }
}
exports.Automator = Automator;
// static event delegates
function onTickerUpdate() {
    this.onTickerUpdate();
}
function onTap(event) {
    this.onTap(event);
}
function onPointerMove(event) {
    this.onPointerMove(event);
}
//# sourceMappingURL=Automator.js.map