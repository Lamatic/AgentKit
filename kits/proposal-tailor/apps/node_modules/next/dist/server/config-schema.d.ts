import type { NextConfig } from './config';
import { z } from 'next/dist/compiled/zod';
import type zod from 'next/dist/compiled/zod';
import type { SizeLimit } from '../types';
export declare const experimentalSchema: {
    outputHashSalt: z.ZodOptional<z.ZodString>;
    useSkewCookie: z.ZodOptional<z.ZodBoolean>;
    after: z.ZodOptional<z.ZodBoolean>;
    appNavFailHandling: z.ZodOptional<z.ZodBoolean>;
    appNewScrollHandler: z.ZodOptional<z.ZodBoolean>;
    coldCacheBadge: z.ZodOptional<z.ZodBoolean>;
    preloadEntriesOnStart: z.ZodOptional<z.ZodBoolean>;
    allowedRevalidateHeaderKeys: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    staleTimes: z.ZodOptional<z.ZodObject<{
        dynamic: z.ZodOptional<z.ZodNumber>;
        static: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        static?: number | undefined;
        dynamic?: number | undefined;
    }, {
        static?: number | undefined;
        dynamic?: number | undefined;
    }>>;
    cacheLife: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        stale: z.ZodOptional<z.ZodNumber>;
        revalidate: z.ZodOptional<z.ZodNumber>;
        expire: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        revalidate?: number | undefined;
        expire?: number | undefined;
        stale?: number | undefined;
    }, {
        revalidate?: number | undefined;
        expire?: number | undefined;
        stale?: number | undefined;
    }>>>;
    cacheHandlers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>>;
    clientRouterFilter: z.ZodOptional<z.ZodBoolean>;
    clientRouterFilterRedirects: z.ZodOptional<z.ZodBoolean>;
    clientRouterFilterAllowedRate: z.ZodOptional<z.ZodNumber>;
    cpus: z.ZodOptional<z.ZodNumber>;
    memoryBasedWorkersCount: z.ZodOptional<z.ZodBoolean>;
    craCompat: z.ZodOptional<z.ZodBoolean>;
    caseSensitiveRoutes: z.ZodOptional<z.ZodBoolean>;
    clientParamParsingOrigins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    cachedNavigations: z.ZodOptional<z.ZodBoolean>;
    dynamicOnHover: z.ZodOptional<z.ZodBoolean>;
    useOffline: z.ZodOptional<z.ZodBoolean>;
    optimisticRouting: z.ZodOptional<z.ZodBoolean>;
    instrumentationClientRouterTransitionEvents: z.ZodOptional<z.ZodBoolean>;
    varyParams: z.ZodOptional<z.ZodBoolean>;
    prefetchInlining: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        maxSize: z.ZodOptional<z.ZodNumber>;
        maxBundleSize: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxSize?: number | undefined;
        maxBundleSize?: number | undefined;
    }, {
        maxSize?: number | undefined;
        maxBundleSize?: number | undefined;
    }>]>>;
    devMemoryThresholdRestart: z.ZodOptional<z.ZodBoolean>;
    disableOptimizedLoading: z.ZodOptional<z.ZodBoolean>;
    disablePostcssPresetEnv: z.ZodOptional<z.ZodBoolean>;
    cacheComponents: z.ZodOptional<z.ZodBoolean>;
    inlineCss: z.ZodOptional<z.ZodBoolean>;
    esmExternals: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"loose">]>>;
    serverActions: z.ZodOptional<z.ZodObject<{
        bodySizeLimit: z.ZodOptional<z.ZodType<SizeLimit, z.ZodTypeDef, SizeLimit>>;
        allowedOrigins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        bodySizeLimit?: SizeLimit | undefined;
        allowedOrigins?: string[] | undefined;
    }, {
        bodySizeLimit?: SizeLimit | undefined;
        allowedOrigins?: string[] | undefined;
    }>>;
    maxPostponedStateSize: z.ZodOptional<z.ZodType<SizeLimit, z.ZodTypeDef, SizeLimit>>;
    extensionAlias: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    externalDir: z.ZodOptional<z.ZodBoolean>;
    externalMiddlewareRewritesResolve: z.ZodOptional<z.ZodBoolean>;
    externalProxyRewritesResolve: z.ZodOptional<z.ZodBoolean>;
    exposeTestingApiInProductionBuild: z.ZodOptional<z.ZodBoolean>;
    requestInsights: z.ZodOptional<z.ZodBoolean>;
    fallbackNodePolyfills: z.ZodOptional<z.ZodLiteral<false>>;
    fetchCacheKeyPrefix: z.ZodOptional<z.ZodString>;
    forceSwcTransforms: z.ZodOptional<z.ZodBoolean>;
    fullySpecified: z.ZodOptional<z.ZodBoolean>;
    gzipSize: z.ZodOptional<z.ZodBoolean>;
    imgOptConcurrency: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    imgOptOperationCache: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    imgOptTimeoutInSeconds: z.ZodOptional<z.ZodNumber>;
    imgOptMaxInputPixels: z.ZodOptional<z.ZodNumber>;
    imgOptSequentialRead: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    isrFlushToDisk: z.ZodOptional<z.ZodBoolean>;
    largePageDataBytes: z.ZodOptional<z.ZodNumber>;
    linkNoTouchStart: z.ZodOptional<z.ZodBoolean>;
    manualClientBasePath: z.ZodOptional<z.ZodBoolean>;
    middlewarePrefetch: z.ZodOptional<z.ZodEnum<["strict", "flexible"]>>;
    proxyPrefetch: z.ZodOptional<z.ZodEnum<["strict", "flexible"]>>;
    middlewareClientMaxBodySize: z.ZodOptional<z.ZodType<SizeLimit, z.ZodTypeDef, SizeLimit>>;
    proxyClientMaxBodySize: z.ZodOptional<z.ZodType<SizeLimit, z.ZodTypeDef, SizeLimit>>;
    multiZoneDraftMode: z.ZodOptional<z.ZodBoolean>;
    cssChunking: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"strict">, z.ZodLiteral<"loose">, z.ZodLiteral<"graph">, z.ZodObject<{
        type: z.ZodLiteral<"strict">;
    }, "strict", z.ZodTypeAny, {
        type: "strict";
    }, {
        type: "strict";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"loose">;
    }, "strict", z.ZodTypeAny, {
        type: "loose";
    }, {
        type: "loose";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"graph">;
        requestCost: z.ZodOptional<z.ZodNumber>;
        weightDistribution: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        type: "graph";
        requestCost?: number | undefined;
        weightDistribution?: number | undefined;
    }, {
        type: "graph";
        requestCost?: number | undefined;
        weightDistribution?: number | undefined;
    }>]>>;
    nextScriptWorkers: z.ZodOptional<z.ZodBoolean>;
    optimizeCss: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodAny]>>;
    optimisticClientCache: z.ZodOptional<z.ZodBoolean>;
    parallelServerCompiles: z.ZodOptional<z.ZodBoolean>;
    parallelServerBuildTraces: z.ZodOptional<z.ZodBoolean>;
    ppr: z.ZodOptional<z.ZodReadonly<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"incremental">]>>>;
    taint: z.ZodOptional<z.ZodBoolean>;
    blockingSSR: z.ZodOptional<z.ZodBoolean>;
    prerenderEarlyExit: z.ZodOptional<z.ZodBoolean>;
    proxyTimeout: z.ZodOptional<z.ZodNumber>;
    rootParams: z.ZodOptional<z.ZodBoolean>;
    mcpServer: z.ZodOptional<z.ZodBoolean>;
    removeUncaughtErrorAndRejectionListeners: z.ZodOptional<z.ZodBoolean>;
    validateRSCRequestHeaders: z.ZodOptional<z.ZodBoolean>;
    scrollRestoration: z.ZodOptional<z.ZodBoolean>;
    sri: z.ZodOptional<z.ZodObject<{
        algorithm: z.ZodOptional<z.ZodEnum<["sha256", "sha384", "sha512"]>>;
    }, "strip", z.ZodTypeAny, {
        algorithm?: "sha256" | "sha512" | "sha384" | undefined;
    }, {
        algorithm?: "sha256" | "sha512" | "sha384" | undefined;
    }>>;
    swcPlugins: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>], null>, "many">>;
    swcEnvOptions: z.ZodOptional<z.ZodObject<{
        mode: z.ZodOptional<z.ZodEnum<["usage", "entry"]>>;
        coreJs: z.ZodOptional<z.ZodString>;
        skip: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        shippedProposals: z.ZodOptional<z.ZodBoolean>;
        forceAllTransforms: z.ZodOptional<z.ZodBoolean>;
        debug: z.ZodOptional<z.ZodBoolean>;
        loose: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        include?: string[] | undefined;
        loose?: boolean | undefined;
        skip?: string[] | undefined;
        exclude?: string[] | undefined;
        mode?: "usage" | "entry" | undefined;
        debug?: boolean | undefined;
        coreJs?: string | undefined;
        shippedProposals?: boolean | undefined;
        forceAllTransforms?: boolean | undefined;
    }, {
        include?: string[] | undefined;
        loose?: boolean | undefined;
        skip?: string[] | undefined;
        exclude?: string[] | undefined;
        mode?: "usage" | "entry" | undefined;
        debug?: boolean | undefined;
        coreJs?: string | undefined;
        shippedProposals?: boolean | undefined;
        forceAllTransforms?: boolean | undefined;
    }>>;
    swcTraceProfiling: z.ZodOptional<z.ZodBoolean>;
    urlImports: z.ZodOptional<z.ZodAny>;
    workerThreads: z.ZodOptional<z.ZodBoolean>;
    webVitalsAttribution: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"CLS">, z.ZodLiteral<"FCP">, z.ZodLiteral<"FID">, z.ZodLiteral<"INP">, z.ZodLiteral<"LCP">, z.ZodLiteral<"TTFB">]>, "many">>;
    mdxRs: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        development: z.ZodOptional<z.ZodBoolean>;
        jsxRuntime: z.ZodOptional<z.ZodString>;
        jsxImportSource: z.ZodOptional<z.ZodString>;
        providerImportSource: z.ZodOptional<z.ZodString>;
        mdxType: z.ZodOptional<z.ZodEnum<["gfm", "commonmark"]>>;
    }, "strip", z.ZodTypeAny, {
        development?: boolean | undefined;
        jsxImportSource?: string | undefined;
        jsxRuntime?: string | undefined;
        providerImportSource?: string | undefined;
        mdxType?: "gfm" | "commonmark" | undefined;
    }, {
        development?: boolean | undefined;
        jsxImportSource?: string | undefined;
        jsxRuntime?: string | undefined;
        providerImportSource?: string | undefined;
        mdxType?: "gfm" | "commonmark" | undefined;
    }>]>>;
    transitionIndicator: z.ZodOptional<z.ZodBoolean>;
    gestureTransition: z.ZodOptional<z.ZodBoolean>;
    typedRoutes: z.ZodOptional<z.ZodBoolean>;
    webpackBuildWorker: z.ZodOptional<z.ZodBoolean>;
    webpackMemoryOptimizations: z.ZodOptional<z.ZodBoolean>;
    turbopackMemoryEviction: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<false>, z.ZodLiteral<"full">, z.ZodLiteral<"auto">]>>;
    turbopackPluginRuntimeStrategy: z.ZodOptional<z.ZodEnum<["workerThreads", "childProcesses"]>>;
    turbopackMinify: z.ZodOptional<z.ZodBoolean>;
    turbopackFileSystemCacheForDev: z.ZodOptional<z.ZodBoolean>;
    turbopackFileSystemCacheForBuild: z.ZodOptional<z.ZodBoolean>;
    turbopackSeedCacheFromWorktree: z.ZodOptional<z.ZodBoolean>;
    turbopackSourceMaps: z.ZodOptional<z.ZodBoolean>;
    turbopackInputSourceMaps: z.ZodOptional<z.ZodBoolean>;
    turbopackModuleFragments: z.ZodOptional<z.ZodBoolean>;
    turbopackRemoveUnusedImports: z.ZodOptional<z.ZodBoolean>;
    turbopackRemoveUnusedExports: z.ZodOptional<z.ZodBoolean>;
    turbopackScopeHoisting: z.ZodOptional<z.ZodBoolean>;
    turbopackSharedRuntime: z.ZodOptional<z.ZodBoolean>;
    turbopackChunking: z.ZodOptional<z.ZodObject<{
        firstPageLoadPriority: z.ZodOptional<z.ZodNumber>;
        priorityRoutes: z.ZodOptional<z.ZodArray<z.ZodType<RegExp, z.ZodTypeDef, RegExp>, "many">>;
        priorityBoost: z.ZodOptional<z.ZodNumber>;
        requestCost: z.ZodOptional<z.ZodNumber>;
        minChunkSize: z.ZodOptional<z.ZodNumber>;
        maxChunkCountPerGroup: z.ZodOptional<z.ZodNumber>;
        maxMergeChunkSize: z.ZodOptional<z.ZodNumber>;
        minComponentChunkSize: z.ZodOptional<z.ZodNumber>;
        generateComponentChunks: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requestCost?: number | undefined;
        firstPageLoadPriority?: number | undefined;
        priorityRoutes?: RegExp[] | undefined;
        priorityBoost?: number | undefined;
        minChunkSize?: number | undefined;
        maxChunkCountPerGroup?: number | undefined;
        maxMergeChunkSize?: number | undefined;
        minComponentChunkSize?: number | undefined;
        generateComponentChunks?: boolean | undefined;
    }, {
        requestCost?: number | undefined;
        firstPageLoadPriority?: number | undefined;
        priorityRoutes?: RegExp[] | undefined;
        priorityBoost?: number | undefined;
        minChunkSize?: number | undefined;
        maxChunkCountPerGroup?: number | undefined;
        maxMergeChunkSize?: number | undefined;
        minComponentChunkSize?: number | undefined;
        generateComponentChunks?: boolean | undefined;
    }>>;
    turbopackWorkerAssetPrefix: z.ZodOptional<z.ZodString>;
    turbopackClientSideNestedAsyncChunking: z.ZodOptional<z.ZodBoolean>;
    turbopackServerSideNestedAsyncChunking: z.ZodOptional<z.ZodBoolean>;
    turbopackImportTypeBytes: z.ZodOptional<z.ZodBoolean>;
    turbopackUseBuiltinBabel: z.ZodOptional<z.ZodBoolean>;
    turbopackUseBuiltinSass: z.ZodOptional<z.ZodBoolean>;
    turbopackLocalPostcssConfig: z.ZodOptional<z.ZodBoolean>;
    turbopackModuleIds: z.ZodOptional<z.ZodEnum<["named", "deterministic"]>>;
    turbopackInferModuleSideEffects: z.ZodOptional<z.ZodBoolean>;
    turbopackCjsTreeShaking: z.ZodOptional<z.ZodBoolean>;
    turbopackServerFastRefresh: z.ZodOptional<z.ZodBoolean>;
    optimizePackageImports: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    optimizeServerReact: z.ZodOptional<z.ZodBoolean>;
    strictRouteTypes: z.ZodOptional<z.ZodBoolean>;
    useTypeScriptCli: z.ZodOptional<z.ZodBoolean>;
    clientTraceMetadata: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    serverMinification: z.ZodOptional<z.ZodBoolean>;
    serverSourceMaps: z.ZodOptional<z.ZodBoolean>;
    useWasmBinary: z.ZodOptional<z.ZodBoolean>;
    useLightningcss: z.ZodOptional<z.ZodBoolean>;
    lightningCssFeatures: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodArray<z.ZodEnum<["nesting", "not-selector-list", "dir-selector", "lang-selector-list", "is-selector", "text-decoration-thickness-percent", "media-interval-syntax", "media-range-syntax", "custom-media-queries", "clamp-function", "color-function", "oklab-colors", "lab-colors", "p3-colors", "hex-alpha-colors", "space-separated-color-notation", "font-family-system-ui", "double-position-gradients", "vendor-prefixes", "logical-properties", "light-dark", "selectors", "media-queries", "colors"]>, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodEnum<["nesting", "not-selector-list", "dir-selector", "lang-selector-list", "is-selector", "text-decoration-thickness-percent", "media-interval-syntax", "media-range-syntax", "custom-media-queries", "clamp-function", "color-function", "oklab-colors", "lab-colors", "p3-colors", "hex-alpha-colors", "space-separated-color-notation", "font-family-system-ui", "double-position-gradients", "vendor-prefixes", "logical-properties", "light-dark", "selectors", "media-queries", "colors"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        include?: ("nesting" | "colors" | "not-selector-list" | "dir-selector" | "lang-selector-list" | "is-selector" | "text-decoration-thickness-percent" | "media-interval-syntax" | "media-range-syntax" | "custom-media-queries" | "clamp-function" | "color-function" | "oklab-colors" | "lab-colors" | "p3-colors" | "hex-alpha-colors" | "space-separated-color-notation" | "font-family-system-ui" | "double-position-gradients" | "vendor-prefixes" | "logical-properties" | "light-dark" | "selectors" | "media-queries")[] | undefined;
        exclude?: ("nesting" | "colors" | "not-selector-list" | "dir-selector" | "lang-selector-list" | "is-selector" | "text-decoration-thickness-percent" | "media-interval-syntax" | "media-range-syntax" | "custom-media-queries" | "clamp-function" | "color-function" | "oklab-colors" | "lab-colors" | "p3-colors" | "hex-alpha-colors" | "space-separated-color-notation" | "font-family-system-ui" | "double-position-gradients" | "vendor-prefixes" | "logical-properties" | "light-dark" | "selectors" | "media-queries")[] | undefined;
    }, {
        include?: ("nesting" | "colors" | "not-selector-list" | "dir-selector" | "lang-selector-list" | "is-selector" | "text-decoration-thickness-percent" | "media-interval-syntax" | "media-range-syntax" | "custom-media-queries" | "clamp-function" | "color-function" | "oklab-colors" | "lab-colors" | "p3-colors" | "hex-alpha-colors" | "space-separated-color-notation" | "font-family-system-ui" | "double-position-gradients" | "vendor-prefixes" | "logical-properties" | "light-dark" | "selectors" | "media-queries")[] | undefined;
        exclude?: ("nesting" | "colors" | "not-selector-list" | "dir-selector" | "lang-selector-list" | "is-selector" | "text-decoration-thickness-percent" | "media-interval-syntax" | "media-range-syntax" | "custom-media-queries" | "clamp-function" | "color-function" | "oklab-colors" | "lab-colors" | "p3-colors" | "hex-alpha-colors" | "space-separated-color-notation" | "font-family-system-ui" | "double-position-gradients" | "vendor-prefixes" | "logical-properties" | "light-dark" | "selectors" | "media-queries")[] | undefined;
    }>>;
    testProxy: z.ZodOptional<z.ZodBoolean>;
    defaultTestRunner: z.ZodOptional<z.ZodEnum<["playwright"]>>;
    allowDevelopmentBuild: z.ZodOptional<z.ZodLiteral<true>>;
    reactDebugChannel: z.ZodOptional<z.ZodBoolean>;
    instantInsights: z.ZodOptional<z.ZodObject<{
        validationLevel: z.ZodOptional<z.ZodEnum<["warning", "manual-warning", "experimental-error", "experimental-manual-error"]>>;
    }, "strip", z.ZodTypeAny, {
        validationLevel?: "warning" | "experimental-error" | "manual-warning" | "experimental-manual-error" | undefined;
    }, {
        validationLevel?: "warning" | "experimental-error" | "manual-warning" | "experimental-manual-error" | undefined;
    }>>;
    devValidationWorker: z.ZodOptional<z.ZodBoolean>;
    staticGenerationRetryCount: z.ZodOptional<z.ZodNumber>;
    staticGenerationMaxConcurrency: z.ZodOptional<z.ZodNumber>;
    staticGenerationMinPagesPerWorker: z.ZodOptional<z.ZodNumber>;
    typedEnv: z.ZodOptional<z.ZodBoolean>;
    serverComponentsHmrCache: z.ZodOptional<z.ZodBoolean>;
    serverComponentsHmrCancellation: z.ZodOptional<z.ZodBoolean>;
    authInterrupts: z.ZodOptional<z.ZodBoolean>;
    useCache: z.ZodOptional<z.ZodBoolean>;
    durableUseCacheEntries: z.ZodOptional<z.ZodBoolean>;
    useCacheTimeout: z.ZodOptional<z.ZodNumber>;
    slowModuleDetection: z.ZodOptional<z.ZodObject<{
        buildTimeThresholdMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        buildTimeThresholdMs: number;
    }, {
        buildTimeThresholdMs: number;
    }>>;
    globalNotFound: z.ZodOptional<z.ZodBoolean>;
    turbopackRustReactCompiler: z.ZodOptional<z.ZodBoolean>;
    browserDebugInfoInTerminal: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodEnum<["error", "warn", "verbose"]>, z.ZodObject<{
        level: z.ZodOptional<z.ZodEnum<["error", "warn", "verbose"]>>;
        depthLimit: z.ZodOptional<z.ZodNumber>;
        edgeLimit: z.ZodOptional<z.ZodNumber>;
        showSourceLocation: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        level?: "error" | "warn" | "verbose" | undefined;
        depthLimit?: number | undefined;
        edgeLimit?: number | undefined;
        showSourceLocation?: boolean | undefined;
    }, {
        level?: "error" | "warn" | "verbose" | undefined;
        depthLimit?: number | undefined;
        edgeLimit?: number | undefined;
        showSourceLocation?: boolean | undefined;
    }>]>>;
    lockDistDir: z.ZodOptional<z.ZodBoolean>;
    hideLogsAfterAbort: z.ZodOptional<z.ZodBoolean>;
    runtimeServerDeploymentId: z.ZodOptional<z.ZodBoolean>;
    supportsImmutableAssets: z.ZodOptional<z.ZodBoolean>;
    deferredEntries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    onBeforeDeferredEntries: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodPromise<z.ZodVoid>>>;
    reportSystemEnvInlining: z.ZodOptional<z.ZodEnum<["warn", "error"]>>;
};
export declare const configSchema: zod.ZodType<NextConfig>;
