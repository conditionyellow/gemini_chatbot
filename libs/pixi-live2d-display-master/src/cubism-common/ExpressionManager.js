"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionManager = void 0;
const utils_1 = require("@/utils");
const core_1 = require("@pixi/core");
/**
 * Abstract expression manager.
 * @emits {@link ExpressionManagerEvents}
 */
class ExpressionManager extends core_1.utils.EventEmitter {
    constructor(settings, options) {
        super();
        /**
         * The Expressions. The structure is the same as {@link definitions}, initially there's only
         * an empty array, which means all expressions will be `undefined`. When an Expression has
         * been loaded, it'll fill the place in which it should be; when it fails to load,
         * the place will be filled with `null`.
         */
        this.expressions = [];
        /**
         * The pending Expression.
         */
        this.reserveExpressionIndex = -1;
        /**
         * Flags the instance has been destroyed.
         */
        this.destroyed = false;
        this.settings = settings;
        this.tag = `ExpressionManager(${settings.name})`;
    }
    /**
     * Should be called in the constructor of derived class.
     */
    init() {
        this.defaultExpression = this.createExpression({}, undefined);
        this.currentExpression = this.defaultExpression;
        this.stopAllExpressions();
    }
    /**
     * Loads an Expression. Errors in this method will not be thrown,
     * but be emitted with an "expressionLoadError" event.
     * @param index - Index of the expression in definitions.
     * @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
     * @emits {@link ExpressionManagerEvents.expressionLoaded}
     * @emits {@link ExpressionManagerEvents.expressionLoadError}
     */
    async loadExpression(index) {
        if (!this.definitions[index]) {
            utils_1.logger.warn(this.tag, `Undefined expression at [${index}]`);
            return undefined;
        }
        if (this.expressions[index] === null) {
            utils_1.logger.warn(this.tag, `Cannot set expression at [${index}] because it's already failed in loading.`);
            return undefined;
        }
        if (this.expressions[index]) {
            return this.expressions[index];
        }
        const expression = await this._loadExpression(index);
        this.expressions[index] = expression;
        return expression;
    }
    /**
     * Loads the Expression. Will be implemented by Live2DFactory in order to avoid circular dependency.
     * @ignore
     */
    _loadExpression(index) {
        throw new Error("Not implemented.");
    }
    /**
     * Sets a random Expression that differs from current one.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    async setRandomExpression() {
        if (this.definitions.length) {
            const availableIndices = [];
            for (let i = 0; i < this.definitions.length; i++) {
                if (this.expressions[i] !== null &&
                    this.expressions[i] !== this.currentExpression &&
                    i !== this.reserveExpressionIndex) {
                    availableIndices.push(i);
                }
            }
            if (availableIndices.length) {
                const index = Math.floor(Math.random() * availableIndices.length);
                return this.setExpression(index);
            }
        }
        return false;
    }
    /**
     * Resets model's expression using {@link ExpressionManager#defaultExpression}.
     */
    resetExpression() {
        this._setExpression(this.defaultExpression);
    }
    /**
     * Restores model's expression to {@link currentExpression}.
     */
    restoreExpression() {
        this._setExpression(this.currentExpression);
    }
    /**
     * Sets an Expression.
     * @param index - Either the index, or the name of the expression.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    async setExpression(index) {
        if (typeof index !== "number") {
            index = this.getExpressionIndex(index);
        }
        if (!(index > -1 && index < this.definitions.length)) {
            return false;
        }
        if (index === this.expressions.indexOf(this.currentExpression)) {
            return false;
        }
        this.reserveExpressionIndex = index;
        const expression = await this.loadExpression(index);
        if (!expression || this.reserveExpressionIndex !== index) {
            return false;
        }
        this.reserveExpressionIndex = -1;
        this.currentExpression = expression;
        this._setExpression(expression);
        return true;
    }
    /**
     * Updates parameters of the core model.
     * @return True if the parameters are actually updated.
     */
    update(model, now) {
        if (!this.isFinished()) {
            return this.updateParameters(model, now);
        }
        return false;
    }
    /**
     * Destroys the instance.
     * @emits {@link ExpressionManagerEvents.destroy}
     */
    destroy() {
        this.destroyed = true;
        this.emit("destroy");
        const self = this;
        self.definitions = undefined;
        self.expressions = undefined;
    }
}
exports.ExpressionManager = ExpressionManager;
//# sourceMappingURL=ExpressionManager.js.map