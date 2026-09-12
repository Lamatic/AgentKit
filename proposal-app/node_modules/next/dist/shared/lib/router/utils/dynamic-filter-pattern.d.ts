/**
 * A token that can never collide with a real path segment (dynamic segments are
 * always `[name]`, `[...name]`, or `[[...name]]`, and static segments never
 * equal `[]`). Shared with the builder's `normalizeRouteToFilterPattern`.
 */
export declare const DYNAMIC_FILTER_PLACEHOLDER = "[]";
/**
 * Test whether any app route that could shadow the resolved pages route passes
 * `test` (typically a dynamic-filter membership check). An app route can only
 * win over a matching pages route by turning some of that route's dynamic
 * positions into static segments, so we enumerate keeping each such position
 * either literal (static in the app route) or a placeholder (still dynamic in
 * the app route) and return as soon as one passes.
 *
 * A static route segment pins its position to that literal; every other
 * concrete position is dynamic and thus a candidate for a placeholder. That
 * includes the tail a trailing catch-all (`[...slug]`/`[[...slug]]`) absorbs,
 * which is why a catch-all route legitimately has fewer segments than the path
 * it matched.
 *
 * Order is irrelevant: any match means the path is shadowed, and resolution is
 * handed to the server via a hard navigation regardless of which candidate
 * matched.
 */
export declare function hasDynamicFilterCandidate(routePattern: string, concretePathname: string, test: (candidate: string) => boolean): boolean;
