// Import cpu-profile first to start profiling early if enabled
import { saveCpuProfile } from '../../server/lib/cpu-profile';
import path from 'path';
import { validateTurboNextConfig } from '../../lib/turbopack-warning';
import { seedTurbopackCacheIfNeeded } from '../../lib/turbopack-cache-seed';
import { NextBuildContext } from '../build-context';
import { createDefineEnv, getBindingsSync } from '../swc';
import { installBindings } from '../swc/install-bindings';
import { handleRouteType, rawEntrypointsToEntrypoints } from '../handle-entrypoints';
import { TurbopackManifestLoader } from '../../shared/lib/turbopack/manifest-loader';
import { promises as fs } from 'fs';
import { PHASE_PRODUCTION_BUILD } from '../../shared/lib/constants';
import loadConfig from '../../server/config';
import { hasCustomExportOutput } from '../../export/utils';
import { Telemetry } from '../../telemetry/storage';
import { eventBuildFeatureUsageFromTurbopack } from '../../telemetry/events/build';
import { setGlobal, trace, initializeTraceState, getTraceEvents } from '../../trace';
import { isCI } from '../../server/ci-info';
import { backgroundLogCompilationEvents } from '../../shared/lib/turbopack/compilation-events';
import { getSupportedBrowsers } from '../get-supported-browsers';
import { printBuildErrors } from '../print-build-errors';
import { normalizePath } from '../../lib/normalize-path';
import { Bundler } from '../../lib/bundler';
export async function turbopackBuild(telemetry) {
    var _config_experimental_deferredEntries, _config_experimental, _config_turbopack, _config_experimental_sri;
    await validateTurboNextConfig({
        dir: NextBuildContext.dir,
        configPhase: PHASE_PRODUCTION_BUILD
    });
    const config = NextBuildContext.config;
    const dir = NextBuildContext.dir;
    const distDir = NextBuildContext.distDir;
    const buildId = NextBuildContext.buildId;
    const encryptionKey = NextBuildContext.encryptionKey;
    const previewProps = NextBuildContext.previewProps;
    const hasRewrites = NextBuildContext.hasRewrites;
    const rewrites = NextBuildContext.rewrites;
    const noMangling = NextBuildContext.noMangling;
    const currentNodeJsVersion = process.versions.node;
    const startTime = process.hrtime();
    const bindings = getBindingsSync() // our caller should have already loaded these
    ;
    if (bindings.isWasm) {
        throw Object.defineProperty(new Error(`Turbopack is not supported on this platform (${process.platform}/${process.arch}) because native bindings are not available. ` + `Only WebAssembly (WASM) bindings were loaded, and Turbopack requires native bindings.\n\n` + `To build on this platform, use Webpack instead:\n` + `  next build --webpack\n\n` + `For more information, see: https://nextjs.org/docs/app/api-reference/turbopack#supported-platforms`), "__NEXT_ERROR_CODE", {
            value: "E1050",
            enumerable: false,
            configurable: true
        });
    }
    const dev = false;
    const supportedBrowsers = getSupportedBrowsers(dir, dev);
    const hasDeferredEntries = (((_config_experimental_deferredEntries = config.experimental.deferredEntries) == null ? void 0 : _config_experimental_deferredEntries.length) ?? 0) > 0;
    const persistentCaching = ((_config_experimental = config.experimental) == null ? void 0 : _config_experimental.turbopackFileSystemCacheForBuild) || false;
    const rootPath = ((_config_turbopack = config.turbopack) == null ? void 0 : _config_turbopack.root) || config.outputFileTracingRoot || dir;
    // Shared options for createProject calls
    const sharedProjectOptions = {
        rootPath,
        projectPath: normalizePath(path.relative(rootPath, dir) || '.'),
        distDir,
        nextConfig: config,
        watch: {
            enable: false
        },
        dev,
        env: process.env,
        defineEnv: createDefineEnv({
            isTurbopack: true,
            clientRouterFilters: NextBuildContext.clientRouterFilters,
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
        seedTurbopackCacheIfNeeded({
            projectDir: dir,
            distDir
        });
    }
    const sharedTurboOptions = {
        turbopackMemoryEviction: config.experimental.turbopackMemoryEvictionMode,
        dependencyTracking: persistentCaching || hasDeferredEntries,
        isCi: isCI,
        isShortSession: true,
        skipCompaction: process.env.NEXT_USE_POST_BUILD === '1'
    };
    const sriEnabled = Boolean((_config_experimental_sri = config.experimental.sri) == null ? void 0 : _config_experimental_sri.algorithm);
    const project = await bindings.turbo.createProject({
        ...sharedProjectOptions,
        debugBuildPaths: NextBuildContext.debugBuildPaths
    }, sharedTurboOptions, hasDeferredEntries && config.experimental.onBeforeDeferredEntries ? {
        onBeforeDeferredEntries: async ()=>{
            const workerConfig = await loadConfig(PHASE_PRODUCTION_BUILD, dir, {
                debugPrerender: NextBuildContext.debugPrerender,
                reactProductionProfiling: NextBuildContext.reactProductionProfiling,
                bundler: Bundler.Turbopack
            });
            await (workerConfig.experimental.onBeforeDeferredEntries == null ? void 0 : workerConfig.experimental.onBeforeDeferredEntries.call(workerConfig.experimental));
        }
    } : undefined);
    const buildEventsSpan = trace('turbopack-build-events');
    // Stop immediately: this span is only used as a parent for
    // manualTraceChild calls which carry their own timestamps.
    buildEventsSpan.stop();
    const shutdownController = new AbortController();
    const compilationEvents = backgroundLogCompilationEvents(project, {
        parentSpan: buildEventsSpan,
        signal: shutdownController.signal
    });
    try {
        // Write an empty file in a known location to signal this was built with Turbopack
        await fs.writeFile(path.join(distDir, 'turbopack'), '');
        await fs.mkdir(path.join(distDir, 'server'), {
            recursive: true
        });
        await fs.mkdir(path.join(distDir, 'static', buildId), {
            recursive: true
        });
        await fs.writeFile(path.join(distDir, 'package.json'), '{"type": "commonjs"}');
        let appDirOnly = NextBuildContext.appDirOnly;
        const entrypoints = await project.writeAllEntrypointsToDisk(appDirOnly);
        // Defer warnings so the caller can print them after static generation,
        // keeping SSG errors more prominent than compile warnings.
        const { warnings } = printBuildErrors(entrypoints, dev, {
            deferWarnings: true
        });
        // Skip when telemetry is fully off — featureUsage() isn't free.
        if (telemetry.isEnabled || process.env.NEXT_TELEMETRY_DEBUG) {
            try {
                const featureUsage = await project.featureUsage();
                const events = eventBuildFeatureUsageFromTurbopack(featureUsage);
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
        const manifestLoader = new TurbopackManifestLoader({
            buildId,
            distDir,
            encryptionKey,
            dev: false,
            sriEnabled
        });
        const currentEntrypoints = await rawEntrypointsToEntrypoints(entrypoints);
        const promises = [];
        if (!appDirOnly) {
            for (const [page, route] of currentEntrypoints.page){
                promises.push(handleRouteType({
                    page,
                    route,
                    manifestLoader
                }));
            }
        }
        for (const [page, route] of currentEntrypoints.app){
            promises.push(handleRouteType({
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
        if (NextBuildContext.analyze) {
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
export async function workerMain(workerData) {
    var _config_experimental;
    // setup new build context from the serialized data passed from the parent
    Object.assign(NextBuildContext, workerData.buildContext);
    initializeTraceState(workerData.traceState);
    /// load the config because it's not serializable
    const config = await loadConfig(PHASE_PRODUCTION_BUILD, NextBuildContext.dir, {
        debugPrerender: NextBuildContext.debugPrerender,
        reactProductionProfiling: NextBuildContext.reactProductionProfiling,
        bundler: Bundler.Turbopack
    });
    NextBuildContext.config = config;
    // Matches handling in build/index.ts
    // https://github.com/vercel/next.js/blob/84f347fc86f4efc4ec9f13615c215e4b9fb6f8f0/packages/next/src/build/index.ts#L815-L818
    // Ensures the `config.distDir` option is matched.
    if (hasCustomExportOutput(NextBuildContext.config)) {
        NextBuildContext.config.distDir = '.next';
    }
    // Clone the telemetry for worker
    const telemetry = new Telemetry({
        distDir: NextBuildContext.config.distDir
    });
    setGlobal('telemetry', telemetry);
    // Install bindings early so we can access synchronously later
    await installBindings((_config_experimental = config.experimental) == null ? void 0 : _config_experimental.useWasmBinary);
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
        await saveCpuProfile();
    }
}
export async function waitForShutdown() {
    if (shutdownPromise) {
        await shutdownPromise;
    }
    // Collect trace events after shutdown completes so that all compilation
    // events (e.g. persistence trace spans) have been processed.
    return {
        debugTraceEvents: getTraceEvents()
    };
}

//# sourceMappingURL=impl.js.map