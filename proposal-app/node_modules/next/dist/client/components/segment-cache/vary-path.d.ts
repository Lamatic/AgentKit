import { FetchStrategy } from './types';
import type { NormalizedPathname, NormalizedSearch, NormalizedNextUrl } from './cache-key';
import type { RouteTree } from './cache';
import { type FallbackType } from './cache-map';
type Opaque<T, K> = T & {
    __brand: K;
};
/**
 * A linked-list of all the params (or other param-like) inputs that a cache
 * entry may vary by. This is used by the CacheMap module to reuse cache entries
 * across different param values. If a param has a value of Fallback, it means
 * the cache entry is reusable for all possible values of that param. See
 * cache-map.ts for details.
 *
 * A segment's vary path is a pure function of a segment's position in a
 * particular route tree and the (post-rewrite) URL that is being queried. More
 * concretely, successive queries of the cache for the same segment always use
 * the same vary path.
 *
 * A route's vary path is simpler: it's comprised of the pathname, search
 * string, and Next-URL header.
 */
export type VaryPath = {
    /**
     * Identifies which param this vary path node corresponds to. Used by
     * getFulfilledSegmentVaryPath to determine which params to replace with
     * Fallback based on the varyParams set from the server.
     *
     * - For path params: the param name (e.g., 'slug')
     * - For search params: '?'
     * - For non-param nodes (request keys, etc.): null
     */
    id: string | null;
    value: string | null | FallbackType;
    /**
     * Whether this node corresponds to a root param — a path param at or above
     * the application's root layout. Root params may appear in the App Shell, so
     * the shell vary path keeps their concrete value instead of replacing it with
     * Fallback. See getShellSegmentVaryPath. Only ever true on path param nodes;
     * false for structural and search param nodes.
     *
     * Always a boolean (never undefined) so that every VaryPath node shares a
     * single hidden class, keeping the cache hot paths monomorphic.
     */
    isRootParam: boolean;
    parent: VaryPath | null;
};
export type RouteVaryPath = Opaque<{
    id: null;
    value: NormalizedPathname;
    isRootParam: false;
    parent: {
        id: '?';
        value: NormalizedSearch;
        isRootParam: false;
        parent: {
            id: null;
            value: NormalizedNextUrl | null | FallbackType;
            isRootParam: false;
            parent: null;
        };
    };
}, 'RouteVaryPath'>;
export type LayoutVaryPath = Opaque<{
    id: null;
    value: string;
    isRootParam: false;
    parent: PartialSegmentVaryPath | null;
}, 'LayoutVaryPath'>;
export type PageVaryPath = Opaque<{
    id: null;
    value: string;
    isRootParam: false;
    parent: {
        id: '?';
        value: NormalizedSearch | FallbackType;
        isRootParam: false;
        parent: PartialSegmentVaryPath | null;
    };
}, 'PageVaryPath'>;
export type SegmentVaryPath = LayoutVaryPath | PageVaryPath;
export type PartialSegmentVaryPath = Opaque<VaryPath, 'PartialSegmentVaryPath'>;
export declare function getRouteVaryPath(pathname: NormalizedPathname, search: NormalizedSearch, nextUrl: NormalizedNextUrl | null): RouteVaryPath;
export declare function getFulfilledRouteVaryPath(pathname: NormalizedPathname, search: NormalizedSearch, nextUrl: NormalizedNextUrl | null, couldBeIntercepted: boolean): RouteVaryPath;
export declare function appendLayoutVaryPath(parentPath: PartialSegmentVaryPath | null, cacheKey: string, paramName: string, isRootParam: boolean): PartialSegmentVaryPath;
export declare function finalizeLayoutVaryPath(requestKey: string, varyPath: PartialSegmentVaryPath | null): LayoutVaryPath;
export declare function getPartialLayoutVaryPath(finalizedVaryPath: LayoutVaryPath): PartialSegmentVaryPath | null;
export declare function finalizePageVaryPath(requestKey: string, renderedSearch: NormalizedSearch, varyPath: PartialSegmentVaryPath | null): PageVaryPath;
export declare function getPartialPageVaryPath(finalizedVaryPath: PageVaryPath): PartialSegmentVaryPath | null;
export declare function finalizeMetadataVaryPath(pageRequestKey: string, renderedSearch: NormalizedSearch, varyPath: PartialSegmentVaryPath | null): PageVaryPath;
export declare function getSegmentVaryPathForRequest(fetchStrategy: FetchStrategy, tree: RouteTree): SegmentVaryPath;
export declare function clonePageVaryPathWithNewSearchParams(originalVaryPath: PageVaryPath, newSearch: NormalizedSearch): PageVaryPath;
export declare function getRenderedSearchFromVaryPath(varyPath: PageVaryPath): NormalizedSearch | null;
export declare function getFulfilledSegmentVaryPath(original: VaryPath, varyParams: Set<string>): SegmentVaryPath;
export declare function getShellSegmentVaryPath(original: VaryPath): SegmentVaryPath;
export {};
