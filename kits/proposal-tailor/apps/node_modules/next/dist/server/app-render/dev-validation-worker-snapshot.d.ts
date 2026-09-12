import type { AppRenderContext, ResolvedValidationInputs } from './app-render';
import type { PrefetchingMode } from './app-render';
import type { OpaqueFallbackRouteParams } from '../request/fallback-params';
import type { DevValidationSnapshot } from './dev-validation-worker-globals';
/**
 * Builds the serializable snapshot the dev validation worker needs to rebuild
 * the render context and inputs and run `runValidationInDev` on the worker
 * thread. Reads only serializable data from the settled render; the live
 * objects (`componentMod`, the async-storage stores,
 * `getDynamicParamFromSegment`) are reconstructed on the worker from this seed.
 * Draining the debug channels is async, so this returns a promise.
 */
export declare function buildDevValidationSnapshot(ctx: AppRenderContext, instantInputs: ResolvedValidationInputs | null, staticInputs: ResolvedValidationInputs, prefetchMode: PrefetchingMode, fallbackRouteParams: OpaqueFallbackRouteParams | null, devRenderDidError: boolean): Promise<DevValidationSnapshot>;
