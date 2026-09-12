import type { NextConfigComplete } from '../server/config-shared';
import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type { ProxyConfig } from './analysis/get-page-static-info';
import type { LoadedEnvFiles } from '@next/env';
import type { AppLoaderOptions } from './webpack/loaders/next-app-loader';
import type { CompilerNameValues } from '../shared/lib/constants';
import type { __ApiPreviewProps } from '../server/api-utils';
import type { ServerRuntime } from '../types';
import type { PageExtensions } from './page-extensions-type';
import type { MappedPages } from './build-context';
import { PAGE_TYPES } from '../lib/page-types';
type ObjectValue<T> = T extends {
    [key: string]: infer V;
} ? V : never;
export declare function getPageFilePath({ absolutePagePath, pagesDir, appDir, rootDir, }: {
    absolutePagePath: string;
    pagesDir: string | undefined;
    appDir: string | undefined;
    rootDir: string;
}): string;
export interface CreateEntrypointsParams {
    buildId: string;
    config: NextConfigComplete;
    envFiles: LoadedEnvFiles;
    isDev: boolean;
    pages: MappedPages;
    pagesDir?: string;
    previewMode: __ApiPreviewProps;
    rootDir: string;
    rootPaths?: MappedPages;
    appDir?: string;
    appPaths?: MappedPages;
    pageExtensions: PageExtensions;
    hasInstrumentationHook?: boolean;
    /**
     * When set to 'exclude', deferred entries are excluded from the result.
     * When set to 'only', only deferred entries are included in the result.
     * When undefined, all entries are included.
     */
    deferredEntriesFilter?: 'exclude' | 'only';
}
/**
 * Checks if a page path matches any of the deferred entry patterns.
 * @param page - The page path (e.g., '/about', '/api/hello')
 * @param deferredEntries - Array of path patterns to match against
 * @returns true if the page matches a deferred entry pattern
 */
export declare function isDeferredEntry(page: string, deferredEntries: string[] | undefined): boolean;
export declare function getEdgeServerEntry(opts: {
    rootDir: string;
    absolutePagePath: string;
    buildId: string;
    bundlePath: string;
    config: NextConfigComplete;
    isDev: boolean;
    isServerComponent: boolean;
    page: string;
    pages: MappedPages;
    middleware?: Partial<ProxyConfig>;
    pagesType: PAGE_TYPES;
    appDirLoader?: string;
    hasInstrumentationHook?: boolean;
    preferredRegion: string | string[] | undefined;
    middlewareConfig?: ProxyConfig;
}): {
    import: string;
    layer: "rsc";
    filename?: undefined;
} | {
    import: string;
    layer: "middleware";
    filename: string | undefined;
} | {
    import: string;
    layer: "api-edge";
    filename?: undefined;
} | {
    import: string;
    layer: "ssr" | undefined;
    filename?: undefined;
};
export declare function getInstrumentationEntry(opts: {
    absolutePagePath: string;
    isEdgeServer: boolean;
    isDev: boolean;
}): {
    import: string;
    filename: string;
    layer: "instrument";
};
export declare function getAppLoader(): "builtin:next-app-loader" | "next-app-loader";
export declare function getAppEntry(opts: Readonly<AppLoaderOptions>): {
    import: string;
    layer: "rsc";
};
export declare function getClientEntry(opts: {
    absolutePagePath: string;
    page: string;
}): string | string[];
export declare function runDependingOnPageType<T>(params: {
    onClient: () => T;
    onEdgeServer: () => T;
    onServer: () => T;
    page: string;
    pageRuntime: ServerRuntime;
    pageType?: PAGE_TYPES;
}): void;
export declare function createEntrypoints(params: CreateEntrypointsParams): Promise<{
    client: webpack.EntryObject;
    server: webpack.EntryObject;
    edgeServer: webpack.EntryObject;
    middlewareMatchers: undefined;
}>;
export declare function finalizeEntrypoint({ name, compilerType, value, isServerComponent, hasAppDir, }: {
    compilerType: CompilerNameValues;
    name: string;
    value: ObjectValue<webpack.EntryObject>;
    isServerComponent?: boolean;
    hasAppDir?: boolean;
}): ObjectValue<webpack.EntryObject>;
export {};
