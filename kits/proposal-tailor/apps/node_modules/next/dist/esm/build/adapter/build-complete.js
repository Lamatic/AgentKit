import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import * as Log from '../output/log';
import { isMiddlewareFilename } from '../utils';
import { RenderingMode } from '../rendering-mode';
import { interopDefault } from '../../lib/interop-default';
import { recursiveReadDir } from '../../lib/recursive-readdir';
import { isDynamicRoute } from '../../shared/lib/router/utils';
import { normalizeAppPath } from '../../shared/lib/router/utils/app-paths';
import { AdapterOutputType } from '../../shared/lib/constants';
import { normalizePagePath } from '../../shared/lib/page-path/normalize-page-path';
import { convertRedirects, convertRewrites, convertHeaders } from 'next/dist/compiled/@vercel/routing-utils';
import { CACHE_ONE_YEAR_SECONDS, HTML_CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE_HEADER, NEXT_QUERY_PARAM_PREFIX, NEXT_RESUME_HEADER } from '../../lib/constants';
import { normalizeLocalePath } from '../../shared/lib/i18n/normalize-locale-path';
import { getStaticMetadataPrerenderPathname } from '../../lib/metadata/get-metadata-route';
import { isStaticMetadataFile } from '../../lib/metadata/is-metadata-route';
import { addPathPrefix } from '../../shared/lib/router/utils/add-path-prefix';
import { getRedirectStatus, modifyRouteRegex } from '../../lib/redirect-status';
import { getNamedRouteRegex } from '../../shared/lib/router/utils/route-regex';
import { escapeStringRegexp } from '../../shared/lib/escape-regexp';
import { sortSortableRoutes } from '../../shared/lib/router/utils/sortable-routes';
import { defaultOverrides } from '../../server/require-hook';
import { generateRoutesManifest } from '../generate-routes-manifest';
import { Bundler } from '../../lib/bundler';
import { resolveCacheHandlerPathToFilesystem } from '../../lib/format-dynamic-import-path';
import { InvariantError } from '../../shared/lib/invariant-error';
function getPrerenderClassification(route, routeType, response, compute, htmlSize) {
    if (routeType === undefined && response === undefined && compute === undefined && htmlSize === undefined) {
        return {};
    }
    if (routeType === undefined || response === undefined || compute === undefined) {
        throw Object.defineProperty(new InvariantError(`Expected complete prerender classification for route "${route}"`), "__NEXT_ERROR_CODE", {
            value: "E1458",
            enumerable: false,
            configurable: true
        });
    }
    return {
        routeType,
        response,
        compute,
        ...typeof htmlSize === 'number' && {
            htmlSize
        }
    };
}
function normalizePathnames(config, outputs) {
    // normalize pathname field with basePath
    if (config.basePath) {
        for (const output of [
            ...outputs.pages,
            ...outputs.pagesApi,
            ...outputs.appPages,
            ...outputs.appRoutes,
            ...outputs.prerenders,
            ...outputs.staticFiles
        ]){
            output.pathname = addPathPrefix(output.pathname, config.basePath).replace(/\/$/, '') || '/';
        }
    }
}
export async function handleBuildComplete({ dir, config, appType, buildId, configOutDir, distDir, pageKeys, bundler, repoRoot, outputFileTracingRoot, adapterPath, appPageKeys, staticPages, nextVersion, hasStatic404, hasStatic500, routesManifest, serverPropsPages, hasNodeMiddleware, prerenderManifest, middlewareManifest, requiredServerFiles, hasInstrumentationHook, functionsConfigManifest }) {
    const adapterMod = interopDefault(await import(pathToFileURL(require.resolve(adapterPath)).href));
    if (typeof adapterMod.onBuildComplete === 'function') {
        const outputs = {
            pages: [],
            pagesApi: [],
            appPages: [],
            appRoutes: [],
            prerenders: [],
            staticFiles: []
        };
        if (config.output === 'export') {
            // collect export assets and provide as static files
            const exportFiles = await recursiveReadDir(configOutDir);
            for (const file of exportFiles){
                let pathname = (file.endsWith('.html') ? file.replace(/\.html$/, '') : file).replace(/\\/g, '/');
                pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
                outputs.staticFiles.push({
                    id: file,
                    pathname,
                    filePath: path.join(configOutDir, file),
                    type: AdapterOutputType.STATIC_FILE,
                    immutableHash: undefined
                });
            }
        } else {
            const staticFiles = await recursiveReadDir(path.join(distDir, 'static'));
            const clientHashes = bundler === Bundler.Turbopack && config.supportsImmutableAssets ? JSON.parse(await fs.readFile(path.join(distDir, 'immutable-static-hashes.json'), 'utf8')) : undefined;
            for (const file of staticFiles){
                const pathname = path.posix.join('/_next/static', file);
                const filePath = path.join(distDir, 'static', file);
                const id = path.join('static', file);
                outputs.staticFiles.push({
                    type: AdapterOutputType.STATIC_FILE,
                    id,
                    pathname,
                    filePath,
                    immutableHash: clientHashes == null ? void 0 : clientHashes[id]
                });
            }
            const { sharedNodeAssets, sharedNodeAssetsHashes, pagesSharedNodeAssets, pagesSharedNodeAssetsHashes, appPagesSharedNodeAssets, appPagesSharedNodeAssetsHashes } = await getSharedNodeAssets({
                distDir,
                requiredServerFiles,
                dir,
                repoRoot,
                outputFileTracingRoot,
                bundler,
                hasInstrumentationHook,
                config
            });
            async function handleTraceFiles(entryFilePath, type) {
                const assets = {};
                const assetsHashes = {};
                const { entryHash } = await loadNFT(assets, assetsHashes, repoRoot, `${entryFilePath}.nft.json`);
                Object.assign(assets, sharedNodeAssets, type === 'pages' ? pagesSharedNodeAssets : {}, type === 'app' ? appPagesSharedNodeAssets : {});
                Object.assign(assetsHashes, sharedNodeAssetsHashes, type === 'pages' ? pagesSharedNodeAssetsHashes : {}, type === 'app' ? appPagesSharedNodeAssetsHashes : {});
                if (entryHash) {
                    assetsHashes[path.relative(repoRoot, entryFilePath)] = entryHash;
                }
                return {
                    assets,
                    assetsHashes,
                    entryHash
                };
            }
            async function handleEdgeFunction(page, isMiddleware = false) {
                let type = AdapterOutputType.PAGES;
                const isAppPrefix = page.name.startsWith('app/');
                const isAppPage = isAppPrefix && page.name.endsWith('/page');
                const isAppRoute = isAppPrefix && page.name.endsWith('/route');
                let currentOutputs = outputs.pages;
                if (isMiddleware) {
                    type = AdapterOutputType.MIDDLEWARE;
                } else if (isAppPage) {
                    currentOutputs = outputs.appPages;
                    type = AdapterOutputType.APP_PAGE;
                } else if (isAppRoute) {
                    currentOutputs = outputs.appRoutes;
                    type = AdapterOutputType.APP_ROUTE;
                } else if (page.page.startsWith('/api')) {
                    currentOutputs = outputs.pagesApi;
                    type = AdapterOutputType.PAGES_API;
                }
                const route = page.page.replace(/^(app|pages)\//, '');
                const pathname = isAppPrefix ? normalizeAppPath(route) : route === '/index' ? '/' : route.replace(/\/index$/, '');
                const functionConfig = functionsConfigManifest.functions[pathname] || {};
                const edgeEntrypointRelativePath = page.entrypoint;
                const edgeEntrypointPath = path.join(distDir, edgeEntrypointRelativePath);
                const output = {
                    type,
                    id: page.name,
                    runtime: 'edge',
                    sourcePage: route,
                    pathname,
                    filePath: edgeEntrypointPath,
                    edgeRuntime: {
                        modulePath: edgeEntrypointPath,
                        entryKey: `middleware_${page.name}`,
                        handlerExport: 'handler'
                    },
                    assets: {},
                    assetsHashes: {},
                    // Computing assetsHash for edge functions isn't implemented for now
                    wasmAssets: {},
                    config: {
                        maxDuration: functionConfig.maxDuration,
                        env: page.env,
                        preferredRegion: page.regions
                    }
                };
                for (const file of page.files){
                    const originalPath = path.join(distDir, file);
                    const fileOutputPath = path.relative(config.distDir, path.join(path.relative(repoRoot, distDir), file));
                    output.assets[fileOutputPath] = originalPath;
                }
                for (const item of [
                    ...page.assets || []
                ]){
                    output.assets[item.name] = path.join(distDir, item.filePath);
                }
                for (const item of page.wasm || []){
                    if (!output.wasmAssets) {
                        output.wasmAssets = {};
                    }
                    output.wasmAssets[item.name] = path.join(distDir, item.filePath);
                }
                if (type === AdapterOutputType.MIDDLEWARE) {
                    ;
                    output.config.matchers = page.matchers.map((item)=>{
                        return {
                            source: item.originalSource,
                            sourceRegex: item.regexp,
                            has: item.has,
                            missing: [
                                ...item.missing || [],
                                // always skip middleware for on-demand revalidate
                                {
                                    type: 'header',
                                    key: 'x-prerender-revalidate',
                                    value: prerenderManifest.preview.previewModeId
                                }
                            ]
                        };
                    });
                    output.pathname = '/_middleware';
                    output.id = page.name;
                    outputs.middleware = output;
                } else {
                    currentOutputs.push(output);
                }
                // need to add matching .rsc output
                if (isAppPage) {
                    const rscPathname = normalizePagePath(output.pathname) + '.rsc';
                    outputs.appPages.push({
                        ...output,
                        pathname: rscPathname,
                        id: page.name + '.rsc'
                    });
                } else if (type !== AdapterOutputType.MIDDLEWARE && serverPropsPages.has(pathname)) {
                    const nextDataPath = path.posix.join('/_next/data/', buildId, normalizePagePath(pathname) + '.json');
                    outputs.pages.push({
                        ...output,
                        pathname: nextDataPath
                    });
                }
            }
            const edgeFunctionHandlers = [];
            for (const middleware of Object.values(middlewareManifest.middleware)){
                if (isMiddlewareFilename(middleware.name)) {
                    edgeFunctionHandlers.push(handleEdgeFunction(middleware, true));
                }
            }
            for (const page of Object.values(middlewareManifest.functions)){
                edgeFunctionHandlers.push(handleEdgeFunction(page));
            }
            const pagesDistDir = path.join(distDir, 'server', 'pages');
            const pageOutputMap = {};
            const rscFallbackPath = path.join(distDir, 'server', 'rsc-fallback.json');
            const emittedStaticFilePathnames = new Set();
            if (appPageKeys && appPageKeys.length > 0 && pageKeys.length > 0) {
                await fs.writeFile(rscFallbackPath, '{}');
            }
            for (const page of pageKeys){
                if (page === '/_app' || page === '/_document') {
                    continue;
                }
                if (middlewareManifest.functions.hasOwnProperty(page)) {
                    continue;
                }
                const route = normalizePagePath(page);
                const pageFile = path.join(pagesDistDir, `${route}.js`);
                // if it's an auto static optimized page it's just
                // a static file
                if (staticPages.has(page)) {
                    if (config.i18n) {
                        for (const locale of config.i18n.locales || []){
                            const localePage = page === '/' ? `/${locale}` : addPathPrefix(page, `/${locale}`);
                            const localeOutput = {
                                id: localePage,
                                pathname: localePage,
                                type: AdapterOutputType.STATIC_FILE,
                                filePath: path.join(pagesDistDir, `${normalizePagePath(localePage)}.html`),
                                immutableHash: undefined
                            };
                            outputs.staticFiles.push(localeOutput);
                            emittedStaticFilePathnames.add(localeOutput.pathname);
                            if (appPageKeys && appPageKeys.length > 0) {
                                outputs.staticFiles.push({
                                    id: `${localePage}.rsc`,
                                    pathname: `${localePage}.rsc`,
                                    type: AdapterOutputType.STATIC_FILE,
                                    filePath: rscFallbackPath,
                                    immutableHash: undefined
                                });
                            }
                        }
                    } else {
                        const staticOutput = {
                            id: page,
                            pathname: route,
                            type: AdapterOutputType.STATIC_FILE,
                            filePath: pageFile.replace(/\.js$/, '.html'),
                            immutableHash: undefined
                        };
                        outputs.staticFiles.push(staticOutput);
                        emittedStaticFilePathnames.add(staticOutput.pathname);
                        if (appPageKeys && appPageKeys.length > 0) {
                            outputs.staticFiles.push({
                                id: `${page}.rsc`,
                                pathname: `${route}.rsc`,
                                type: AdapterOutputType.STATIC_FILE,
                                filePath: rscFallbackPath,
                                immutableHash: undefined
                            });
                        }
                    }
                    if (page !== '/404') {
                        continue;
                    }
                }
                const { assets, assetsHashes } = await handleTraceFiles(pageFile, 'pages').catch((err)=>{
                    if (err.code !== 'ENOENT' || page !== '/404' && page !== '/500') {
                        Log.warn(`Failed to locate traced assets for ${pageFile}`, err);
                    }
                    return {
                        assets: {},
                        assetsHashes: {}
                    };
                });
                const functionConfig = functionsConfigManifest.functions[route] || {};
                let sourcePage = route.replace(/^\//, '');
                sourcePage = sourcePage === 'api' ? 'api/index' : sourcePage;
                const output = {
                    id: route,
                    type: page.startsWith('/api') ? AdapterOutputType.PAGES_API : AdapterOutputType.PAGES,
                    filePath: pageFile,
                    pathname: route,
                    sourcePage,
                    assets,
                    assetsHashes,
                    runtime: 'nodejs',
                    config: {
                        maxDuration: functionConfig.maxDuration,
                        preferredRegion: functionConfig.regions
                    }
                };
                pageOutputMap[page] = output;
                if (output.type === AdapterOutputType.PAGES) {
                    var _config_i18n;
                    outputs.pages.push(output);
                    // if page is get server side props we need to create
                    // the _next/data output as well
                    if (serverPropsPages.has(page)) {
                        const dataPathname = path.posix.join('/_next/data', buildId, normalizePagePath(page) + '.json');
                        outputs.pages.push({
                            ...output,
                            pathname: dataPathname,
                            id: dataPathname
                        });
                        if (appPageKeys && appPageKeys.length > 0) {
                            const rscPage = `${page === '/' ? '/index' : page}.rsc`;
                            outputs.staticFiles.push({
                                id: rscPage,
                                pathname: rscPage,
                                type: AdapterOutputType.STATIC_FILE,
                                filePath: rscFallbackPath,
                                immutableHash: undefined
                            });
                        }
                    }
                    for (const locale of ((_config_i18n = config.i18n) == null ? void 0 : _config_i18n.locales) || []){
                        const localePage = page === '/' ? `/${locale}` : addPathPrefix(page, `/${locale}`);
                        outputs.pages.push({
                            ...output,
                            id: localePage,
                            pathname: localePage
                        });
                        if (serverPropsPages.has(page)) {
                            const dataPathname = path.posix.join('/_next/data', buildId, localePage + '.json');
                            outputs.pages.push({
                                ...output,
                                pathname: dataPathname,
                                id: dataPathname
                            });
                            if (appPageKeys && appPageKeys.length > 0) {
                                outputs.staticFiles.push({
                                    id: `${localePage}.rsc`,
                                    pathname: `${localePage}.rsc`,
                                    type: AdapterOutputType.STATIC_FILE,
                                    filePath: rscFallbackPath,
                                    immutableHash: undefined
                                });
                            }
                        }
                    }
                } else {
                    outputs.pagesApi.push(output);
                }
            }
            if (hasNodeMiddleware) {
                var _functionConfig_matchers;
                const middlewareFile = path.join(distDir, 'server', 'middleware.js');
                const { assets, assetsHashes } = await handleTraceFiles(middlewareFile, 'neutral');
                const functionConfig = functionsConfigManifest.functions['/_middleware'] || {};
                outputs.middleware = {
                    pathname: '/_middleware',
                    id: '/_middleware',
                    sourcePage: 'middleware',
                    assets,
                    assetsHashes,
                    type: AdapterOutputType.MIDDLEWARE,
                    runtime: 'nodejs',
                    filePath: middlewareFile,
                    config: {
                        matchers: ((_functionConfig_matchers = functionConfig.matchers) == null ? void 0 : _functionConfig_matchers.map((item)=>{
                            return {
                                source: item.originalSource,
                                sourceRegex: item.regexp,
                                has: item.has,
                                missing: [
                                    ...item.missing || [],
                                    // always skip middleware for on-demand revalidate
                                    {
                                        type: 'header',
                                        key: 'x-prerender-revalidate',
                                        value: prerenderManifest.preview.previewModeId
                                    }
                                ]
                            };
                        })) || []
                    }
                };
            }
            const appOutputMap = {};
            const appDistDir = path.join(distDir, 'server', 'app');
            if (appPageKeys) {
                for (const page of appPageKeys){
                    var _config_i18n_locales, _config_i18n1;
                    if (middlewareManifest.functions.hasOwnProperty(page)) {
                        continue;
                    }
                    const normalizedPage = normalizeAppPath(page);
                    // Skip static metadata routes only when they are prerendered.
                    // Dynamic metadata routes (e.g. robots/sitemap using connection())
                    // should remain app routes in adapter outputs.
                    const isStaticMetadataRoute = isStaticMetadataFile(normalizedPage);
                    const staticMetadataPrerenderPathname = getStaticMetadataPrerenderPathname(normalizedPage) ?? normalizedPage;
                    const isPrerenderedMetadataRoute = prerenderManifest.routes[staticMetadataPrerenderPathname] || ((_config_i18n1 = config.i18n) == null ? void 0 : (_config_i18n_locales = _config_i18n1.locales) == null ? void 0 : _config_i18n_locales.some((locale)=>{
                        const localePathname = path.posix.join('/', locale, staticMetadataPrerenderPathname.slice(1));
                        return prerenderManifest.routes[localePathname];
                    }));
                    if (isStaticMetadataRoute && isPrerenderedMetadataRoute) {
                        continue;
                    }
                    const pageFile = path.join(appDistDir, `${page}.js`);
                    let { assets, assetsHashes } = await handleTraceFiles(pageFile, 'app').catch((err)=>{
                        Log.warn(`Failed to copy traced files for ${pageFile}`, err);
                        return {
                            assets: {},
                            assetsHashes: {}
                        };
                    });
                    // If this is a parallel route we just need to merge
                    // the assets as they share the same pathname
                    const existingOutput = appOutputMap[normalizedPage];
                    if (existingOutput) {
                        Object.assign(existingOutput.assets, assets);
                        Object.assign(existingOutput.assetsHashes, assetsHashes);
                        await pushAsset(existingOutput.assets, existingOutput.assetsHashes, path.relative(repoRoot, pageFile), pageFile, bundler, config.outputHashSalt || '');
                        continue;
                    }
                    const functionConfig = functionsConfigManifest.functions[normalizedPage] || {};
                    const output = {
                        pathname: normalizedPage,
                        id: normalizedPage,
                        sourcePage: page,
                        assets,
                        assetsHashes,
                        type: page.endsWith('/route') ? AdapterOutputType.APP_ROUTE : AdapterOutputType.APP_PAGE,
                        runtime: 'nodejs',
                        filePath: pageFile,
                        config: {
                            maxDuration: functionConfig.maxDuration,
                            preferredRegion: functionConfig.regions
                        }
                    };
                    appOutputMap[normalizedPage] = output;
                    if (output.type === AdapterOutputType.APP_PAGE) {
                        outputs.appPages.push({
                            ...output,
                            pathname: normalizePagePath(output.pathname) + '.rsc',
                            id: normalizePagePath(output.pathname) + '.rsc'
                        });
                        outputs.appPages.push(output);
                    } else {
                        outputs.appRoutes.push(output);
                        outputs.appRoutes.push({
                            ...output,
                            pathname: normalizePagePath(output.pathname) + '.rsc',
                            id: normalizePagePath(output.pathname) + '.rsc'
                        });
                    }
                }
            }
            const getParentOutput = (srcRoute, childRoute, allowMissing)=>{
                var _config_i18n;
                const normalizedSrcRoute = normalizeLocalePath(srcRoute, ((_config_i18n = config.i18n) == null ? void 0 : _config_i18n.locales) || []).pathname;
                const parentOutput = pageOutputMap[normalizedSrcRoute] || appOutputMap[normalizedSrcRoute];
                if (!parentOutput && !allowMissing) {
                    console.error({
                        appOutputs: Object.keys(appOutputMap),
                        pageOutputs: Object.keys(pageOutputMap)
                    });
                    throw Object.defineProperty(new Error(`Invariant: failed to find source route ${srcRoute} for prerender ${childRoute}`), "__NEXT_ERROR_CODE", {
                        value: "E777",
                        enumerable: false,
                        configurable: true
                    });
                }
                return parentOutput;
            };
            const { prefetchSegmentDirSuffix, prefetchSegmentSuffix, varyHeader, didPostponeHeader, contentTypeHeader: rscContentTypeHeader } = routesManifest.rsc;
            const handleAppMeta = async (route, initialOutput, meta, ctx)=>{
                if (meta.postponed && initialOutput.fallback) {
                    initialOutput.fallback.postponedState = meta.postponed;
                }
                if (meta == null ? void 0 : meta.segmentPaths) {
                    const normalizedRoute = normalizePagePath(route);
                    const segmentsDir = path.join(appDistDir, `${normalizedRoute}${prefetchSegmentDirSuffix}`);
                    // If client param parsing is enabled, we follow the same logic as
                    // the HTML allowQuery as it's already going to vary based on if
                    // there's a static shell generated or if there's fallback root
                    // params. If there are fallback root params, and we can serve a
                    // fallback, then we should follow the same logic for the segment
                    // prerenders.
                    //
                    // If client param parsing is not enabled, we have to use the
                    // allowQuery because the segment payloads will contain dynamic
                    // segment values.
                    const segmentAllowQuery = routesManifest.rsc.clientParamParsing ? ctx.htmlAllowQuery : ctx.dataAllowQuery;
                    for (const segmentPath of meta.segmentPaths){
                        var _initialOutput_fallback, _initialOutput_fallback1, _initialOutput_fallback2;
                        const outputSegmentPath = path.join(normalizedRoute + prefetchSegmentDirSuffix, segmentPath) + prefetchSegmentSuffix;
                        // Only use the fallback value when the allowQuery is defined and
                        // either: (1) it is empty, meaning segments do not vary by params,
                        // or (2) client param parsing is enabled, meaning the segment
                        // payloads are safe to reuse across params.
                        const shouldAttachSegmentFallback = segmentAllowQuery && (segmentAllowQuery.length === 0 || routesManifest.rsc.clientParamParsing);
                        const fallbackPathname = shouldAttachSegmentFallback ? path.join(segmentsDir, segmentPath + prefetchSegmentSuffix) : undefined;
                        outputs.prerenders.push({
                            id: outputSegmentPath,
                            pathname: outputSegmentPath,
                            type: AdapterOutputType.PRERENDER,
                            parentOutputId: initialOutput.parentOutputId,
                            groupId: initialOutput.groupId,
                            route: initialOutput.route,
                            config: {
                                ...initialOutput.config,
                                bypassFor: undefined,
                                partialFallback: initialOutput.config.partialFallback
                            },
                            fallback: {
                                filePath: fallbackPathname,
                                postponedState: undefined,
                                initialExpiration: (_initialOutput_fallback = initialOutput.fallback) == null ? void 0 : _initialOutput_fallback.initialExpiration,
                                initialRevalidate: (_initialOutput_fallback1 = initialOutput.fallback) == null ? void 0 : _initialOutput_fallback1.initialRevalidate,
                                initialHeaders: {
                                    ...meta.headers,
                                    ...(_initialOutput_fallback2 = initialOutput.fallback) == null ? void 0 : _initialOutput_fallback2.initialHeaders,
                                    vary: varyHeader,
                                    'content-type': rscContentTypeHeader,
                                    [didPostponeHeader]: '2'
                                }
                            }
                        });
                    }
                }
            };
            let prerenderGroupId = 1;
            const getAppRouteMeta = async (route, isAppPage)=>{
                const basename = route.endsWith('/') ? `${route}index` : route;
                const meta = isAppPage ? JSON.parse(await fs.readFile(path.join(appDistDir, `${basename}.meta`), 'utf8').catch(()=>'{}')) : {};
                if (meta.headers) {
                    // normalize these for consistency
                    for (const key of Object.keys(meta.headers)){
                        const keyLower = key.toLowerCase();
                        let value = meta.headers[key];
                        // normalize values to strings (e.g. set-cookie can be an array)
                        if (Array.isArray(value)) {
                            value = value.join(', ');
                        } else if (typeof value !== 'string') {
                            value = String(value);
                        }
                        if (keyLower !== key) {
                            delete meta.headers[key];
                        }
                        meta.headers[keyLower] = value;
                    }
                }
                return meta;
            };
            const filePathCache = new Map();
            const cachedFilePathCheck = async (filePath)=>{
                if (filePathCache.has(filePath)) {
                    return filePathCache.get(filePath);
                }
                const newCheck = fs.access(filePath).then(()=>true).catch(()=>false);
                filePathCache.set(filePath, newCheck);
                return newCheck;
            };
            for(const route in prerenderManifest.routes){
                var _routesManifest_dynamicRoutes_find;
                const { initialExpireSeconds: initialExpiration, initialRevalidateSeconds: initialRevalidate, initialHeaders, initialStatus, dataRoute, prefetchDataRoute, renderingMode, routeType, response, compute, htmlSize, allowHeader, experimentalBypassFor } = prerenderManifest.routes[route];
                const srcRoute = prerenderManifest.routes[route].srcRoute || route;
                const srcRouteInfo = prerenderManifest.dynamicRoutes[srcRoute];
                const isAppPage = Boolean(appOutputMap[srcRoute]) || srcRoute === '/_not-found';
                const isNotFoundTrue = prerenderManifest.notFoundRoutes.includes(route);
                let allowQuery;
                const routeKeys = (_routesManifest_dynamicRoutes_find = routesManifest.dynamicRoutes.find((item)=>item.page === srcRoute)) == null ? void 0 : _routesManifest_dynamicRoutes_find.routeKeys;
                if (!isDynamicRoute(route)) {
                    // for non-dynamic routes we use an empty array since
                    // no query values bust the cache for non-dynamic prerenders
                    // prerendered paths also do not pass allowQuery as they match
                    // during handle: 'filesystem' so should not cache differently
                    // by query values
                    allowQuery = [];
                } else if (routeKeys) {
                    // if we have routeKeys in the routes-manifest we use those
                    // for allowQuery for dynamic routes
                    allowQuery = Object.values(routeKeys);
                }
                let filePath = path.join(isAppPage ? appDistDir : pagesDistDir, `${normalizePagePath(route)}.${isAppPage && !dataRoute ? 'body' : 'html'}`);
                // Check if this is a static metadata route (e.g., /favicon.ico, /icon.png, /opengraph-image.png)
                // These should be output as static files, not prerenders.
                if (isStaticMetadataFile(route)) {
                    // For static metadata from app router, check if the .body file exists
                    const staticMetadataFilePath = path.join(appDistDir, `${normalizePagePath(route)}.body`);
                    if (await cachedFilePathCheck(staticMetadataFilePath)) {
                        outputs.staticFiles.push({
                            id: route,
                            pathname: route,
                            type: AdapterOutputType.STATIC_FILE,
                            filePath: staticMetadataFilePath,
                            immutableHash: undefined
                        });
                        continue;
                    }
                }
                // we use the static 404 for notFound: true if available
                // if not we do a blocking invoke on first request
                if (isNotFoundTrue && hasStatic404) {
                    var _config_i18n2;
                    const locale = config.i18n && normalizeLocalePath(route, (_config_i18n2 = config.i18n) == null ? void 0 : _config_i18n2.locales).detectedLocale;
                    for (const currentFilePath of [
                        path.join(pagesDistDir, locale || '', '404.html'),
                        path.join(pagesDistDir, '404.html')
                    ]){
                        if (await cachedFilePathCheck(currentFilePath)) {
                            filePath = currentFilePath;
                            break;
                        }
                    }
                }
                const meta = await getAppRouteMeta(route, isAppPage);
                // If we already have a complete 404.html, favor that instead of the
                // _not-found prerender. A route with postponed state only produced a
                // shell, so preserve its prerender output in order to resume it.
                if (srcRoute === '/_not-found' && hasStatic404 && !meta.postponed) {
                    continue;
                }
                let htmlAllowQuery = allowQuery;
                let dataAllowQuery = allowQuery;
                const dataInitialHeaders = {};
                // We additionally vary based on if there's a postponed prerender
                // because if there isn't, then that means that we generated an
                // empty shell, and producing an empty RSC shell would be a waste.
                // If there is a postponed prerender, then the RSC shell would be
                // non-empty, and it would be valuable to also generate an empty
                // RSC shell.
                if (meta.postponed) {
                    htmlAllowQuery = [];
                    if (routesManifest.rsc.dynamicRSCPrerender) {
                        // If client param parsing is enabled, we follow the same logic as the
                        // HTML allowQuery as it's already going to vary based on if there's a
                        // static shell generated or if there's fallback root params. If there
                        // are fallback root params, and we can serve a fallback, then we
                        // should follow the same logic for the dynamic RSC routes.
                        //
                        // If client param parsing is not enabled, we have to use the
                        // allowQuery because the RSC payloads will contain dynamic segment
                        // values.
                        if (routesManifest.rsc.clientParamParsing) {
                            dataAllowQuery = htmlAllowQuery;
                        }
                    }
                }
                if (renderingMode === RenderingMode.PARTIALLY_STATIC) {
                    // Dynamic RSC requests cannot be cached, so we explicity set it
                    // here to ensure that the response is not cached by the browser.
                    dataInitialHeaders['cache-control'] = 'private, no-store, no-cache, max-age=0, must-revalidate';
                }
                const classification = getPrerenderClassification(route, routeType, response, compute, htmlSize);
                const initialOutput = {
                    id: route,
                    type: AdapterOutputType.PRERENDER,
                    pathname: route,
                    parentOutputId: srcRoute === '/_not-found' ? srcRoute : getParentOutput(srcRoute, route).id,
                    groupId: prerenderGroupId,
                    route: srcRoute,
                    pprChain: isAppPage && renderingMode === RenderingMode.PARTIALLY_STATIC ? {
                        headers: {
                            [NEXT_RESUME_HEADER]: '1'
                        }
                    } : undefined,
                    parentFallbackMode: srcRouteInfo == null ? void 0 : srcRouteInfo.fallback,
                    fallback: !isNotFoundTrue || isNotFoundTrue && hasStatic404 ? {
                        filePath,
                        postponedState: undefined,
                        initialStatus: initialStatus ?? meta.status ?? (isNotFoundTrue ? 404 : undefined),
                        initialHeaders: {
                            ...initialHeaders,
                            vary: varyHeader,
                            'content-type': HTML_CONTENT_TYPE_HEADER,
                            ...meta.headers
                        },
                        initialExpiration,
                        initialRevalidate: typeof initialRevalidate === 'undefined' ? 1 : initialRevalidate
                    } : undefined,
                    config: {
                        allowQuery,
                        allowHeader,
                        renderingMode,
                        bypassFor: isAppPage && srcRoute !== '/_not-found' ? experimentalBypassFor : undefined,
                        bypassToken: prerenderManifest.preview.previewModeId
                    }
                };
                // Classification describes the primary HTML or Route Handler body,
                // not the related RSC/data/segment outputs that spread initialOutput.
                // The shallow spread shares `fallback` by reference, so
                // handleAppMeta's postponedState mutation still reaches this output.
                outputs.prerenders.push({
                    ...initialOutput,
                    ...classification
                });
                if (!isAppPage && appPageKeys && appPageKeys.length > 0) {
                    const rscPage = `${route === '/' ? '/index' : route}.rsc`;
                    outputs.staticFiles.push({
                        id: rscPage,
                        pathname: rscPage,
                        type: AdapterOutputType.STATIC_FILE,
                        filePath: rscFallbackPath,
                        immutableHash: undefined
                    });
                }
                if (dataRoute) {
                    let dataFilePath = path.join(pagesDistDir, `${normalizePagePath(route)}.json`);
                    let postponed = meta.postponed;
                    const dataRouteToUse = renderingMode === RenderingMode.PARTIALLY_STATIC && prefetchDataRoute ? prefetchDataRoute : dataRoute;
                    if (isAppPage) {
                        var _this;
                        // When experimental PPR is enabled, we expect that the data
                        // that should be served as a part of the prerender should
                        // be from the prefetch data route. If this isn't enabled
                        // for ppr, the only way to get the data is from the data
                        // route.
                        dataFilePath = path.join(appDistDir, (_this = dataRouteToUse ?? dataRoute) == null ? void 0 : _this.replace(/^\//, ''));
                    }
                    if (renderingMode === RenderingMode.PARTIALLY_STATIC && !await cachedFilePathCheck(dataFilePath)) {
                        var _initialOutput_fallback;
                        outputs.prerenders.push({
                            ...initialOutput,
                            id: dataRoute,
                            pathname: dataRoute,
                            fallback: {
                                ...initialOutput.fallback,
                                postponedState: postponed,
                                initialStatus: undefined,
                                initialHeaders: {
                                    ...(_initialOutput_fallback = initialOutput.fallback) == null ? void 0 : _initialOutput_fallback.initialHeaders,
                                    ...dataInitialHeaders,
                                    'content-type': isAppPage ? rscContentTypeHeader : JSON_CONTENT_TYPE_HEADER
                                },
                                filePath: undefined
                            }
                        });
                    } else {
                        var _initialOutput_fallback1;
                        outputs.prerenders.push({
                            ...initialOutput,
                            id: dataRoute,
                            pathname: dataRoute,
                            fallback: isNotFoundTrue ? undefined : {
                                ...initialOutput.fallback,
                                initialStatus: undefined,
                                initialHeaders: {
                                    ...(_initialOutput_fallback1 = initialOutput.fallback) == null ? void 0 : _initialOutput_fallback1.initialHeaders,
                                    ...dataInitialHeaders,
                                    'content-type': isAppPage ? rscContentTypeHeader : JSON_CONTENT_TYPE_HEADER
                                },
                                postponedState: undefined,
                                filePath: dataFilePath
                            }
                        });
                    }
                }
                if (isAppPage) {
                    await handleAppMeta(route, initialOutput, meta, {
                        htmlAllowQuery,
                        dataAllowQuery
                    });
                }
                prerenderGroupId += 1;
            }
            for(const dynamicRoute in prerenderManifest.dynamicRoutes){
                var _routesManifest_dynamicRoutes_find1;
                if (isStaticMetadataFile(dynamicRoute)) {
                    continue;
                }
                const { fallback, fallbackExpire, fallbackRevalidate, fallbackHeaders, fallbackStatus, fallbackSourceRoute, fallbackRootParams, remainingPrerenderableParams, allowHeader, dataRoute, renderingMode, routeType, response, compute, htmlSize, experimentalBypassFor } = prerenderManifest.dynamicRoutes[dynamicRoute];
                const srcRoute = fallbackSourceRoute || dynamicRoute;
                const parentOutput = getParentOutput(srcRoute, dynamicRoute);
                const isAppPage = Boolean(appOutputMap[srcRoute]);
                const meta = await getAppRouteMeta(dynamicRoute, isAppPage);
                const routeKeys = ((_routesManifest_dynamicRoutes_find1 = routesManifest.dynamicRoutes.find((item)=>item.page === dynamicRoute)) == null ? void 0 : _routesManifest_dynamicRoutes_find1.routeKeys) || {};
                const allowQuery = Object.values(routeKeys);
                const partialFallback = // Partial fallback shells are only emitted when Partial Prefetching
                // is enabled in the app's Next.js config.
                Boolean(config.partialPrefetching) && isAppPage && remainingPrerenderableParams !== undefined && remainingPrerenderableParams.length > 0 && renderingMode === RenderingMode.PARTIALLY_STATIC && typeof fallback === 'string' && Boolean(meta.postponed);
                const canEmitPartialFallback = partialFallback && (fallbackRootParams == null ? void 0 : fallbackRootParams.length) === 0;
                let htmlAllowQuery = allowQuery;
                let didFilterBlockingAllowQuery = false;
                // We only want to vary on the shell contents if there is a fallback
                // present and able to be served.
                if (typeof fallback === 'string') {
                    if (fallbackRootParams && fallbackRootParams.length > 0) {
                        htmlAllowQuery = fallbackRootParams;
                    } else if (meta.postponed) {
                        // If there's postponed fallback content, we usually collapse to a shared shell (`[]`).
                        // For partial fallbacks in cache components, keep only the
                        // params that can still complete this shell.
                        const remainingPrerenderableQueryKeys = new Set((remainingPrerenderableParams ?? []).map((param)=>`${NEXT_QUERY_PARAM_PREFIX}${param.paramName}`));
                        htmlAllowQuery = canEmitPartialFallback && routesManifest.rsc.clientParamParsing ? Object.values(routeKeys).filter((routeKey)=>remainingPrerenderableQueryKeys.has(routeKey)) : [];
                    }
                } else if (fallback === null && isAppPage && renderingMode === RenderingMode.PARTIALLY_STATIC && routesManifest.rsc.clientParamParsing && remainingPrerenderableParams !== undefined) {
                    // BLOCKING entries (no servable fallback) still cache their
                    // on-demand renders, so the same cache-key contract applies as for
                    // partial fallbacks: only params that `generateStaticParams` can
                    // still provide may partition the cache — root params (which are
                    // always provided) and the remaining prerenderable params.
                    // Including a never-prerenderable param would create a cache entry
                    // per param value and resolve the param into the cached content,
                    // so it must be stripped from the request instead, which defers it
                    // to a per-request resume.
                    const prerenderableQueryKeys = new Set();
                    for (const paramName of fallbackRootParams ?? []){
                        prerenderableQueryKeys.add(`${NEXT_QUERY_PARAM_PREFIX}${paramName}`);
                    }
                    for (const param of remainingPrerenderableParams){
                        prerenderableQueryKeys.add(`${NEXT_QUERY_PARAM_PREFIX}${param.paramName}`);
                    }
                    htmlAllowQuery = allowQuery.filter((routeKey)=>prerenderableQueryKeys.has(routeKey));
                    didFilterBlockingAllowQuery = true;
                }
                // app router dynamic route fallbacks don't have the extension so
                // ensure it's added here
                const fallbackHtmlFile = typeof fallback === 'string' ? fallback.endsWith('.html') ? fallback : `${fallback}.html` : undefined;
                const fallbackHtmlPath = fallbackHtmlFile !== undefined ? path.join(isAppPage ? appDistDir : pagesDistDir, fallbackHtmlFile) : undefined;
                const classification = getPrerenderClassification(dynamicRoute, routeType, response, compute, htmlSize);
                const initialOutput = {
                    id: dynamicRoute,
                    type: AdapterOutputType.PRERENDER,
                    pathname: dynamicRoute,
                    parentOutputId: parentOutput.id,
                    groupId: prerenderGroupId,
                    route: srcRoute,
                    pprChain: isAppPage && renderingMode === RenderingMode.PARTIALLY_STATIC ? {
                        headers: {
                            [NEXT_RESUME_HEADER]: '1'
                        }
                    } : undefined,
                    fallback: fallbackHtmlPath !== undefined ? {
                        filePath: fallbackHtmlPath,
                        postponedState: undefined,
                        initialStatus: fallbackStatus ?? meta.status,
                        initialHeaders: {
                            ...fallbackHeaders,
                            ...(appPageKeys == null ? void 0 : appPageKeys.length) ? {
                                vary: varyHeader
                            } : {},
                            'content-type': HTML_CONTENT_TYPE_HEADER,
                            ...meta.headers
                        },
                        initialExpiration: fallbackExpire,
                        initialRevalidate: fallbackRevalidate ?? 1
                    } : undefined,
                    config: {
                        allowQuery: htmlAllowQuery,
                        allowHeader,
                        renderingMode,
                        partialFallback: canEmitPartialFallback || undefined,
                        bypassFor: isAppPage ? experimentalBypassFor : undefined,
                        bypassToken: prerenderManifest.preview.previewModeId
                    }
                };
                if (!config.i18n || isAppPage) {
                    // Classification describes only the primary HTML response, not the
                    // related RSC/data/segment outputs that spread initialOutput. The
                    // shallow spread shares `fallback` by reference, so handleAppMeta's
                    // postponedState mutation still reaches this output.
                    outputs.prerenders.push({
                        ...initialOutput,
                        ...classification
                    });
                    if (!isAppPage && fallback !== false && appPageKeys && appPageKeys.length > 0) {
                        const rscPage = `${srcRoute === '/' ? '/index' : srcRoute}.rsc`;
                        outputs.staticFiles.push({
                            id: rscPage,
                            pathname: rscPage,
                            type: AdapterOutputType.STATIC_FILE,
                            filePath: rscFallbackPath,
                            immutableHash: undefined
                        });
                    }
                    let dataAllowQuery = allowQuery;
                    const dataInitialHeaders = {};
                    if (meta.postponed && routesManifest.rsc.dynamicRSCPrerender) {
                        // If client param parsing is enabled, we follow the same logic as the
                        // HTML allowQuery as it's already going to vary based on if there's a
                        // static shell generated or if there's fallback root params. If there
                        // are fallback root params, and we can serve a fallback, then we
                        // should follow the same logic for the dynamic RSC routes.
                        //
                        // If client param parsing is not enabled, we have to use the
                        // allowQuery because the RSC payloads will contain dynamic segment
                        // values.
                        if (routesManifest.rsc.clientParamParsing) {
                            dataAllowQuery = htmlAllowQuery;
                        }
                    } else if (didFilterBlockingAllowQuery) {
                        // Blocking entries have no fallback shell whose presence could
                        // make the data route vary differently from the HTML route: the
                        // on-demand data render is cached under the same
                        // prerenderable-params-only contract.
                        dataAllowQuery = htmlAllowQuery;
                    }
                    if (renderingMode === RenderingMode.PARTIALLY_STATIC) {
                        // Dynamic RSC requests cannot be cached, so we explicity set it
                        // here to ensure that the response is not cached by the browser.
                        dataInitialHeaders['cache-control'] = 'private, no-store, no-cache, max-age=0, must-revalidate';
                    }
                    if (isAppPage) {
                        await handleAppMeta(dynamicRoute, initialOutput, meta, {
                            htmlAllowQuery,
                            dataAllowQuery
                        });
                    }
                    if (renderingMode === RenderingMode.PARTIALLY_STATIC) {
                        var _initialOutput_fallback2;
                        outputs.prerenders.push({
                            ...initialOutput,
                            id: `${dynamicRoute}.rsc`,
                            pathname: `${dynamicRoute}.rsc`,
                            fallback: {
                                ...initialOutput.fallback,
                                filePath: undefined,
                                postponedState: meta.postponed,
                                initialStatus: undefined,
                                initialHeaders: {
                                    ...(_initialOutput_fallback2 = initialOutput.fallback) == null ? void 0 : _initialOutput_fallback2.initialHeaders,
                                    ...dataInitialHeaders,
                                    'content-type': isAppPage ? rscContentTypeHeader : JSON_CONTENT_TYPE_HEADER
                                }
                            },
                            config: {
                                ...initialOutput.config,
                                allowQuery: dataAllowQuery,
                                partialFallback: undefined
                            }
                        });
                    } else if (dataRoute) {
                        outputs.prerenders.push({
                            ...initialOutput,
                            id: dataRoute,
                            pathname: dataRoute,
                            fallback: undefined,
                            config: {
                                ...initialOutput.config,
                                partialFallback: undefined
                            }
                        });
                    }
                    prerenderGroupId += 1;
                } else {
                    for (const locale of config.i18n.locales){
                        const currentOutput = {
                            ...initialOutput,
                            pathname: path.posix.join(`/${locale}`, initialOutput.pathname),
                            id: path.posix.join(`/${locale}`, initialOutput.id),
                            fallback: fallbackHtmlFile !== undefined ? {
                                ...initialOutput.fallback,
                                initialStatus: undefined,
                                postponedState: undefined,
                                filePath: path.join(pagesDistDir, locale, fallbackHtmlFile)
                            } : undefined,
                            groupId: prerenderGroupId
                        };
                        outputs.prerenders.push(currentOutput);
                        if (!isAppPage && fallback !== false && appPageKeys && appPageKeys.length > 0) {
                            const rscPage = `${path.posix.join(`/${locale}`, initialOutput.pathname)}.rsc`;
                            outputs.staticFiles.push({
                                id: rscPage,
                                pathname: rscPage,
                                type: AdapterOutputType.STATIC_FILE,
                                filePath: rscFallbackPath,
                                immutableHash: undefined
                            });
                        }
                        if (dataRoute) {
                            const dataPathname = path.posix.join(`/_next/data`, buildId, locale, dynamicRoute + '.json');
                            outputs.prerenders.push({
                                ...initialOutput,
                                id: dataPathname,
                                pathname: dataPathname,
                                // data route doesn't have skeleton fallback
                                fallback: undefined,
                                config: {
                                    ...initialOutput.config,
                                    partialFallback: undefined
                                },
                                groupId: prerenderGroupId
                            });
                        }
                        prerenderGroupId += 1;
                    }
                }
            }
            // ensure 404
            const staticErrorDocs = [
                ...hasStatic404 ? [
                    '/404'
                ] : [],
                ...hasStatic500 ? [
                    '/500'
                ] : []
            ];
            for (const errorDoc of staticErrorDocs){
                var _config_i18n3;
                const errorDocPath = path.posix.join('/', ((_config_i18n3 = config.i18n) == null ? void 0 : _config_i18n3.defaultLocale) || '', errorDoc);
                if (!prerenderManifest.routes[errorDocPath]) {
                    var _config_i18n_locales1, _config_i18n4;
                    for (const currentDocPath of [
                        errorDocPath,
                        ...((_config_i18n4 = config.i18n) == null ? void 0 : (_config_i18n_locales1 = _config_i18n4.locales) == null ? void 0 : _config_i18n_locales1.filter((locale)=>{
                            var _config_i18n;
                            return locale !== ((_config_i18n = config.i18n) == null ? void 0 : _config_i18n.defaultLocale);
                        }).map((locale)=>path.posix.join('/', locale, errorDoc))) || []
                    ]){
                        // skip if this static file was already emitted for an
                        // auto-static-optimized page above to avoid duplicate entries
                        if (emittedStaticFilePathnames.has(currentDocPath)) {
                            continue;
                        }
                        const currentFilePath = path.join(pagesDistDir, `${currentDocPath}.html`);
                        if (await cachedFilePathCheck(currentFilePath)) {
                            outputs.staticFiles.push({
                                pathname: currentDocPath,
                                id: currentDocPath,
                                type: AdapterOutputType.STATIC_FILE,
                                filePath: currentFilePath,
                                immutableHash: undefined
                            });
                        }
                    }
                }
            }
        }
        normalizePathnames(config, outputs);
        const dynamicRoutes = [];
        const dynamicDataRoutes = [];
        const dynamicSegmentRoutes = [];
        const getDestinationQuery = (routeKeys)=>{
            const items = Object.entries(routeKeys ?? {});
            if (items.length === 0) return '';
            return '?' + items.map(([key, value])=>`${value}=$${key}`).join('&');
        };
        const fallbackFalseHasCondition = [
            {
                type: 'cookie',
                key: '__prerender_bypass',
                value: prerenderManifest.preview.previewModeId
            },
            {
                type: 'cookie',
                key: '__next_preview_data'
            }
        ];
        for (const route of routesManifest.dynamicRoutes){
            var _prerenderManifest_dynamicRoutes_route_page;
            const shouldLocalize = Boolean(config.i18n);
            const routeRegex = getNamedRouteRegex(route.page, {
                prefixRouteKeys: true
            });
            const isFallbackFalse = ((_prerenderManifest_dynamicRoutes_route_page = prerenderManifest.dynamicRoutes[route.page]) == null ? void 0 : _prerenderManifest_dynamicRoutes_route_page.fallback) === false;
            const sourceRegex = routeRegex.namedRegex.replace('^', `^${config.basePath && config.basePath !== '/' ? path.posix.join('/', config.basePath || '') : ''}[/]?${shouldLocalize ? '(?<nextLocale>[^/]{1,})' : ''}`);
            const destination = path.posix.join('/', config.basePath, shouldLocalize ? '/$nextLocale' : '', route.page) + getDestinationQuery(route.routeKeys);
            if (appPageKeys && appPageKeys.length > 0) {
                dynamicRoutes.push({
                    source: route.page + '.rsc',
                    sourceRegex: sourceRegex.replace(new RegExp(escapeStringRegexp('(?:/)?$')), '(?<rscSuffix>\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$'),
                    destination: destination == null ? void 0 : destination.replace(/($|\?)/, '$rscSuffix$1'),
                    has: isFallbackFalse && !pageKeys.includes(route.page) ? fallbackFalseHasCondition : undefined,
                    missing: undefined
                });
            }
            // needs basePath and locale handling if pages router
            dynamicRoutes.push({
                source: route.page,
                sourceRegex,
                destination,
                has: isFallbackFalse ? fallbackFalseHasCondition : undefined,
                missing: undefined
            });
            for (const segmentRoute of route.prefetchSegmentDataRoutes || []){
                dynamicSegmentRoutes.push({
                    source: route.page,
                    sourceRegex: segmentRoute.source.replace('^', `^${config.basePath && config.basePath !== '/' ? path.posix.join('/', config.basePath || '') : ''}[/]?`),
                    destination: path.posix.join('/', config.basePath, segmentRoute.destination + getDestinationQuery(segmentRoute.routeKeys)),
                    has: undefined,
                    missing: undefined
                });
            }
        }
        const needsMiddlewareResolveRoutes = outputs.middleware && outputs.pages.length > 0;
        const dataRoutePages = new Set([
            ...routesManifest.dataRoutes.map((item)=>item.page)
        ]);
        const sortedDataPages = sortSortableRoutes([
            ...needsMiddlewareResolveRoutes ? [
                ...staticPages
            ].map((page)=>({
                    sourcePage: page,
                    page
                })) : [],
            ...routesManifest.dataRoutes.map((item)=>({
                    sourcePage: item.page,
                    page: item.page
                }))
        ]);
        for (const { page } of sortedDataPages){
            if (needsMiddlewareResolveRoutes || isDynamicRoute(page)) {
                var _prerenderManifest_dynamicRoutes_page;
                const shouldLocalize = config.i18n;
                const isFallbackFalse = ((_prerenderManifest_dynamicRoutes_page = prerenderManifest.dynamicRoutes[page]) == null ? void 0 : _prerenderManifest_dynamicRoutes_page.fallback) === false;
                const routeRegex = getNamedRouteRegex(page + '.json', {
                    prefixRouteKeys: true,
                    includeSuffix: true
                });
                const isDataRoute = dataRoutePages.has(page);
                const destination = path.posix.join('/', config.basePath, ...isDataRoute ? [
                    `_next/data`,
                    buildId
                ] : '', ...page === '/' ? [
                    shouldLocalize ? '$nextLocale.json' : 'index.json'
                ] : [
                    shouldLocalize ? '$nextLocale' : '',
                    page + (isDataRoute ? '.json' : '') + getDestinationQuery(routeRegex.routeKeys || {})
                ]);
                dynamicDataRoutes.push({
                    source: page,
                    sourceRegex: shouldLocalize && page === '/' ? '^' + path.posix.join('/', config.basePath, '_next/data', escapeStringRegexp(buildId), '(?<nextLocale>[^/]{1,}).json') : routeRegex.namedRegex.replace('^', `^${path.posix.join('/', config.basePath, `_next/data`, escapeStringRegexp(buildId))}[/]?${shouldLocalize ? '(?<nextLocale>[^/]{1,})' : ''}`),
                    destination,
                    has: isFallbackFalse ? fallbackFalseHasCondition : undefined,
                    missing: undefined
                });
            }
        }
        const buildRewriteItem = (route)=>{
            const converted = convertRewrites([
                route
            ], [
                'nextInternalLocale'
            ])[0];
            const regex = converted.src || route.regex;
            return {
                source: route.source,
                sourceRegex: route.internal ? regex : modifyRouteRegex(regex),
                destination: converted.dest || route.destination,
                has: route.has,
                missing: route.missing
            };
        };
        const buildRouteFromHeader = (route)=>{
            const converted = convertHeaders([
                route
            ])[0];
            const regex = converted.src || route.regex;
            return {
                source: route.source,
                sourceRegex: route.internal ? regex : modifyRouteRegex(regex),
                headers: 'headers' in converted ? converted.headers || {} : {},
                has: route.has,
                missing: route.missing,
                priority: route.internal || undefined
            };
        };
        try {
            var _outputs_middleware_config_matchers, _outputs_middleware;
            Log.info(`Running onBuildComplete from ${adapterMod.name}`);
            const combinedDynamicRoutes = [
                ...dynamicDataRoutes,
                ...dynamicSegmentRoutes,
                ...dynamicRoutes
            ];
            const rewrites = {
                beforeFiles: routesManifest.rewrites.beforeFiles.map(buildRewriteItem),
                afterFiles: routesManifest.rewrites.afterFiles.map(buildRewriteItem),
                fallback: routesManifest.rewrites.fallback.map(buildRewriteItem)
            };
            const redirects = routesManifest.redirects.map((route)=>{
                const converted = convertRedirects([
                    route
                ], 307)[0];
                const regex = converted.src || route.regex;
                return {
                    source: route.source,
                    sourceRegex: route.internal ? regex : modifyRouteRegex(regex),
                    headers: 'headers' in converted ? converted.headers || {} : {},
                    status: converted.status || getRedirectStatus(route),
                    has: route.has,
                    missing: route.missing,
                    priority: route.internal || undefined
                };
            });
            const headers = routesManifest.headers.map((route)=>buildRouteFromHeader(route));
            const onMatchHeaders = routesManifest.onMatchHeaders.map((route)=>buildRouteFromHeader(route));
            await adapterMod.onBuildComplete({
                routing: {
                    beforeMiddleware: [
                        ...headers,
                        ...redirects
                    ],
                    middlewareMatchers: ((_outputs_middleware = outputs.middleware) == null ? void 0 : (_outputs_middleware_config_matchers = _outputs_middleware.config.matchers) == null ? void 0 : _outputs_middleware_config_matchers.map((matcher)=>({
                            source: matcher.source,
                            sourceRegex: matcher.sourceRegex,
                            has: matcher.has,
                            missing: matcher.missing
                        }))) ?? [],
                    beforeFiles: rewrites.beforeFiles,
                    afterFiles: rewrites.afterFiles,
                    dynamicRoutes: combinedDynamicRoutes,
                    onMatch: [
                        {
                            // This ensures we only match known emitted-by-Next.js files and not
                            // user-emitted files which may be missing a hash in their filename.
                            sourceRegex: `${path.posix.join(config.basePath || '/', '_next/static', `/(?:[^/]+/pages|pages|chunks|immutable|runtime|css|image|media|${escapeStringRegexp(buildId)})/.+`)}`,
                            // Next.js assets contain a hash or entropy in their filenames, so they
                            // are guaranteed to be unique and cacheable indefinitely.
                            headers: {
                                'cache-control': `public,max-age=${CACHE_ONE_YEAR_SECONDS},immutable`
                            }
                        },
                        ...onMatchHeaders
                    ],
                    fallback: rewrites.fallback,
                    shouldNormalizeNextData: !!needsMiddlewareResolveRoutes,
                    rsc: generateRoutesManifest({
                        appType,
                        pageKeys: {
                            pages: pageKeys,
                            app: appPageKeys
                        },
                        config,
                        redirects: [],
                        headers: [],
                        onMatchHeaders: [],
                        rewrites,
                        restrictedRedirectPaths: [],
                        isAppPPREnabled: config.cacheComponents
                    }).routesManifest.rsc
                },
                outputs,
                config,
                distDir,
                buildId,
                nextVersion,
                projectDir: dir,
                repoRoot: repoRoot
            });
        } catch (err) {
            Log.error(`Failed to run onBuildComplete from ${adapterMod.name}`);
            throw err;
        }
    }
}
async function getSharedNodeAssets({ dir, bundler, distDir, repoRoot, outputFileTracingRoot, requiredServerFiles, hasInstrumentationHook, config }) {
    const sharedNodeAssets = {};
    const sharedNodeAssetsHashes = {};
    const pagesSharedNodeAssets = {};
    const pagesSharedNodeAssetsHashes = {};
    const appPagesSharedNodeAssets = {};
    const appPagesSharedNodeAssetsHashes = {};
    const salt = config.outputHashSalt || '';
    const moduleTypes = [
        'app-page',
        'pages'
    ];
    for (const type of moduleTypes){
        const currentDependencies = [];
        const modulePath = require.resolve(`next/dist/server/route-modules/${type}/module.compiled`);
        currentDependencies.push(modulePath);
        const contextDir = path.join(path.dirname(modulePath), 'vendored', 'contexts');
        for (const item of (await fs.readdir(contextDir))){
            if (item.match(/\.(mjs|cjs|js)$/)) {
                currentDependencies.push(path.join(contextDir, item));
            }
        }
        for (const dependencyPath of currentDependencies){
            const rootRelativeFilePath = path.relative(repoRoot, dependencyPath);
            if (type === 'pages') {
                await pushAsset(pagesSharedNodeAssets, pagesSharedNodeAssetsHashes, rootRelativeFilePath, path.join(repoRoot, rootRelativeFilePath), bundler, salt);
            } else {
                await pushAsset(appPagesSharedNodeAssets, appPagesSharedNodeAssetsHashes, rootRelativeFilePath, path.join(repoRoot, rootRelativeFilePath), bundler, salt);
            }
        }
    }
    // add "next/setup-node-env" stub so it can be required top-level
    // TODO: should we make this always available without adapters
    const setupNodeStubPath = path.join(path.dirname(require.resolve('next/package.json')), 'setup-node-env.js');
    await pushAsset(sharedNodeAssets, sharedNodeAssetsHashes, path.relative(repoRoot, setupNodeStubPath), require.resolve('next/dist/build/adapter/setup-node-env.external'), bundler, salt);
    // Turbopack traces these itself, they are listed in the nft.json files.
    if (bundler !== Bundler.Turbopack) {
        const { nodeFileTrace } = require('next/dist/compiled/@vercel/nft');
        const { makeIgnoreFn } = require('../collect-build-traces');
        const sharedTraceIgnores = [
            '**/next/dist/compiled/next-server/**/*.dev.js',
            '**/next/dist/compiled/webpack/*',
            '**/node_modules/webpack5/**/*',
            '**/next/dist/server/lib/route-resolver*',
            'next/dist/compiled/semver/semver/**/*.js',
            '**/node_modules/react{,-dom,-dom-server-turbopack}/**/*.development.js',
            '**/*.d.ts',
            '**/*.map',
            '**/next/dist/pages/**/*',
            '**/node_modules/sharp/**/*',
            '**/@img/sharp-libvips*/**/*',
            '**/next/dist/compiled/edge-runtime/**/*',
            '**/next/dist/server/web/sandbox/**/*',
            '**/next/dist/server/post-process.js'
        ];
        const sharedIgnoreFn = makeIgnoreFn(outputFileTracingRoot, sharedTraceIgnores);
        // These are modules that are necessary for bootstrapping node env
        const necessaryNodeDependencies = [
            require.resolve('next/dist/server/node-environment'),
            require.resolve('next/dist/server/require-hook'),
            require.resolve('next/dist/server/node-polyfill-crypto'),
            // Nothing references these, the require hook resolves them at runtime.
            // Turbopack traces them via `Project::pages_traced_modules`.
            ...Object.values(defaultOverrides).filter((item)=>path.extname(item))
        ];
        const { cacheHandler, cacheHandlers } = config;
        // ensure we trace any dependencies needed for a custom incremental cache handler
        if (cacheHandler) {
            const resolvedPath = resolveCacheHandlerPathToFilesystem(cacheHandler);
            necessaryNodeDependencies.push(require.resolve(path.isAbsolute(resolvedPath) ? resolvedPath : path.join(dir, resolvedPath)));
        }
        if (cacheHandlers) {
            for (const handlerPath of Object.values(cacheHandlers)){
                if (handlerPath) {
                    const resolvedPath = resolveCacheHandlerPathToFilesystem(handlerPath);
                    necessaryNodeDependencies.push(require.resolve(path.isAbsolute(resolvedPath) ? resolvedPath : path.join(dir, resolvedPath)));
                }
            }
        }
        const { fileList, esmFileList } = await nodeFileTrace(necessaryNodeDependencies, {
            base: outputFileTracingRoot,
            ignore: sharedIgnoreFn,
            moduleSyncCatchall: true
        });
        esmFileList.forEach((item)=>fileList.add(item));
        for (const tracingRootRelativeFilePath of fileList){
            // nodeFileTrace returns paths relative to `base` (outputFileTracingRoot),
            // so resolve to an absolute path and re-relativize against repoRoot, which
            // is the root all adapter output keys/source paths are based on.
            const absoluteFilePath = path.join(outputFileTracingRoot, tracingRootRelativeFilePath);
            await pushAsset(sharedNodeAssets, sharedNodeAssetsHashes, path.relative(repoRoot, absoluteFilePath), absoluteFilePath, bundler, salt);
        }
    }
    if (hasInstrumentationHook) {
        const { entryHash: instrumentationEntryHash } = await loadNFT(sharedNodeAssets, sharedNodeAssetsHashes, repoRoot, path.join(distDir, 'server', 'instrumentation.js.nft.json'));
        const fileOutputPath = path.relative(repoRoot, path.join(distDir, 'server', 'instrumentation.js'));
        await pushAsset(sharedNodeAssets, sharedNodeAssetsHashes, fileOutputPath, path.join(distDir, 'server', 'instrumentation.js'), bundler, salt, instrumentationEntryHash);
    }
    // Run after hasInstrumentationHook, which inserts the NFT-provided file hash for .next/server/instrumentation.js
    for (const file of requiredServerFiles){
        // add to shared node assets
        const filePath = path.join(dir, file);
        const fileOutputPath = path.relative(repoRoot, filePath);
        await pushAsset(sharedNodeAssets, sharedNodeAssetsHashes, fileOutputPath, filePath, bundler, salt);
    }
    return {
        sharedNodeAssets,
        sharedNodeAssetsHashes,
        pagesSharedNodeAssets,
        pagesSharedNodeAssetsHashes,
        appPagesSharedNodeAssets,
        appPagesSharedNodeAssetsHashes
    };
}
async function pushAsset(assets, assetsHashes, targetFilePath, sourceFilePath, bundler, salt, hashOverride) {
    if (!(targetFilePath in assets)) {
        assets[targetFilePath] = sourceFilePath;
        if (bundler === Bundler.Turbopack) {
            assetsHashes[targetFilePath] = hashOverride ?? await hashFile(salt, sourceFilePath);
        }
    }
}
async function loadNFT(assets, assetsHashes, repoRoot, traceFilePath) {
    const { files, fileHashes, entryHash } = await JSON.parse(await fs.readFile(traceFilePath, 'utf8'));
    const traceFileDir = path.dirname(traceFilePath);
    for(let i = 0; i < files.length; i++){
        const relativeFile = files[i];
        const contentHash = fileHashes == null ? void 0 : fileHashes[i];
        const tracedFilePath = path.join(traceFileDir, relativeFile);
        const fileOutputPath = path.relative(repoRoot, tracedFilePath);
        assets[fileOutputPath] = tracedFilePath;
        if (contentHash) {
            assetsHashes[fileOutputPath] = contentHash;
        }
    }
    return {
        entryHash
    };
}
async function hashFile(salt, filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(salt);
    try {
        // Try symlink first, since readFile just transparently resolves those (or fails if it's a
        // directory symlink).
        const linkTarget = await fs.readlink(filePath);
        hash.update('link');
        hash.update(linkTarget);
    } catch (e) {
        if (e.code === 'EINVAL') {
            // Not a symlink
            hash.update('file:');
            hash.update(await fs.readFile(filePath));
        } else {
            throw e;
        }
    }
    return hash.digest('hex');
}

//# sourceMappingURL=build-complete.js.map