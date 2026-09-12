/**
 * Resolves a URL path (e.g. "/blog/hello-world") to its matching Next.js route
 * specifier (e.g. "/blog/[slug]") using the dev router's own live route table.
 *
 * The `matchers` argument is a thin view of `fsChecker` from the router-server
 * process — the same data structure `resolve-routes.ts` iterates on every
 * incoming HTTP request — so first-match ordering and live route updates are
 * inherited for free.
 */
export interface RouteMatcherView {
    appFiles: ReadonlySet<string>;
    pageFiles: ReadonlySet<string>;
    dynamicRoutes: ReadonlyArray<{
        page: string;
        match: (pathname: string) => false | object;
    }>;
}
export declare function resolvePathToRoute(path: string, matchers: RouteMatcherView): {
    routeSpecifier: string;
} | {
    notFound: true;
    pathname: string;
};
