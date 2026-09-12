type Opaque<K, T> = T & {
    __brand: K;
};
export type NormalizedPathname = Opaque<'NormalizedPathname', string>;
export type NormalizedSearch = Opaque<'NormalizedSearch', string>;
export type NormalizedNextUrl = Opaque<'NormalizedNextUrl', string>;
export type RouteCacheKey = Opaque<'RouteCacheKey', {
    pathname: NormalizedPathname;
    search: NormalizedSearch;
    nextUrl: NormalizedNextUrl | null;
}>;
export declare function createCacheKey(originalHref: string, nextUrl: string | null): RouteCacheKey;
/**
 * Splits a pathname into its non-empty parts. Equivalent to
 * `pathname.split('/').filter((p) => p !== '')` — empty tokens produced by
 * leading, trailing, or consecutive slashes are skipped.
 *
 * We use a manual loop instead of `split` + `filter` because
 * `String.prototype.split` can return arrays with either the packed or holey
 * elements kind depending on internal fast paths, and `filter`/`slice`
 * propagate the kind. Mixing holey and packed arrays at the same call sites
 * makes downstream array method loads (`slice`, `join`, `length`) polymorphic
 * and causes repeated "wrong map" deoptimizations in hot route-matching code.
 * Pushing into an array literal guarantees a packed elements kind.
 */
export declare function splitPathnameIntoParts(pathname: string): Array<string>;
export {};
