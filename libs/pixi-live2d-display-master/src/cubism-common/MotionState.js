"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionState = exports.MotionPriority = void 0;
const utils_1 = require("@/utils");
const config_1 = require("../config");
/**
 * Indicates the motion priority.
 */
var MotionPriority;
(function (MotionPriority) {
    /** States that the model is currently not playing any motion. This priority cannot be applied to a motion. */
    MotionPriority[MotionPriority["NONE"] = 0] = "NONE";
    /** Low priority, used when starting idle motions automatically. */
    MotionPriority[MotionPriority["IDLE"] = 1] = "IDLE";
    /** Medium priority. */
    MotionPriority[MotionPriority["NORMAL"] = 2] = "NORMAL";
    /** High priority. Motions as this priority will always be played regardless of the current priority. */
    MotionPriority[MotionPriority["FORCE"] = 3] = "FORCE";
})(MotionPriority || (exports.MotionPriority = MotionPriority = {}));
/**
 * Handles the state of a MotionManager.
 */
class MotionState {
    constructor() {
        /**
         * When enabled, the states will be dumped to the logger when an exception occurs.
         */
        this.debug = false;
        /**
         * Priority of the current motion. Will be `MotionPriority.NONE` if there's no playing motion.
         */
        this.currentPriority = MotionPriority.NONE;
        /**
         * Priority of the reserved motion, which is still in loading and will be played once loaded.
         * Will be `MotionPriority.NONE` if there's no reserved motion.
         */
        this.reservePriority = MotionPriority.NONE;
    }
    /**
     * Reserves the playback for a motion.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @return True if the reserving has succeeded.
     */
    reserve(group, index, priority) {
        if (priority <= MotionPriority.NONE) {
            utils_1.logger.log(this.tag, `Cannot start a motion with MotionPriority.NONE.`);
            return false;
        }
        if (group === this.currentGroup && index === this.currentIndex) {
            utils_1.logger.log(this.tag, `Motion is already playing.`, this.dump(group, index));
            return false;
        }
        if ((group === this.reservedGroup && index === this.reservedIndex) ||
            (group === this.reservedIdleGroup && index === this.reservedIdleIndex)) {
            utils_1.logger.log(this.tag, `Motion is already reserved.`, this.dump(group, index));
            return false;
        }
        if (priority === MotionPriority.IDLE) {
            if (this.currentPriority !== MotionPriority.NONE) {
                utils_1.logger.log(this.tag, `Cannot start idle motion because another motion is playing.`, this.dump(group, index));
                return false;
            }
            if (this.reservedIdleGroup !== undefined) {
                utils_1.logger.log(this.tag, `Cannot start idle motion because another idle motion has reserved.`, this.dump(group, index));
                return false;
            }
            this.setReservedIdle(group, index);
        }
        else {
            if (priority < MotionPriority.FORCE) {
                if (priority <= this.currentPriority) {
                    utils_1.logger.log(this.tag, "Cannot start motion because another motion is playing as an equivalent or higher priority.", this.dump(group, index));
                    return false;
                }
                if (priority <= this.reservePriority) {
                    utils_1.logger.log(this.tag, "Cannot start motion because another motion has reserved as an equivalent or higher priority.", this.dump(group, index));
                    return false;
                }
            }
            this.setReserved(group, index, priority);
        }
        return true;
    }
    /**
     * Requests the playback for a motion.
     * @param motion - The Motion, can be undefined.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @return True if the request has been approved, i.e. the motion is allowed to play.
     */
    start(motion, group, index, priority) {
        if (priority === MotionPriority.IDLE) {
            this.setReservedIdle(undefined, undefined);
            if (this.currentPriority !== MotionPriority.NONE) {
                utils_1.logger.log(this.tag, "Cannot start idle motion because another motion is playing.", this.dump(group, index));
                return false;
            }
        }
        else {
            if (group !== this.reservedGroup || index !== this.reservedIndex) {
                utils_1.logger.log(this.tag, "Cannot start motion because another motion has taken the place.", this.dump(group, index));
                return false;
            }
            this.setReserved(undefined, undefined, MotionPriority.NONE);
        }
        if (!motion) {
            return false;
        }
        this.setCurrent(group, index, priority);
        return true;
    }
    /**
     * Notifies the motion playback has finished.
     */
    complete() {
        this.setCurrent(undefined, undefined, MotionPriority.NONE);
    }
    /**
     * Sets the current motion.
     */
    setCurrent(group, index, priority) {
        this.currentPriority = priority;
        this.currentGroup = group;
        this.currentIndex = index;
    }
    /**
     * Sets the reserved motion.
     */
    setReserved(group, index, priority) {
        this.reservePriority = priority;
        this.reservedGroup = group;
        this.reservedIndex = index;
    }
    /**
     * Sets the reserved idle motion.
     */
    setReservedIdle(group, index) {
        this.reservedIdleGroup = group;
        this.reservedIdleIndex = index;
    }
    /**
     * Checks if a Motion is currently playing or has reserved.
     * @return True if active.
     */
    isActive(group, index) {
        return ((group === this.currentGroup && index === this.currentIndex) ||
            (group === this.reservedGroup && index === this.reservedIndex) ||
            (group === this.reservedIdleGroup && index === this.reservedIdleIndex));
    }
    /**
     * Resets the state.
     */
    reset() {
        this.setCurrent(undefined, undefined, MotionPriority.NONE);
        // make sure the reserved motions (if existing) won't start when they are loaded
        this.setReserved(undefined, undefined, MotionPriority.NONE);
        this.setReservedIdle(undefined, undefined);
    }
    /**
     * Checks if an idle motion should be requests to play.
     */
    shouldRequestIdleMotion() {
        return this.currentGroup === undefined && this.reservedIdleGroup === undefined;
    }
    /**
     * Checks if the model's expression should be overridden by the motion.
     */
    shouldOverrideExpression() {
        return !config_1.config.preserveExpressionOnMotion && this.currentPriority > MotionPriority.IDLE;
    }
    /**
     * Dumps the state for debugging.
     */
    dump(requestedGroup, requestedIndex) {
        if (this.debug) {
            const keys = [
                "currentPriority",
                "reservePriority",
                "currentGroup",
                "currentIndex",
                "reservedGroup",
                "reservedIndex",
                "reservedIdleGroup",
                "reservedIdleIndex",
            ];
            return (`\n<Requested> group = "${requestedGroup}", index = ${requestedIndex}\n` +
                keys.map((key) => "[" + key + "] " + this[key]).join("\n"));
        }
        return "";
    }
}
exports.MotionState = MotionState;
//# sourceMappingURL=MotionState.js.map