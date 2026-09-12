import type { DevValidationWorkerMessage, DevValidationWorkerResult } from '../app-render/dev-validation-worker-globals';
import type { NodeJsPartialHmrUpdate } from '../../build/swc/types';
import '../require-hook';
import '../node-environment';
/**
 * What this thread did with a forwarded HMR update.
 *
 * `no-runtime` is not a failure: no runtime the update routes to had been
 * loaded here, so there was nothing to patch, and whatever loads that route
 * later reads the updated chunk from disk.
 */
export type HmrApplyOutcome = 'applied' | 'no-runtime' | 'failed';
/**
 * Applies a server HMR update to this thread's module registry, mirroring the
 * apply the dev server performed on its own.
 *
 * Turbopack's Node.js runtime registers the apply machinery per isolate (see
 * `dev-nodejs.ts`), and `loadComponents` evaluates that runtime here, so this
 * thread patches the same modules the dev server does. The apply also leaves
 * the updated module's inline source map in this thread's Node.js cache, which
 * is what makes a stack frame in that module source-mappable here.
 */
export declare function applyHmrUpdate(update: NodeJsPartialHmrUpdate): Promise<HmrApplyOutcome>;
/**
 * Clears the same caches the dev server cleared, for the same paths.
 *
 * `evictModules` follows the dev server's own split: an applied update patches
 * modules in place and clears only the manifest cache for the updated chunks,
 * while a recompile evicts `require.cache` as well. This thread follows both,
 * so its module state stays the dev server's module state.
 */
export declare function invalidateCaches(filePaths: string[], evictModules: boolean): Promise<void>;
/**
 * Runs the dev instant/static-shell validation passes off the main thread.
 * Reloads the route's compiled module, then delegates the whole validation to
 * that module via `ComponentMod.routeModule.runValidationInDev`, so every
 * render (flight re-encodes and client prerenders) runs inside the app-page
 * bundle's single React instance. Logs any returned errors to the worker's
 * stderr with source-mapped code frames, then encodes them as RSC Flight bytes
 * for the main thread to forward to the dev overlay. Returns `null` when
 * validation was superseded or produced no errors.
 */
export declare function runDevValidation(message: DevValidationWorkerMessage, abortBuffer: SharedArrayBuffer): Promise<DevValidationWorkerResult>;
