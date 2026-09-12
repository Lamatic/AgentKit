"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    RENDER_STAGE_ADVANCE_ORDER: null,
    RenderStage: null,
    StagedRenderingController: null,
    SyncIOMode: null,
    getNextStage: null,
    isAdvanceableRenderStage: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RENDER_STAGE_ADVANCE_ORDER: function() {
        return RENDER_STAGE_ADVANCE_ORDER;
    },
    RenderStage: function() {
        return RenderStage;
    },
    StagedRenderingController: function() {
        return StagedRenderingController;
    },
    SyncIOMode: function() {
        return SyncIOMode;
    },
    getNextStage: function() {
        return getNextStage;
    },
    isAdvanceableRenderStage: function() {
        return isAdvanceableRenderStage;
    }
});
const _invarianterror = require("../../shared/lib/invariant-error");
const _promisewithresolvers = require("../../shared/lib/promise-with-resolvers");
var RenderStage = /*#__PURE__*/ function(RenderStage) {
    RenderStage[RenderStage["Before"] = 1] = "Before";
    //
    RenderStage[RenderStage["ShellStatic"] = 11] = "ShellStatic";
    RenderStage[RenderStage["Static"] = 13] = "Static";
    //
    RenderStage[RenderStage["ShellRuntime"] = 21] = "ShellRuntime";
    RenderStage[RenderStage["Runtime"] = 23] = "Runtime";
    //
    RenderStage[RenderStage["Dynamic"] = 30] = "Dynamic";
    //
    RenderStage[RenderStage["Abandoned"] = 40] = "Abandoned";
    return RenderStage;
}({});
const RENDER_STAGE_ADVANCE_ORDER = [
    11,
    13,
    21,
    23,
    30
];
function getNextStage(stage) {
    return RENDER_STAGE_ADVANCE_ORDER[RENDER_STAGE_ADVANCE_ORDER.indexOf(stage) + 1];
}
function isAdvanceableRenderStage(stage) {
    return 1 < stage && stage <= 30;
}
var SyncIOMode = /*#__PURE__*/ function(SyncIOMode) {
    /** Sync IO does not error in any stage. */ SyncIOMode[SyncIOMode["Untracked"] = 1] = "Untracked";
    /** Before `partialPrefetching`: Sync IO errors in static stages, and is allowed otherwise. */ SyncIOMode[SyncIOMode["AllowedInRuntimeOrDynamic"] = 2] = "AllowedInRuntimeOrDynamic";
    /** After `partialPrefetching`: Sync IO errors in all stages other than dynamic. */ SyncIOMode[SyncIOMode["AllowedInDynamic"] = 3] = "AllowedInDynamic";
    return SyncIOMode;
}({});
class StagedRenderingController {
    constructor({ abortSignal, abandonController, syncIO, finalStage }){
        this.currentStage = 1;
        this.syncInterruptReason = null;
        this.triggers = {
            [11]: createStageTrigger(),
            [13]: createStageTrigger(),
            //
            [21]: createStageTrigger(),
            [23]: createStageTrigger(),
            //
            [30]: createStageTrigger()
        };
        this.abortSignal = abortSignal;
        this.abandonController = abandonController;
        this.syncIOMode = syncIO;
        this.finalStage = finalStage;
        if (abortSignal) {
            abortSignal.addEventListener('abort', ()=>{
                // Reject all stage promises that haven't already been resolved.
                // `cancelStageTrigger` is a noop if the trigger already resolved.
                const { reason } = abortSignal;
                for (const trigger of Object.values(this.triggers)){
                    cancelStageTrigger(trigger, reason);
                }
            }, {
                once: true
            });
        }
        if (abandonController) {
            abandonController.signal.addEventListener('abort', ()=>{
                this.abandonRender();
            }, {
                once: true
            });
        }
    }
    onStage(stage, callback) {
        addSyncTriggerListener(this.triggers[stage], callback);
    }
    shouldTrackSyncInterrupt() {
        if (this.syncIOMode === 1) {
            return false;
        }
        switch(this.currentStage){
            case 1:
                // If we haven't started the render yet, it can't be interrupted.
                return false;
            case 11:
            case 13:
                return true;
            case 21:
            case 23:
                {
                    switch(this.syncIOMode){
                        case 2:
                            {
                                // Before `partialPrefetching`: Sync IO only errors in static stages.
                                return false;
                            }
                        case 3:
                            {
                                return true;
                            }
                    }
                // NOT a fallthrough, but eslint doesn't understand that
                }
            case 30:
            case 40:
                return false;
            default:
                this.currentStage;
                return false;
        }
    }
    /** Note: only call this if `shouldTrackSyncInterrupt()` returned true */ syncInterruptCurrentStageWithReason(reason) {
        const { currentStage } = this;
        if (currentStage === 1 || currentStage === 30 || currentStage === 40) {
            // Not interruptible. Defensive noop.
            return;
        }
        // If Sync IO occurs during an abandonable render, we trigger the abandon.
        // The abandon listener will call abandonRender which advances through
        // stages to let caches fill before marking as Abandoned.
        if (this.abandonController) {
            this.abandonController.abort();
            return;
        }
        if (this.abortSignal) {
            // If this is an abortable render, we capture the interruption reason and stop advancing.
            // We don't release any more promises.
            // The caller is expected to abort the signal.
            this.syncInterruptReason = reason;
            this.currentStage = 40;
            return;
        }
        // If we're in a non-abandonable & non-abortable render,
        // we need to advance to the Dynamic stage and capture the interruption reason.
        // (in dev, this will be the restarted render)
        this.syncInterruptReason = reason;
        this.advanceStage(30);
    }
    getSyncInterruptReason() {
        return this.syncInterruptReason;
    }
    getStageEndTime(stage) {
        return this.triggers[getNextStage(stage)].triggeredAt ?? Infinity;
    }
    abandonRender() {
        // In staged rendering, only the initial render is abandonable.
        // We can abandon the initial render if
        //   1. We notice a cache miss, and need to wait for caches to fill
        //   2. A sync IO error occurs, and the render should be interrupted
        //      (this might be a lazy intitialization of a module,
        //       so we still want to restart in this case and see if it still occurs)
        // In either case, we'll be doing another render after this one,
        // so we only want to unblock the next stage, not Dynamic, because
        // unblocking the dynamic stage would likely lead to wasted (uncached) IO.
        const { currentStage } = this;
        if (currentStage === 1) {
            throw Object.defineProperty(new _invarianterror.InvariantError("A render that hasn't started yet cannot be abandoned"), "__NEXT_ERROR_CODE", {
                value: "E1300",
                enumerable: false,
                configurable: true
            });
        }
        if (currentStage === 30 || currentStage === 40) {
            // We shouldn't ever trigger an abandon in these. Defensive noop.
            return;
        }
        // Resolve all stages after the current one, up to runtime (excluding dynamic)
        const nextStageIx = RENDER_STAGE_ADVANCE_ORDER.indexOf(currentStage) + 1;
        const dynamicStageIx = RENDER_STAGE_ADVANCE_ORDER.indexOf(30);
        for(let i = nextStageIx; i < dynamicStageIx; i++){
            this.resolveStage(RENDER_STAGE_ADVANCE_ORDER[i]);
        }
        this.currentStage = 40;
    }
    advanceStage(targetStage) {
        if (this.finalStage !== null && targetStage > this.finalStage) {
            throw Object.defineProperty(new _invarianterror.InvariantError(`Attempted to advance to stage ${RenderStage[targetStage]} but the render is limited to ${RenderStage[this.finalStage]}`), "__NEXT_ERROR_CODE", {
                value: "E1302",
                enumerable: false,
                configurable: true
            });
        }
        const { currentStage } = this;
        if (currentStage === 30 || currentStage === 40) {
            // Terminal stages, nowhere left to advance.
            return;
        }
        // If we're already at the target stage or beyond, do nothing.
        if (targetStage <= currentStage) {
            return;
        }
        this.currentStage = targetStage;
        // Resolve all stages between the current stage and the target.
        const nextStageIx = currentStage === 1 ? 0 : RENDER_STAGE_ADVANCE_ORDER.indexOf(currentStage) + 1;
        const targetStageIx = RENDER_STAGE_ADVANCE_ORDER.indexOf(targetStage);
        for(let i = nextStageIx; i <= targetStageIx; i++){
            this.resolveStage(RENDER_STAGE_ADVANCE_ORDER[i]);
        }
    }
    resolveStage(stage) {
        fireStageTrigger(this.triggers[stage]);
    }
    getStagePromise(stage) {
        return this.triggers[stage].promise;
    }
    waitForStage(stage) {
        return this.getStagePromise(stage);
    }
    delayUntilStage(stage, displayName, resolvedValue) {
        const stagePromise = this.getStagePromise(stage);
        const promise = process.env.NODE_ENV === 'development' ? makeDevtoolsIOPromiseFromIOTrigger(stagePromise, displayName, resolvedValue) : stagePromise.then(()=>resolvedValue);
        // Analogously to `makeDynamicHangingPromise`, we might reject this promise if the signal is invoked.
        // (e.g. in the case where we don't want want the render to proceed to the dynamic stage and abort it).
        // We shouldn't consider this an unhandled rejection, so we attach a noop catch handler here to suppress this warning.
        if (this.abortSignal) {
            promise.catch(ignoreReject);
        }
        return promise;
    }
}
function ignoreReject() {}
// TODO(restart-on-cache-miss): the layering of `delayUntilStage`,
// `makeDevtoolsIOPromiseFromIOTrigger` and and `makeDevtoolsIOAwarePromise`
// is confusing, we should clean it up.
function makeDevtoolsIOPromiseFromIOTrigger(ioTrigger, displayName, resolvedValue) {
    // If we create a `new Promise` and give it a displayName
    // (with no userspace code above us in the stack)
    // React Devtools will use it as the IO cause when determining "suspended by".
    // In particular, it should shadow any inner IO that resolved/rejected the promise
    // (in case of staged rendering, this will be the `setTimeout` that triggers the relevant stage)
    const promise = new Promise((resolve, reject)=>{
        ioTrigger.then(resolve.bind(null, resolvedValue), reject);
    });
    if (displayName !== undefined) {
        // @ts-expect-error
        promise.displayName = displayName;
    }
    return promise;
}
function addSyncTriggerListener(trigger, listener) {
    if (trigger.state === 'pending') {
        trigger._listeners.push(listener);
    } else {
        listener();
    }
}
function createStageTrigger() {
    const { promise, resolve, reject } = (0, _promisewithresolvers.createPromiseWithResolvers)();
    return {
        state: 'pending',
        triggeredAt: null,
        promise,
        _listeners: [],
        _resolvePromise: resolve,
        _rejectPromise: reject
    };
}
function fireStageTrigger(trigger) {
    if (trigger.state !== 'pending') {
        return;
    }
    trigger.state = 'triggered';
    trigger.triggeredAt = performance.now() + performance.timeOrigin;
    try {
        const { _listeners: listeners } = trigger;
        for(let i = 0; i < listeners.length; i++){
            listeners[i]();
        }
        listeners.length = 0;
    } finally{
        trigger._resolvePromise();
    }
}
function cancelStageTrigger(trigger, reason) {
    if (trigger.state !== 'pending') {
        return;
    }
    trigger.state = 'cancelled';
    // we didn't trigger, so don't save `triggeredAt`.
    // We're not gonna fire the listeners, we may as well free them.
    trigger._listeners.length = 0;
    // Suppress unhandled rejection warnings for promises that no one is awaiting.
    trigger.promise.catch(ignoreReject);
    trigger._rejectPromise(reason);
}

//# sourceMappingURL=staged-rendering.js.map