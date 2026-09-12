import type { RenderOpts, PreloadCallbacks } from './types';
import type { ActionResult, DynamicParamTypesShort, DynamicSegmentTuple, FlightRouterState, CacheNodeSeedData } from '../../shared/lib/app-router-types';
import { type WorkStore } from '../app-render/work-async-storage.external';
import type { RequestStore } from '../app-render/work-unit-async-storage.external';
import type { NextParsedUrlQuery } from '../request-meta';
import type { LoaderTree } from '../lib/app-dir-module';
import type { AppPageModule } from '../route-modules/app-page/module';
import type { BaseNextRequest, BaseNextResponse } from '../base-http';
import RenderResult, { type AppPageRenderResultMetadata } from '../render-result';
import type { AnyStream } from './stream-ops';
import { type DevValidationWorkerMessage } from './dev-validation-worker-globals';
import { type ImplicitTags } from '../lib/implicit-tags';
import { parseRelativeUrl } from '../../shared/lib/router/utils/parse-relative-url';
import type { ServerComponentsHmrCache } from '../response-cache';
import { type OpaqueFallbackRouteParams } from '../request/fallback-params';
import type { Params } from '../request/params';
import type { StageEndTimes } from './instant-validation/instant-validation';
export type GetDynamicParamFromSegment = (loaderTree: LoaderTree) => DynamicParam | null;
export type DynamicParam = {
    param: string;
    value: string | string[] | null;
    treeSegment: DynamicSegmentTuple;
    type: DynamicParamTypesShort;
};
export type GenerateFlight = typeof generateDynamicFlightRenderResult;
export type AppSharedContext = {
    buildId: string;
    deploymentId: string;
    clientAssetToken: string;
};
export type AppRenderContext = {
    sharedContext: AppSharedContext;
    workStore: WorkStore;
    url: ReturnType<typeof parseRelativeUrl>;
    componentMod: AppPageModule;
    renderOpts: RenderOpts;
    parsedRequestHeaders: ParsedRequestHeaders;
    getDynamicParamFromSegment: GetDynamicParamFromSegment;
    interpolatedParams: Params;
    /**
     * The request's fallback route params (the same ones
     * `getDynamicParamFromSegment` closes over). Kept on the context so the dev
     * validation worker can rebuild an identical `getDynamicParamFromSegment`;
     * the depth-loop segment keys are derived from it, so it must match what
     * produced the seed render's Flight, not the separate fallback set validation
     * uses to mark params unknown in its stores.
     */
    fallbackRouteParams: OpaqueFallbackRouteParams | null;
    query: NextParsedUrlQuery;
    isPrefetch: boolean;
    isPossibleServerAction: boolean;
    requestTimestamp: number;
    appUsingSizeAdjustment: boolean;
    flightRouterState?: FlightRouterState;
    requestId: string;
    htmlRequestId: string;
    pagePath: string;
    assetPrefix: string;
    isNotFoundPath: boolean;
    nonce: string | undefined;
    res: BaseNextResponse;
    /**
     * For now, the implicit tags are common for the whole route. If we ever start
     * rendering/revalidating segments independently, they need to move to the
     * work unit store.
     */
    implicitTags: ImplicitTags;
};
interface ParsedRequestHeaders {
    /**
     * Router state provided from the client-side router. Used to handle rendering
     * from the common layout down. This value will be undefined if the request is
     * not a client-side navigation request, or if the request is a prefetch
     * request.
     */
    readonly flightRouterState: FlightRouterState | undefined;
    readonly isPrefetchRequest: boolean;
    readonly isRuntimePrefetchRequest: boolean;
    /**
     * App Shell prefetch: a runtime prefetch that the server renders with
     * params omitted (any `await params` hangs forever). Produces the
     * param-independent shell of the route. Implies isRuntimePrefetchRequest.
     */
    readonly isAppShellPrefetchRequest: boolean;
    readonly isRouteTreePrefetchRequest: boolean;
    readonly isHmrRefresh: boolean;
    readonly isRSCRequest: boolean;
    readonly nonce: string | undefined;
    readonly previouslyRevalidatedTags: string[];
    readonly requestId: string | undefined;
    readonly htmlRequestId: string | undefined;
}
/**
 * Produces a RenderResult containing the Flight data for the given request. See
 * `generateDynamicRSCPayload` for information on the contents of the render result.
 */
