import { RenderStage, type AdvanceableRenderStage } from './app-render/staged-rendering';
import type { RequestStore, WorkUnitStore } from './app-render/work-unit-async-storage.external';
export declare function isHangingPromiseRejectionError(err: unknown): err is HangingPromiseRejectionError;
declare class HangingPromiseRejectionError extends Error {
    readonly route: string;
    readonly expression: string;
    readonly digest = "HANGING_PROMISE_REJECTION";
    constructor(route: string, expression: string);
}
export declare class ClientHookDynamicError extends Error {
    readonly digest = "CLIENT_HOOK_DYNAMIC";
    constructor(route: string, expression: string);
}
export declare function isClientHookDynamicError(err: unknown): err is ClientHookDynamicError;
export declare function makeUntrackedHangingPromise<T>(signal: AbortSignal, route: string, expression: string): Promise<T>;
/**
 * Records on a static prerender store that the render accessed a data source
 * which would have resolved during a runtime prerender. No-op for all other
 * store types.
 *
 * `makeRuntimeHangingPromise` and `makeStageHangingPromise` call this
 * automatically; call it directly only where the access is observed
 * separately from the promise's creation (see the null `workUnitStore` case
 * of `makeRuntimeHangingPromise`), or where the prerender is aborted
 * synchronously instead of hanging.
 *
 * For fallback-param data, use `trackFallbackParamsAccessed` instead. When
 * unsure, this is the conservative choice: it unconditionally clears the
 * static-prefetch hint.
 */
export declare function trackRuntimeDataAccessed(workUnitStore: WorkUnitStore): void;
/**
 * Fallback-param variant of `trackRuntimeDataAccessed`, for accesses of
 * fallback route params and values derived solely from them. It records the
 * response-level flag all the same, but only clears the build-time
 * static-prefetch hint when the route is not fallback-upgradeable — on an
 * upgradeable route the access is transient, since ISR later produces a
 * concrete prerender that resolves it.
 */
export declare function trackFallbackParamsAccessed(workUnitStore: WorkUnitStore): void;
export declare function makeClientHookHangingPromise<T>(signal: AbortSignal, error: ClientHookDynamicError): Promise<T>;
/**
 * Creates a promise that will be triggered when another promise resolves.
 * It will not emit unhandled rejections, which is important if the trigger
 * is a promise that might itself get rejected (e.g. when a prerender/render
 * are aborted due to sync IO)
 */
export declare function makePromiseFromTrigger<T>(trigger: Promise<any>, value: T): Promise<T>;
export declare function makeDevtoolsIOAwarePromise<T>(underlying: T, requestStore: RequestStore, stage: AdvanceableRenderStage): Promise<T>;
export declare const RENDER_STAGES_BY_DATA_KIND: {
    sessionData: RenderStage.ShellRuntime;
    staticLinkData: RenderStage.Static;
    runtimeLinkData: RenderStage.Runtime;
};
export declare function applyOwnerStack(error: Error): Error;
export {};
