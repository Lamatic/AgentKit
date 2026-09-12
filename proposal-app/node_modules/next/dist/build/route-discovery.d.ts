import { createValidFileMatcher } from '../server/lib/find-page-file';
import { PAGE_TYPES } from '../lib/page-types';
import { type SlotInfo, type RouteInfo } from './file-classifier';
import type { PageExtensions } from './page-extensions-type';
import type { MappedPages } from './build-context';
/**
 * For a given page path removes the provided extensions.
 */
export declare function getPageFromPath(pagePath: string, pageExtensions: PageExtensions): string;
/**
 * Collect app pages, layouts, and default files from the app directory
 */
export declare function collectAppFiles(appDir: string, validFileMatcher: ReturnType<typeof createValidFileMatcher>): Promise<{
    appPaths: string[];
    layoutPaths: string[];
    defaultPaths: string[];
}>;
/**
 * Collect pages from the pages directory
 */
export declare function collectPagesFiles(pagesDir: string, validFileMatcher: ReturnType<typeof createValidFileMatcher>): Promise<string[]>;
/**
 * Create a relative file path from a mapped page path
 */
export declare function createRelativeFilePath(baseDir: string, filePath: string, prefix: 'pages' | 'app', isSrcDir: boolean): string;
/**
 * Process pages routes from mapped pages
 */
export declare function processPageRoutes(mappedPages: {
    [page: string]: string;
}, baseDir: string, isSrcDir: boolean): {
    pageRoutes: RouteInfo[];
    pageApiRoutes: RouteInfo[];
};
/**
 * Process app routes from mapped app pages
 */
export declare function processAppRoutes(mappedAppPages: {
    [page: string]: string;
}, validFileMatcher: ReturnType<typeof createValidFileMatcher>, baseDir: string, isSrcDir: boolean): {
    appRoutes: RouteInfo[];
    appRouteHandlers: RouteInfo[];
};
/**
 * Process layout routes from mapped app layouts
 */
export declare function processLayoutRoutes(mappedAppLayouts: {
    [page: string]: string;
}, baseDir: string, isSrcDir: boolean): RouteInfo[];
/**
 * Creates a mapping of route to page file path for a given list of page paths.
 */
export declare function createPagesMapping({ isDev, pageExtensions, pagePaths, pagesType, pagesDir, appDir, appDirOnly, }: {
    isDev: boolean;
    pageExtensions: PageExtensions;
    pagePaths: string[];
    pagesType: PAGE_TYPES;
    pagesDir: string | undefined;
    appDir: string | undefined;
    appDirOnly: boolean;
}): Promise<MappedPages>;
export interface RouteDiscoveryOptions {
    appDir?: string;
    pagesDir?: string;
    pageExtensions: string[];
    isDev: boolean;
    baseDir: string;
    /** Whether the app/pages directories are under a /src directory. */
    isSrcDir?: boolean;
    /** Override app-dir-only mode (e.g. from --experimental-app-only CLI flag) */
    appDirOnly?: boolean;
    validFileMatcher?: ReturnType<typeof createValidFileMatcher>;
    debugBuildPaths?: {
        app: string[];
        pages: string[];
    };
}
export interface RouteDiscoveryResult {
    appRoutes: RouteInfo[];
    appRouteHandlers: RouteInfo[];
    layoutRoutes: RouteInfo[];
    slots: SlotInfo[];
    pageRoutes: RouteInfo[];
    pageApiRoutes: RouteInfo[];
    mappedAppPages?: MappedPages;
    mappedAppLayouts?: MappedPages;
    mappedPages?: MappedPages;
    /** Raw page file paths (post-filtering), useful for telemetry */
    pagesPaths: string[];
    /** Resolved app-dir-only state (may have been updated during discovery) */
    appDirOnly: boolean;
}
/**
 * High-level API: Collect, map, and process all routes in one call
 */
export declare function discoverRoutes(options: RouteDiscoveryOptions): Promise<RouteDiscoveryResult>;
