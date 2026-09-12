// Import cpu-profile first to start profiling early if enabled
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    turbopackBuild: null,
    waitForShutdown: null,
    workerMain: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    turbopackBuild: function() {
        return turbopackBuild;
    },
    waitForShutdown: function() {
        return waitForShutdown;
    },
    workerMain: function() {
        return workerMain;
    }
});
const _cpuprofile = require("../../server/lib/cpu-profile");
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _turbopackwarning = require("../../lib/turbopack-warning");
const _turbopackcacheseed = require("../../lib/turbopack-cache-seed");
const _buildcontext = require("../build-context");
const _swc = require("../swc");
const _installbindings = require("../swc/install-bindings");
const _handleentrypoints = require("../handle-entrypoints");
const _manifestloader = require("../../shared/lib/turbopack/manifest-loader");
const _fs = require("fs");
const _constants = require("../../shared/lib/constants");
const _config = /*#__PURE__*/ _interop_require_default(require("../../server/config"));
const _utils = require("../../export/utils");
const _storage = require("../../telemetry/storage");
const _build = require("../../telemetry/events/build");
const _trace = require("../../trace");
const _ciinfo = require("../../server/ci-info");
const _compilationevents = require("../../shared/lib/turbopack/compilation-events");
const _getsupportedbrowsers = require("../get-supported-browsers");
const _printbuilderrors = require("../print-build-errors");
const _normalizepath = require("../../lib/normalize-path");
const _bundler = require("../../lib/bundler");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function turbopackBuild(telemetry) {
    var _config_experimental_deferredEntries, _config_experimental, _config_turbopack, _config_experimental_sri;
    await (0, _turbopackwarning.validateTurboNextConfig)({
        dir: _buildcontext.NextBuildContext.dir,
        configPhase: _constants.PHASE_PRODUCTION_BUILD
    });
    const config = _buildcontext.NextBuildContext.config;
    const dir = _buildcontext.NextBuildContext.dir;
    const distDir = _buildcontext.NextBuildContext.distDir;
    const buildId = _buildcontext.NextBuildContext.buildId;
    const encryptionKey = _buildcontext.NextBuildContext.encryptionKey;
    const previewProps = _buildcontext.NextBuildContext.previewProps;
    const hasRewrites = _buildcontext.NextBuildContext.hasRewrites;
    const rewrites = _buildcontext.NextBuildContext.rewrites;
    const noMangling = _buildcontext.NextBuildContext.noMangling;
    const currentNodeJsVersion = process.versions.node;
    const startTime = process.hrtime();
    const bindings = (0, _swc.getBindingsSync)() // our caller should have already loaded these
    ;
    if (bindings.isWasm) {
        throw Object.defineProperty(new Error(`Turbopack is not supported on this platform (${process.platform}/${process.arch}) because native bindings are not available. ` + `Only WebAssembly (WASM) bindings were loaded, and Turbopack requires native bindings.\n\n` + `To build on this platform, use Webpack instead:\n` + `  next build --webpack\n\n` + `For more information, see: https://nextjs.org/docs/app/api-reference/turbopack#supported-platforms`), "__NEXT_ERROR_CODE", {
            value: "E1050",
            enumerable: false,
            configurable: true
        });
    }
    const dev = false;
    const supportedBrowsers = (0, _getsupportedbrowsers.getSupportedBrowsers)(dir, dev);
    const hasDeferredEntries = (((_config_experimental_deferredEntries = config.experimental.deferredEntries) == null ? void 0 : _config_experimental_deferredEntries.length) ?? 0) > 0;
    const persistentCaching = ((_config_experimental = config.experimental) == null ? void 0 : _config_experimental.turbopackFileSystemCacheForBuild) || false;
    const rootPath = ((_config_turbopack = config.turbopack) == null ? void 0 : _config_turbopack.root) || config.outputFileTracingRoot || dir;
    // Shared options for createProject calls
    const sharedProjectOptions = {
        rootPath,
        projectPath: (0, _normalizepath.normalizePath)(_path.default.relative(rootPath, dir) || '.'),
        distDir,
        nextConfig: config,
        watch: {
            enable: false
        },
        dev,
        env: process.env,
        defineEnv: (0, _swc.createDefineEnv)({
            isTurbopack: true,
            clientRouterFilters: _buildcontext.NextBuildContext.clientRouterFilters,
            config,
            dev,
            distDir,
            projectPath: dir,
            fetchCacheKeyPrefix: config.experimental.fetchCacheKeyPrefix,
            hasRewrites,
            // Implemented separately in Turbopack, doesn't have to be passed here.
            middlewareMatchers: undefined,
            rewrites
        }),
        buildId,
        encryptionKey,
        previewProps,
        browserslistQuery: supportedBrowsers.join(', '),
        noMangling,
        writeRoutesHashesManifest: !!process.env.NEXT_TURBOPACK_WRITE_ROUTES_HASHES_MANIFEST,
        currentNodeJsVersion,
        isPersistentCachingEnabled: persistentCaching,
        deferredEntries: config.experimental.deferredEntries,
        nextVersion: "16.3.5"
    };
    if (config.experimental.turbopackSeedCacheFromWorktree) {
        (0, _turbopackcacheseed.seedTurbopackCacheIfNeeded)({
            projectDir: dir,
            distDir
        });
    }
    const sharedTurboOptions = {
        turbopackMemoryEviction: config.experimental.turbopackMemoryEvictionMode,
        dependencyTracking: persistentCaching || hasDeferredEntries,
        isCi: _ciinfo.isCI,
        isShortSession: true,
        skipCompaction: process.env.NEXT_USE_POST_BUILD === '1'
    };
    const sriEnabled = Boolean((_config_experimental_sri = config.experimental.sri) == null ? void 0 : _config_experimental_sri.algorithm);
    const project = await bindings.turbo.createProject({
        ...sharedProjectOptions,
        debugBuildPaths: _buildcontext.NextBuildContext.debugBuildPaths
    }, sharedTurboOptions, hasDeferredEntries && config.experimental.onBeforeDeferredEntries ? {
        onBeforeDeferredEntries: async ()=>{
            const workerConfig = await (0, _config.default)(_constants.PHASE_PRODUCTION_BUILD, dir, {
                debugPrerender: _buildcontext.NextBuildContext.debugPrerender,
                reactProductionProfiling: _buildcontext.NextBuildContext.reactProductionProfiling,
                bundler: _bundler.Bundler.Turbopack
            });
            await (workerConfig.experimental.onBeforeDeferredEntries == null ? void 0 : workerConfig.experimental.onBeforeDeferredEntries.call(workerConfig.experimental));
        }
    } : undefined);
    const buildEventsSpan = (0, _trace.trace)('turbopack-build-events');
    // Stop immediately: this span is only used as a parent for
    // manualTraceChild calls which carry their own timestamps.
    buildEventsSpan.stop();
    const shutdownController = new AbortController();
    const compilationEvents = (0, _compilationevents.backgroundLogCompilationEvents)(project, {
        parentSpan: buildEventsSpan,
        signal: shutdownController.signal
    });
    try {
        // Write an empty file in a known location to signal this was built with Turbopack
        await _fs.promises.writeFile(_path.default.join(distDir, 'turbopack'), '');
        await _fs.promises.mkdir(_path.default.join(distDir, 'server'), {
            recursive: true
        });
        await _fs.promises.mkdir(_path.default.join(distDir, 'static', buildId), {
            recursive: true
        });
        await _fs.promises.writeFile(_path.default.join(distDir, 'package.json'), '{"type": "commonjs"}');
        let appDirOnly = _buildcontext.NextBuildContext.appDirOnly;
        const entrypoints = await project.writeAllEntrypointsToDisk(appDirOnly);
        // Defer warnings so the caller can print them after static generation,
        // keeping SSG errors more prominent than compile warnings.
        const { warnings } = (0, _printbuilderrors.printBuildErrors)(entrypoints, dev, {
            deferWarnings: true
        });
        // Skip when telemetry is fully off — featureUsage() isn't free.
        if (telemetry.isEnabled || process.env.NEXT_TELEMETRY_DEBUG) {
            try {
                const featureUsage = await project.featureUsage();
                const events = (0, _build.eventBuildFeatureUsageFromTurbopack)(featureUsage);
                if (events.length > 0) {
                    telemetry.record(events);
                }
            } catch (err) {
                // Telemetry must never break a build.
                console.warn('Failed to record Turbopack feature telemetry:', err);
            }
        }
        const routes = entrypoints.routes;
        if (!routes) {
            // This should never ever happen, there should be an error issue, or the bindings call should
            // have thrown.
            throw Object.defineProperty(new Error(`Turbopack build failed`), "__NEXT_ERROR_CODE", {
                value: "E853",
                enumerable: false,
                configurable: true
            });
        }
        const hasPagesEntries = Array.from(routes.values()).some((route)=>{
            if (route.type === 'page' || route.type === 'page-api') {
                return true;
            }
            return false;
        });
        // If there's no pages entries, then we are in app-dir-only mode
        if (!hasPagesEntries) {
            appDirOnly = true;
        }
        const manifestLoader = new _manifestloader.TurbopackManifestLoader({
            buildId,
            distDir,
            encryptionKey,
            dev: false,
            sriEnabled
        });
        const currentEntrypoints = await (0, _handleentrypoints.rawEntrypointsToEntrypoints)(entrypoints);
        const promises = [];
        if (!appDirOnly) {
            for (const [page, route] of currentEntrypoints.page){
                promises.push((0, _handleentrypoints.handleRouteType)({
                    page,
                    route,
                    manifestLoader
                }));
            }
        }
        for (const [page, route] of currentEntrypoints.app){
            promises.push((0, _handleentrypoints.handleRouteType)({
                page,
                route,
                manifestLoader
            }));
        }
        await Promise.all(promises);
        await Promise.all([
            // Only load pages router manifests if not app-only
            ...!appDirOnly ? [
                manifestLoader.loadBuildManifest('_app'),
                manifestLoader.loadPagesManifest('_app'),
                manifestLoader.loadFontManifest('_app'),
                manifestLoader.loadPagesManifest('_document'),
                manifestLoader.loadClientBuildManifest('_error'),
                manifestLoader.loadBuildManifest('_error'),
                manifestLoader.loadPagesManifest('_error'),
                manifestLoader.loadFontManifest('_error')
            ] : [],
            entrypoints.instrumentation && manifestLoader.loadMiddlewareManifest('instrumentation', 'instrumentation'),
            entrypoints.middleware && await manifestLoader.loadMiddlewareManifest('middleware', 'middleware')
        ]);
        manifestLoader.writeManifests({
            devRewrites: undefined,
            productionRewrites: rewrites,
            entrypoints: currentEntrypoints
        });
        if (_buildcontext.NextBuildContext.analyze) {
            await project.writeAnalyzeData(appDirOnly);
        }
        // Shutdown may trigger final compilation events (e.g. persistence,
        // compaction trace spans).  This is the last chance to capture them.
        // After shutdown resolves we abort the signal to close the iterator
        // and drain any remaining buffered events.
        const shutdownPromise = project.shutdown().then(()=>{
            shutdownController.abort();
            return compilationEvents.catch(()=>{});
        });
        const time = process.hrtime(startTime);
        return {
            duration: time[0] + time[1] / 1e9,
            buildTraceContext: undefined,
            shutdownPromise,
            warnings
        };
    } catch (err) {
        await project.shutdown();
        shutdownController.abort();
        await compilationEvents.catch(()=>{});
        throw err;
    }
}
let shutdownPromise;
async function workerMain(workerData) {
    var _config_experimental;
    // setup new build context from the serialized data passed from the parent
    Object.assign(_buildcontext.NextBuildContext, workerData.buildContext);
    (0, _trace.initializeTraceState)(workerData.traceState);
    /// load the config because it's not serializable
    const config = await (0, _config.default)(_constants.PHASE_PRODUCTION_BUILD, _buildcontext.NextBuildContext.dir, {
        debugPrerender: _buildcontext.NextBuildContext.debugPrerender,
        reactProductionProfiling: _buildcontext.NextBuildContext.reactProductionProfiling,
        bundler: _bundler.Bundler.Turbopack
    });
    _buildcontext.NextBuildContext.config = config;
    // Matches handling in build/index.ts
    // https://github.com/vercel/next.js/blob/84f347fc86f4efc4ec9f13615c215e4b9fb6f8f0/packages/next/src/build/index.ts#L815-L818
    // Ensures the `config.distDir` option is matched.
    if ((0, _utils.hasCustomExportOutput)(_buildcontext.NextBuildContext.config)) {
        _buildcontext.NextBuildContext.config.distDir = '.next';
    }
    // Clone the telemetry for worker
    const telemetry = new _storage.Telemetry({
        distDir: _buildcontext.NextBuildContext.config.distDir
    });
    (0, _trace.setGlobal)('telemetry', telemetry);
    // Install bindings early so we can access synchronously later
    await (0, _installbindings.installBindings)((_config_experimental = config.experimental) == null ? void 0 : _config_experimental.useWasmBinary);
    try {
        const { shutdownPromise: resultShutdownPromise, buildTraceContext, duration, warnings } = await turbopackBuild(telemetry);
        shutdownPromise = resultShutdownPromise;
        return {
            buildTraceContext,
            duration,
            warnings
        };
    } finally{
        // Always flush telemetry before worker exits (waits for async operations like setTimeout in debug mode)
        await telemetry.flush();
        // Save CPU profile before worker exits
        await (0, _cpuprofile.saveCpuProfile)();
    }
}
async function waitForShutdown() {
    if (shutdownPromise) {
        await shutdownPromise;
    }
    // Collect trace events after shutdown completes so that all compilation
    // events (e.g. persistence trace spans) have been processed.
    return {
        debugTraceEvents: (0, _trace.getTraceEvents)()
    };
}

//# sourceMappingURL=impl.js.map