declare function generateDynamicFlightRenderResult(req: BaseNextRequest, ctx: AppRenderContext, requestStore: RequestStore, options?: {
    actionResult: ActionResult;
    skipPageRendering: boolean;
    componentTree?: CacheNodeSeedData;
    preloadCallbacks?: PreloadCallbacks;
    temporaryReferences?: WeakMap<any, string>;
    waitUntil?: Promise<unknown>;
}): Promise<RenderResult>;
export type BinaryStreamOf<T> = AnyStream;
export type AppPageRender = (req: BaseNextRequest, res: BaseNextResponse, pagePath: string, query: NextParsedUrlQuery, fallbackRouteParams: OpaqueFallbackRouteParams | null, renderOpts: RenderOpts, serverComponentsHmrCache: ServerComponentsHmrCache | undefined, sharedContext: AppSharedContext) => Promise<RenderResult<AppPageRenderResultMetadata>>;
export declare const renderToHTMLOrFlight: AppPageRender;
/**
 * A staged dev render interrupted by sync IO. It has no artifacts that could be
 * used as validation inputs, only the reason it was interrupted.
 */
interface SyncInterruptedStagedDevRender {
    readonly syncInterruptReason: Error;
}
/**
 * The chunks and per-stage timings a staged dev render accumulates once its
 * stream finishes. A render only produces them when it runs to the end without
 * a sync-IO interrupt, so they back both a render's uninterrupted outcome and
 * the validation inputs.
 */
interface StagedDevRenderArtifacts {
    readonly accumulatedChunks: AccumulatedStreamChunks;
    readonly startTime: number;
    readonly stageEndTimes: StageEndTimes;
}
/**
 * What `runValidationInDev` consumes: an uninterrupted render's artifacts plus
 * the request store and the debug channel. Carries no `syncInterruptReason`:
 * the resolution step has already surfaced and bailed on any sync interrupt.
 */
export interface ResolvedValidationInputs extends StagedDevRenderArtifacts {
    readonly requestStore: RequestStore;
    readonly debugChannelClient: AnyStream | undefined;
}
/**
 * The inputs produced for validation, before resolution: either an
 * uninterrupted render's artifacts (`ResolvedValidationInputs`) or, for a
 * render interrupted by sync IO, only the interrupt reason. An interrupted
 * render is never validated, so it carries nothing else: its debug channel is
 * dropped at construction. Discriminate with `'syncInterruptReason' in x`; the
 * resolution step surfaces and bails on the interrupted case, so the depth loop
 * only ever sees `ResolvedValidationInputs`.
 */
export type DevValidationInputs = ResolvedValidationInputs | SyncInterruptedStagedDevRender;
export declare enum PrefetchingMode {
    LegacySpeculative = 1,
    Partial = 2
}
interface AccumulatedStreamChunks {
    readonly shellStaticChunks: Array<Uint8Array>;
    readonly staticChunks: Array<Uint8Array>;
    readonly shellRuntimeChunks: Array<Uint8Array>;
    readonly runtimeChunks: Array<Uint8Array>;
    readonly dynamicChunks: Array<Uint8Array>;
}
/**
 * The slice of the render context the dev/build validation passes read. Both
 * the in-process callers and the validation worker build one of these, so it
 * names exactly what validation depends on and nothing else: no live
 * request/response objects that can't be rebuilt off the main thread.
 * `isDebugChannelEnabled` is the derived flag validation uses in place of the
 * main render's `setReactDebugChannel` callback (validation only ever read that
 * callback's presence as a boolean).
 */
export type ValidationRenderContext = Pick<AppRenderContext, 'componentMod' | 'getDynamicParamFromSegment' | 'query' | 'implicitTags' | 'nonce' | 'workStore'> & {
    renderOpts: Pick<RenderOpts, 'images' | 'allowEmptyStaticShell'>;
    isDebugChannelEnabled: boolean;
};
/**
 * Projects a full app render context down to the slice validation reads. The
 * in-process dev and build callers hold an `AppRenderContext` and use this to
 * hand validation exactly what it needs; the worker builds the same shape from
 * its snapshot instead.
 */
export declare function toValidationRenderContext(ctx: AppRenderContext): ValidationRenderContext;
/**
 * Worker entry point for Cached Components dev validation, reached from the
 * validation worker via `ComponentMod.routeModule.runValidationInDev`. The
 * worker reloads the route's compiled module and calls this so the entire
 * validation (Flight re-encodes and the client prerenders) runs inside the
 * app-page bundle's single React instance, alongside the user's client
 * components. It rebuilds the render context, work store, and request store
 * from the transported snapshot (the live objects can't cross a thread) and
 * returns the validation errors for the worker to serialize and the main thread
 * to deliver.
 */
export declare function runValidationInDevFromSnapshot(message: DevValidationWorkerMessage, componentMod: AppPageModule, abortSignal: AbortSignal): Promise<Array<unknown> | undefined>;
export {};
