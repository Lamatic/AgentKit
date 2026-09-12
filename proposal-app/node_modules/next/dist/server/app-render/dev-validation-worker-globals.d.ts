import type { Params } from '../request/params';
import type { OpaqueFallbackRouteParams } from '../request/fallback-params';
import type { NextParsedUrlQuery } from '../request-meta';
import type { PrefetchingMode } from './app-render';
import type { NextConfigComplete, ValidationLevel } from '../config-shared';
import type { ImageConfigComplete } from '../../shared/lib/image-config';
import type { StageEndTimes } from './instant-validation/instant-validation';
/**
 * Per-stage RSC chunks, the serializable form of `AccumulatedStreamChunks` that
 * the worker replays. No live streams cross the boundary.
 */
export interface SerializedAccumulatedChunks {
    shellStaticChunks: Uint8Array[];
    staticChunks: Uint8Array[];
    shellRuntimeChunks: Uint8Array[];
    runtimeChunks: Uint8Array[];
    dynamicChunks: Uint8Array[];
}
/**
 * Serializable view of one validation input (the shape `DevValidationInputs`
 * carries), with the live streams already drained to chunks. The stage-end
 * timings are replayed into the per-depth Flight re-encodes so the worker
 * reconstructs the same partial-stage boundaries the main render observed.
 */
export interface SerializedValidationInputs {
    accumulatedChunks: SerializedAccumulatedChunks;
    debugChunks: Uint8Array[] | null;
    startTime: number;
    stageEndTimes: StageEndTimes;
}
/**
 * Serializable view of the request, rebuilt into a `RequestStore` on the worker
 * so `cookies()` / `headers()` / `draftMode()` behave as in the real render.
 */
export interface DevValidationRequestSnapshot {
    headers: [string, string][];
    urlPathname: string;
    urlSearch: string;
    rootParams: Params;
    isDraftMode: boolean;
    isHmrRefresh: boolean;
    hmrRefreshHash: string | undefined;
    requestStartTime: number;
}
/**
 * Everything the worker needs to rebuild the render context and inputs and run
 * `runValidationInDev`. Built on the main thread from the settled render; the
 * pool augments it with install-time fields (`distDir`, `buildId`, …).
 */
export interface DevValidationSnapshot {
    page: string;
    route: string;
    requestId: string;
    responseFinished: boolean;
    prefetchMode: PrefetchingMode;
    devRenderDidError: boolean;
    nonce: string | undefined;
    query: NextParsedUrlQuery;
    request: DevValidationRequestSnapshot;
    interpolatedParams: Params;
    requestFallbackRouteParams: OpaqueFallbackRouteParams | null;
    fallbackRouteParams: OpaqueFallbackRouteParams | null;
    optimisticRouting: boolean;
    forceStatic: boolean | undefined;
    validationLevel: ValidationLevel;
    implicitTags: string[];
    /**
     * Pages whose client reference manifests supplied client references to the
     * render being validated, beyond the validated route's own manifest (see
     * `WorkStore.additionalClientReferenceManifestPages`). The worker registers
     * these so the same references resolve in its thread. Empty for all but the
     * rare renders that React's I/O tracking carries a reference into.
     */
    additionalClientReferenceManifestPages: string[];
    isDebugChannelEnabled: boolean;
    renderOpts: {
        images: ImageConfigComplete;
        allowEmptyStaticShell: boolean | undefined;
    };
    instantInputs: SerializedValidationInputs | null;
    staticInputs: SerializedValidationInputs;
}
/**
 * Install-time fields the dev server's worker pool augments the snapshot with
 * so the worker can reload the route (`distDir`; `page` comes from the
 * snapshot) and rebuild the work store (`buildId`, `deploymentId`, the config
 * slice).
 */
export interface DevValidationInstallFields {
    distDir: string;
    buildId: string;
    deploymentId: string;
    nextConfigSerializable: {
        httpAgentOptions: NextConfigComplete['httpAgentOptions'];
        cacheLifeProfiles: NextConfigComplete['cacheLife'];
        useCacheTimeout: number;
        staticPageGenerationTimeout: number;
    };
}
/**
 * The full message the worker receives and forwards into the in-bundle entry:
 * the main-thread snapshot plus the pool's install-time fields.
 */
export type DevValidationWorkerMessage = DevValidationSnapshot & DevValidationInstallFields;
/**
 * The RSC-encoded `{ errors, errorCodes }` Flight chunks for the dev overlay,
 * or null when validation produced no errors or was aborted. The worker also
 * logs the errors to its own stderr (piped to the parent) with code frames.
 */
export type DevValidationWorkerResult = Uint8Array[] | null;
/**
 * Worker hook installed by the dev server. Given the render snapshot and the
 * validation abort signal, runs validation on a worker thread and resolves to
 * the validation error Flight chunks to deliver on the main thread. On an abort
 * the pool relays the aborted signal to the worker thread through a shared
 * flag, so the in-flight run aborts mid-run; validation always runs as a thread
 * (never a child process), which is what makes that cross-thread abort
 * possible.
 */
export type DevValidationWorker = (snapshot: DevValidationSnapshot, validationAbortSignal: AbortSignal) => Promise<DevValidationWorkerResult>;
export declare function setDevValidationWorker(fn: DevValidationWorker | undefined): void;
export declare function getDevValidationWorker(): DevValidationWorker | undefined;
