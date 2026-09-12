declare abstract class ResourceManager<T, Args> {
    private resources;
    abstract create(resourceArgs: Args): T;
    abstract destroy(resource: T): void;
    add(resourceArgs: Args): T;
    remove(resource: T): void;
    /**
     * Stop tracking a resource without destroying it. Used when a resource has
     * already been released by other means (e.g. a one-shot timeout that ran to
     * completion) so it should no longer be retained by this manager.
     */
    protected untrack(resource: T): void;
    removeAll(): void;
    /** Number of resources currently tracked. Exposed for observability/tests. */
    get size(): number;
}
export declare class IntervalsManager extends ResourceManager<number, Parameters<typeof webSetIntervalPolyfill>> {
    create(args: Parameters<typeof webSetIntervalPolyfill>): number;
    destroy(interval: number): void;
}
export declare class TimeoutsManager extends ResourceManager<number, Parameters<typeof webSetTimeoutPolyfill>> {
    create(args: Parameters<typeof webSetTimeoutPolyfill>): number;
    destroy(timeout: number): void;
}
export type GlobalObject = import('edge-runtime').EdgeRuntime['context'];
declare function webSetIntervalPolyfill<TArgs extends any[]>(globalObject: GlobalObject, callback: (...args: TArgs) => void, ms?: number, ...args: TArgs): number;
declare function webSetTimeoutPolyfill<TArgs extends any[]>(globalObject: GlobalObject, callback: (...args: TArgs) => void, ms?: number, ...args: TArgs): number;
export declare const intervalsManager: IntervalsManager;
export declare const timeoutsManager: TimeoutsManager;
export {};
