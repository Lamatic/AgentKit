import { posix, join, normalize } from 'path';
import { stringify } from 'querystring';
import { PAGES_DIR_ALIAS, ROOT_DIR_ALIAS, APP_DIR_ALIAS, WEBPACK_LAYERS, INSTRUMENTATION_HOOK_FILENAME } from '../lib/constants';
import { isAPIRoute } from '../lib/is-api-route';
import { isEdgeRuntime } from '../lib/is-edge-runtime';
import { APP_CLIENT_INTERNALS, RSC_MODULE_TYPES } from '../shared/lib/constants';
import { CLIENT_STATIC_FILES_RUNTIME_MAIN, CLIENT_STATIC_FILES_RUNTIME_MAIN_APP, CLIENT_STATIC_FILES_RUNTIME_POLYFILLS, CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH, COMPILER_NAMES, EDGE_RUNTIME_WEBPACK } from '../shared/lib/constants';
import { isMiddlewareFile, isMiddlewareFilename, isProxyFile, isInstrumentationHookFile, isInstrumentationHookFilename } from './utils';
import { normalizePagePath } from '../shared/lib/page-path/normalize-page-path';
import { normalizeAppPath, compareAppPaths } from '../shared/lib/router/utils/app-paths';
import { encodeMatchers } from './webpack/loaders/next-middleware-loader';
import { isAppRouteRoute } from '../lib/is-app-route-route';
import { getRouteLoaderEntry } from './webpack/loaders/next-route-loader';
import { isInternalComponent, isNonRoutePagesPage } from '../lib/is-internal-component';
import { RouteKind } from '../server/route-kind';
import { encodeToBase64 } from './webpack/loaders/utils';
import { normalizeCatchAllRoutes } from './normalize-catchall-routes';
import { PAGE_TYPES } from '../lib/page-types';
import { getStaticInfoIncludingLayouts } from './get-static-info-including-layouts';
import { getPageFromPath } from './route-discovery';
export function getPageFilePath({ absolutePagePath, pagesDir, appDir, rootDir }) {
    if (absolutePagePath.startsWith(PAGES_DIR_ALIAS) && pagesDir) {
        return absolutePagePath.replace(PAGES_DIR_ALIAS, pagesDir);
    }
    if (absolutePagePath.startsWith(APP_DIR_ALIAS) && appDir) {
        return absolutePagePath.replace(APP_DIR_ALIAS, appDir);
    }
    if (absolutePagePath.startsWith(ROOT_DIR_ALIAS)) {
        return absolutePagePath.replace(ROOT_DIR_ALIAS, rootDir);
    }
    return require.resolve(absolutePagePath);
}
/**
 * Checks if a page path matches any of the deferred entry patterns.
 * @param page - The page path (e.g., '/about', '/api/hello')
 * @param deferredEntries - Array of path patterns to match against
 * @returns true if the page matches a deferred entry pattern
 */ export function isDeferredEntry(page, deferredEntries) {
    if (!deferredEntries || deferredEntries.length === 0) {
        return false;
    }
    // Normalize the page path
    const normalizedPage = page.startsWith('/') ? page : `/${page}`;
    for (const pattern of deferredEntries){
        // Normalize the pattern
        const normalizedPattern = pattern.startsWith('/') ? pattern : `/${pattern}`;
        // Check for exact match or prefix match for directories
        if (normalizedPage === normalizedPattern) {
            return true;
        }
        // Check if the page is under the deferred directory
        if (normalizedPage.startsWith(normalizedPattern + '/')) {
            return true;
        }
    }
    return false;
}
export function getEdgeServerEntry(opts) {
    var _opts_config_experimental_sri;
    const cacheHandler = opts.config.cacheHandler || undefined;
    if (opts.pagesType === 'app' && isAppRouteRoute(opts.page) && opts.appDirLoader) {
        const loaderParams = {
            absolutePagePath: opts.absolutePagePath,
            page: opts.page,
            appDirLoader: Buffer.from(opts.appDirLoader || '').toString('base64'),
            preferredRegion: opts.preferredRegion,
            middlewareConfig: Buffer.from(JSON.stringify(opts.middlewareConfig || {})).toString('base64'),
            cacheHandlers: JSON.stringify(opts.config.cacheHandlers || {}),
            ...cacheHandler ? {
                cacheHandler
            } : {}
        };
        return {
            import: `next-edge-app-route-loader?${stringify(loaderParams)}!`,
            layer: WEBPACK_LAYERS.reactServerComponents
        };
    }
    if (isMiddlewareFile(opts.page)) {
        var _opts_middleware;
        const loaderParams = {
            absolutePagePath: opts.absolutePagePath,
            page: opts.page,
            rootDir: opts.rootDir,
            matchers: ((_opts_middleware = opts.middleware) == null ? void 0 : _opts_middleware.matchers) ? encodeMatchers(opts.middleware.matchers) : '',
            preferredRegion: opts.preferredRegion,
            middlewareConfig: Buffer.from(JSON.stringify(opts.middlewareConfig || {})).toString('base64'),
            ...cacheHandler ? {
                cacheHandler
            } : {}
        };
        return {
            import: `next-middleware-loader?${stringify(loaderParams)}!`,
            layer: WEBPACK_LAYERS.middleware,
            filename: opts.isDev ? 'middleware.js' : undefined
        };
    }
    if (isAPIRoute(opts.page)) {
        const loaderParams = {
            absolutePagePath: opts.absolutePagePath,
            page: opts.page,
            rootDir: opts.rootDir,
            preferredRegion: opts.preferredRegion,
            middlewareConfig: Buffer.from(JSON.stringify(opts.middlewareConfig || {})).toString('base64'),
            ...cacheHandler ? {
                cacheHandler
            } : {}
        };
        return {
            import: `next-edge-function-loader?${stringify(loaderParams)}!`,
            layer: WEBPACK_LAYERS.apiEdge
        };
    }
    const loaderParams = {
        absolute500Path: opts.pages['/500'] || '',
        absoluteAppPath: opts.pages['/_app'],
        absoluteDocumentPath: opts.pages['/_document'],
        absoluteErrorPath: opts.pages['/_error'],
        absolutePagePath: opts.absolutePagePath,
        dev: opts.isDev,
        isServerComponent: opts.isServerComponent,
        page: opts.page,
        pagesType: opts.pagesType,
        appDirLoader: Buffer.from(opts.appDirLoader || '').toString('base64'),
        sriEnabled: !opts.isDev && !!((_opts_config_experimental_sri = opts.config.experimental.sri) == null ? void 0 : _opts_config_experimental_sri.algorithm),
        preferredRegion: opts.preferredRegion,
        middlewareConfig: Buffer.from(JSON.stringify(opts.middlewareConfig || {})).toString('base64'),
        serverActions: opts.config.experimental.serverActions,
        cacheHandlers: JSON.stringify(opts.config.cacheHandlers || {}),
        ...cacheHandler ? {
            cacheHandler
        } : {}
    };
    return {
        import: `next-edge-ssr-loader?${JSON.stringify(loaderParams)}!`,
        // The Edge bundle includes the server in its entrypoint, so it has to
        // be in the SSR layer — we later convert the page request to the RSC layer
        // via a webpack rule.
        layer: opts.appDirLoader ? WEBPACK_LAYERS.serverSideRendering : undefined
    };
}
export function getInstrumentationEntry(opts) {
    // the '../' is needed to make sure the file is not chunked
    const filename = `${opts.isEdgeServer ? 'edge-' : opts.isDev ? '' : '../'}${INSTRUMENTATION_HOOK_FILENAME}.js`;
    return {
        import: opts.absolutePagePath,
        filename,
        layer: WEBPACK_LAYERS.instrument
    };
}
export function getAppLoader() {
    return process.env.BUILTIN_APP_LOADER ? `builtin:next-app-loader` : 'next-app-loader';
}
export function getAppEntry(opts) {
    if (process.env.NEXT_RSPACK && process.env.BUILTIN_APP_LOADER) {
        ;
        opts.projectRoot = normalize(join(__dirname, '../../..'));
    }
    return {
        import: `${getAppLoader()}?${stringify(opts)}!`,
        layer: WEBPACK_LAYERS.reactServerComponents
    };
}
export function getClientEntry(opts) {
    const loaderOptions = {
        absolutePagePath: opts.absolutePagePath,
        page: opts.page
    };
    const pageLoader = `next-client-pages-loader?${stringify(loaderOptions)}!`;
    // Make sure next/router is a dependency of _app or else chunk splitting
    // might cause the router to not be able to load causing hydration
    // to fail
    return opts.page === '/_app' ? [
        pageLoader,
        require.resolve('../client/router')
    ] : pageLoader;
}
export function runDependingOnPageType(params) {
    if (params.pageType === PAGE_TYPES.ROOT && isInstrumentationHookFile(params.page)) {
        params.onServer();
        params.onEdgeServer();
        return;
    }
    if (isProxyFile(params.page)) {
        params.onServer();
        return;
    }
    if (isMiddlewareFile(params.page)) {
        if (params.pageRuntime === 'nodejs') {
            params.onServer();
            return;
        } else {
            params.onEdgeServer();
            return;
        }
    }
    if (isAPIRoute(params.page)) {
        if (isEdgeRuntime(params.pageRuntime)) {
            params.onEdgeServer();
            return;
        }
        params.onServer();
        return;
    }
    if (params.page === '/_document') {
        params.onServer();
        return;
    }
    if (params.page === '/_app' || params.page === '/_error' || params.page === '/404' || params.page === '/500') {
        params.onClient();
        params.onServer();
        return;
    }
    if (isEdgeRuntime(params.pageRuntime)) {
        params.onClient();
        params.onEdgeServer();
        return;
    }
    params.onClient();
    params.onServer();
    return;
}
export async function createEntrypoints(params) {
    const { config, pages, pagesDir, isDev, rootDir, rootPaths, appDir, appPaths, pageExtensions, deferredEntriesFilter } = params;
    const deferredEntries = config.experimental.deferredEntries;
    const edgeServer = {};
    const server = {};
    const client = {};
    let middlewareMatchers = undefined;
    let appPathsPerRoute = {};
    if (appDir && appPaths) {
        for(const pathname in appPaths){
            const normalizedPath = normalizeAppPath(pathname);
            const actualPath = appPaths[pathname];
            if (!appPathsPerRoute[normalizedPath]) {
                appPathsPerRoute[normalizedPath] = [];
            }
            appPathsPerRoute[normalizedPath].push(// TODO-APP: refactor to pass the page path from createPagesMapping instead.
            getPageFromPath(actualPath, pageExtensions).replace(APP_DIR_ALIAS, ''));
        }
        // TODO: find a better place to do this
        normalizeCatchAllRoutes(appPathsPerRoute);
        // Make sure to sort parallel routes to make the result deterministic.
        appPathsPerRoute = Object.fromEntries(Object.entries(appPathsPerRoute).map(([k, v])=>[
                k,
                v.sort(compareAppPaths)
            ]));
    }
    const getEntryHandler = (mappings, pagesType)=>async (page)=>{
            // Apply deferred entries filter if specified
            if (deferredEntriesFilter) {
                const isDeferred = isDeferredEntry(page, deferredEntries);
                if (deferredEntriesFilter === 'exclude' && isDeferred) {
                    // Skip deferred entries when excluding them
                    return;
                }
                if (deferredEntriesFilter === 'only' && !isDeferred) {
                    // Skip non-deferred entries when only including deferred ones
                    return;
                }
            }
            const bundleFile = normalizePagePath(page);
            const clientBundlePath = posix.join(pagesType, bundleFile);
            const serverBundlePath = pagesType === PAGE_TYPES.PAGES ? posix.join('pages', bundleFile) : pagesType === PAGE_TYPES.APP ? posix.join('app', bundleFile) : bundleFile.slice(1);
            const absolutePagePath = mappings[page];
            // Handle paths that have aliases
            const pageFilePath = getPageFilePath({
                absolutePagePath,
                pagesDir,
                appDir,
                rootDir
            });
            const isInsideAppDir = !!appDir && (absolutePagePath.startsWith(APP_DIR_ALIAS) || absolutePagePath.startsWith(appDir));
            const staticInfo = await getStaticInfoIncludingLayouts({
                isInsideAppDir,
                pageExtensions,
                pageFilePath,
                appDir,
                config,
                isDev,
                page
            });
            // TODO(timneutkens): remove this
            const isServerComponent = isInsideAppDir && staticInfo.rsc !== RSC_MODULE_TYPES.client;
            if (isMiddlewareFile(page)) {
                var _staticInfo_middleware;
                middlewareMatchers = ((_staticInfo_middleware = staticInfo.middleware) == null ? void 0 : _staticInfo_middleware.matchers) ?? [
                    {
                        regexp: '.*',
                        originalSource: '/:path*'
                    }
                ];
            }
            const isInstrumentation = isInstrumentationHookFile(page) && pagesType === PAGE_TYPES.ROOT;
            runDependingOnPageType({
                page,
                pageRuntime: staticInfo.runtime,
                pageType: pagesType,
                onClient: ()=>{
                    if (isServerComponent || isInsideAppDir) {
                    // We skip the initial entries for server component pages and let the
                    // server compiler inject them instead.
                    } else {
                        client[clientBundlePath] = getClientEntry({
                            absolutePagePath,
                            page
                        });
                    }
                },
                onServer: ()=>{
                    if (pagesType === 'app' && appDir) {
                        const matchedAppPaths = appPathsPerRoute[normalizeAppPath(page)];
                        server[serverBundlePath] = getAppEntry({
                            page,
                            name: serverBundlePath,
                            pagePath: absolutePagePath,
                            appDir,
                            appPaths: matchedAppPaths,
                            allNormalizedAppPaths: Object.keys(appPathsPerRoute),
                            pageExtensions,
                            basePath: config.basePath,
                            assetPrefix: config.assetPrefix,
                            nextConfigOutput: config.output,
                            preferredRegion: staticInfo.preferredRegion,
                            middlewareConfig: encodeToBase64(staticInfo.middleware || {}),
                            isGlobalNotFoundEnabled: config.experimental.globalNotFound ? true : undefined
                        });
                    } else if (isInstrumentation) {
                        server[serverBundlePath.replace('src/', '')] = getInstrumentationEntry({
                            absolutePagePath,
                            isEdgeServer: false,
                            isDev: false
                        });
                    } else if (isMiddlewareFile(page)) {
                        server[serverBundlePath.replace('src/', '')] = getEdgeServerEntry({
                            ...params,
                            rootDir,
                            absolutePagePath: absolutePagePath,
                            bundlePath: clientBundlePath,
                            isDev: false,
                            isServerComponent,
                            page,
                            middleware: staticInfo == null ? void 0 : staticInfo.middleware,
                            pagesType,
                            preferredRegion: staticInfo.preferredRegion,
                            middlewareConfig: staticInfo.middleware
                        });
                    } else if (isAPIRoute(page)) {
                        server[serverBundlePath] = [
                            getRouteLoaderEntry({
                                kind: RouteKind.PAGES_API,
                                page,
                                absolutePagePath,
                                preferredRegion: staticInfo.preferredRegion,
                                middlewareConfig: staticInfo.middleware || {}
                            })
                        ];
                    } else if (!isMiddlewareFile(page) && !isInternalComponent(absolutePagePath) && !isNonRoutePagesPage(page)) {
                        server[serverBundlePath] = [
                            getRouteLoaderEntry({
                                kind: RouteKind.PAGES,
                                page,
                                pages,
                                absolutePagePath,
                                preferredRegion: staticInfo.preferredRegion,
                                middlewareConfig: staticInfo.middleware ?? {}
                            })
                        ];
                    } else {
                        server[serverBundlePath] = [
                            absolutePagePath
                        ];
                    }
                },
                onEdgeServer: ()=>{
                    let appDirLoader = '';
                    if (isInstrumentation) {
                        edgeServer[serverBundlePath.replace('src/', '')] = getInstrumentationEntry({
                            absolutePagePath,
                            isEdgeServer: true,
                            isDev: false
                        });
                    } else {
                        if (pagesType === 'app') {
                            const matchedAppPaths = appPathsPerRoute[normalizeAppPath(page)];
                            appDirLoader = getAppEntry({
                                name: serverBundlePath,
                                page,
                                pagePath: absolutePagePath,
                                appDir: appDir,
                                appPaths: matchedAppPaths,
                                allNormalizedAppPaths: Object.keys(appPathsPerRoute),
                                pageExtensions,
                                basePath: config.basePath,
                                assetPrefix: config.assetPrefix,
                                nextConfigOutput: config.output,
                                // This isn't used with edge as it needs to be set on the entry module, which will be the `edgeServerEntry` instead.
                                // Still passing it here for consistency.
                                preferredRegion: staticInfo.preferredRegion,
                                middlewareConfig: Buffer.from(JSON.stringify(staticInfo.middleware || {})).toString('base64'),
                                isGlobalNotFoundEnabled: config.experimental.globalNotFound ? true : undefined
                            }).import;
                        }
                        edgeServer[serverBundlePath] = getEdgeServerEntry({
                            ...params,
                            rootDir,
                            absolutePagePath: absolutePagePath,
                            bundlePath: clientBundlePath,
                            isDev: false,
                            isServerComponent,
                            page,
                            middleware: staticInfo == null ? void 0 : staticInfo.middleware,
                            pagesType,
                            appDirLoader,
                            preferredRegion: staticInfo.preferredRegion,
                            middlewareConfig: staticInfo.middleware
                        });
                    }
                }
            });
        };
    const promises = [];
    if (appPaths) {
        const entryHandler = getEntryHandler(appPaths, PAGE_TYPES.APP);
        promises.push(Promise.all(Object.keys(appPaths).map(entryHandler)));
    }
    if (rootPaths) {
        promises.push(Promise.all(Object.keys(rootPaths).map(getEntryHandler(rootPaths, PAGE_TYPES.ROOT))));
    }
    promises.push(Promise.all(Object.keys(pages).map(getEntryHandler(pages, PAGE_TYPES.PAGES))));
    await Promise.all(promises);
    // Optimization: If there's only one instrumentation hook in edge compiler, which means there's no edge server entry.
    // We remove the edge instrumentation entry from edge compiler as it can be pure server side.
    if (edgeServer.instrumentation && Object.keys(edgeServer).length === 1) {
        delete edgeServer.instrumentation;
    }
    return {
        client,
        server,
        edgeServer,
        middlewareMatchers
    };
}
export function finalizeEntrypoint({ name, compilerType, value, isServerComponent, hasAppDir }) {
    const entry = typeof value !== 'object' || Array.isArray(value) ? {
        import: value
    } : value;
    const isApi = name.startsWith('pages/api/');
    const isInstrumentation = isInstrumentationHookFilename(name);
    switch(compilerType){
        case COMPILER_NAMES.server:
            {
                const layer = isApi ? WEBPACK_LAYERS.apiNode : isInstrumentation ? WEBPACK_LAYERS.instrument : isServerComponent ? WEBPACK_LAYERS.reactServerComponents : name.startsWith('pages/') ? WEBPACK_LAYERS.pagesDirNode : undefined;
                return {
                    publicPath: isApi ? '' : undefined,
                    runtime: isApi ? 'webpack-api-runtime' : 'webpack-runtime',
                    layer,
                    ...entry
                };
            }
        case COMPILER_NAMES.edgeServer:
            {
                return {
                    layer: isApi ? WEBPACK_LAYERS.apiEdge : isMiddlewareFilename(name) || isInstrumentation ? WEBPACK_LAYERS.middleware : name.startsWith('pages/') ? WEBPACK_LAYERS.pagesDirEdge : undefined,
                    library: {
                        name: [
                            '_ENTRIES',
                            `middleware_[name]`
                        ],
                        type: 'assign'
                    },
                    runtime: EDGE_RUNTIME_WEBPACK,
                    asyncChunks: false,
                    ...entry
                };
            }
        case COMPILER_NAMES.client:
            {
                const isAppLayer = hasAppDir && (name === CLIENT_STATIC_FILES_RUNTIME_MAIN_APP || name === APP_CLIENT_INTERNALS || name.startsWith('app/'));
                if (// Client special cases
                name !== CLIENT_STATIC_FILES_RUNTIME_POLYFILLS && name !== CLIENT_STATIC_FILES_RUNTIME_MAIN && name !== CLIENT_STATIC_FILES_RUNTIME_MAIN_APP && name !== CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH) {
                    if (isAppLayer) {
                        return {
                            dependOn: CLIENT_STATIC_FILES_RUNTIME_MAIN_APP,
                            layer: WEBPACK_LAYERS.appPagesBrowser,
                            ...entry
                        };
                    }
                    return {
                        dependOn: name.startsWith('pages/') && name !== 'pages/_app' ? 'pages/_app' : CLIENT_STATIC_FILES_RUNTIME_MAIN,
                        layer: WEBPACK_LAYERS.pagesDirBrowser,
                        ...entry
                    };
                }
                if (isAppLayer) {
                    return {
                        layer: WEBPACK_LAYERS.appPagesBrowser,
                        ...entry
                    };
                }
                return {
                    layer: WEBPACK_LAYERS.pagesDirBrowser,
                    ...entry
                };
            }
        default:
            return compilerType;
    }
}

//# sourceMappingURL=entries.js.map