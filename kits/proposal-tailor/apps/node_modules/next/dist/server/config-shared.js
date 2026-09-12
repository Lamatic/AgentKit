"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DEFAULT_MAX_POSTPONED_STATE_SIZE: null,
    LIGHTNINGCSS_FEATURE_NAMES: null,
    defaultConfig: null,
    getNextConfigRuntime: null,
    normalizeConfig: null,
    parseMaxPostponedStateSize: null,
    resolveCssChunkingMode: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DEFAULT_MAX_POSTPONED_STATE_SIZE: function() {
        return _sizelimit.DEFAULT_MAX_POSTPONED_STATE_SIZE;
    },
    LIGHTNINGCSS_FEATURE_NAMES: function() {
        return LIGHTNINGCSS_FEATURE_NAMES;
    },
    defaultConfig: function() {
        return defaultConfig;
    },
    getNextConfigRuntime: function() {
        return getNextConfigRuntime;
    },
    normalizeConfig: function() {
        return normalizeConfig;
    },
    parseMaxPostponedStateSize: function() {
        return _sizelimit.parseMaxPostponedStateSize;
    },
    resolveCssChunkingMode: function() {
        return resolveCssChunkingMode;
    }
});
const _os = /*#__PURE__*/ _interop_require_default(require("os"));
const _imageconfig = require("../shared/lib/image-config");
const _constants = require("../lib/constants");
const _sizelimit = require("../shared/lib/size-limit");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const LIGHTNINGCSS_FEATURE_NAMES = [
    // Individual features (bit 0–20)
    'nesting',
    'not-selector-list',
    'dir-selector',
    'lang-selector-list',
    'is-selector',
    'text-decoration-thickness-percent',
    'media-interval-syntax',
    'media-range-syntax',
    'custom-media-queries',
    'clamp-function',
    'color-function',
    'oklab-colors',
    'lab-colors',
    'p3-colors',
    'hex-alpha-colors',
    'space-separated-color-notation',
    'font-family-system-ui',
    'double-position-gradients',
    'vendor-prefixes',
    'logical-properties',
    'light-dark',
    // Composite groups
    'selectors',
    'media-queries',
    'colors'
];
function resolveCssChunkingMode(value) {
    if (value === undefined || value === false) return 'off';
    if (value === true || value === 'loose') return 'loose';
    if (value === 'strict' || value === 'graph') return value;
    // Object form. `requestCost` and `weightDistribution` are validated by the schema.
    if (value.type === 'strict') return 'strict';
    if (value.type === 'graph') return 'graph';
    return 'loose';
}
const defaultConfig = Object.freeze({
    env: {},
    webpack: null,
    typescript: {
        ignoreBuildErrors: false,
        tsconfigPath: undefined
    },
    typedRoutes: false,
    distDir: '.next',
    cleanDistDir: true,
    assetPrefix: '',
    cacheHandler: process.env.NEXT_CACHE_HANDLER_PATH,
    // default to 50MB limit
    cacheMaxMemorySize: 50 * 1024 * 1024,
    configOrigin: 'default',
    useFileSystemPublicRoutes: true,
    generateBuildId: ()=>null,
    generateEtags: true,
    pageExtensions: [
        'tsx',
        'ts',
        'jsx',
        'js'
    ],
    instrumentationClientInject: [],
    poweredByHeader: true,
    compress: true,
    images: _imageconfig.imageConfigDefault,
    devIndicators: {
        position: 'bottom-left'
    },
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 5
    },
    basePath: '',
    sassOptions: {},
    trailingSlash: false,
    i18n: null,
    productionBrowserSourceMaps: false,
    excludeDefaultMomentLocales: true,
    reactProductionProfiling: false,
    reactStrictMode: null,
    reactMaxHeadersLength: 6000,
    httpAgentOptions: {
        keepAlive: true
    },
    logging: {
        serverFunctions: true
    },
    compiler: {},
    expireTime: process.env.NEXT_PRIVATE_CDN_CONSUMED_SWR_CACHE_CONTROL ? undefined : 31536000,
    staticPageGenerationTimeout: 60,
    output: !!process.env.NEXT_PRIVATE_STANDALONE ? 'standalone' : undefined,
    modularizeImports: undefined,
    outputFileTracingRoot: '',
    allowedDevOrigins: undefined,
    enablePrerenderSourceMaps: true,
    cacheComponents: false,
    cacheLife: {
        default: {
            stale: undefined,
            revalidate: 60 * 15,
            expire: _constants.INFINITE_CACHE
        },
        seconds: {
            stale: 30,
            revalidate: 1,
            expire: 60
        },
        minutes: {
            stale: 60 * 5,
            revalidate: 60,
            expire: 60 * 60
        },
        hours: {
            stale: 60 * 5,
            revalidate: 60 * 60,
            expire: 60 * 60 * 24
        },
        days: {
            stale: 60 * 5,
            revalidate: 60 * 60 * 24,
            expire: 60 * 60 * 24 * 7
        },
        weeks: {
            stale: 60 * 5,
            revalidate: 60 * 60 * 24 * 7,
            expire: 60 * 60 * 24 * 30
        },
        max: {
            stale: 60 * 5,
            revalidate: 60 * 60 * 24 * 30,
            expire: 60 * 60 * 24 * 365
        }
    },
    cacheHandlers: {
        default: process.env.NEXT_DEFAULT_CACHE_HANDLER_PATH,
        remote: process.env.NEXT_REMOTE_CACHE_HANDLER_PATH,
        static: process.env.NEXT_STATIC_CACHE_HANDLER_PATH
    },
    adapterPath: process.env.NEXT_ADAPTER_PATH || undefined,
    experimental: {
        appNewScrollHandler: true,
        coldCacheBadge: false,
        devValidationWorker: true,
        useSkewCookie: false,
        cssChunking: true,
        multiZoneDraftMode: false,
        appNavFailHandling: false,
        prerenderEarlyExit: true,
        serverMinification: true,
        linkNoTouchStart: false,
        caseSensitiveRoutes: false,
        clientParamParsingOrigins: undefined,
        cachedNavigations: false,
        dynamicOnHover: false,
        useOffline: false,
        varyParams: true,
        optimisticRouting: true,
        instrumentationClientRouterTransitionEvents: false,
        prefetchInlining: true,
        preloadEntriesOnStart: true,
        clientRouterFilter: true,
        clientRouterFilterRedirects: false,
        fetchCacheKeyPrefix: '',
        proxyPrefetch: 'flexible',
        optimisticClientCache: true,
        manualClientBasePath: false,
        cpus: Math.max(1, (Number(process.env.CIRCLE_NODE_TOTAL) || (_os.default.cpus() || {
            length: 1
        }).length) - 1),
        memoryBasedWorkersCount: false,
        imgOptConcurrency: null,
        imgOptOperationCache: null,
        imgOptTimeoutInSeconds: 7,
        imgOptMaxInputPixels: 268402689,
        imgOptSequentialRead: null,
        isrFlushToDisk: true,
        workerThreads: false,
        proxyTimeout: undefined,
        optimizeCss: false,
        nextScriptWorkers: false,
        scrollRestoration: false,
        externalDir: false,
        devMemoryThresholdRestart: true,
        disableOptimizedLoading: false,
        gzipSize: true,
        craCompat: false,
        esmExternals: true,
        fullySpecified: false,
        swcTraceProfiling: false,
        forceSwcTransforms: false,
        requestInsights: false,
        swcPlugins: undefined,
        largePageDataBytes: 128 * 1000,
        disablePostcssPresetEnv: undefined,
        urlImports: undefined,
        typedEnv: false,
        clientTraceMetadata: undefined,
        parallelServerCompiles: false,
        parallelServerBuildTraces: false,
        ppr: false,
        authInterrupts: false,
        webpackBuildWorker: undefined,
        webpackMemoryOptimizations: false,
        optimizeServerReact: true,
        strictRouteTypes: false,
        useTypeScriptCli: true,
        removeUncaughtErrorAndRejectionListeners: false,
        validateRSCRequestHeaders: true,
        staleTimes: {
            dynamic: 0,
            static: 300
        },
        allowDevelopmentBuild: undefined,
        reactDebugChannel: true,
        staticGenerationRetryCount: undefined,
        serverComponentsHmrCache: true,
        serverComponentsHmrCancellation: false,
        staticGenerationMaxConcurrency: 8,
        staticGenerationMinPagesPerWorker: 25,
        transitionIndicator: false,
        gestureTransition: false,
        inlineCss: false,
        useCache: undefined,
        slowModuleDetection: undefined,
        globalNotFound: false,
        browserDebugInfoInTerminal: 'warn',
        lockDistDir: true,
        proxyClientMaxBodySize: 10485760,
        hideLogsAfterAbort: false,
        mcpServer: true,
        turbopackFileSystemCacheForDev: true,
        turbopackFileSystemCacheForBuild: true,
        turbopackInferModuleSideEffects: true,
        turbopackPluginRuntimeStrategy: 'childProcesses'
    },
    htmlLimitedBots: undefined,
    bundlePagesRouterDependencies: false
});
async function normalizeConfig(phase, config) {
    if (typeof config === 'function') {
        config = config(phase, {
            defaultConfig
        });
    }
    // Support `new Promise` and `async () =>` as return values of the config export
    return await config;
}
function getNextConfigRuntime(config) {
    // This config filter is a breaking change, so only do it if experimental.runtimeServerDeploymentId is enabled
    if (!config.experimental.runtimeServerDeploymentId) {
        return config;
    }
    const ex = config.experimental;
    const experimental = {
        ppr: ex.ppr,
        taint: ex.taint,
        serverActions: ex.serverActions,
        staleTimes: ex.staleTimes,
        dynamicOnHover: ex.dynamicOnHover,
        useOffline: ex.useOffline,
        optimisticRouting: ex.optimisticRouting,
        inlineCss: ex.inlineCss,
        prefetchInlining: ex.prefetchInlining,
        authInterrupts: ex.authInterrupts,
        useCacheTimeout: ex.useCacheTimeout,
        clientTraceMetadata: ex.clientTraceMetadata,
        clientParamParsingOrigins: ex.clientParamParsingOrigins,
        allowedRevalidateHeaderKeys: ex.allowedRevalidateHeaderKeys,
        fetchCacheKeyPrefix: ex.fetchCacheKeyPrefix,
        isrFlushToDisk: ex.isrFlushToDisk,
        optimizeCss: ex.optimizeCss,
        nextScriptWorkers: ex.nextScriptWorkers,
        disableOptimizedLoading: ex.disableOptimizedLoading,
        largePageDataBytes: ex.largePageDataBytes,
        serverComponentsHmrCache: ex.serverComponentsHmrCache,
        serverComponentsHmrCancellation: ex.serverComponentsHmrCancellation,
        caseSensitiveRoutes: ex.caseSensitiveRoutes,
        validateRSCRequestHeaders: ex.validateRSCRequestHeaders,
        sri: ex.sri,
        useSkewCookie: ex.useSkewCookie,
        preloadEntriesOnStart: ex.preloadEntriesOnStart,
        hideLogsAfterAbort: ex.hideLogsAfterAbort,
        removeUncaughtErrorAndRejectionListeners: ex.removeUncaughtErrorAndRejectionListeners,
        imgOptConcurrency: ex.imgOptConcurrency,
        imgOptOperationCache: ex.imgOptOperationCache,
        imgOptMaxInputPixels: ex.imgOptMaxInputPixels,
        imgOptSequentialRead: ex.imgOptSequentialRead,
        imgOptTimeoutInSeconds: ex.imgOptTimeoutInSeconds,
        proxyClientMaxBodySize: ex.proxyClientMaxBodySize,
        proxyTimeout: ex.proxyTimeout,
        testProxy: ex.testProxy,
        runtimeServerDeploymentId: ex.runtimeServerDeploymentId,
        maxPostponedStateSize: ex.maxPostponedStateSize,
        cachedNavigations: ex.cachedNavigations,
        exposeTestingApiInProductionBuild: ex.exposeTestingApiInProductionBuild,
        instantInsights: ex.instantInsights,
        requestInsights: ex.requestInsights,
        trustHostHeader: ex.trustHostHeader,
        isExperimentalCompile: ex.isExperimentalCompile
    };
    const runtimeConfig = {
        deploymentId: config.experimental.runtimeServerDeploymentId ? '' : config.deploymentId,
        supportsImmutableAssets: config.supportsImmutableAssets,
        configFileName: undefined,
        env: undefined,
        distDir: config.distDir,
        cacheComponents: config.cacheComponents,
        partialPrefetching: config.partialPrefetching,
        agentRules: config.agentRules,
        htmlLimitedBots: config.htmlLimitedBots,
        assetPrefix: config.assetPrefix,
        output: config.output,
        crossOrigin: config.crossOrigin,
        trailingSlash: config.trailingSlash,
        images: config.images,
        reactMaxHeadersLength: config.reactMaxHeadersLength,
        cacheLife: config.cacheLife,
        basePath: config.basePath,
        expireTime: config.expireTime,
        generateEtags: config.generateEtags,
        poweredByHeader: config.poweredByHeader,
        cacheHandler: config.cacheHandler,
        cacheHandlers: config.cacheHandlers,
        // The full adapterPath might be non-deterministic across builds and doesn't
        // actually matter at runtime, so replace it with a placeholder if it's set.
        adapterPath: config.adapterPath ? '<omitted but set>' : undefined,
        cacheMaxMemorySize: config.cacheMaxMemorySize,
        compress: config.compress,
        i18n: config.i18n,
        httpAgentOptions: config.httpAgentOptions,
        skipProxyUrlNormalize: config.skipProxyUrlNormalize,
        pageExtensions: config.pageExtensions,
        useFileSystemPublicRoutes: config.useFileSystemPublicRoutes,
        logging: config.logging,
        staticPageGenerationTimeout: config.staticPageGenerationTimeout,
        experimental
    };
    if (config.experimental.isExperimentalCompile) {
        runtimeConfig.env = config.env;
    }
    return runtimeConfig;
}

//# sourceMappingURL=config-shared.js.map