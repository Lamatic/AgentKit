import type { Params } from '../request/params';
/**
 * Serializable view of the outer `RequestStore` forwarded to the probe
 * worker. The worker rebuilds a real `RequestStore` from this so cache
 * bodies that read `cookies()`, `headers()`, or `draftMode()` behave the
 * same as in a real fill — without it, those reads would diverge from
 * production behaviour and could mask the actual deadlock.
 */
export type UseCacheProbeRequestSnapshot = {
    headers: [string, string][];
    cookieHeader: string | undefined;
    urlPathname: string;
    urlSearch: string;
    rootParams: Params;
    isDraftMode: boolean;
    isHmrRefresh: boolean;
    hmrRefreshHash: string | undefined;
    requestStartTime: number;
};
/**
 * Probe hook installed by the dev server. Resolves to `true` if the cache
 * function ran to completion in isolation — the strong signal that shared
 * outer-scope state is deadlocking the main fill. Resolves to `false` for
 * any other outcome (probe timeout, decode failure, missing module, etc.).
 */
export type UseCacheProbe = (args: {
    /**
     * Page key as it appears in the build manifest, e.g. `/static/page` for
     * `app/static/page.tsx`. The trailing `/page` (or `/route`) suffix is
     * load-bearing — the worker passes this directly to `loadComponents()`.
     */
    page: string;
    /** Route pathname; used to populate the worker's `WorkStore.route`. */
    route: string;
    id: string;
    kind: string;
    encodedArguments: string | FormData;
    request: UseCacheProbeRequestSnapshot;
    timeoutMs: number;
}) => Promise<boolean>;
export declare function setUseCacheProbe(fn: UseCacheProbe | undefined): void;
export declare function getUseCacheProbe(): UseCacheProbe | undefined;
