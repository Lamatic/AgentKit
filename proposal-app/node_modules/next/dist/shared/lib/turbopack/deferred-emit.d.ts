/**
 * Fires a callback after a delay unless it's cancelled or flushed first.
 *
 * `schedule()` replaces any still-pending emit.
 */
export declare class DeferredEmit {
    #private;
    /**
     * Arm `fn` to run after `delayMs`, replacing any still-pending emit.
     *
     * @param delayMs The delay in milliseconds before the callback is fired.
     * @param fn The callback function to be executed after the delay.
     */
    schedule(delayMs: number, scheduledFn: () => void): void;
    /**
     * If an emit is pending, run it now instead of waiting for the delay.
     */
    flush(): void;
    /**
     * Cancel a pending emit without running it.
     */
    cancel(): void;
    get isPending(): boolean;
}
