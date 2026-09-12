"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    IntervalsManager: null,
    TimeoutsManager: null,
    intervalsManager: null,
    timeoutsManager: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    IntervalsManager: function() {
        return IntervalsManager;
    },
    TimeoutsManager: function() {
        return TimeoutsManager;
    },
    intervalsManager: function() {
        return intervalsManager;
    },
    timeoutsManager: function() {
        return timeoutsManager;
    }
});
class ResourceManager {
    add(resourceArgs) {
        const resource = this.create(resourceArgs);
        this.resources.add(resource);
        return resource;
    }
    remove(resource) {
        this.untrack(resource);
        this.destroy(resource);
    }
    /**
   * Stop tracking a resource without destroying it. Used when a resource has
   * already been released by other means (e.g. a one-shot timeout that ran to
   * completion) so it should no longer be retained by this manager.
   */ untrack(resource) {
        this.resources.delete(resource);
    }
    removeAll() {
        for (const resource of this.resources){
            this.destroy(resource);
        }
        this.resources.clear();
    }
    /** Number of resources currently tracked. Exposed for observability/tests. */ get size() {
        return this.resources.size;
    }
    constructor(){
        this.resources = new Set();
    }
}
class IntervalsManager extends ResourceManager {
    create(args) {
        // TODO: use the edge runtime provided `setInterval` instead
        return webSetIntervalPolyfill(...args);
    }
    destroy(interval) {
        clearInterval(interval);
    }
}
class TimeoutsManager extends ResourceManager {
    create(args) {
        // TODO: use the edge runtime provided `setTimeout` instead
        const [globalObject, callback, ms, ...rest] = args;
        // A one-shot timeout releases itself from tracking once its callback has
        // run. Otherwise fire-and-forget timeouts (whose ids user code never
        // passes to `clearTimeout`) would accumulate for the lifetime of the
        // module context and leak memory in long-lived server processes.
        // See: https://github.com/vercel/next.js/issues/95094
        let timeoutId;
        const callbackWithRelease = (...callbackArgs)=>{
            try {
                return callback.apply(globalObject, callbackArgs);
            } finally{
                this.untrack(timeoutId);
            }
        };
        timeoutId = webSetTimeoutPolyfill(globalObject, callbackWithRelease, ms, ...rest);
        return timeoutId;
    }
    destroy(timeout) {
        clearTimeout(timeout);
    }
}
function webSetIntervalPolyfill(globalObject, callback, ms, ...args) {
    return setInterval(()=>{
        // node's `setInterval` sets `this` to the `Timeout` instance it returned,
        // but web `setInterval` always sets `this` to `window`
        // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#the_this_problem
        return callback.apply(globalObject, args);
    }, ms)[Symbol.toPrimitive]();
}
function webSetTimeoutPolyfill(globalObject, callback, ms, ...args) {
    const wrappedCallback = ()=>{
        try {
            // node's `setTimeout` sets `this` to the `Timeout` instance it returned,
            // but web `setTimeout` always sets `this` to `window`
            // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#the_this_problem
            return callback.apply(globalObject, args);
        } finally{
            // On certain older node versions (<20.16.0, <22.4.0),
            // a `setTimeout` whose Timeout was converted to a primitive will leak.
            // See: https://github.com/nodejs/node/issues/53335
            // We can work around this by explicitly calling `clearTimeout` after the callback runs.
            clearTimeout(timeout);
        }
    };
    const timeout = setTimeout(wrappedCallback, ms);
    return timeout[Symbol.toPrimitive]();
}
const intervalsManager = new IntervalsManager();
const timeoutsManager = new TimeoutsManager();

//# sourceMappingURL=resource-managers.js.map