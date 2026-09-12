export type Instant = InstantConfig | true | false;
export type Prefetch = 'auto' | 'partial' | 'unstable_eager' | 'force-disabled';
export type InstantConfigForTypeCheckInternal = __GenericInstantConfig | Instant;
interface __GenericInstantConfig {
    level?: string;
    unstable_samples?: Array<WideInstantSample>;
    unstable_from?: string[];
    unstable_disableValidation?: boolean;
    unstable_disableDevValidation?: boolean;
    unstable_disableBuildValidation?: boolean;
}
type WideInstantSample = {
    cookies?: InstantSample['cookies'];
    headers?: Array<string[]>;
    params?: InstantSample['params'];
    searchParams?: InstantSample['searchParams'];
};
export interface InstantConfig {
    level?: 'warning' | 'experimental-error';
    unstable_samples?: Array<InstantSample>;
    unstable_from?: string[];
    unstable_disableValidation?: true;
    unstable_disableDevValidation?: true;
    unstable_disableBuildValidation?: true;
}
export type InstantSample = {
    cookies?: Array<{
        name: string;
        value: string | null;
    }>;
    headers?: Array<[string, string | null]>;
    params?: {
        [key: string]: string | string[];
    };
    searchParams?: {
        [key: string]: string | string[] | null;
    };
};
/**
 * Parse the app segment config.
 * @param data - The data to parse.
 * @param route - The route of the app.
 * @returns The parsed app segment config.
 */
export declare function parseAppSegmentConfig(data: unknown, route: string): AppSegmentConfig;
/**
 * The configuration for a page.
 */
export type AppSegmentConfig = {
    /**
     * The revalidation period for the page in seconds, or false to disable ISR.
     */
    revalidate?: number | false;
    /**
     * Whether the page supports dynamic parameters.
     */
    dynamicParams?: boolean;
    /**
     * The dynamic behavior of the page.
     */
    dynamic?: 'auto' | 'error' | 'force-static' | 'force-dynamic';
    /**
     * The caching behavior of the page.
     */
    fetchCache?: 'auto' | 'default-cache' | 'default-no-store' | 'force-cache' | 'force-no-store' | 'only-cache' | 'only-no-store';
    /**
     * How this segment should be prefetched.
     */
    instant?: Instant;
    /**
     * Controls prefetching for this segment.
     * - 'auto' (default) is a noop.
     * - 'partial' enables Partial Prefetching. Only Cache Components are
     *   prefetched, not dynamic ones. When a static prefetch is insufficient,
     *   the segment may be prefetched with a runtime request instead.
     * - 'unstable_eager' behaves like 'partial' but, when App Shells are enabled,
     *   keeps eagerly prefetching the route's segments instead of relying on the
     *   shared app shell. Internal migration aid; not part of the public API.
     * - 'force-disabled' disables prefetching for the segment.
     */
    prefetch?: Prefetch;
    /**
     * The stale time for dynamic responses in seconds.
     * Controls how long the client-side router cache retains dynamic page data.
     * Pages only — not allowed in layouts.
     */
    unstable_dynamicStaleTime?: number;
    /**
     * The preferred region for the page.
     */
    preferredRegion?: string | string[];
    /**
     * The runtime to use for the page.
     */
    runtime?: 'edge' | 'nodejs';
    /**
     * The maximum duration for the page in seconds.
     */
    maxDuration?: number;
};
export {};
