import type { FlightRouterState, InitialRSCPayload, NavigationFlightResponse } from '../../../shared/lib/app-router-types';
import { type NEXT_ROUTER_PREFETCH_HEADER, type NEXT_ROUTER_SEGMENT_PREFETCH_HEADER, NEXT_ROUTER_STATE_TREE_HEADER, NEXT_URL, RSC_HEADER, NEXT_HMR_REFRESH_HEADER, NEXT_HTML_REQUEST_ID_HEADER, NEXT_REQUEST_ID_HEADER } from '../app-router-headers';
import { type NormalizedFlightData } from '../../flight-data-helpers';
import type { NormalizedSearch } from '../segment-cache/cache-key';
export interface FetchServerResponseOptions {
    readonly flightRouterState: FlightRouterState;
    readonly nextUrl: string | null;
    readonly isHmrRefresh?: boolean;
    readonly signal?: AbortSignal;
}
export type StaticStageData<T extends NavigationFlightResponse | InitialRSCPayload = NavigationFlightResponse> = {
    readonly response: T;
    readonly isResponsePartial: boolean;
};
type SpaFetchServerResponseResult = {
    flightData: NormalizedFlightData[];
    canonicalUrl: URL;
    renderedSearch: NormalizedSearch;
    couldBeIntercepted: boolean;
    supportsPerSegmentPrefetching: boolean;
    postponed: boolean;
    dynamicStaleTime: number;
    staticStageData: StaticStageData | null;
    runtimePrefetchStream: ReadableStream<Uint8Array> | null;
    responseHeaders: Headers;
    debugInfo: Array<any> | null;
    /**
     * Dev only: resolves once the server has flushed the shell-stage content to
     * the stream (or earlier, on a cache miss). The navigation defers revealing
     * the response (resolving its deferred RSCs) until this settles, so React
     * doesn't render a boundary's children before their row has been decoded and
     * commit a premature Suspense fallback. `null` outside the streaming dev
     * render.
     */
    revealAfter: Promise<void> | null;
};
type MpaFetchServerResponseResult = string;
export type FetchServerResponseResult = MpaFetchServerResponseResult | SpaFetchServerResponseResult;
export type RequestHeaders = {
    [RSC_HEADER]?: '1';
    [NEXT_ROUTER_STATE_TREE_HEADER]?: string;
    [NEXT_URL]?: string;
    [NEXT_ROUTER_PREFETCH_HEADER]?: '1' | '2' | '3';
    [NEXT_ROUTER_SEGMENT_PREFETCH_HEADER]?: string;
    'x-deployment-id'?: string;
    [NEXT_HMR_REFRESH_HEADER]?: '1';
    'Next-Test-Fetch-Priority'?: RequestInit['priority'];
    [NEXT_HTML_REQUEST_ID_HEADER]?: string;
    [NEXT_REQUEST_ID_HEADER]?: string;
};
/**
 * Fetch the flight data for the provided url. Takes in the current router state
 * to decide what to render server-side.
 */
export declare function fetchServerResponse(url: URL, options: FetchServerResponseOptions): Promise<FetchServerResponseResult>;
export type RSCResponse<T> = {
    ok: boolean;
    redirected: boolean;
    headers: Headers;
    body: ReadableStream<Uint8Array> | null;
    status: number;
    url: string;
    flightResponsePromise: (Promise<T> & {
        _debugInfo?: Array<any>;
    }) | null;
    cacheData: Promise<FetchResponseCacheData | null>;
};
type FetchResponseCacheData = {
    isResponsePartial: boolean;
    staticBodyClone?: ReadableStream<Uint8Array>;
    shellBodyClone?: ReadableStream<Uint8Array>;
};
/**
 * Strips the leading isPartial byte from an RSC navigation response and
 * clones the body for segment cache extraction.
 *
 * When cache components is enabled, the server prepends a single byte:
 * '~' (0x7e) for partial, '#' (0x23) for complete. This must be stripped
 * before Flight decoding because it's not valid RSC data. The body is
 * cloned before Flight can consume it so the clone is available for later use.
 *
 * When cache components is disabled, returns the original response with
 * cacheData: null.
 */
export declare function processFetch(response: Response): Promise<{
    response: Response;
    cacheData: FetchResponseCacheData | null;
}>;
/**
 * Resolves the static stage response from the raw `processFetch` outputs and
 * the decoded flight response, for writing into the segment cache.
 *
 * - Fully static: use the decoded flight response as-is, no truncation needed.
 * - Not fully static + `l` field: truncate the body clone at the static stage
 *   byte boundary and decode.
 * - Otherwise: no cache-worthy data.
 */
export declare function resolveStaticStageData<T extends NavigationFlightResponse | InitialRSCPayload>(cacheData: FetchResponseCacheData, flightResponse: T, headers: RequestHeaders | undefined): Promise<StaticStageData<T> | null>;
/**
 * Resolves the shell stage of a prerender response, performing a separate
 * Flight decode of the byte prefix when the shell differs from the main
 * response. Returns null when no separate decode is needed:
 *
 * - `a === undefined`: server didn't emit shell stage info.
 * - `a` resolves to `null`: the shell IS the main response — the caller can
 *   reuse the existing decoded `flightResponse` if it needs a shell payload.
 *
 * Returns the decoded shell payload when `a` resolves to a number, i.e.
 * the shell is a strict prefix of the response and requires a separate
 * decode at that byte boundary.
 */
export declare function resolveShellStageData<T extends NavigationFlightResponse | InitialRSCPayload>(cacheData: FetchResponseCacheData, flightResponse: T, headers: RequestHeaders | undefined): Promise<T | null>;
/**
 * Truncates and buffers a Flight stream clone at the given byte boundary and
 * decodes the prefix as a Flight payload. Used by the static-stage and
 * shell-stage extraction helpers.
 */
export declare function decodeStageUntilBoundary<T>(responseBodyClone: ReadableStream<Uint8Array>, byteLength: number, headers: RequestHeaders | undefined): Promise<T>;
/**
 * Decodes already-buffered Flight response bytes as a stage payload. The
 * bytes are delivered to Flight as a single chunk so all rows are processed
 * synchronously in one call — required for the thenable-status reads that
 * scope a response's late-resolving metadata (vary params, isPartial, ...)
 * to this decode.
 */
export declare function decodeBufferedStage<T>(buffer: Uint8Array, headers: RequestHeaders | undefined): Promise<T>;
export declare function createFetch<T>(url: URL, headers: RequestHeaders, fetchPriority: 'auto' | 'high' | 'low' | null, shouldImmediatelyDecode: boolean, signal?: AbortSignal): Promise<RSCResponse<T>>;
export declare function createFromNextReadableStream<T>(flightStream: ReadableStream<Uint8Array>, requestHeaders: RequestHeaders | undefined, options?: {
    allowPartialStream?: boolean;
}): Promise<T>;
export {};
