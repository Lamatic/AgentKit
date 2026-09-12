/**
 * Fires a callback after a delay unless it's cancelled or flushed first.
 *
 * `schedule()` replaces any still-pending emit.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DeferredEmit", {
    enumerable: true,
    get: function() {
        return DeferredEmit;
    }
});
class DeferredEmit {
    #timer;
    #fn;
    /**
   * Arm `fn` to run after `delayMs`, replacing any still-pending emit.
   *
   * @param delayMs The delay in milliseconds before the callback is fired.
   * @param fn The callback function to be executed after the delay.
   */ schedule(delayMs, scheduledFn) {
        this.cancel();
        this.#fn = scheduledFn;
        this.#timer = setTimeout(()=>{
            this.#timer = undefined;
            const fn = this.#fn;
            this.#fn = undefined;
            fn?.();
        }, delayMs);
    }
    /**
   * If an emit is pending, run it now instead of waiting for the delay.
   */ flush() {
        if (this.#timer === undefined) {
            return;
        }
        clearTimeout(this.#timer);
        this.#timer = undefined;
        const fn = this.#fn;
        this.#fn = undefined;
        fn?.();
    }
    /**
   * Cancel a pending emit without running it.
   */ cancel() {
        if (this.#timer === undefined) {
            return;
        }
        clearTimeout(this.#timer);
        this.#timer = undefined;
        this.#fn = undefined;
    }
    get isPending() {
        return this.#timer !== undefined;
    }
}

//# sourceMappingURL=deferred-emit.js.map