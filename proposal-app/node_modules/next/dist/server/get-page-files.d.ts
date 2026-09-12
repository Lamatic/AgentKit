export type BuildManifest = {
    devFiles: readonly string[];
    polyfillFiles: readonly string[];
    lowPriorityFiles: readonly string[];
    rootMainFiles: readonly string[];
    rootMainFilesTree: {
        [appRoute: string]: readonly string[];
    };
    pages: {
        '/_app': readonly string[];
        [page: string]: readonly string[];
    };
    pagesChunkGroupBootstrapParams?: {
        [page: string]: object;
    };
    chunkLoadingGlobal?: string;
};
/**
 * Builds inline `globalThis[<global>].push(<params>)` bootstrap content for the given
 * pages, seeding the runtime queue before the shared runtime chunk drains it. Only call
 * this for Turbopack production builds (the only builds that populate
 * `pagesChunkGroupBootstrapParams` / `chunkLoadingGlobal`). Returns undefined when none
 * of the given pages have inlined params.
 */
export declare function getTurbopackChunkGroupBootstrap(paramsByPage: {
    [page: string]: object;
}, chunkLoadingGlobal: string, pages: readonly string[]): string | undefined;
export declare function getPageFiles(buildManifest: BuildManifest, page: string): readonly string[];
