"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createStaticWorker: null,
    default: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createStaticWorker: function() {
        return createStaticWorker;
    },
    default: function() {
        return build;
    }
});
require("../lib/setup-exception-listeners");
const _resolvebuildpaths = require("../lib/resolve-build-paths");
const _env = require("@next/env");
const _picocolors = require("../lib/picocolors");
const _picomatch = require("next/dist/compiled/picomatch");
const _fs = require("fs");
const _os = /*#__PURE__*/ _interop_require_default(require("os"));
const _worker = require("../lib/worker");
const _configshared = require("../server/config-shared");
const _devalue = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/devalue"));
const _findup = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/find-up"));
const _indexcjs = require("next/dist/compiled/nanoid/index.cjs");
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _formatdynamicimportpath = require("../lib/format-dynamic-import-path");
const _constants = require("../lib/constants");
const _fileexists = require("../lib/file-exists");
const _findpagesdir = require("../lib/find-pages-dir");
const _loadcustomroutes = /*#__PURE__*/ _interop_require_wildcard(require("../lib/load-custom-routes"));
const _nonnullable = require("../lib/non-nullable");
const _recursivedelete = require("../lib/recursive-delete");
const _verifypartytownsetup = require("../lib/verify-partytown-setup");
const _constants1 = require("../shared/lib/constants");
const _entryconstants = require("../shared/lib/entry-constants");
const _utils = require("../shared/lib/router/utils");
const _bundler = require("../lib/bundler");
const _config = /*#__PURE__*/ _interop_require_default(require("../server/config"));
const _normalizepagepath = require("../shared/lib/page-path/normalize-page-path");
const _require = require("../server/require");
const _ciinfo = /*#__PURE__*/ _interop_require_wildcard(require("../server/ci-info"));
const _turborepoaccesstrace = require("./turborepo-access-trace");
const _events = require("../telemetry/events");
const _storage = require("../telemetry/storage");
const _routediscovery = require("./route-discovery");
const _sortbypageexts = require("./sort-by-page-exts");
const _getstaticinfoincludinglayouts = require("./get-static-info-including-layouts");
const _pagetypes = require("../lib/page-types");
const _generatebuildid = require("./generate-build-id");
const _iswriteable = require("./is-writeable");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("./output/log"));
const _spinner = /*#__PURE__*/ _interop_require_default(require("./spinner"));
const _trace = require("../trace");
const _routebundlestats = require("./route-bundle-stats");
const _utils1 = require("./utils");
const _writebuildid = require("./write-build-id");
const _normalizelocalepath = require("../shared/lib/i18n/normalize-locale-path");
const _iserror = /*#__PURE__*/ _interop_require_default(require("../lib/is-error"));
const _isedgeruntime = require("../lib/is-edge-runtime");
const _recursivecopy = require("../lib/recursive-copy");
const _swc = require("./swc");
const _installbindings = require("./swc/install-bindings");
const _routeregex = require("../shared/lib/router/utils/route-regex");
const _getfilesindir = require("../lib/get-files-in-dir");
const _swcplugins = require("../telemetry/events/swc-plugins");
const _apppaths = require("../shared/lib/router/utils/app-paths");
const _approuterheaders = require("../client/components/app-router-headers");
const _webpackbuild = require("./webpack-build");
const _buildcontext = require("./build-context");
const _normalizepathsep = require("../shared/lib/page-path/normalize-path-sep");
const _isapprouteroute = require("../lib/is-app-route-route");
const _getmetadataroute = require("../lib/metadata/get-metadata-route");
const _ismetadataroute = require("../lib/metadata/is-metadata-route");
const _createclientrouterfilter = require("../lib/create-client-router-filter");
const _typecheck = require("./type-check");
const _generateinterceptionroutesrewrites = require("../lib/generate-interception-routes-rewrites");
const _builddataroute = require("../server/lib/router-utils/build-data-route");
const _formatmanifest = require("./manifests/formatter/format-manifest");
const _builddiagnostics = require("../diagnostics/build-diagnostics");
const _appinfolog = require("../server/lib/app-info-log");
const _utils2 = require("../export/utils");
const _trace1 = require("../lib/memory/trace");
const _encryptionutilsserver = require("../server/app-render/encryption-utils-server");
const _uploadtrace = /*#__PURE__*/ _interop_require_default(require("../trace/upload-trace"));
const _ppr = require("../server/lib/experimental/ppr");
const _fallback = require("../lib/fallback");
const _renderingmode = require("./rendering-mode");
const _invarianterror = require("../shared/lib/invariant-error");
const _isbot = require("../shared/lib/router/utils/is-bot");
const _turbopackbuild = require("./turbopack-build");
const _printbuilderrors = require("./print-build-errors");
const _inlinestaticenv = require("../lib/inline-static-env");
const _staticenv = require("../lib/static-env");
const _durationtostring = require("./duration-to-string");
const _shared = require("../trace/shared");
const _errortelemetryutils = require("../lib/error-telemetry-utils");
const _afterproductioncompile = require("./after-production-compile");
const _previewkeyutils = require("./preview-key-utils");
const _buildcomplete = require("./adapter/build-complete");
const _sortableroutes = require("../shared/lib/router/utils/sortable-routes");
const _promises = require("fs/promises");
const _routetypesutils = require("../server/lib/router-utils/route-types-utils");
const _cachelifetypeutils = require("../server/lib/router-utils/cache-life-type-utils");
const _rootparamstypeutils = require("../server/lib/router-utils/root-params-type-utils");
const _lockfile = require("./lockfile");
const _buildprefetchsegmentdataroute = require("../server/lib/router-utils/build-prefetch-segment-data-route");
const _generateroutesmanifest = require("./generate-routes-manifest");
const _buildcustomroute = require("../lib/build-custom-route");
const _validateapppaths = require("./validate-app-paths");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
/**
 * The headers that are allowed to be used when revalidating routes. Currently
 * this includes both headers used by the pages and app routers.
 */ const ALLOWED_HEADERS = [
    'host',
    _constants.MATCHED_PATH_HEADER,
    _constants.PRERENDER_REVALIDATE_HEADER,
    _constants.PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER,
    _constants.NEXT_CACHE_REVALIDATED_TAGS_HEADER,
    _constants.NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER
];
function getPprAppPageClassification(route, result) {
    if (typeof (result == null ? void 0 : result.htmlSize) !== 'number') {
        throw Object.defineProperty(new _invarianterror.InvariantError(`Expected an HTML size for prerendered app route "${route}"`), "__NEXT_ERROR_CODE", {
            value: "E1456",
            enumerable: false,
            configurable: true
        });
    }
    if (typeof result.hasEmptyStaticShell !== 'boolean' || typeof result.hasPostponed !== 'boolean' || typeof result.hasPendingUi !== 'boolean') {
        throw Object.defineProperty(new _invarianterror.InvariantError(`Expected prerender classification data for PPR route "${route}"`), "__NEXT_ERROR_CODE", {
            value: "E1457",
            enumerable: false,
            configurable: true
        });
    }
    return {
        response: result.hasEmptyStaticShell ? 'empty' : result.hasPendingUi || result.hasPostponed ? 'initial' : 'complete',
        compute: result.hasPostponed ? result.hasEmptyStaticShell ? 'blocking' : 'resuming' : 'static',
        htmlSize: result.htmlSize
    };
}
function getStaticAppPageClassification(route, result) {
    if (typeof (result == null ? void 0 : result.htmlSize) !== 'number') {
        throw Object.defineProperty(new _invarianterror.InvariantError(`Expected an HTML size for prerendered app route "${route}"`), "__NEXT_ERROR_CODE", {
            value: "E1456",
            enumerable: false,
            configurable: true
        });
    }
    return {
        routeType: 'page',
        response: 'complete',
        compute: 'static',
        htmlSize: result.htmlSize
    };
}
function getPagesFallbackClassification(fallback) {
    if (fallback === null) {
        return {
            routeType: 'page',
            response: 'empty',
            compute: 'blocking'
        };
    }
    if (typeof fallback === 'string' || fallback === true) {
        return {
            routeType: 'fallback',
            response: 'initial',
            compute: 'static'
        };
    }
    return {};
}
function getCacheDir(distDir) {
    const cacheDir = _path.default.join(distDir, 'cache');
    if (_ciinfo.isCI && !_ciinfo.hasNextSupport) {
        const hasCache = (0, _fs.existsSync)(cacheDir);
        if (!hasCache) {
            // Intentionally not piping to stderr which is what `Log.warn` does in case people fail in CI when
            // stderr is detected.
            console.log(`${_log.prefixes.warn} No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache`);
        }
    }
    return cacheDir;
}
async function writeFileUtf8(filePath, content) {
    await _fs.promises.writeFile(filePath, content, 'utf-8');
}
function readFileUtf8(filePath) {
    return _fs.promises.readFile(filePath, 'utf8');
}
async function writeManifest(filePath, manifest) {
    await writeFileUtf8(filePath, (0, _formatmanifest.formatManifest)(manifest));
}
async function readManifest(filePath) {
    return JSON.parse(await readFileUtf8(filePath));
}
async function writePrerenderManifest(distDir, manifest) {
    // Sort for deterministic outputs
    manifest.routes = (0, _sortableroutes.sortPagesObject)(manifest.routes);
    manifest.dynamicRoutes = (0, _sortableroutes.sortPagesObject)(manifest.dynamicRoutes);
    await writeManifest(_path.default.join(distDir, _constants1.PRERENDER_MANIFEST), manifest);
}
async function writeClientSsgManifest(prerenderManifest, { buildId, distDir, locales }) {
    const ssgPages = new Set([
        ...Object.entries(prerenderManifest.routes)// Filter out dynamic routes
        .filter(([, { srcRoute }])=>srcRoute == null).map(([route])=>(0, _normalizelocalepath.normalizeLocalePath)(route, locales).pathname),
        ...Object.keys(prerenderManifest.dynamicRoutes)
    ].sort());
    const clientSsgManifestContent = `self.__SSG_MANIFEST=${(0, _devalue.default)(ssgPages)};self.__SSG_MANIFEST_CB&&self.__SSG_MANIFEST_CB()`;
    let ssgManifestPath = _path.default.join(_constants1.CLIENT_STATIC_FILES_PATH, buildId, '_ssgManifest.js');
    await writeFileUtf8(_path.default.join(distDir, ssgManifestPath), clientSsgManifestContent);
}
async function writeFunctionsConfigManifest(distDir, manifest) {
    let sortedManifest = {
        version: manifest.version,
        functions: Object.fromEntries(Object.entries(manifest.functions).sort(([a], [b])=>a.localeCompare(b)))
    };
    await writeManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.FUNCTIONS_CONFIG_MANIFEST), sortedManifest);
}
async function writeRequiredServerFilesManifest(distDir, requiredServerFiles) {
    await writeManifest(_path.default.join(distDir, _constants1.SERVER_FILES_MANIFEST + '.json'), requiredServerFiles);
    await writeFileUtf8(_path.default.join(distDir, _constants1.SERVER_FILES_MANIFEST + '.js'), `self.__SERVER_FILES_MANIFEST=${(0, _formatmanifest.formatManifest)(requiredServerFiles)}`);
}
async function writeImagesManifest(distDir, config) {
    var _config_images, _config_images1;
    const images = {
        ...config.images
    };
    const { deviceSizes, imageSizes } = images;
    images.sizes = [
        ...deviceSizes,
        ...imageSizes
    ];
    // By default, remotePatterns will allow no remote images ([])
    images.remotePatterns = ((config == null ? void 0 : (_config_images = config.images) == null ? void 0 : _config_images.remotePatterns) || []).map((p)=>{
        var _p_protocol;
        return {
            // Modifying the manifest should also modify matchRemotePattern()
            protocol: (_p_protocol = p.protocol) == null ? void 0 : _p_protocol.replace(/:$/, ''),
            hostname: (0, _picomatch.makeRe)(p.hostname).source,
            port: p.port,
            pathname: (0, _picomatch.makeRe)(p.pathname ?? '**', {
                dot: true
            }).source,
            search: p.search
        };
    });
    // By default, localPatterns will allow all local images (undefined)
    if (config == null ? void 0 : (_config_images1 = config.images) == null ? void 0 : _config_images1.localPatterns) {
        images.localPatterns = config.images.localPatterns.map((p)=>({
                // Modifying the manifest should also modify matchLocalPattern()
                pathname: (0, _picomatch.makeRe)(p.pathname ?? '**', {
                    dot: true
                }).source,
                search: p.search
            }));
    }
    await writeManifest(_path.default.join(distDir, _constants1.IMAGES_MANIFEST), {
        version: 1,
        images
    });
}
const STANDALONE_DIRECTORY = 'standalone';
async function writeStandaloneDirectory(nextBuildSpan, distDir, pageKeys, denormalizedAppPages, outputFileTracingRoot, requiredServerFiles, middlewareManifest, hasNodeMiddleware, hasInstrumentationHook, staticPages, loadedEnvFiles, appDir) {
    await nextBuildSpan.traceChild('write-standalone-directory').traceAsyncFn(async ()=>{
        await (0, _utils1.copyTracedFiles)(// requiredServerFiles.appDir Refers to the application directory, not App Router.
        requiredServerFiles.appDir, distDir, pageKeys.pages, denormalizedAppPages, outputFileTracingRoot, requiredServerFiles.config, middlewareManifest, hasNodeMiddleware, hasInstrumentationHook, staticPages);
        for (const file of [
            ...requiredServerFiles.files,
            _path.default.join(requiredServerFiles.config.distDir, _constants1.SERVER_FILES_MANIFEST + '.json'),
            ...loadedEnvFiles.reduce((acc, envFile)=>{
                if ([
                    '.env',
                    '.env.production'
                ].includes(envFile.path)) {
                    acc.push(envFile.path);
                }
                return acc;
            }, [])
        ]){
            // requiredServerFiles.appDir Refers to the application directory, not App Router.
            const filePath = _path.default.join(requiredServerFiles.appDir, file);
            const outputPath = _path.default.join(distDir, STANDALONE_DIRECTORY, _path.default.relative(outputFileTracingRoot, filePath));
            await _fs.promises.mkdir(_path.default.dirname(outputPath), {
                recursive: true
            });
            await _fs.promises.copyFile(filePath, outputPath);
        }
        if (hasNodeMiddleware) {
            const middlewareOutput = _path.default.join(distDir, STANDALONE_DIRECTORY, _path.default.relative(outputFileTracingRoot, distDir), _constants1.SERVER_DIRECTORY, 'middleware.js');
            await _fs.promises.mkdir(_path.default.dirname(middlewareOutput), {
                recursive: true
            });
            await _fs.promises.copyFile(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'middleware.js'), middlewareOutput);
        }
        const originalPagesDir = _path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'pages');
        if ((0, _fs.existsSync)(originalPagesDir)) {
            await (0, _recursivecopy.recursiveCopy)(originalPagesDir, _path.default.join(distDir, STANDALONE_DIRECTORY, _path.default.relative(outputFileTracingRoot, distDir), _constants1.SERVER_DIRECTORY, 'pages'), {
                overwrite: true
            });
        }
        if (appDir) {
            const originalServerApp = _path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'app');
            if ((0, _fs.existsSync)(originalServerApp)) {
                await (0, _recursivecopy.recursiveCopy)(originalServerApp, _path.default.join(distDir, STANDALONE_DIRECTORY, _path.default.relative(outputFileTracingRoot, distDir), _constants1.SERVER_DIRECTORY, 'app'), {
                    overwrite: true
                });
            }
        }
    });
}
function getNumberOfWorkers(config, maxTasks) {
    let workers;
    if (config.experimental.cpus && config.experimental.cpus !== _configshared.defaultConfig.experimental.cpus) {
        // If it's not set to the default, it's a user override
        workers = config.experimental.cpus;
    } else if (config.experimental.memoryBasedWorkersCount) {
        workers = Math.max(Math.min(config.experimental.cpus || 1, Math.floor(_os.default.freemem() / 1e9)), // enforce a minimum of 4 workers
        4);
    } else if (config.experimental.cpus) {
        workers = config.experimental.cpus;
    } else {
        // Fall back to 4 workers if a count is not specified
        workers = 4;
    }
    // Cap workers to one more than the number of tasks.
    // Tasks can be passed to avoid over-allocating workers.
    if (maxTasks !== undefined && maxTasks > 0) {
        workers = Math.min(workers, maxTasks + 1);
    }
    return Math.max(workers, 1);
}
const staticWorkerPath = require.resolve('./worker');
const staticWorkerExposedMethods = [
    'hasCustomGetInitialProps',
    'isPageStatic',
    'getDefinedNamedExports',
    'exportPages'
];
function createStaticWorker(config, options) {
    const { numberOfWorkers, debuggerPortOffset, progress } = options;
    return new _worker.Worker(staticWorkerPath, {
        logger: _log,
        numWorkers: numberOfWorkers,
        onActivity: ()=>{
            progress == null ? void 0 : progress.run();
        },
        onActivityAbort: ()=>{
            progress == null ? void 0 : progress.clear();
        },
        debuggerPortOffset,
        enableSourceMaps: config.enablePrerenderSourceMaps,
        // remove --max-old-space-size flag as it can cause memory issues.
        isolatedMemory: true,
        enableWorkerThreads: config.experimental.workerThreads,
        exposedMethods: staticWorkerExposedMethods,
        forkOptions: {
            env: {
                ...process.env.NEXT_CPU_PROF ? {
                    NEXT_CPU_PROF: '1',
                    NEXT_CPU_PROF_DIR: process.env.NEXT_CPU_PROF_DIR,
                    __NEXT_PRIVATE_CPU_PROFILE: 'build-static-worker'
                } : undefined,
                // worker.ts copies this value into globalThis.NEXT_CLIENT_ASSET_SUFFIX
                __NEXT_PRERENDER_CLIENT_ASSET_SUFFIX: config.supportsImmutableAssets || !config.deploymentId ? '' : `?dpl=${config.deploymentId}`
            }
        }
    });
}
async function writeFullyStaticExport(config, dir, enabledDirectories, configOutDir, nextBuildSpan, appDirOnly, bundler) {
    const exportApp = require('../export').default;
    await exportApp(dir, {
        buildExport: false,
        nextConfig: config,
        enabledDirectories,
        silent: true,
        outdir: _path.default.join(dir, configOutDir),
        numWorkers: getNumberOfWorkers(config),
        appDirOnly,
        bundler
    }, nextBuildSpan);
}
async function getBuildId(isGenerateMode, distDir, nextBuildSpan, config) {
    if (isGenerateMode) {
        return await _fs.promises.readFile(_path.default.join(distDir, _constants1.BUILD_ID_FILE), 'utf8');
    }
    if (config.deploymentId) {
        // Skew protection is enabled and NEXT_NAV_DEPLOYMENT_ID_HEADER will be used instead. Set a
        // constant but "random" string because various tools perform `.replace(escapedBuildId, ....)`
        // which would fail if this were something like "build-id" instead.
        return 'build-TfctsWXpff2fKS';
    } else {
        return await nextBuildSpan.traceChild('generate-buildid').traceAsyncFn(()=>(0, _generatebuildid.generateBuildId)(config.generateBuildId, _indexcjs.nanoid));
    }
}
async function build(dir, experimentalAnalyze = false, reactProductionProfiling = false, debugOutput = false, debugPrerender = false, noMangling = false, appDirOnly = false, bundler = _bundler.Bundler.Turbopack, experimentalBuildMode, traceUploadUrl, debugBuildPathsPatterns, enabledFeatures = {}) {
    const isCompileMode = experimentalBuildMode === 'compile';
    const isGenerateMode = experimentalBuildMode === 'generate';
    _buildcontext.NextBuildContext.isCompileMode = isCompileMode;
    _buildcontext.NextBuildContext.analyze = experimentalAnalyze;
    const buildStartTime = Date.now();
    let appType;
    let loadedConfig;
    let staticWorker;
    // Turbopack compile warnings are deferred until after static generation.
    let deferredTurbopackWarnings;
    const flushTurbopackWarnings = ()=>{
        if (deferredTurbopackWarnings && deferredTurbopackWarnings.length > 0) {
            console.warn(`${(0, _printbuilderrors.formatWarningsHeader)(deferredTurbopackWarnings.length)}\n${deferredTurbopackWarnings.join('\n')}`);
        }
        deferredTurbopackWarnings = undefined;
    };
    // A failing static generation worker exits the process directly (`prerenderEarlyExit`), skipping the flush points below.
    process.once('exit', ()=>flushTurbopackWarnings());
    try {
        const nextBuildSpan = (0, _trace.trace)('next-build', undefined, {
            buildMode: experimentalBuildMode,
            version: "16.3.5",
            ...enabledFeatures
        });
        _buildcontext.NextBuildContext.nextBuildSpan = nextBuildSpan;
        _buildcontext.NextBuildContext.dir = dir;
        _buildcontext.NextBuildContext.appDirOnly = appDirOnly;
        _buildcontext.NextBuildContext.reactProductionProfiling = reactProductionProfiling;
        _buildcontext.NextBuildContext.noMangling = noMangling;
        _buildcontext.NextBuildContext.debugPrerender = debugPrerender;
        await nextBuildSpan.traceAsyncFn(async ()=>{
            var _config_experimental, _mappedPages_404, _mappedPages__error, _pageKeys_app, _config_experimental1;
            // attempt to load global env values so they are available in next.config.js
            const { loadedEnvFiles } = nextBuildSpan.traceChild('load-dotenv').traceFn(()=>(0, _env.loadEnvConfig)(dir, false, _log));
            _buildcontext.NextBuildContext.loadedEnvFiles = loadedEnvFiles;
            // Log the version banner before loading the config just like `dev`
            (0, _appinfolog.logStartInfo)({
                networkUrl: null,
                appUrl: null,
                envInfo: (0, _appinfolog.getEnvInfo)(dir),
                logBundler: true
            });
            const turborepoAccessTraceResult = new _turborepoaccesstrace.TurborepoAccessTraceResult();
            let experimentalFeatures = [];
            const config = await nextBuildSpan.traceChild('load-next-config').traceAsyncFn(()=>(0, _turborepoaccesstrace.turborepoTraceAccess)(()=>(0, _config.default)(_constants1.PHASE_PRODUCTION_BUILD, dir, {
                        // Log for next.config loading process
                        silent: false,
                        reactProductionProfiling,
                        debugPrerender,
                        reportExperimentalFeatures (features) {
                            experimentalFeatures = features.toSorted(({ key: a }, { key: b })=>a.localeCompare(b));
                        },
                        bundler
                    }), turborepoAccessTraceResult));
            loadedConfig = config;
            // Resolve selective build paths now that the page extensions are known.
            const debugBuildPaths = debugBuildPathsPatterns ? await (async ()=>{
                const resolved = await (0, _resolvebuildpaths.resolveBuildPaths)(debugBuildPathsPatterns, dir, config.pageExtensions);
                return {
                    app: resolved.appPaths,
                    pages: resolved.pagePaths
                };
            })() : undefined;
            _buildcontext.NextBuildContext.debugBuildPaths = debugBuildPaths;
            // Validate deploymentId if provided
            if (config.deploymentId !== undefined) {
                if (typeof config.deploymentId !== 'string') {
                    throw Object.defineProperty(new Error(`Invalid \`deploymentId\` configuration: must be a string. See https://nextjs.org/docs/messages/deploymentid-not-a-string`), "__NEXT_ERROR_CODE", {
                        value: "E987",
                        enumerable: false,
                        configurable: true
                    });
                }
                if (!/^[a-zA-Z0-9_-]*$/.test(config.deploymentId)) {
                    throw Object.defineProperty(new Error(`Invalid \`deploymentId\` configuration: contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed. See https://nextjs.org/docs/messages/deploymentid-invalid-characters`), "__NEXT_ERROR_CODE", {
                        value: "E988",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
            // Reading the config can modify environment variables that influence the bundler selection.
            bundler = (0, _bundler.finalizeBundlerFromConfig)(bundler);
            nextBuildSpan.setAttribute('bundler', getBundlerForTelemetry(bundler));
            let configOutDir = 'out';
            if ((0, _utils2.hasCustomExportOutput)(config)) {
                configOutDir = config.distDir;
                config.distDir = '.next';
            }
            const distDir = _path.default.join(dir, config.distDir);
            _buildcontext.NextBuildContext.distDir = distDir;
            (0, _trace.setGlobal)('phase', _constants1.PHASE_PRODUCTION_BUILD);
            (0, _trace.setGlobal)('distDir', distDir);
            // Check for build cache before initializing telemetry, because the
            // Telemetry constructor creates the cache directory in CI environments.
            const cacheDir = getCacheDir(distDir);
            // Initialize telemetry before installBindings so that SWC load failure
            // events are captured if native bindings fail to load.
            const telemetry = new _storage.Telemetry({
                distDir
            });
            (0, _trace.setGlobal)('telemetry', telemetry);
            // Install the native bindings early so we can have synchronous access later.
            await (0, _installbindings.installBindings)((_config_experimental = config.experimental) == null ? void 0 : _config_experimental.useWasmBinary);
            // Set up code frame renderer for error formatting
            const { installCodeFrameSupport } = require('../server/lib/install-code-frame');
            installCodeFrameSupport();
            process.env.NEXT_DEPLOYMENT_ID = config.deploymentId || '';
            _buildcontext.NextBuildContext.config = config;
            const buildId = await getBuildId(isGenerateMode, distDir, nextBuildSpan, config);
            _buildcontext.NextBuildContext.buildId = buildId;
            if (experimentalBuildMode === 'generate-env') {
                if (bundler === _bundler.Bundler.Turbopack) {
                    _log.warn('generate-env is not needed with turbopack');
                    process.exit(0);
                }
                _log.info('Inlining static env ...');
                await nextBuildSpan.traceChild('inline-static-env').traceAsyncFn(async ()=>{
                    await (0, _inlinestaticenv.inlineStaticEnv)({
                        distDir,
                        config
                    });
                });
                _log.info('Complete');
                await (0, _trace.flushAllTraces)();
                (0, _swc.teardownTraceSubscriber)();
                process.exit(0);
            }
            // when using compile mode static env isn't inlined so we
            // need to populate in normal runtime env
            if (isCompileMode || isGenerateMode) {
                (0, _staticenv.populateStaticEnv)(config, config.deploymentId);
            }
            const customRoutes = await nextBuildSpan.traceChild('load-custom-routes').traceAsyncFn(()=>(0, _loadcustomroutes.default)(config));
            const { headers, onMatchHeaders, rewrites, redirects } = customRoutes;
            const combinedRewrites = [
                ...rewrites.beforeFiles,
                ...rewrites.afterFiles,
                ...rewrites.fallback
            ];
            const hasRewrites = combinedRewrites.length > 0;
            _buildcontext.NextBuildContext.hasRewrites = hasRewrites;
            _buildcontext.NextBuildContext.originalRewrites = config._originalRewrites;
            _buildcontext.NextBuildContext.originalRedirects = config._originalRedirects;
            const distDirCreated = await nextBuildSpan.traceChild('create-dist-dir').traceAsyncFn(async ()=>{
                try {
                    await _fs.promises.mkdir(distDir, {
                        recursive: true
                    });
                    return true;
                } catch (err) {
                    if ((0, _iserror.default)(err) && err.code === 'EPERM') {
                        return false;
                    }
                    throw err;
                }
            });
            if (!distDirCreated || !await (0, _iswriteable.isWriteable)(distDir)) {
                throw Object.defineProperty(new Error('> Build directory is not writeable. https://nextjs.org/docs/messages/build-dir-not-writeable'), "__NEXT_ERROR_CODE", {
                    value: "E202",
                    enumerable: false,
                    configurable: true
                });
            }
            if (config.experimental.lockDistDir) {
                // This leaks the lock file descriptor. That's okay, it'll be cleaned up by the OS upon
                // process exit.
                await _lockfile.Lockfile.acquireWithRetriesOrExit(_path.default.join(distDir, 'lock'), 'next build');
            }
            if (config.cleanDistDir && !isGenerateMode) {
                await nextBuildSpan.traceChild('clean').traceAsyncFn(()=>(0, _recursivedelete.recursiveDeleteSyncWithAsyncRetries)(distDir, /^(cache|dev|lock|trace)/));
            }
            const publicDir = _path.default.join(dir, 'public');
            const { pagesDir, appDir } = (0, _findpagesdir.findPagesDir)(dir);
            if (pagesDir && appDir) {
                appType = 'hybrid';
            } else if (pagesDir) {
                appType = 'pages';
            } else if (appDir) {
                appType = 'app';
            }
            if (!appDirOnly && !pagesDir) {
                appDirOnly = true;
            }
            _buildcontext.NextBuildContext.pagesDir = pagesDir;
            _buildcontext.NextBuildContext.appDir = appDir;
            const enabledDirectories = {
                app: typeof appDir === 'string',
                pages: typeof pagesDir === 'string'
            };
            // Generate a random encryption key for this build.
            // This key is used to encrypt cross boundary values and can be used to generate hashes.
            const encryptionKey = await (0, _encryptionutilsserver.generateEncryptionKeyBase64)({
                isBuild: true,
                distDir
            });
            _buildcontext.NextBuildContext.encryptionKey = encryptionKey;
            const isSrcDir = _path.default.relative(dir, pagesDir || appDir || '').startsWith('src');
            const hasPublicDir = (0, _fs.existsSync)(publicDir);
            telemetry.record((0, _events.eventCliSession)(config, {
                webpackVersion: 5,
                cliCommand: 'build',
                isSrcDir,
                hasNowJson: !!await (0, _findup.default)('now.json', {
                    cwd: dir
                }),
                isCustomServer: null,
                turboFlag: bundler === _bundler.Bundler.Turbopack,
                pagesDir: !!pagesDir,
                appDir: !!appDir
            }));
            (0, _events.eventNextPlugins)(_path.default.resolve(dir)).then((events)=>telemetry.record(events));
            (0, _swcplugins.eventSwcPlugins)(_path.default.resolve(dir), config).then((events)=>telemetry.record(events));
            (0, _appinfolog.logExperimentalInfo)({
                experimentalFeatures,
                cacheComponents: !!config.cacheComponents,
                partialPrefetching: config.partialPrefetching
            });
            const typeCheckingOptions = {
                dir,
                appDir,
                pagesDir,
                telemetry,
                nextBuildSpan,
                config,
                cacheDir,
                debugBuildPaths
            };
            if (appDir && 'exportPathMap' in config) {
                const errorMessage = 'The "exportPathMap" configuration cannot be used with the "app" directory. Please use generateStaticParams() instead.';
                _log.error(errorMessage);
                await telemetry.flush();
                throw Object.defineProperty(new Error(errorMessage), "__NEXT_ERROR_CODE", {
                    value: "E998",
                    enumerable: false,
                    configurable: true
                });
            }
            const middlewareDetectionRegExp = new RegExp(`^${_constants.MIDDLEWARE_FILENAME}\\.(?:${config.pageExtensions.join('|')})$`);
            const proxyDetectionRegExp = new RegExp(`^${_constants.PROXY_FILENAME}\\.(?:${config.pageExtensions.join('|')})$`);
            const instrumentationHookDetectionRegExp = new RegExp(`^${_constants.INSTRUMENTATION_HOOK_FILENAME}\\.(?:${config.pageExtensions.join('|')})$`);
            const rootDir = _path.default.join(pagesDir || appDir, '..');
            const includes = [
                middlewareDetectionRegExp,
                proxyDetectionRegExp,
                instrumentationHookDetectionRegExp
            ];
            const rootPaths = Array.from(await (0, _getfilesindir.getFilesInDir)(rootDir)).filter((file)=>includes.some((include)=>include.test(file))).sort((0, _sortbypageexts.sortByPageExts)(config.pageExtensions)).map((file)=>_path.default.join(rootDir, file).replace(dir, ''));
            let instrumentationHookFilePath;
            let proxyFilePath;
            let middlewareFilePath;
            for (const rootPath of rootPaths){
                const { name: fileBaseName, dir: fileDir } = _path.default.parse(rootPath);
                const normalizedFileDir = (0, _normalizepathsep.normalizePathSep)(fileDir);
                const isAtConventionLevel = normalizedFileDir === '/' || normalizedFileDir === '/src';
                if (isAtConventionLevel && fileBaseName === _constants.MIDDLEWARE_FILENAME) {
                    middlewareFilePath = rootPath;
                }
                if (isAtConventionLevel && fileBaseName === _constants.PROXY_FILENAME) {
                    proxyFilePath = rootPath;
                }
                if (isAtConventionLevel && fileBaseName === _constants.INSTRUMENTATION_HOOK_FILENAME) {
                    instrumentationHookFilePath = rootPath;
                }
            }
            if (middlewareFilePath) {
                if (proxyFilePath) {
                    const cwd = process.cwd();
                    const absoluteProxyPath = _path.default.join(rootDir, proxyFilePath);
                    const absoluteMiddlewarePath = _path.default.join(rootDir, middlewareFilePath);
                    throw Object.defineProperty(new Error(`Both ${_constants.MIDDLEWARE_FILENAME} file "./${_path.default.relative(cwd, absoluteMiddlewarePath)}" and ${_constants.PROXY_FILENAME} file "./${_path.default.relative(cwd, absoluteProxyPath)}" are detected. Please use "./${_path.default.relative(cwd, absoluteProxyPath)}" only. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`), "__NEXT_ERROR_CODE", {
                        value: "E900",
                        enumerable: false,
                        configurable: true
                    });
                }
                _log.warnOnce(`The "${_constants.MIDDLEWARE_FILENAME}" file convention is deprecated. Please use "${_constants.PROXY_FILENAME}" instead.\n\n` + `  To migrate automatically, run:\n` + `  npx @next/codemod@canary middleware-to-proxy .\n\n` + `  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`);
            }
            const hasInstrumentationHook = Boolean(instrumentationHookFilePath);
            const hasMiddlewareFile = Boolean(middlewareFilePath);
            const hasProxyFile = Boolean(proxyFilePath);
            _buildcontext.NextBuildContext.hasInstrumentationHook = hasInstrumentationHook;
            const previewProps = await (0, _previewkeyutils.generatePreviewKeys)({
                isBuild: true,
                distDir
            });
            _buildcontext.NextBuildContext.previewProps = previewProps;
            const discovery = await nextBuildSpan.traceChild('discover-routes').traceAsyncFn(()=>(0, _routediscovery.discoverRoutes)({
                    appDir,
                    pagesDir,
                    pageExtensions: config.pageExtensions,
                    isDev: false,
                    baseDir: dir,
                    isSrcDir,
                    appDirOnly,
                    debugBuildPaths
                }));
            // Update appDirOnly from discovery (may have changed if no pages found)
            appDirOnly = discovery.appDirOnly;
            _buildcontext.NextBuildContext.appDirOnly = appDirOnly;
            const pagesPaths = discovery.pagesPaths;
            _buildcontext.NextBuildContext.mappedPages = discovery.mappedPages || {};
            _buildcontext.NextBuildContext.mappedAppPages = discovery.mappedAppPages;
            _buildcontext.NextBuildContext.mappedRootPaths = await nextBuildSpan.traceChild('create-root-mapping').traceAsyncFn(()=>(0, _routediscovery.createPagesMapping)({
                    isDev: false,
                    pageExtensions: config.pageExtensions,
                    pagePaths: rootPaths,
                    pagesType: _pagetypes.PAGE_TYPES.ROOT,
                    pagesDir,
                    appDir,
                    appDirOnly
                }));
            const { pageRoutes, pageApiRoutes, appRoutes, appRouteHandlers, layoutRoutes, slots } = discovery;
            const pagesPageKeys = Object.keys(_buildcontext.NextBuildContext.mappedPages);
            const conflictingAppPagePaths = [];
            const appPageKeys = new Set();
            let denormalizedAppPages;
            if (discovery.mappedAppPages) {
                denormalizedAppPages = Object.keys(discovery.mappedAppPages);
                for (const appKey of denormalizedAppPages){
                    const normalizedAppPageKey = (0, _apppaths.normalizeAppPath)(appKey);
                    const pagePath = _buildcontext.NextBuildContext.mappedPages[normalizedAppPageKey];
                    if (pagePath) {
                        const appPath = discovery.mappedAppPages[appKey];
                        conflictingAppPagePaths.push([
                            pagePath.replace(/^private-next-pages/, 'pages'),
                            appPath.replace(/^private-next-app-dir/, 'app')
                        ]);
                    }
                    appPageKeys.add(normalizedAppPageKey);
                }
            }
            const appPaths = Array.from(appPageKeys);
            const totalAppPagesCount = appPaths.length;
            const mappedPages = _buildcontext.NextBuildContext.mappedPages;
            const mappedAppPages = _buildcontext.NextBuildContext.mappedAppPages;
            // Validate that the app paths are valid. This is currently duplicating
            // the logic from packages/next/src/shared/lib/router/utils/sorted-routes.ts
            // but is instead specifically focused on code that can be shared
            // eventually with the development code.
            (0, _validateapppaths.validateAppPaths)(appPaths);
            // Interception routes are modelled as beforeFiles rewrites
            rewrites.beforeFiles.push(...(0, _generateinterceptionroutesrewrites.generateInterceptionRoutesRewrites)(appPaths, config.basePath));
            _buildcontext.NextBuildContext.rewrites = rewrites;
            const pageKeys = {
                pages: pagesPageKeys,
                app: appPaths.length > 0 ? appPaths : undefined
            };
            await nextBuildSpan.traceChild('generate-route-types').traceAsyncFn(async ()=>{
                const routeTypesFilePath = _path.default.join(distDir, 'types', 'routes.d.ts');
                const validatorFilePath = _path.default.join(distDir, 'types', 'validator.ts');
                const cacheLifeFilePath = _path.default.join(distDir, 'types', 'cache-life.d.ts');
                await (0, _promises.mkdir)(_path.default.dirname(routeTypesFilePath), {
                    recursive: true
                });
                const routeTypesManifest = await (0, _routetypesutils.createRouteTypesManifest)({
                    dir,
                    pageRoutes,
                    appRoutes,
                    appRouteHandlers,
                    pageApiRoutes,
                    layoutRoutes,
                    slots,
                    redirects: config.redirects,
                    rewrites: config.rewrites,
                    validatorFilePath
                });
                await (0, _routetypesutils.writeRouteTypesManifest)(routeTypesManifest, routeTypesFilePath, config);
                await (0, _routetypesutils.writeValidatorFile)(routeTypesManifest, validatorFilePath, Boolean(config.experimental.strictRouteTypes));
                (0, _cachelifetypeutils.writeCacheLifeTypes)(config.cacheLife, cacheLifeFilePath);
                await (0, _rootparamstypeutils.writeRootParamsTypes)(routeTypesManifest, _path.default.join(distDir, 'types', 'root-params.d.ts'));
            });
            // Turbopack already handles conflicting app and page routes.
            if (bundler !== _bundler.Bundler.Turbopack) {
                const numConflictingAppPaths = conflictingAppPagePaths.length;
                if (mappedAppPages && numConflictingAppPaths > 0) {
                    const errorMessage = `Conflicting app and page file${numConflictingAppPaths === 1 ? ' was' : 's were'} found, please remove the conflicting files to continue:`;
                    _log.error(errorMessage);
                    for (const [pagePath, appPath] of conflictingAppPagePaths){
                        _log.error(`  "${pagePath}" - "${appPath}"`);
                    }
                    await telemetry.flush();
                    throw Object.defineProperty(new Error(errorMessage), "__NEXT_ERROR_CODE", {
                        value: "E1042",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
            const conflictingPublicFiles = [];
            const hasPages404 = (_mappedPages_404 = mappedPages['/404']) == null ? void 0 : _mappedPages_404.startsWith(_constants.PAGES_DIR_ALIAS);
            const hasApp404 = !!(mappedAppPages == null ? void 0 : mappedAppPages[_entryconstants.UNDERSCORE_NOT_FOUND_ROUTE_ENTRY]);
            const hasAppGlobalError = !!(mappedAppPages == null ? void 0 : mappedAppPages[_entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE_ENTRY]);
            const hasCustomErrorPage = (_mappedPages__error = mappedPages['/_error']) == null ? void 0 : _mappedPages__error.startsWith(_constants.PAGES_DIR_ALIAS);
            // Check if there are any user pages (non-reserved pages) in the pages router
            const hasUserPagesRoutes = Object.keys(mappedPages).some((route)=>!(0, _utils1.isReservedPage)(route));
            if (hasPublicDir) {
                const hasPublicUnderScoreNextDir = (0, _fs.existsSync)(_path.default.join(publicDir, '_next'));
                if (hasPublicUnderScoreNextDir) {
                    throw Object.defineProperty(new Error(_constants.PUBLIC_DIR_MIDDLEWARE_CONFLICT), "__NEXT_ERROR_CODE", {
                        value: "E394",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
            await nextBuildSpan.traceChild('public-dir-conflict-check').traceAsyncFn(async ()=>{
                // Check if pages conflict with files in `public`
                // Only a page of public file can be served, not both.
                for(const page in mappedPages){
                    const hasPublicPageFile = await (0, _fileexists.fileExists)(_path.default.join(publicDir, page === '/' ? '/index' : page), _fileexists.FileType.File);
                    if (hasPublicPageFile) {
                        conflictingPublicFiles.push(page);
                    }
                }
                const numConflicting = conflictingPublicFiles.length;
                if (numConflicting) {
                    throw Object.defineProperty(new Error(`Conflicting public and page file${numConflicting === 1 ? ' was' : 's were'} found. https://nextjs.org/docs/messages/conflicting-public-file-page\n${conflictingPublicFiles.join('\n')}`), "__NEXT_ERROR_CODE", {
                        value: "E270",
                        enumerable: false,
                        configurable: true
                    });
                }
            });
            const nestedReservedPages = pageKeys.pages.filter((page)=>{
                return page.match(/\/(_app|_document|_error)$/) && _path.default.dirname(page) !== '/';
            });
            if (nestedReservedPages.length) {
                _log.warn(`The following reserved Next.js pages were detected not directly under the pages directory:\n` + nestedReservedPages.join('\n') + `\nSee more info here: https://nextjs.org/docs/messages/nested-reserved-page\n`);
            }
            const restrictedRedirectPaths = [
                '/_next'
            ].map((p)=>config.basePath ? `${config.basePath}${p}` : p);
            const isAppCacheComponentsEnabled = Boolean(config.cacheComponents);
            const isAuthInterruptsEnabled = Boolean(config.experimental.authInterrupts);
            const isAppPPREnabled = (0, _ppr.checkIsAppPPREnabled)(config.experimental.ppr);
            const routesManifestPath = _path.default.join(distDir, _constants1.ROUTES_MANIFEST);
            // Generate the routes manifest using the extracted helper
            const { routesManifest, dynamicRoutes, sourcePages } = nextBuildSpan.traceChild('generate-routes-manifest').traceFn(()=>(0, _generateroutesmanifest.generateRoutesManifest)({
                    appType,
                    pageKeys,
                    config,
                    redirects,
                    headers,
                    onMatchHeaders,
                    rewrites,
                    restrictedRedirectPaths,
                    isAppPPREnabled,
                    deploymentId: config.deploymentId
                }));
            // For pages directory, we run type checking after route collection but before build.
            if (!appDir && !isCompileMode) {
                await (0, _typecheck.startTypeChecking)(typeCheckingOptions);
            }
            let clientRouterFilters;
            if (config.experimental.clientRouterFilter) {
                const nonInternalRedirects = (config._originalRedirects || []).filter((r)=>!r.internal);
                clientRouterFilters = (0, _createclientrouterfilter.createClientRouterFilter)([
                    ...appPaths
                ], config.experimental.clientRouterFilterRedirects ? nonInternalRedirects : [], config.experimental.clientRouterFilterAllowedRate);
                _buildcontext.NextBuildContext.clientRouterFilters = clientRouterFilters;
            }
            // Ensure commonjs handling is used for files in the distDir (generally .next)
            // Files outside of the distDir can be "type": "module"
            await writeFileUtf8(_path.default.join(distDir, 'package.json'), '{"type": "commonjs"}');
            // These are written to distDir, so they need to come after creating and cleaning distDr.
            await (0, _builddiagnostics.recordFrameworkVersion)("16.3.5");
            await (0, _builddiagnostics.updateBuildDiagnostics)({
                buildStage: 'start'
            });
            const outputFileTracingRoot = config.outputFileTracingRoot || dir;
            const pagesManifestPath = _path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.PAGES_MANIFEST);
            let buildTraceContext;
            let buildTracesPromise = undefined;
            // If there's has a custom webpack config and disable the build worker.
            // Otherwise respect the option if it's set.
            const useBuildWorker = config.experimental.webpackBuildWorker || config.experimental.webpackBuildWorker === undefined && !config.webpack;
            const runServerAndEdgeInParallel = config.experimental.parallelServerCompiles;
            const collectServerBuildTracesInParallel = config.experimental.parallelServerBuildTraces || config.experimental.parallelServerBuildTraces === undefined && isCompileMode;
            nextBuildSpan.setAttribute('has-custom-webpack-config', String(!!config.webpack));
            nextBuildSpan.setAttribute('use-build-worker', String(useBuildWorker));
            if (!useBuildWorker && (runServerAndEdgeInParallel || collectServerBuildTracesInParallel)) {
                throw Object.defineProperty(new Error('The "parallelServerBuildTraces" and "parallelServerCompiles" options may only be used when build workers can be used. Read more: https://nextjs.org/docs/messages/parallel-build-without-worker'), "__NEXT_ERROR_CODE", {
                    value: "E101",
                    enumerable: false,
                    configurable: true
                });
            }
            // #region Compile
            _log.info('Creating an optimized production build ...');
            (0, _trace1.traceMemoryUsage)('Starting build', nextBuildSpan);
            await (0, _builddiagnostics.updateBuildDiagnostics)({
                buildStage: 'compile',
                buildOptions: {
                    useBuildWorker: String(useBuildWorker)
                }
            });
            let shutdownPromise = Promise.resolve();
            if (!isGenerateMode) {
                if (bundler === _bundler.Bundler.Turbopack) {
                    const { duration: compilerDuration, shutdownPromise: p, warnings, ...rest } = await (0, _turbopackbuild.turbopackBuild)(process.env.NEXT_TURBOPACK_USE_WORKER === undefined || process.env.NEXT_TURBOPACK_USE_WORKER !== '0', telemetry);
                    shutdownPromise = p;
                    deferredTurbopackWarnings = warnings;
                    (0, _trace1.traceMemoryUsage)('Finished build', nextBuildSpan);
                    buildTraceContext = rest.buildTraceContext;
                    const durationString = (0, _durationtostring.durationToString)(compilerDuration);
                    _log.event(`Compiled successfully in ${durationString}`);
                    telemetry.record((0, _events.eventBuildCompleted)(pagesPaths, {
                        bundler: 'turbopack',
                        durationInSeconds: Math.round(compilerDuration),
                        totalAppPagesCount
                    }));
                } else {
                    if (runServerAndEdgeInParallel || collectServerBuildTracesInParallel) {
                        let durationInSeconds = 0;
                        await (0, _builddiagnostics.updateBuildDiagnostics)({
                            buildStage: 'compile-server'
                        });
                        const serverBuildPromise = (0, _webpackbuild.webpackBuild)(useBuildWorker, [
                            'server'
                        ]).then((res)=>{
                            (0, _trace1.traceMemoryUsage)('Finished server compilation', nextBuildSpan);
                            buildTraceContext = res.buildTraceContext;
                            durationInSeconds += res.duration;
                            if (collectServerBuildTracesInParallel) {
                                const buildTraceWorker = new _worker.Worker(require.resolve('./collect-build-traces'), {
                                    debuggerPortOffset: -1,
                                    isolatedMemory: false,
                                    numWorkers: 1,
                                    exposedMethods: [
                                        'collectBuildTraces'
                                    ],
                                    forkOptions: process.env.NEXT_CPU_PROF ? {
                                        env: {
                                            NEXT_CPU_PROF: '1',
                                            NEXT_CPU_PROF_DIR: process.env.NEXT_CPU_PROF_DIR,
                                            __NEXT_PRIVATE_CPU_PROFILE: 'build-trace-worker'
                                        }
                                    } : undefined
                                });
                                buildTracesPromise = nextBuildSpan.traceChild('collect-build-traces').traceAsyncFn(()=>{
                                    return buildTraceWorker.collectBuildTraces({
                                        dir,
                                        config,
                                        distDir,
                                        // Serialize Map as this is sent to the worker.
                                        edgeRuntimeRoutes: (0, _utils1.collectRoutesUsingEdgeRuntime)(new Map()),
                                        staticPages: [],
                                        buildTraceContext,
                                        outputFileTracingRoot
                                    }).catch((err)=>{
                                        console.error(err);
                                        throw err;
                                    });
                                });
                            }
                        });
                        if (!runServerAndEdgeInParallel) {
                            await serverBuildPromise;
                            await (0, _builddiagnostics.updateBuildDiagnostics)({
                                buildStage: 'webpack-compile-edge-server'
                            });
                        }
                        const edgeBuildPromise = (0, _webpackbuild.webpackBuild)(useBuildWorker, [
                            'edge-server'
                        ]).then((res)=>{
                            durationInSeconds += res.duration;
                            (0, _trace1.traceMemoryUsage)('Finished edge-server compilation', nextBuildSpan);
                        });
                        if (runServerAndEdgeInParallel) {
                            await serverBuildPromise;
                            await (0, _builddiagnostics.updateBuildDiagnostics)({
                                buildStage: 'webpack-compile-edge-server'
                            });
                        }
                        await edgeBuildPromise;
                        await (0, _builddiagnostics.updateBuildDiagnostics)({
                            buildStage: 'webpack-compile-client'
                        });
                        await (0, _webpackbuild.webpackBuild)(useBuildWorker, [
                            'client'
                        ]).then((res)=>{
                            durationInSeconds += res.duration;
                            (0, _trace1.traceMemoryUsage)('Finished client compilation', nextBuildSpan);
                        });
                        const durationString = (0, _durationtostring.durationToString)(durationInSeconds);
                        _log.event(`Compiled successfully in ${durationString}`);
                        telemetry.record((0, _events.eventBuildCompleted)(pagesPaths, {
                            bundler: getBundlerForTelemetry(bundler),
                            durationInSeconds,
                            totalAppPagesCount
                        }));
                    } else {
                        const { duration: compilerDuration, ...rest } = await (0, _webpackbuild.webpackBuild)(useBuildWorker, null);
                        (0, _trace1.traceMemoryUsage)('Finished build', nextBuildSpan);
                        buildTraceContext = rest.buildTraceContext;
                        telemetry.record((0, _events.eventBuildCompleted)(pagesPaths, {
                            bundler: getBundlerForTelemetry(bundler),
                            durationInSeconds: compilerDuration,
                            totalAppPagesCount
                        }));
                    }
                }
                await (0, _afterproductioncompile.runAfterProductionCompile)({
                    config,
                    buildSpan: nextBuildSpan,
                    telemetry,
                    metadata: {
                        projectDir: dir,
                        distDir
                    }
                });
            }
            // #endregion
            // For app directory, we run type checking after build.
            if (appDir && !isCompileMode && !isGenerateMode) {
                await (0, _builddiagnostics.updateBuildDiagnostics)({
                    buildStage: 'type-checking'
                });
                await (0, _typecheck.startTypeChecking)(typeCheckingOptions);
                (0, _trace1.traceMemoryUsage)('Finished type checking', nextBuildSpan);
            }
            // #region required-server-files
            const requiredServerFilesManifest = await nextBuildSpan.traceChild('generate-required-server-files').traceAsyncFn(async ()=>{
                let runtimeConfig = (0, _configshared.getNextConfigRuntime)(config);
                const normalizedCacheHandlers = {};
                for (const [key, value] of Object.entries(runtimeConfig.cacheHandlers || {})){
                    if (key && value) {
                        normalizedCacheHandlers[key] = _path.default.relative(distDir, (0, _formatdynamicimportpath.resolveCacheHandlerPathToFilesystem)(value));
                    }
                }
                // getNextConfigRuntime only filters if experimental.runtimeServerDeploymentId is true,
                // but we unconditionally want to remove configFile for this manifest
                let runtimeConfigWithoutFilePath = {
                    ...runtimeConfig
                };
                delete runtimeConfigWithoutFilePath.configFile;
                const serverFilesManifest = {
                    version: 1,
                    config: {
                        ...runtimeConfigWithoutFilePath,
                        ..._ciinfo.hasNextSupport ? {
                            compress: false
                        } : {},
                        cacheHandler: runtimeConfig.cacheHandler ? _path.default.relative(distDir, (0, _formatdynamicimportpath.resolveCacheHandlerPathToFilesystem)(runtimeConfig.cacheHandler)) : runtimeConfig.cacheHandler,
                        cacheHandlers: normalizedCacheHandlers,
                        experimental: {
                            ...runtimeConfig.experimental,
                            trustHostHeader: _ciinfo.hasNextSupport,
                            isExperimentalCompile: isCompileMode
                        }
                    },
                    appDir: dir,
                    relativeAppDir: _path.default.relative(outputFileTracingRoot, dir),
                    files: [
                        // distDir `{"type":"commonjs"}` boundary so `.next/server/**/*.js`
                        // is loaded as CJS when the user's project is "type": "module".
                        'package.json',
                        _constants1.ROUTES_MANIFEST,
                        _path.default.relative(distDir, pagesManifestPath),
                        _constants1.BUILD_MANIFEST,
                        _constants1.PRERENDER_MANIFEST,
                        _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.FUNCTIONS_CONFIG_MANIFEST),
                        _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST),
                        _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_BUILD_MANIFEST + '.js'),
                        ...bundler !== _bundler.Bundler.Turbopack ? [
                            _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_REACT_LOADABLE_MANIFEST + '.js'),
                            _constants1.REACT_LOADABLE_MANIFEST
                        ] : [],
                        ...appDir ? [
                            ...config.experimental.sri ? [
                                _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.SUBRESOURCE_INTEGRITY_MANIFEST + '.js'),
                                _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.SUBRESOURCE_INTEGRITY_MANIFEST + '.json')
                            ] : [],
                            _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.APP_PATHS_MANIFEST),
                            _path.default.join(_constants1.APP_PATH_ROUTES_MANIFEST),
                            _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.SERVER_REFERENCE_MANIFEST + '.js'),
                            _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.SERVER_REFERENCE_MANIFEST + '.json'),
                            _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.PREFETCH_HINTS)
                        ] : [],
                        ...pagesDir && bundler !== _bundler.Bundler.Turbopack ? [
                            _constants1.DYNAMIC_CSS_MANIFEST + '.json',
                            _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.DYNAMIC_CSS_MANIFEST + '.js')
                        ] : [],
                        _constants1.BUILD_ID_FILE,
                        _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.NEXT_FONT_MANIFEST + '.js'),
                        _path.default.join(_constants1.SERVER_DIRECTORY, _constants1.NEXT_FONT_MANIFEST + '.json'),
                        _constants1.SERVER_FILES_MANIFEST + '.json'
                    ].filter(_nonnullable.nonNullable).map((file)=>_path.default.join(config.distDir, file)),
                    ignore: []
                };
                if (hasInstrumentationHook) {
                    serverFilesManifest.files.push(_path.default.join(config.distDir, _constants1.SERVER_DIRECTORY, `${_constants.INSTRUMENTATION_HOOK_FILENAME}.js`));
                    // If there are edge routes, append the edge instrumentation hook
                    // Turbopack generates this chunk with a hashed name and references it in middleware-manifest.
                    let edgeInstrumentationHook = _path.default.join(config.distDir, _constants1.SERVER_DIRECTORY, `edge-${_constants.INSTRUMENTATION_HOOK_FILENAME}.js`);
                    if (bundler !== _bundler.Bundler.Turbopack && (0, _fs.existsSync)(_path.default.join(dir, edgeInstrumentationHook))) {
                        serverFilesManifest.files.push(edgeInstrumentationHook);
                    }
                }
                if (config.experimental.optimizeCss) {
                    const globOrig = require('next/dist/compiled/glob');
                    const cssFilePaths = await new Promise((resolve, reject)=>{
                        globOrig('**/*.css', {
                            cwd: _path.default.join(distDir, 'static')
                        }, (err, files)=>{
                            if (err) {
                                return reject(err);
                            }
                            resolve(files);
                        });
                    });
                    serverFilesManifest.files.push(...cssFilePaths.map((filePath)=>_path.default.join(config.distDir, 'static', filePath)));
                }
                // Under standalone mode, we need to ensure that the cache entry debug
                // handler is copied so that it can be used in the test. This is required
                // for the turbopack test to run as it's more strict about the build
                // directories. This is only used for testing and is not used in
                // production.
                if (process.env.__NEXT_TEST_MODE && process.env.NEXT_PRIVATE_DEBUG_CACHE_ENTRY_HANDLERS) {
                    serverFilesManifest.files.push(_path.default.relative(dir, _path.default.isAbsolute(process.env.NEXT_PRIVATE_DEBUG_CACHE_ENTRY_HANDLERS) ? process.env.NEXT_PRIVATE_DEBUG_CACHE_ENTRY_HANDLERS : _path.default.join(dir, process.env.NEXT_PRIVATE_DEBUG_CACHE_ENTRY_HANDLERS)));
                }
                return serverFilesManifest;
            });
            await writeRequiredServerFilesManifest(distDir, requiredServerFilesManifest);
            // #endregion
            // #region Collect data
            const totalPageCount = pageKeys.pages.length + (((_pageKeys_app = pageKeys.app) == null ? void 0 : _pageKeys_app.length) || 0);
            const numberOfWorkers = getNumberOfWorkers(config, totalPageCount);
            const collectingPageDataStart = process.hrtime();
            const postCompileSpinner = (0, _spinner.default)(`Collecting page data using ${numberOfWorkers} worker${numberOfWorkers > 1 ? 's' : ''}`);
            const buildManifestPath = _path.default.join(distDir, _constants1.BUILD_MANIFEST);
            let staticAppPagesCount = 0;
            let serverAppPagesCount = 0;
            let edgeRuntimeAppCount = 0;
            let edgeRuntimePagesCount = 0;
            const ssgPages = new Set();
            const ssgStaticFallbackPages = new Set();
            const ssgBlockingFallbackPages = new Set();
            const staticPages = new Set();
            const invalidPages = new Set();
            const serverPropsPages = new Set();
            const additionalPaths = new Map();
            const staticPaths = new Map();
            const appNormalizedPaths = new Map();
            const fallbackModes = new Map();
            const appDefaultConfigs = new Map();
            const pageInfos = new Map();
            let pagesManifest = await readManifest(pagesManifestPath);
            const buildManifest = await readManifest(buildManifestPath);
            const appPathRoutes = {};
            if (appDir) {
                const appPathsManifest = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.APP_PATHS_MANIFEST));
                for(const key in appPathsManifest){
                    appPathRoutes[key] = (0, _apppaths.normalizeAppPath)(key);
                }
                await writeManifest(_path.default.join(distDir, _constants1.APP_PATH_ROUTES_MANIFEST), appPathRoutes);
            }
            process.env.NEXT_PHASE = _constants1.PHASE_PRODUCTION_BUILD;
            staticWorker = createStaticWorker(config, {
                numberOfWorkers,
                debuggerPortOffset: (0, _worker.getNextBuildDebuggerPortOffset)({
                    kind: 'export-page'
                })
            });
            const analysisBegin = process.hrtime();
            const staticCheckSpan = nextBuildSpan.traceChild('static-check');
            const functionsConfigManifest = {
                version: 1,
                functions: {}
            };
            const { customAppGetInitialProps, namedExports, isNextImageImported, hasNonStaticErrorPage } = await staticCheckSpan.traceAsyncFn(async ()=>{
                var _config_experimental_sri;
                if (isCompileMode) {
                    return {
                        customAppGetInitialProps: false,
                        namedExports: [],
                        isNextImageImported: true,
                        hasNonStaticErrorPage: hasUserPagesRoutes
                    };
                }
                const { configFileName } = config;
                const sriEnabled = Boolean((_config_experimental_sri = config.experimental.sri) == null ? void 0 : _config_experimental_sri.algorithm);
                const nonStaticErrorPageSpan = staticCheckSpan.traceChild('check-static-error-page');
                const errorPageHasCustomGetInitialProps = nonStaticErrorPageSpan.traceAsyncFn(async ()=>hasCustomErrorPage && await staticWorker.hasCustomGetInitialProps({
                        page: '/_error',
                        distDir,
                        checkingApp: false,
                        sriEnabled
                    }));
                const errorPageStaticResult = nonStaticErrorPageSpan.traceAsyncFn(async ()=>{
                    var _config_i18n, _config_i18n1;
                    return hasCustomErrorPage && staticWorker.isPageStatic({
                        dir,
                        page: '/_error',
                        distDir,
                        configFileName,
                        cacheComponents: isAppCacheComponentsEnabled,
                        authInterrupts: isAuthInterruptsEnabled,
                        useCacheTimeout: config.experimental.useCacheTimeout,
                        staticPageGenerationTimeout: config.staticPageGenerationTimeout,
                        httpAgentOptions: config.httpAgentOptions,
                        locales: (_config_i18n = config.i18n) == null ? void 0 : _config_i18n.locales,
                        defaultLocale: (_config_i18n1 = config.i18n) == null ? void 0 : _config_i18n1.defaultLocale,
                        nextConfigOutput: config.output,
                        pprConfig: config.experimental.ppr,
                        cacheLifeProfiles: config.cacheLife,
                        buildId,
                        deploymentId: config.deploymentId,
                        clientAssetToken: config.supportsImmutableAssets ? '' : config.deploymentId,
                        sriEnabled,
                        cacheMaxMemorySize: config.cacheMaxMemorySize
                    });
                });
                const appPageToCheck = '/_app';
                const customAppGetInitialPropsPromise = hasUserPagesRoutes ? staticWorker.hasCustomGetInitialProps({
                    page: appPageToCheck,
                    distDir,
                    checkingApp: true,
                    sriEnabled
                }) : Promise.resolve(false);
                const namedExportsPromise = hasUserPagesRoutes ? staticWorker.getDefinedNamedExports({
                    page: appPageToCheck,
                    distDir,
                    sriEnabled
                }) : Promise.resolve([]);
                // eslint-disable-next-line @typescript-eslint/no-shadow
                let isNextImageImported;
                const middlewareManifest = require(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST));
                const actionManifest = appDir ? require(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.SERVER_REFERENCE_MANIFEST + '.json')) : null;
                const entriesWithAction = actionManifest ? new Set() : null;
                if (actionManifest && entriesWithAction) {
                    for(const id in actionManifest.node){
                        for(const entry in actionManifest.node[id].workers){
                            entriesWithAction.add(entry);
                        }
                    }
                    for(const id in actionManifest.edge){
                        for(const entry in actionManifest.edge[id].workers){
                            entriesWithAction.add(entry);
                        }
                    }
                }
                for (const key of Object.keys(middlewareManifest == null ? void 0 : middlewareManifest.functions)){
                    if (key.startsWith('/api')) {
                        edgeRuntimePagesCount++;
                    }
                }
                await Promise.all(Object.entries(pageKeys).reduce((acc, [key, files])=>{
                    if (!files) {
                        return acc;
                    }
                    const pageType = key;
                    for (const page of files){
                        acc.push({
                            pageType,
                            page
                        });
                    }
                    return acc;
                }, []).map(({ pageType, page })=>{
                    const checkPageSpan = staticCheckSpan.traceChild('check-page', {
                        page
                    });
                    return checkPageSpan.traceAsyncFn(async ()=>{
                        const actualPage = (0, _normalizepagepath.normalizePagePath)(page);
                        let isRoutePPREnabled = false;
                        let isSSG = false;
                        let isStatic = false;
                        let isServerComponent = false;
                        let ssgPageRoutes = null;
                        let pagePath = '';
                        if (pageType === 'pages') {
                            pagePath = pagesPaths.find((p)=>{
                                p = (0, _normalizepathsep.normalizePathSep)(p);
                                return p.startsWith(actualPage + '.') || p.startsWith(actualPage + '/index.');
                            }) || '';
                        }
                        let originalAppPath;
                        if (pageType === 'app' && mappedAppPages) {
                            for (const [originalPath, normalizedPath] of Object.entries(appPathRoutes)){
                                if (normalizedPath === page && mappedAppPages[originalPath]) {
                                    pagePath = mappedAppPages[originalPath].replace(/^private-next-app-dir/, '');
                                    originalAppPath = originalPath;
                                    break;
                                }
                            }
                        }
                        const pageFilePath = (0, _utils1.isAppBuiltinPage)(pagePath) ? pagePath : _path.default.join((pageType === 'pages' ? pagesDir : appDir) || '', pagePath);
                        const isInsideAppDir = pageType === 'app';
                        const staticInfo = pagePath ? await (0, _getstaticinfoincludinglayouts.getStaticInfoIncludingLayouts)({
                            isInsideAppDir,
                            pageFilePath,
                            pageExtensions: config.pageExtensions,
                            appDir,
                            config,
                            isDev: false,
                            // If this route is an App Router page route, inherit the
                            // route segment configs (e.g. `runtime`) from the layout by
                            // passing the `originalAppPath`, which should end with `/page`.
                            page: isInsideAppDir ? originalAppPath : page
                        }) : undefined;
                        if (staticInfo == null ? void 0 : staticInfo.hadUnsupportedValue) {
                            errorFromUnsupportedSegmentConfig();
                        }
                        // If there's any thing that would contribute to the functions
                        // configuration, we need to add it to the manifest.
                        if (typeof (staticInfo == null ? void 0 : staticInfo.runtime) !== 'undefined' || typeof (staticInfo == null ? void 0 : staticInfo.maxDuration) !== 'undefined' || typeof (staticInfo == null ? void 0 : staticInfo.preferredRegion) !== 'undefined') {
                            const regions = (staticInfo == null ? void 0 : staticInfo.preferredRegion) ? typeof staticInfo.preferredRegion === 'string' ? [
                                staticInfo.preferredRegion
                            ] : staticInfo.preferredRegion : undefined;
                            functionsConfigManifest.functions[page] = {
                                maxDuration: staticInfo == null ? void 0 : staticInfo.maxDuration,
                                ...regions && {
                                    regions
                                }
                            };
                        }
                        const pageRuntime = middlewareManifest.functions[originalAppPath || page] ? 'edge' : staticInfo == null ? void 0 : staticInfo.runtime;
                        if (!isCompileMode) {
                            isServerComponent = pageType === 'app' && (staticInfo == null ? void 0 : staticInfo.rsc) !== _constants1.RSC_MODULE_TYPES.client;
                            if (pageType === 'app' || !(0, _utils1.isReservedPage)(page)) {
                                try {
                                    let edgeInfo;
                                    if ((0, _isedgeruntime.isEdgeRuntime)(pageRuntime)) {
                                        if (pageType === 'app') {
                                            edgeRuntimeAppCount++;
                                        } else {
                                            edgeRuntimePagesCount++;
                                        }
                                        const manifestKey = pageType === 'pages' ? page : originalAppPath || '';
                                        edgeInfo = middlewareManifest.functions[manifestKey];
                                    }
                                    let isPageStaticSpan = checkPageSpan.traceChild('is-page-static');
                                    let workerResult = await isPageStaticSpan.traceAsyncFn(()=>{
                                        var _config_i18n, _config_i18n1;
                                        return staticWorker.isPageStatic({
                                            dir,
                                            page,
                                            originalAppPath,
                                            distDir,
                                            configFileName,
                                            httpAgentOptions: config.httpAgentOptions,
                                            locales: (_config_i18n = config.i18n) == null ? void 0 : _config_i18n.locales,
                                            defaultLocale: (_config_i18n1 = config.i18n) == null ? void 0 : _config_i18n1.defaultLocale,
                                            parentId: isPageStaticSpan.getId(),
                                            pageRuntime,
                                            edgeInfo,
                                            pageType,
                                            cacheComponents: isAppCacheComponentsEnabled,
                                            authInterrupts: isAuthInterruptsEnabled,
                                            useCacheTimeout: config.experimental.useCacheTimeout,
                                            staticPageGenerationTimeout: config.staticPageGenerationTimeout,
                                            cacheHandler: config.cacheHandler,
                                            cacheHandlers: config.cacheHandlers,
                                            isrFlushToDisk: _ciinfo.hasNextSupport ? false : config.experimental.isrFlushToDisk,
                                            cacheMaxMemorySize: config.cacheMaxMemorySize,
                                            nextConfigOutput: config.output,
                                            pprConfig: config.experimental.ppr,
                                            cacheLifeProfiles: config.cacheLife,
                                            buildId,
                                            deploymentId: config.deploymentId,
                                            clientAssetToken: config.supportsImmutableAssets ? '' : config.deploymentId,
                                            sriEnabled
                                        });
                                    });
                                    if (pageType === 'app' && originalAppPath) {
                                        appNormalizedPaths.set(originalAppPath, page);
                                        // TODO-APP: handle prerendering with edge
                                        if ((0, _isedgeruntime.isEdgeRuntime)(pageRuntime)) {
                                            isStatic = false;
                                            isSSG = false;
                                            _log.warnOnce(`Using edge runtime on a page currently disables static generation for that page`);
                                        } else {
                                            const isDynamic = (0, _utils.isDynamicRoute)(page);
                                            if (typeof workerResult.isRoutePPREnabled === 'boolean') {
                                                isRoutePPREnabled = workerResult.isRoutePPREnabled;
                                            }
                                            // If this route can be partially pre-rendered, then
                                            // mark it as such and mark that it can be
                                            // generated server-side.
                                            if (workerResult.isRoutePPREnabled) {
                                                isSSG = true;
                                                isStatic = true;
                                                staticPaths.set(originalAppPath, []);
                                            }
                                            if (workerResult.prerenderedRoutes) {
                                                staticPaths.set(originalAppPath, workerResult.prerenderedRoutes);
                                                ssgPageRoutes = workerResult.prerenderedRoutes.map((route)=>route.pathname);
                                                isSSG = true;
                                            }
                                            const appConfig = workerResult.appConfig || {};
                                            if (appConfig.revalidate !== 0) {
                                                const hasGenerateStaticParams = workerResult.prerenderedRoutes && workerResult.prerenderedRoutes.length > 0;
                                                if (config.output === 'export' && isDynamic && !hasGenerateStaticParams) {
                                                    throw Object.defineProperty(new Error(`Page "${page}" is missing "generateStaticParams()" so it cannot be used with "output: export" config. See more info here: https://nextjs.org/docs/messages/generate-static-params`), "__NEXT_ERROR_CODE", {
                                                        value: "E1452",
                                                        enumerable: false,
                                                        configurable: true
                                                    });
                                                }
                                                // Mark the app as static if:
                                                // - It has no dynamic param
                                                // - It doesn't have generateStaticParams but `dynamic` is set to
                                                //   `error` or `force-static`
                                                if (!isDynamic) {
                                                    staticPaths.set(originalAppPath, [
                                                        {
                                                            params: {},
                                                            pathname: page,
                                                            encodedPathname: page,
                                                            fallbackRouteParams: [],
                                                            fallbackMode: workerResult.prerenderFallbackMode,
                                                            fallbackRootParams: [],
                                                            throwOnEmptyStaticShell: true
                                                        }
                                                    ]);
                                                    isStatic = true;
                                                } else if (!hasGenerateStaticParams && (appConfig.dynamic === 'error' || appConfig.dynamic === 'force-static')) {
                                                    staticPaths.set(originalAppPath, []);
                                                    isStatic = true;
                                                    isRoutePPREnabled = false;
                                                }
                                            }
                                            if (workerResult.prerenderFallbackMode) {
                                                fallbackModes.set(originalAppPath, workerResult.prerenderFallbackMode);
                                            }
                                            appDefaultConfigs.set(originalAppPath, appConfig);
                                        }
                                    } else {
                                        if ((0, _isedgeruntime.isEdgeRuntime)(pageRuntime)) {
                                            if (workerResult.hasStaticProps) {
                                                console.warn(`"getStaticProps" is not yet supported fully with "experimental-edge", detected on ${page}`);
                                            }
                                            workerResult.isStatic = false;
                                            workerResult.hasStaticProps = false;
                                        }
                                        if (workerResult.isNextImageImported) {
                                            isNextImageImported = true;
                                        }
                                        if (workerResult.hasStaticProps) {
                                            ssgPages.add(page);
                                            isSSG = true;
                                            if (workerResult.prerenderedRoutes && workerResult.prerenderedRoutes.length > 0) {
                                                additionalPaths.set(page, workerResult.prerenderedRoutes);
                                                ssgPageRoutes = workerResult.prerenderedRoutes.map((route)=>route.pathname);
                                            }
                                            if (workerResult.prerenderFallbackMode === _fallback.FallbackMode.BLOCKING_STATIC_RENDER) {
                                                ssgBlockingFallbackPages.add(page);
                                            } else if (workerResult.prerenderFallbackMode === _fallback.FallbackMode.PRERENDER) {
                                                ssgStaticFallbackPages.add(page);
                                            }
                                        } else if (workerResult.hasServerProps) {
                                            serverPropsPages.add(page);
                                        } else if (workerResult.isStatic && !isServerComponent && await customAppGetInitialPropsPromise === false) {
                                            staticPages.add(page);
                                            isStatic = true;
                                        } else if (isServerComponent) {
                                            // This is a static server component page that doesn't have
                                            // gSP or gSSP. We still treat it as a SSG page.
                                            ssgPages.add(page);
                                            isSSG = true;
                                        }
                                        if (hasPages404 && page === '/404') {
                                            if (!workerResult.isStatic && !workerResult.hasStaticProps) {
                                                throw Object.defineProperty(new Error(`\`pages/404\` ${_constants.STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR}`), "__NEXT_ERROR_CODE", {
                                                    value: "E134",
                                                    enumerable: false,
                                                    configurable: true
                                                });
                                            }
                                            // we need to ensure the 404 lambda is present since we use
                                            // it when _app has getInitialProps
                                            if (await customAppGetInitialPropsPromise && !workerResult.hasStaticProps) {
                                                staticPages.delete(page);
                                            }
                                        }
                                        if (_constants1.STATIC_STATUS_PAGES.includes(page) && !workerResult.isStatic && !workerResult.hasStaticProps) {
                                            throw Object.defineProperty(new Error(`\`pages${page}\` ${_constants.STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR}`), "__NEXT_ERROR_CODE", {
                                                value: "E125",
                                                enumerable: false,
                                                configurable: true
                                            });
                                        }
                                    }
                                } catch (err) {
                                    if (!(0, _iserror.default)(err) || err.message !== 'INVALID_DEFAULT_EXPORT') throw err;
                                    invalidPages.add(page);
                                }
                            }
                            if (pageType === 'app') {
                                if (isSSG || isStatic) {
                                    staticAppPagesCount++;
                                } else {
                                    serverAppPagesCount++;
                                }
                            }
                        }
                        pageInfos.set(page, {
                            originalAppPath,
                            isStatic,
                            isSSG,
                            isRoutePPREnabled,
                            ssgPageRoutes,
                            initialCacheControl: undefined,
                            runtime: pageRuntime,
                            pageDuration: undefined,
                            ssgPageDurations: undefined,
                            hasEmptyStaticShell: undefined
                        });
                    });
                }));
                const errorPageResult = await errorPageStaticResult;
                const nonStaticErrorPage = await errorPageHasCustomGetInitialProps || errorPageResult && errorPageResult.hasServerProps;
                const returnValue = {
                    customAppGetInitialProps: await customAppGetInitialPropsPromise,
                    namedExports: await namedExportsPromise,
                    isNextImageImported,
                    hasNonStaticErrorPage: nonStaticErrorPage
                };
                return returnValue;
            });
            if (postCompileSpinner) {
                const collectingPageDataEnd = process.hrtime(collectingPageDataStart);
                postCompileSpinner.setText(`Collecting page data using ${numberOfWorkers} worker${numberOfWorkers > 1 ? 's' : ''} in ${(0, _durationtostring.hrtimeDurationToString)(collectingPageDataEnd)}`);
                postCompileSpinner.stopAndPersist();
            }
            (0, _trace1.traceMemoryUsage)('Finished collecting page data', nextBuildSpan);
            if (customAppGetInitialProps) {
                console.warn((0, _picocolors.bold)((0, _picocolors.yellow)(`Warning: `)) + (0, _picocolors.yellow)(`You have opted-out of Automatic Static Optimization due to \`getInitialProps\` in \`pages/_app\`. This does not opt-out pages with \`getStaticProps\``));
                console.warn('Read more: https://nextjs.org/docs/messages/opt-out-auto-static-optimization\n');
            }
            const middlewareFile = (0, _normalizepathsep.normalizePathSep)(proxyFilePath || middlewareFilePath || '');
            let hasNodeMiddleware = false;
            if (middlewareFile) {
                // Is format of `(/src)/(proxy|middleware).<ext>`, so split by
                // "." and get the first part, regard rest of the extensions
                // to match the `page` value format.
                const page = middlewareFile.split('.')[0];
                const staticInfo = await (0, _getstaticinfoincludinglayouts.getStaticInfoIncludingLayouts)({
                    isInsideAppDir: false,
                    pageFilePath: _path.default.join(dir, middlewareFile),
                    config,
                    appDir,
                    pageExtensions: config.pageExtensions,
                    isDev: false,
                    page
                });
                if (staticInfo.hadUnsupportedValue) {
                    errorFromUnsupportedSegmentConfig();
                }
                if (staticInfo.runtime === 'nodejs' || (0, _utils1.isProxyFile)(page)) {
                    var _staticInfo_middleware;
                    hasNodeMiddleware = true;
                    functionsConfigManifest.functions['/_middleware'] = {
                        runtime: 'nodejs',
                        matchers: ((_staticInfo_middleware = staticInfo.middleware) == null ? void 0 : _staticInfo_middleware.matchers) ?? [
                            {
                                regexp: '^.*$',
                                originalSource: '/:path*'
                            }
                        ]
                    };
                    if (bundler === _bundler.Bundler.Turbopack) {
                        const clientMiddlewareManifestJs = `self.__MIDDLEWARE_MATCHERS = ${JSON.stringify(functionsConfigManifest.functions['/_middleware'].matchers || [], null, 2)};self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()`;
                        let clientMiddlewareManifestPath = _path.default.join(_constants1.CLIENT_STATIC_FILES_PATH, buildId, _constants1.TURBOPACK_CLIENT_MIDDLEWARE_MANIFEST);
                        await writeFileUtf8(_path.default.join(distDir, clientMiddlewareManifestPath), clientMiddlewareManifestJs);
                    }
                }
            }
            await writeFunctionsConfigManifest(distDir, functionsConfigManifest);
            // #endregion
            // #region NFT
            if (bundler !== _bundler.Bundler.Turbopack && !isGenerateMode && !buildTracesPromise) {
                buildTracesPromise = nextBuildSpan.traceChild('collect-build-traces').traceAsyncFn(()=>{
                    const { collectBuildTraces } = require('./collect-build-traces');
                    return collectBuildTraces({
                        dir,
                        config,
                        distDir,
                        edgeRuntimeRoutes: (0, _utils1.collectRoutesUsingEdgeRuntime)(pageInfos),
                        staticPages: [
                            ...staticPages
                        ],
                        nextBuildSpan,
                        buildTraceContext,
                        outputFileTracingRoot
                    }).catch((err)=>{
                        console.error(err);
                        throw err;
                    });
                });
            }
            if (serverPropsPages.size > 0 || ssgPages.size > 0) {
                // We update the routes manifest after the build with the
                // data routes since we can't determine these until after build
                routesManifest.dataRoutes = (0, _sortableroutes.sortPages)([
                    ...serverPropsPages,
                    ...ssgPages
                ]).map((page)=>{
                    return (0, _builddataroute.buildDataRoute)(page, buildId);
                });
            }
            // Service workers are compiled into `distDir/static/service-worker/` and register at a broader
            // scope than their own directory (e.g. `/`), so their script response needs a
            // `Service-Worker-Allowed` header.
            const serviceWorkerDir = _path.default.join(distDir, 'static', 'service-worker');
            if ((0, _fs.existsSync)(serviceWorkerDir) && (await _fs.promises.readdir(serviceWorkerDir)).length > 0) {
                routesManifest.headers.push((0, _buildcustomroute.buildCustomRoute)('header', {
                    source: `${config.basePath || ''}/_next/static/service-worker/:path*`,
                    headers: [
                        {
                            key: 'Service-Worker-Allowed',
                            value: config.basePath || '/'
                        }
                    ],
                    locale: false,
                    internal: true
                }));
            }
            // We need to write the manifest with rewrites before build
            await nextBuildSpan.traceChild('write-routes-manifest').traceAsyncFn(()=>writeManifest(routesManifestPath, routesManifest));
            // Since custom _app.js can wrap the 404 page we have to opt-out of static optimization if it has getInitialProps
            // Only export the static 404 when there is no /_error present
            const useStaticPages404 = !customAppGetInitialProps && (!hasNonStaticErrorPage || hasPages404);
            if (invalidPages.size > 0) {
                const err = Object.defineProperty(new Error(`Build optimization failed: found page${invalidPages.size === 1 ? '' : 's'} without a React Component as default export in \n${[
                    ...invalidPages
                ].map((pg)=>`pages${pg}`).join('\n')}\n\nSee https://nextjs.org/docs/messages/page-without-valid-component for more info.\n`), "__NEXT_ERROR_CODE", {
                    value: "E474",
                    enumerable: false,
                    configurable: true
                });
                err.code = 'BUILD_OPTIMIZATION_FAILED';
                throw err;
            }
            await (0, _writebuildid.writeBuildId)(distDir, buildId);
            const features = [
                {
                    featureName: 'experimental/cacheComponents',
                    invocationCount: config.cacheComponents ? 1 : 0
                },
                {
                    featureName: 'experimental/optimizeCss',
                    invocationCount: config.experimental.optimizeCss ? 1 : 0
                },
                {
                    featureName: 'experimental/nextScriptWorkers',
                    invocationCount: config.experimental.nextScriptWorkers ? 1 : 0
                },
                {
                    featureName: 'experimental/ppr',
                    invocationCount: config.experimental.ppr ? 1 : 0
                },
                {
                    featureName: 'turbopackFileSystemCache',
                    invocationCount: ((_config_experimental1 = config.experimental) == null ? void 0 : _config_experimental1.turbopackFileSystemCacheForBuild) ? 1 : 0
                }
            ];
            telemetry.record(features.map((feature)=>{
                return {
                    eventName: _events.EVENT_BUILD_FEATURE_USAGE,
                    payload: feature
                };
            }));
            // we don't need to inline for turbopack build as
            // it will handle it's own caching separate of compile
            if (isGenerateMode && bundler !== _bundler.Bundler.Turbopack) {
                _log.info('Inlining static env ...');
                await nextBuildSpan.traceChild('inline-static-env').traceAsyncFn(async ()=>{
                    await (0, _inlinestaticenv.inlineStaticEnv)({
                        distDir,
                        config
                    });
                });
            }
            const middlewareManifest = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST));
            const prerenderManifest = {
                version: 4,
                routes: {},
                dynamicRoutes: {},
                notFoundRoutes: [],
                preview: previewProps
            };
            // Accumulate per-route segment inlining decisions for
            // prefetch-hints.json. First-writer-wins: if multiple param
            // combinations exist for the same route pattern, use the first one.
            const prefetchHints = {};
            const tbdPrerenderRoutes = [];
            const { i18n } = config;
            const usedStaticStatusPages = _constants1.STATIC_STATUS_PAGES.filter((page)=>mappedPages[page] && mappedPages[page].startsWith('private-next-pages'));
            usedStaticStatusPages.forEach((page)=>{
                if (!ssgPages.has(page) && !customAppGetInitialProps) {
                    staticPages.add(page);
                }
            });
            const hasPages500 = !appDirOnly && usedStaticStatusPages.includes('/500');
            const useDefaultStatic500 = !hasPages500 && !hasNonStaticErrorPage && !customAppGetInitialProps;
            const combinedPages = [
                ...staticPages,
                ...ssgPages
            ];
            const isAppGlobalErrorStatic = staticPaths.has(_entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE_ENTRY);
            const hasStaticAppGlobalError = hasAppGlobalError && isAppGlobalErrorStatic;
            await (0, _builddiagnostics.updateBuildDiagnostics)({
                buildStage: 'static-generation'
            });
            const hasGSPAndRevalidateZero = new Set();
            // #endregion
            // #region SSG
            // we need to trigger automatic exporting when we have
            // - static 404/500
            // - getStaticProps paths
            // - experimental app is enabled
            if (!isCompileMode && (combinedPages.length > 0 || useStaticPages404 || useDefaultStatic500 || appDir)) {
                const staticGenerationSpan = nextBuildSpan.traceChild('static-generation');
                await staticGenerationSpan.traceAsyncFn(async ()=>{
                    var _pageInfos_get;
                    (0, _utils1.detectConflictingPaths)([
                        ...combinedPages,
                        ...pageKeys.pages.filter((page)=>!combinedPages.includes(page))
                    ], ssgPages, new Map(Array.from(additionalPaths.entries()).map(([page, routes])=>{
                        return [
                            page,
                            routes.map((route)=>route.pathname)
                        ];
                    })));
                    const sortedStaticPaths = Array.from(staticPaths.entries()).sort(([a], [b])=>a.localeCompare(b));
                    const exportApp = require('../export').default;
                    const exportConfig = {
                        ...config,
                        // Default map will be the collection of automatic statically exported
                        // pages and incremental pages.
                        // n.b. we cannot handle this above in combinedPages because the dynamic
                        // page must be in the `pages` array, but not in the mapping.
                        exportPathMap: (defaultMap)=>{
                            // Dynamically routed pages should be prerendered to be used as
                            // a client-side skeleton (fallback) while data is being fetched.
                            // This ensures the end-user never sees a 500 or slow response from the
                            // server.
                            //
                            // Note: prerendering disables automatic static optimization.
                            ssgPages.forEach((page)=>{
                                if ((0, _utils.isDynamicRoute)(page)) {
                                    tbdPrerenderRoutes.push(page);
                                    if (ssgStaticFallbackPages.has(page)) {
                                        // Override the rendering for the dynamic page to be treated as a
                                        // fallback render.
                                        if (i18n) {
                                            defaultMap[`/${i18n.defaultLocale}${page}`] = {
                                                page,
                                                _pagesFallback: true
                                            };
                                        } else {
                                            defaultMap[page] = {
                                                page,
                                                _pagesFallback: true
                                            };
                                        }
                                    } else {
                                        // Remove dynamically routed pages from the default path map when
                                        // fallback behavior is disabled.
                                        delete defaultMap[page];
                                    }
                                }
                            });
                            // Append the "well-known" routes we should prerender for, e.g. blog
                            // post slugs.
                            additionalPaths.forEach((routes, page)=>{
                                routes.forEach((route)=>{
                                    defaultMap[route.pathname] = {
                                        page,
                                        _ssgPath: route.encodedPathname
                                    };
                                });
                            });
                            if (useStaticPages404 && !appDirOnly) {
                                defaultMap['/404'] = {
                                    page: hasPages404 ? '/404' : '/_error'
                                };
                            }
                            if (useDefaultStatic500 && !appDirOnly) {
                                defaultMap['/500'] = {
                                    page: '/_error'
                                };
                            }
                            // TODO: output manifest specific to app paths and their
                            // revalidate periods and dynamicParams settings
                            sortedStaticPaths.forEach(([originalAppPath, routes])=>{
                                const appConfig = appDefaultConfigs.get(originalAppPath);
                                const isDynamicError = (appConfig == null ? void 0 : appConfig.dynamic) === 'error';
                                const isRoutePPREnabled = appConfig ? (0, _ppr.checkIsRoutePPREnabled)(config.experimental.ppr) : false;
                                routes.forEach((route)=>{
                                    var _route_remainingPrerenderableParams;
                                    // If the route has any dynamic root segments, we need to skip
                                    // rendering the route. This is because we don't support
                                    // revalidating the shells without the parameters present.
                                    // Note that we only have fallback root params if we also have
                                    // PPR enabled for this route/app already.
                                    if (route.fallbackRootParams && route.fallbackRootParams.length > 0 && // We don't skip rendering the route if we have the
                                    // following enabled. This is because the flight data now
                                    // does not contain any of the route params and is instead
                                    // completely static.
                                    !config.cacheComponents) {
                                        return;
                                    }
                                    defaultMap[route.pathname] = {
                                        page: originalAppPath,
                                        _ssgPath: route.encodedPathname,
                                        _fallbackRouteParams: route.fallbackRouteParams,
                                        _isDynamicError: isDynamicError,
                                        _isAppDir: true,
                                        _isRoutePPREnabled: isRoutePPREnabled,
                                        _allowEmptyStaticShell: !route.throwOnEmptyStaticShell,
                                        // A fallback shell can only be upgraded if at least one of
                                        // its fallback params is a `generateStaticParams` candidate,
                                        // and only when Partial Prefetching is enabled. Otherwise
                                        // nothing ever performs the upgrade, so flagging the shell
                                        // would only cause the client to retry the prefetch.
                                        _isFallbackUpgradeable: Boolean(config.partialPrefetching) && (((_route_remainingPrerenderableParams = route.remainingPrerenderableParams) == null ? void 0 : _route_remainingPrerenderableParams.length) ?? 0) > 0
                                    };
                                });
                            });
                            if (i18n) {
                                for (const page of [
                                    ...staticPages,
                                    ...ssgPages,
                                    ...useStaticPages404 ? [
                                        '/404'
                                    ] : [],
                                    ...useDefaultStatic500 ? [
                                        '/500'
                                    ] : []
                                ]){
                                    const isSsg = ssgPages.has(page);
                                    const isDynamic = (0, _utils.isDynamicRoute)(page);
                                    const isFallback = isSsg && ssgStaticFallbackPages.has(page);
                                    for (const locale of i18n.locales){
                                        var _defaultMap_page;
                                        // skip fallback generation for SSG pages without fallback mode
                                        if (isSsg && isDynamic && !isFallback) continue;
                                        const outputPath = `/${locale}${page === '/' ? '' : page}`;
                                        defaultMap[outputPath] = {
                                            page: ((_defaultMap_page = defaultMap[page]) == null ? void 0 : _defaultMap_page.page) || page,
                                            _locale: locale,
                                            _pagesFallback: isFallback
                                        };
                                    }
                                    // remove non-locale prefixed variant from defaultMap
                                    delete defaultMap[page];
                                }
                            }
                            return defaultMap;
                        }
                    };
                    const outdir = _path.default.join(distDir, 'export');
                    const exportResult = await exportApp(dir, {
                        nextConfig: exportConfig,
                        enabledDirectories,
                        silent: true,
                        buildExport: true,
                        debugOutput,
                        debugPrerender,
                        pages: combinedPages,
                        outdir,
                        statusMessage: `Generating static pages using ${numberOfWorkers} worker${numberOfWorkers > 1 ? 's' : ''}`,
                        numWorkers: numberOfWorkers,
                        appDirOnly,
                        bundler
                    }, nextBuildSpan, staticWorker);
                    // If there was no result, there's nothing more to do.
                    if (!exportResult) return;
                    const getFallbackMode = (route)=>{
                        var _exportResult_byPath_get;
                        const hasEmptyStaticShell = (_exportResult_byPath_get = exportResult.byPath.get(route.pathname)) == null ? void 0 : _exportResult_byPath_get.hasEmptyStaticShell;
                        // If the route has an empty static shell and is not configured to
                        // throw on empty static shell, then we should use the blocking
                        // static render mode.
                        if (hasEmptyStaticShell && !route.throwOnEmptyStaticShell && route.fallbackMode === _fallback.FallbackMode.PRERENDER) {
                            return _fallback.FallbackMode.BLOCKING_STATIC_RENDER;
                        }
                        // If the route has no fallback mode, then we should use the
                        // `NOT_FOUND` fallback mode.
                        if (!route.fallbackMode) {
                            return _fallback.FallbackMode.NOT_FOUND;
                        }
                        return route.fallbackMode;
                    };
                    const getCacheControl = (exportPath, defaultRevalidate = false)=>{
                        var _exportResult_byPath_get;
                        const cacheControl = (_exportResult_byPath_get = exportResult.byPath.get(exportPath)) == null ? void 0 : _exportResult_byPath_get.cacheControl;
                        if (!cacheControl) {
                            return {
                                revalidate: defaultRevalidate,
                                expire: undefined
                            };
                        }
                        if (cacheControl.revalidate !== false && cacheControl.revalidate > 0 && cacheControl.expire === undefined) {
                            return {
                                revalidate: cacheControl.revalidate,
                                expire: config.expireTime
                            };
                        }
                        return cacheControl;
                    };
                    if (debugOutput || process.env.NEXT_SSG_FETCH_METRICS === '1') {
                        (0, _builddiagnostics.recordFetchMetrics)(exportResult);
                    }
                    (0, _turborepoaccesstrace.writeTurborepoAccessTraceResult)({
                        distDir: config.distDir,
                        traces: [
                            turborepoAccessTraceResult,
                            ...exportResult.turborepoAccessTraceResults.values()
                        ]
                    });
                    prerenderManifest.notFoundRoutes = Array.from(exportResult.ssgNotFoundPaths);
                    // remove server bundles that were exported
                    for (const page of staticPages){
                        if (page === '/404') {
                            continue;
                        }
                        const serverBundle = (0, _require.getPagePath)(page, distDir, undefined, false);
                        await _fs.promises.unlink(serverBundle);
                    }
                    sortedStaticPaths.forEach(([originalAppPath, prerenderedRoutes])=>{
                        var _pageInfos_get, _pageInfos_get1;
                        const page = appNormalizedPaths.get(originalAppPath);
                        if (!page) throw Object.defineProperty(new _invarianterror.InvariantError('Page not found'), "__NEXT_ERROR_CODE", {
                            value: "E619",
                            enumerable: false,
                            configurable: true
                        });
                        const appConfig = appDefaultConfigs.get(originalAppPath);
                        if (!appConfig) throw Object.defineProperty(new _invarianterror.InvariantError('App config not found'), "__NEXT_ERROR_CODE", {
                            value: "E616",
                            enumerable: false,
                            configurable: true
                        });
                        const ssgPageRoutesSet = new Set((_pageInfos_get = pageInfos.get(page)) == null ? void 0 : _pageInfos_get.ssgPageRoutes);
                        let hasRevalidateZero = appConfig.revalidate === 0 || getCacheControl(page).revalidate === 0;
                        if (hasRevalidateZero && ((_pageInfos_get1 = pageInfos.get(page)) == null ? void 0 : _pageInfos_get1.isStatic)) {
                            // if the page was marked as being static, but it contains dynamic data
                            // (ie, in the case of a static generation bailout), then it should be marked dynamic
                            pageInfos.set(page, {
                                ...pageInfos.get(page),
                                isStatic: false,
                                isSSG: false
                            });
                        }
                        const isAppRouteHandler = (0, _isapprouteroute.isAppRouteRoute)(originalAppPath);
                        // When this is an app page and PPR is enabled, the route supports
                        // partial pre-rendering.
                        const isRoutePPREnabled = !isAppRouteHandler && (0, _ppr.checkIsRoutePPREnabled)(config.experimental.ppr) ? true : undefined;
                        // htmlLimitedBots has been converted to a string during loadConfig.
                        // The configured pattern replaces the default HTML-limited bot
                        // pattern.
                        const htmlLimitedBotsRegexString = config.htmlLimitedBots || _isbot.HTML_LIMITED_BOT_UA_RE_STRING;
                        // this flag is used to selectively bypass the static cache and invoke the lambda directly
                        // to enable server actions on static routes
                        const bypassFor = [
                            {
                                type: 'header',
                                key: _approuterheaders.ACTION_HEADER
                            },
                            {
                                type: 'header',
                                key: 'content-type',
                                value: 'multipart/form-data;.*'
                            },
                            // For PPR routes, bypass the shell for user agents configured
                            // to receive blocking metadata and produce a dynamic render.
                            ...isRoutePPREnabled ? [
                                {
                                    type: 'header',
                                    key: 'user-agent',
                                    value: htmlLimitedBotsRegexString
                                }
                            ] : []
                        ];
                        // We should collect all the dynamic routes into a single array for
                        // this page. Including the full fallback route (the original
                        // route), any routes that were generated with unknown route params
                        // should be collected and included in the dynamic routes part
                        // of the manifest instead.
                        const staticPrerenderedRoutes = [];
                        const dynamicPrerenderedRoutes = [];
                        // Sort the outputted routes to ensure consistent output. Any route
                        // though that has unknown route params will be pulled and sorted
                        // independently. This is because the routes with unknown route
                        // params will contain the dynamic path parameters, some of which
                        // may conflict with the actual prerendered routes.
                        const unsortedUnknownPrerenderRoutes = [];
                        const unsortedKnownPrerenderRoutes = [];
                        for (const prerenderedRoute of prerenderedRoutes){
                            let route = prerenderedRoute;
                            // Static metadata files under dynamic segments (e.g.
                            // `/[id]/apple-icon.png`) produce the same bytes regardless of
                            // params, so they prerender once to a canonical pathname with
                            // dynamic segments replaced by `-` (e.g. `/-/apple-icon.png`).
                            // Rewriting here ensures they land in `prerenderManifest.routes`
                            // as known static entries rather than in `dynamicRoutes` with
                            // fallback params, which they don't actually need.
                            const staticMetadataPrerenderPathname = (0, _getmetadataroute.getStaticMetadataPrerenderPathname)(prerenderedRoute.pathname);
                            if (staticMetadataPrerenderPathname && staticMetadataPrerenderPathname !== prerenderedRoute.pathname) {
                                route = {
                                    params: prerenderedRoute.params,
                                    pathname: staticMetadataPrerenderPathname,
                                    encodedPathname: staticMetadataPrerenderPathname,
                                    fallbackRouteParams: undefined,
                                    fallbackMode: prerenderedRoute.fallbackMode,
                                    fallbackRootParams: undefined,
                                    throwOnEmptyStaticShell: undefined
                                };
                            }
                            if (route.fallbackRouteParams && route.fallbackRouteParams.length > 0) {
                                unsortedUnknownPrerenderRoutes.push(route);
                            } else {
                                unsortedKnownPrerenderRoutes.push(route);
                            }
                        }
                        const sortedUnknownPrerenderRoutes = (0, _sortableroutes.sortPageObjects)(unsortedUnknownPrerenderRoutes, (prerenderedRoute)=>prerenderedRoute.pathname);
                        const sortedKnownPrerenderRoutes = (0, _sortableroutes.sortPageObjects)(unsortedKnownPrerenderRoutes, (prerenderedRoute)=>prerenderedRoute.pathname);
                        prerenderedRoutes = [
                            ...sortedKnownPrerenderRoutes,
                            ...sortedUnknownPrerenderRoutes
                        ];
                        for (const prerenderedRoute of prerenderedRoutes){
                            if (isRoutePPREnabled && prerenderedRoute.fallbackRouteParams && prerenderedRoute.fallbackRouteParams.length > 0) {
                                // If the route has unknown params, then we need to add it to
                                // the list of dynamic routes.
                                dynamicPrerenderedRoutes.push(prerenderedRoute);
                            } else {
                                // If the route doesn't have unknown params, then we need to
                                // add it to the list of static routes.
                                staticPrerenderedRoutes.push(prerenderedRoute);
                            }
                        }
                        // Handle all the static routes.
                        for (const route of staticPrerenderedRoutes){
                            if ((0, _utils.isDynamicRoute)(page) && route.pathname === page) continue;
                            const pageInfo = pageInfos.get(page);
                            const routeResult = exportResult.byPath.get(route.pathname);
                            const { metadata = {}, hasEmptyStaticShell, hasPostponed, hasStaticRsc } = routeResult ?? {};
                            const cacheControl = getCacheControl(route.pathname, appConfig.revalidate);
                            // Generated concrete paths (for example `/blog/post-1`) inherit
                            // the route-level classification from the dynamic page
                            // (`/blog/[slug]`), but they also need their own export-time
                            // metadata so the tree view can show whether that specific path
                            // ended up fully static or partially prerendered.
                            pageInfos.set(route.pathname, {
                                ...pageInfo,
                                ...pageInfos.get(route.pathname),
                                ssgPageRoutes: null,
                                ssgPageDurations: undefined,
                                pageDuration: undefined,
                                isDynamicAppRoute: false,
                                hasPostponed,
                                hasEmptyStaticShell,
                                initialCacheControl: cacheControl
                            });
                            // update the page (eg /blog/[slug]) to also have the postpone metadata
                            pageInfos.set(page, {
                                ...pageInfos.get(page),
                                hasPostponed,
                                hasEmptyStaticShell,
                                initialCacheControl: cacheControl
                            });
                            // Collect prefetch hints (first-writer-wins per page)
                            if (metadata.prefetchHints && !(page in prefetchHints)) {
                                prefetchHints[page] = metadata.prefetchHints;
                            }
                            if (cacheControl.revalidate !== 0) {
                                const normalizedRoute = (0, _normalizepagepath.normalizePagePath)(route.pathname);
                                let dataRoute;
                                if (isAppRouteHandler) {
                                    dataRoute = null;
                                } else {
                                    dataRoute = _path.default.posix.join(`${normalizedRoute}${_constants.RSC_SUFFIX}`);
                                }
                                const prefetchDataRoute = isRoutePPREnabled && dataRoute && hasStaticRsc ? dataRoute : undefined;
                                const meta = (0, _utils1.collectMeta)(metadata);
                                const status = route.pathname === _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE ? 404 : meta.status;
                                const isNotFoundTrue = prerenderManifest.notFoundRoutes.includes(route.pathname);
                                let classification = {};
                                if (!isNotFoundTrue) {
                                    if (isAppRouteHandler) {
                                        classification = {
                                            routeType: 'route',
                                            response: 'complete',
                                            compute: 'static'
                                        };
                                    } else if (isRoutePPREnabled) {
                                        classification = {
                                            routeType: 'page',
                                            ...getPprAppPageClassification(route.pathname, routeResult)
                                        };
                                    } else {
                                        classification = getStaticAppPageClassification(route.pathname, routeResult);
                                    }
                                }
                                prerenderManifest.routes[route.pathname] = {
                                    initialStatus: status,
                                    initialHeaders: meta.headers,
                                    renderingMode: isAppPPREnabled ? isRoutePPREnabled ? _renderingmode.RenderingMode.PARTIALLY_STATIC : _renderingmode.RenderingMode.STATIC : undefined,
                                    ...classification,
                                    experimentalPPR: isRoutePPREnabled,
                                    experimentalBypassFor: bypassFor,
                                    initialRevalidateSeconds: cacheControl.revalidate,
                                    initialExpireSeconds: cacheControl.expire,
                                    srcRoute: page,
                                    dataRoute,
                                    prefetchDataRoute,
                                    allowHeader: ALLOWED_HEADERS
                                };
                            } else {
                                hasRevalidateZero = true;
                                if (ssgPageRoutesSet.has(route.pathname)) {
                                    const currentPageInfo = pageInfos.get(page);
                                    // Remove the route from the SSG page routes if it bailed out
                                    // during prerendering.
                                    ssgPageRoutesSet.delete(route.pathname);
                                    // Mark the route as having a GSP and revalidate zero.
                                    if (ssgPageRoutesSet.size === 0) {
                                        hasGSPAndRevalidateZero.delete(page);
                                    } else {
                                        hasGSPAndRevalidateZero.add(page);
                                    }
                                    pageInfos.set(page, {
                                        ...currentPageInfo,
                                        ssgPageRoutes: Array.from(ssgPageRoutesSet),
                                        // If there are no SSG page routes left, then the page is not SSG.
                                        isSSG: ssgPageRoutesSet.size === 0 ? false : currentPageInfo.isSSG
                                    });
                                } else {
                                    // we might have determined during prerendering that this page
                                    // used dynamic data
                                    pageInfos.set(route.pathname, {
                                        ...pageInfos.get(route.pathname),
                                        isSSG: false,
                                        isStatic: false
                                    });
                                }
                            }
                        }
                        if (!hasRevalidateZero && (0, _utils.isDynamicRoute)(page)) {
                            // When PPR fallbacks aren't used, we need to include it here. If
                            // they are enabled, then it'll already be included in the
                            // prerendered routes.
                            if (!isRoutePPREnabled) {
                                dynamicPrerenderedRoutes.push({
                                    params: {},
                                    pathname: page,
                                    encodedPathname: page,
                                    fallbackRouteParams: [],
                                    fallbackMode: fallbackModes.get(originalAppPath) ?? _fallback.FallbackMode.NOT_FOUND,
                                    fallbackRootParams: [],
                                    throwOnEmptyStaticShell: true
                                });
                            }
                            for (const route of dynamicPrerenderedRoutes){
                                // Static metadata files are rewritten above into the known
                                // static bucket under their `-`-placeholder pathname, so any
                                // entry that slips through here (e.g. an unexpected fallback
                                // shape) must not generate a dynamic PRERENDER manifest entry
                                // — the route handler shipped with the dynamic route still
                                // serves these at runtime.
                                if ((0, _ismetadataroute.isStaticMetadataFile)(route.pathname)) {
                                    continue;
                                }
                                const normalizedRoute = (0, _normalizepagepath.normalizePagePath)(route.pathname);
                                const parentPageInfo = pageInfos.get(page);
                                const routeResult = exportResult.byPath.get(route.pathname);
                                const metadata = routeResult == null ? void 0 : routeResult.metadata;
                                const cacheControl = getCacheControl(route.pathname);
                                let dataRoute = null;
                                if (!isAppRouteHandler) {
                                    dataRoute = _path.default.posix.join(`${normalizedRoute}${_constants.RSC_SUFFIX}`);
                                }
                                let prefetchDataRoute = null;
                                let dynamicRoute = routesManifest.dynamicRoutes.find((r)=>r.page === route.pathname);
                                if (!isAppRouteHandler && isAppPPREnabled) {
                                    // If the dynamic route wasn't found, then we need to create
                                    // it. This ensures that for each fallback shell there's an
                                    // entry in the app routes manifest which enables routing for
                                    // this fallback shell.
                                    if (!dynamicRoute) {
                                        dynamicRoute = (0, _utils1.pageToRoute)(route.pathname, page);
                                        sourcePages.set(route.pathname, page);
                                        // This route is not for the internal router, but instead
                                        // for external routers.
                                        dynamicRoute.skipInternalRouting = true;
                                        // Push this to the end of the array. The dynamic routes are
                                        // sorted by page later.
                                        dynamicRoutes.push(dynamicRoute);
                                    }
                                }
                                if (!isAppRouteHandler && ((metadata == null ? void 0 : metadata.segmentPaths) || route.fallbackRootParams && route.fallbackRootParams.length > 0)) {
                                    // If PPR isn't enabled, then we might not find the dynamic
                                    // route by pathname. If that's the case, we need to find the
                                    // route by page.
                                    if (!dynamicRoute) {
                                        dynamicRoute = dynamicRoutes.find((r)=>r.page === page);
                                        // If it can't be found by page, we must throw an error.
                                        if (!dynamicRoute) {
                                            throw Object.defineProperty(new _invarianterror.InvariantError('Dynamic route not found'), "__NEXT_ERROR_CODE", {
                                                value: "E633",
                                                enumerable: false,
                                                configurable: true
                                            });
                                        }
                                    }
                                    if (metadata == null ? void 0 : metadata.segmentPaths) {
                                        const pageSegmentPath = metadata.segmentPaths.find((item)=>item.endsWith('__PAGE__'));
                                        if (!pageSegmentPath) {
                                            throw Object.defineProperty(new Error(`Invariant: missing __PAGE__ segmentPath`), "__NEXT_ERROR_CODE", {
                                                value: "E759",
                                                enumerable: false,
                                                configurable: true
                                            });
                                        }
                                        // We build a combined segment data route from the
                                        // page segment as we need to limit the number of
                                        // routes we output and they can be shared
                                        const builtSegmentDataRoute = (0, _buildprefetchsegmentdataroute.buildPrefetchSegmentDataRoute)(route.pathname, pageSegmentPath);
                                        builtSegmentDataRoute.source = builtSegmentDataRoute.source.replace('/__PAGE__\\.segment\\.rsc$', `(?<segment>/__PAGE__\\.segment\\.rsc|\\.segment\\.rsc)(?:/)?$`);
                                        builtSegmentDataRoute.destination = builtSegmentDataRoute.destination.replace('/__PAGE__.segment.rsc', '$segment');
                                        dynamicRoute.prefetchSegmentDataRoutes ??= [];
                                        dynamicRoute.prefetchSegmentDataRoutes.push(builtSegmentDataRoute);
                                    }
                                    // Collect prefetch hints (first-writer-wins per page)
                                    if ((metadata == null ? void 0 : metadata.prefetchHints) && !(page in prefetchHints)) {
                                        prefetchHints[page] = metadata.prefetchHints;
                                    }
                                }
                                if (route.pathname === page) {
                                    // The route pattern entry (for example `/blog/[slug]`) is
                                    // also present in `dynamicPrerenderedRoutes`. Keep updating
                                    // the parent entry in place so it retains its `ssgPageRoutes`
                                    // subtree; if we rewrote it like a concrete child route we
                                    // would lose the generated child paths from the build output.
                                    pageInfos.set(page, {
                                        ...pageInfos.get(page),
                                        initialCacheControl: cacheControl,
                                        isDynamicAppRoute: true,
                                        // if PPR is turned on and the route contains a dynamic segment,
                                        // we assume it'll be partially prerendered
                                        hasPostponed: isRoutePPREnabled
                                    });
                                } else {
                                    // Concrete generated paths inherit the parent route's base
                                    // metadata, but they should not themselves print a nested
                                    // subtree. Clearing `ssgPageRoutes` here lets the tree view
                                    // classify the child path with its own symbol only once.
                                    pageInfos.set(route.pathname, {
                                        ...parentPageInfo,
                                        ...pageInfos.get(route.pathname),
                                        ssgPageRoutes: null,
                                        ssgPageDurations: undefined,
                                        pageDuration: undefined,
                                        initialCacheControl: cacheControl,
                                        isDynamicAppRoute: true,
                                        // if PPR is turned on and the route contains a dynamic segment,
                                        // we assume it'll be partially prerendered
                                        hasPostponed: isRoutePPREnabled
                                    });
                                }
                                const fallbackMode = getFallbackMode(route);
                                // When the route is configured to serve a prerender, we should
                                // use the cache control from the export result. If it can't be
                                // found, mark that we should keep the shell forever
                                // (revalidate: `false` via `getCacheControl()`).
                                const fallbackCacheControl = isRoutePPREnabled && fallbackMode === _fallback.FallbackMode.PRERENDER ? cacheControl : undefined;
                                const fallback = (0, _fallback.fallbackModeToFallbackField)(fallbackMode, route.pathname);
                                const meta = metadata && isRoutePPREnabled && fallbackMode === _fallback.FallbackMode.PRERENDER ? (0, _utils1.collectMeta)(metadata) : {};
                                let classification = {};
                                if (!isAppRouteHandler) {
                                    if (typeof fallback === 'string' && isRoutePPREnabled) {
                                        var _route_remainingPrerenderableParams;
                                        classification = {
                                            routeType: (((_route_remainingPrerenderableParams = route.remainingPrerenderableParams) == null ? void 0 : _route_remainingPrerenderableParams.length) ?? 0) > 0 ? 'fallback' : 'shell',
                                            ...getPprAppPageClassification(route.pathname, routeResult)
                                        };
                                    } else if (fallback === null) {
                                        classification = {
                                            routeType: 'page',
                                            response: 'empty',
                                            compute: 'blocking'
                                        };
                                    }
                                }
                                prerenderManifest.dynamicRoutes[route.pathname] = {
                                    experimentalPPR: isRoutePPREnabled,
                                    remainingPrerenderableParams: route.remainingPrerenderableParams,
                                    renderingMode: isAppPPREnabled ? isRoutePPREnabled ? _renderingmode.RenderingMode.PARTIALLY_STATIC : _renderingmode.RenderingMode.STATIC : undefined,
                                    ...classification,
                                    experimentalBypassFor: bypassFor,
                                    routeRegex: (0, _loadcustomroutes.normalizeRouteRegex)((0, _routeregex.getNamedRouteRegex)(route.pathname, {
                                        prefixRouteKeys: false
                                    }).re.source),
                                    dataRoute,
                                    fallback,
                                    fallbackRevalidate: fallbackCacheControl == null ? void 0 : fallbackCacheControl.revalidate,
                                    fallbackExpire: fallbackCacheControl == null ? void 0 : fallbackCacheControl.expire,
                                    fallbackStatus: meta.status,
                                    fallbackHeaders: meta.headers,
                                    fallbackRootParams: route.fallbackRouteParams ? route.fallbackRootParams : undefined,
                                    fallbackSourceRoute: route.fallbackRouteParams && route.fallbackRouteParams.length > 0 ? page : undefined,
                                    fallbackRouteParams: route.fallbackRouteParams,
                                    dataRouteRegex: !dataRoute ? null : (0, _loadcustomroutes.normalizeRouteRegex)((0, _routeregex.getNamedRouteRegex)(dataRoute, {
                                        prefixRouteKeys: false,
                                        includeSuffix: true,
                                        excludeOptionalTrailingSlash: true
                                    }).re.source),
                                    prefetchDataRoute,
                                    prefetchDataRouteRegex: !prefetchDataRoute ? undefined : (0, _loadcustomroutes.normalizeRouteRegex)((0, _routeregex.getNamedRouteRegex)(prefetchDataRoute, {
                                        prefixRouteKeys: false,
                                        includeSuffix: true,
                                        excludeOptionalTrailingSlash: true
                                    }).re.source),
                                    allowHeader: ALLOWED_HEADERS
                                };
                            }
                        }
                    });
                    // Update pages manifest entries for exported pages.
                    // The export worker writes pages directly to .next/server/pages/,
                    // so no file moving is needed — only the manifest must be updated.
                    const updatePagesManifestForExportedPage = (page, isSsg)=>{
                        const isUnusedStaticStatusPage = _constants1.STATIC_STATUS_PAGES.includes(page) && !usedStaticStatusPages.includes(page);
                        // SSG pages don't get manifest entries
                        if (isSsg) return;
                        if (i18n) {
                            // Replace non-locale entry with per-locale entries
                            delete pagesManifest[page];
                            for (const locale of i18n.locales){
                                const curPath = `/${locale}${page === '/' ? '' : page}`;
                                if (prerenderManifest.notFoundRoutes.includes(curPath)) continue;
                                const relativeDest = page === '/' ? `pages/${locale}.html` : `pages${(0, _normalizepagepath.normalizePagePath)(curPath)}.html`;
                                pagesManifest[curPath] = relativeDest;
                            }
                        } else if (!isUnusedStaticStatusPage) {
                            const file = (0, _normalizepagepath.normalizePagePath)(page);
                            pagesManifest[page] = `pages${file}.html`;
                        }
                    };
                    // The export worker writes files directly to server/pages/,
                    // so we must delete files for notFound routes that shouldn't be served.
                    const deleteNotFoundPageFiles = (normalizedPath)=>Promise.all([
                            _fs.promises.rm(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'pages', `${normalizedPath}.html`), {
                                force: true
                            }),
                            _fs.promises.rm(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'pages', `${normalizedPath}.json`), {
                                force: true
                            })
                        ]);
                    async function moveExportedAppNotFoundTo404() {
                        return staticGenerationSpan.traceChild('move-exported-app-not-found-').traceAsyncFn(async ()=>{
                            const orig = _path.default.join(distDir, 'server', 'app', '_not-found.html');
                            const updatedRelativeDest = _path.default.join('pages', '404.html').replace(/\\/g, '/');
                            if ((0, _fs.existsSync)(orig)) {
                                // if 404.html folder doesn't exist, create it
                                await _fs.promises.mkdir(_path.default.dirname(_path.default.join(distDir, 'server', updatedRelativeDest)), {
                                    recursive: true
                                });
                                await _fs.promises.copyFile(orig, _path.default.join(distDir, 'server', updatedRelativeDest));
                                // since the app router not found is prioritized over pages router,
                                // we have to ensure the app router entries are available for all locales
                                if (i18n) {
                                    for (const locale of i18n.locales){
                                        const curPath = `/${locale}/404`;
                                        pagesManifest[curPath] = updatedRelativeDest;
                                    }
                                }
                                pagesManifest['/404'] = updatedRelativeDest;
                            }
                        });
                    }
                    async function moveExportedAppGlobalErrorTo500() {
                        return staticGenerationSpan.traceChild('move-exported-app-global-error-').traceAsyncFn(async ()=>{
                            // If static 500.html exists in pages router, don't move it
                            if ((0, _fs.existsSync)(_path.default.join(distDir, 'server', 'pages', '500.html'))) {
                                return;
                            }
                            // Only handle 500.html generation for static export
                            const orig = _path.default.join(distDir, 'server', 'app', '_global-error.html');
                            if ((0, _fs.existsSync)(orig)) {
                                const error500Html = _path.default.join(distDir, 'server', 'pages', '500.html');
                                // if 500.html folder doesn't exist, create it
                                await _fs.promises.mkdir(_path.default.dirname(error500Html), {
                                    recursive: true
                                });
                                await _fs.promises.copyFile(orig, error500Html);
                                pagesManifest['/500'] = _path.default.join('pages', '500.html').replace(/\\/g, '/');
                            }
                        });
                    }
                    // If there's a fully static /not-found inside app, we prefer it over
                    // the pages 404. A partially prerendered not-found is only a shell,
                    // so it must remain associated with its resumable prerender output.
                    const hasStaticApp404 = hasApp404 && staticPaths.has(_entryconstants.UNDERSCORE_NOT_FOUND_ROUTE_ENTRY) && !((_pageInfos_get = pageInfos.get(_entryconstants.UNDERSCORE_NOT_FOUND_ROUTE)) == null ? void 0 : _pageInfos_get.hasPostponed);
                    if (hasStaticApp404) {
                        await moveExportedAppNotFoundTo404();
                    } else {
                        // Update manifest for default 404 page
                        if (!hasPages404 && !hasApp404 && useStaticPages404 && !appDirOnly) {
                            updatePagesManifestForExportedPage('/404', false);
                        }
                    }
                    if (useDefaultStatic500 && !appDirOnly) {
                        updatePagesManifestForExportedPage('/500', false);
                    }
                    // If there's app router and no pages router, use app router built-in 500.html
                    if (hasStaticAppGlobalError && mappedAppPages && Object.keys(mappedAppPages).length > 0) {
                        await moveExportedAppGlobalErrorTo500();
                    }
                    for (const page of combinedPages){
                        const isSsg = ssgPages.has(page);
                        const isStaticSsgFallback = ssgStaticFallbackPages.has(page);
                        const isDynamic = (0, _utils.isDynamicRoute)(page);
                        const file = (0, _normalizepagepath.normalizePagePath)(page);
                        const pageInfo = pageInfos.get(page);
                        const durationInfo = exportResult.byPage.get(page);
                        if (pageInfo && durationInfo) {
                            // Set Build Duration
                            if (pageInfo.ssgPageRoutes) {
                                pageInfo.ssgPageDurations = pageInfo.ssgPageRoutes.map((pagePath)=>{
                                    const duration = durationInfo.durationsByPath.get(pagePath);
                                    if (typeof duration === 'undefined') {
                                        throw Object.defineProperty(new Error("Invariant: page wasn't built"), "__NEXT_ERROR_CODE", {
                                            value: "E239",
                                            enumerable: false,
                                            configurable: true
                                        });
                                    }
                                    return duration;
                                });
                            }
                            pageInfo.pageDuration = durationInfo.durationsByPath.get(page);
                        }
                        // The dynamic version of SSG pages are only prerendered if the
                        // fallback is enabled. Below, we handle the specific prerenders
                        // of these.
                        const hasHtmlOutput = !(isSsg && isDynamic && !isStaticSsgFallback);
                        if (hasHtmlOutput) {
                            updatePagesManifestForExportedPage(page, isSsg);
                        }
                        if (isSsg) {
                            if (!isDynamic) {
                                if (i18n) {
                                    // TODO: do we want to show all locale variants in build output
                                    for (const locale of i18n.locales){
                                        const localePage = `/${locale}${page === '/' ? '' : page}`;
                                        const isNotFoundTrue = prerenderManifest.notFoundRoutes.includes(localePage);
                                        if (isNotFoundTrue) {
                                            await deleteNotFoundPageFiles((0, _normalizepagepath.normalizePagePath)(localePage));
                                        }
                                        const cacheControl = getCacheControl(localePage);
                                        prerenderManifest.routes[localePage] = {
                                            ...!isNotFoundTrue && {
                                                routeType: 'page',
                                                response: 'complete',
                                                compute: 'static'
                                            },
                                            initialRevalidateSeconds: cacheControl.revalidate,
                                            initialExpireSeconds: cacheControl.expire,
                                            experimentalPPR: undefined,
                                            renderingMode: undefined,
                                            srcRoute: null,
                                            dataRoute: _path.default.posix.join('/_next/data', buildId, `${localePage}.json`),
                                            prefetchDataRoute: undefined,
                                            allowHeader: ALLOWED_HEADERS
                                        };
                                    }
                                } else {
                                    const isNotFoundTrue = prerenderManifest.notFoundRoutes.includes(page);
                                    if (isNotFoundTrue) {
                                        await deleteNotFoundPageFiles(file);
                                    }
                                    const cacheControl = getCacheControl(page);
                                    prerenderManifest.routes[page] = {
                                        ...!isNotFoundTrue && {
                                            routeType: 'page',
                                            response: 'complete',
                                            compute: 'static'
                                        },
                                        initialRevalidateSeconds: cacheControl.revalidate,
                                        initialExpireSeconds: cacheControl.expire,
                                        experimentalPPR: undefined,
                                        renderingMode: undefined,
                                        srcRoute: null,
                                        dataRoute: _path.default.posix.join('/_next/data', buildId, `${file}.json`),
                                        // Pages does not have a prefetch data route.
                                        prefetchDataRoute: undefined,
                                        allowHeader: ALLOWED_HEADERS
                                    };
                                }
                                if (pageInfo) {
                                    pageInfo.initialCacheControl = getCacheControl(page);
                                }
                            } else {
                                // For a dynamic SSG page, the export worker already wrote
                                // the HTML/JSON files directly to their final location.
                                // We only need to update the prerender manifest.
                                for (const route of additionalPaths.get(page) ?? []){
                                    const isNotFoundTrue = prerenderManifest.notFoundRoutes.includes(route.pathname);
                                    if (isNotFoundTrue) {
                                        await deleteNotFoundPageFiles((0, _normalizepagepath.normalizePagePath)(route.pathname));
                                    }
                                    const cacheControl = getCacheControl(route.pathname);
                                    prerenderManifest.routes[route.pathname] = {
                                        ...!isNotFoundTrue && {
                                            routeType: 'page',
                                            response: 'complete',
                                            compute: 'static'
                                        },
                                        initialRevalidateSeconds: cacheControl.revalidate,
                                        initialExpireSeconds: cacheControl.expire,
                                        experimentalPPR: undefined,
                                        renderingMode: undefined,
                                        srcRoute: page,
                                        dataRoute: _path.default.posix.join('/_next/data', buildId, `${(0, _normalizepagepath.normalizePagePath)(route.pathname)}.json`),
                                        // Pages does not have a prefetch data route.
                                        prefetchDataRoute: undefined,
                                        allowHeader: ALLOWED_HEADERS
                                    };
                                    if (pageInfo) {
                                        pageInfo.initialCacheControl = cacheControl;
                                    }
                                }
                            }
                        }
                    }
                    await writeManifest(pagesManifestPath, pagesManifest);
                });
                // As we may have modified the dynamicRoutes, we need to sort the
                // dynamic routes by page.
                routesManifest.dynamicRoutes = (0, _sortableroutes.sortSortableRouteObjects)(dynamicRoutes, (route)=>({
                        // If the route is PPR enabled, and has an associated source page,
                        // use it. Otherwise fallback to the page which should be the same.
                        sourcePage: sourcePages.get(route.page) ?? route.page,
                        page: route.page
                    }));
                // Now write the routes manifest out.
                await nextBuildSpan.traceChild('write-routes-manifest').traceAsyncFn(()=>writeManifest(routesManifestPath, routesManifest));
            }
            flushTurbopackWarnings();
            const finalizingPageOptimizationStart = process.hrtime();
            const postBuildSpinner = (0, _spinner.default)('Finalizing page optimization');
            let buildTracesSpinner;
            let buildTracesStart;
            if (buildTracesPromise) {
                buildTracesStart = process.hrtime();
                buildTracesSpinner = (0, _spinner.default)('Collecting build traces');
            }
            // When output: export we want to end the worker later as it's still used for writeFullyStaticExport
            if (config.output !== 'export') {
                // ensure the worker is not left hanging
                staticWorker == null ? void 0 : staticWorker.end();
                staticWorker = undefined // Reset staticWorker to make sure it does not end in `finally`
                ;
            }
            const analysisEnd = process.hrtime(analysisBegin);
            telemetry.record((0, _events.eventBuildOptimize)(pagesPaths, {
                durationInSeconds: analysisEnd[0],
                staticPageCount: staticPages.size,
                staticPropsPageCount: ssgPages.size,
                serverPropsPageCount: serverPropsPages.size,
                ssrPageCount: pagesPaths.length - (staticPages.size + ssgPages.size + serverPropsPages.size),
                hasStatic404: useStaticPages404,
                hasReportWebVitals: (namedExports == null ? void 0 : namedExports.includes('reportWebVitals')) ?? false,
                rewritesCount: combinedRewrites.length,
                headersCount: headers.length,
                redirectsCount: redirects.length - 1,
                headersWithHasCount: headers.filter((r)=>!!r.has).length,
                rewritesWithHasCount: combinedRewrites.filter((r)=>!!r.has).length,
                redirectsWithHasCount: redirects.filter((r)=>!!r.has).length,
                middlewareCount: hasMiddlewareFile || hasProxyFile ? 1 : 0,
                totalAppPagesCount,
                staticAppPagesCount,
                serverAppPagesCount,
                edgeRuntimeAppCount,
                edgeRuntimePagesCount
            }));
            if (_buildcontext.NextBuildContext.telemetryState) {
                const events = (0, _events.eventBuildFeatureUsage)(_buildcontext.NextBuildContext.telemetryState.usages);
                telemetry.record(events);
                telemetry.record((0, _events.eventPackageUsedInGetServerSideProps)(_buildcontext.NextBuildContext.telemetryState.packagesUsedInServerSideProps));
                const useCacheTracker = _buildcontext.NextBuildContext.telemetryState.useCacheTracker;
                for (const [key, value] of Object.entries(useCacheTracker)){
                    telemetry.record((0, _events.eventBuildFeatureUsage)([
                        {
                            featureName: key,
                            invocationCount: value
                        }
                    ]));
                }
            }
            if (ssgPages.size > 0 || appDir) {
                var _config_i18n;
                tbdPrerenderRoutes.forEach((tbdRoute)=>{
                    const normalizedRoute = (0, _normalizepagepath.normalizePagePath)(tbdRoute);
                    const dataRoute = _path.default.posix.join('/_next/data', buildId, `${normalizedRoute}.json`);
                    let fallback = false;
                    if (ssgBlockingFallbackPages.has(tbdRoute)) {
                        fallback = null;
                    } else if (ssgStaticFallbackPages.has(tbdRoute)) {
                        fallback = `${normalizedRoute}.html`;
                    }
                    prerenderManifest.dynamicRoutes[tbdRoute] = {
                        routeRegex: (0, _loadcustomroutes.normalizeRouteRegex)((0, _routeregex.getNamedRouteRegex)(tbdRoute, {
                            prefixRouteKeys: false
                        }).re.source),
                        experimentalPPR: undefined,
                        renderingMode: undefined,
                        dataRoute,
                        fallback,
                        ...getPagesFallbackClassification(fallback),
                        fallbackRevalidate: undefined,
                        fallbackExpire: undefined,
                        fallbackSourceRoute: undefined,
                        fallbackRootParams: undefined,
                        fallbackRouteParams: undefined,
                        dataRouteRegex: (0, _loadcustomroutes.normalizeRouteRegex)((0, _routeregex.getNamedRouteRegex)(dataRoute, {
                            prefixRouteKeys: true,
                            includeSuffix: true,
                            excludeOptionalTrailingSlash: true
                        }).re.source),
                        // Pages does not have a prefetch data route.
                        prefetchDataRoute: undefined,
                        prefetchDataRouteRegex: undefined,
                        allowHeader: ALLOWED_HEADERS
                    };
                });
                _buildcontext.NextBuildContext.previewModeId = previewProps.previewModeId;
                _buildcontext.NextBuildContext.fetchCacheKeyPrefix = config.experimental.fetchCacheKeyPrefix;
                _buildcontext.NextBuildContext.allowedRevalidateHeaderKeys = config.experimental.allowedRevalidateHeaderKeys;
                // Defensive sweep: static metadata files should never end up in
                // `dynamicRoutes` because they are rewritten to the `-`-placeholder
                // pathname and added to `routes` above. If anything upstream
                // (e.g. a code path that calls `addDynamicRoute` directly) still
                // registers a bracketed entry like `/[id]/apple-icon.png` here, the
                // adapter would later look for a parent app output that doesn't
                // exist and throw an invariant error. Strip those entries before the
                // manifest is written.
                for (const route of Object.keys(prerenderManifest.dynamicRoutes)){
                    if ((0, _ismetadataroute.isStaticMetadataFile)(route)) {
                        delete prerenderManifest.dynamicRoutes[route];
                    }
                }
                await writePrerenderManifest(distDir, prerenderManifest);
                await writeManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.PREFETCH_HINTS), prefetchHints);
                await writeClientSsgManifest(prerenderManifest, {
                    distDir,
                    buildId,
                    locales: (_config_i18n = config.i18n) == null ? void 0 : _config_i18n.locales
                });
            } else {
                await writePrerenderManifest(distDir, {
                    version: 4,
                    routes: {},
                    dynamicRoutes: {},
                    preview: previewProps,
                    notFoundRoutes: []
                });
            }
            // #endregion
            await writeImagesManifest(distDir, config);
            await writeManifest(_path.default.join(distDir, _constants1.EXPORT_MARKER), {
                version: 1,
                hasExportPathMap: typeof config.exportPathMap === 'function',
                exportTrailingSlash: config.trailingSlash === true,
                isNextImageImported: isNextImageImported === true
            });
            await _fs.promises.unlink(_path.default.join(distDir, _constants1.EXPORT_DETAIL)).catch((err)=>{
                if (err.code === 'ENOENT') {
                    return Promise.resolve();
                }
                return Promise.reject(err);
            });
            if (Boolean(config.experimental.nextScriptWorkers)) {
                await nextBuildSpan.traceChild('verify-partytown-setup').traceAsyncFn(async ()=>{
                    await (0, _verifypartytownsetup.verifyPartytownSetup)(dir, _path.default.join(distDir, _constants1.CLIENT_STATIC_FILES_PATH));
                });
            }
            await buildTracesPromise;
            if (buildTracesSpinner) {
                if (buildTracesStart) {
                    const buildTracesEnd = process.hrtime(buildTracesStart);
                    buildTracesSpinner.setText(`Collecting build traces in ${(0, _durationtostring.hrtimeDurationToString)(buildTracesEnd)}`);
                }
                buildTracesSpinner.stopAndPersist();
                buildTracesSpinner = undefined;
            }
            if (proxyFilePath && bundler !== _bundler.Bundler.Turbopack) {
                await _fs.promises.rename(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'proxy.js'), _path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'middleware.js'));
                await _fs.promises.rename(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'proxy.js.nft.json'), _path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'middleware.js.nft.json'));
                const middlewareNft = JSON.parse(await _fs.promises.readFile(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'middleware.js.nft.json'), 'utf8'));
                // When Proxy self-reference itself e.g. __filename, it is traced to
                // the NFT file. However, since we rename 'proxy.js' to 'middleware.js',
                // the files in NFT will differ from the actual outputs, which will fail
                // for the providers like Vercel that uses NFT. Therefore also rename
                // the 'proxy.js' to 'middleware.js' in the NFT file.
                let hasProxyJsInNft = false;
                middlewareNft.files = middlewareNft.files.map((file)=>{
                    if (file === 'proxy.js') {
                        hasProxyJsInNft = true;
                        return 'middleware.js';
                    }
                    return file;
                });
                if (hasProxyJsInNft) {
                    await _fs.promises.writeFile(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, 'middleware.js.nft.json'), JSON.stringify(middlewareNft));
                }
            }
            if (isCompileMode) {
                _log.info(`Build ran with "compile" mode, to finalize the build run either "generate" or "generate-env" mode as well`);
            }
            if (config.output === 'export') {
                // TODO: When writeFullyStaticExport doesn't fail when staticWorker is passed moved this after writeFullyStaticExport.
                // End the worker here when it's output: export.
                staticWorker.end();
                staticWorker = undefined // Reset staticWorker to make sure it does not end in `finally`
                ;
                await nextBuildSpan.traceChild('output-export-full-static-export').traceAsyncFn(async ()=>{
                    await writeFullyStaticExport(config, dir, enabledDirectories, configOutDir, nextBuildSpan, appDirOnly, bundler);
                });
            }
            // This should come after output: export handling but before
            // output: standalone, in the future output: standalone might
            // not be allowed if an adapter with onBuildComplete is configured
            const adapterPath = config.adapterPath;
            if (adapterPath) {
                await nextBuildSpan.traceChild('adapter-handle-build-complete').traceAsyncFn(async ()=>{
                    await (0, _buildcomplete.handleBuildComplete)({
                        dir,
                        distDir,
                        config,
                        appType,
                        buildId,
                        bundler,
                        configOutDir: _path.default.join(dir, configOutDir),
                        staticPages,
                        serverPropsPages,
                        nextVersion: "16.3.5",
                        repoRoot: config.repoRoot,
                        outputFileTracingRoot,
                        hasNodeMiddleware,
                        hasInstrumentationHook,
                        adapterPath,
                        pageKeys: pageKeys.pages,
                        appPageKeys: denormalizedAppPages,
                        routesManifest,
                        prerenderManifest,
                        middlewareManifest,
                        functionsConfigManifest,
                        hasStatic404: useStaticPages404,
                        hasStatic500: useDefaultStatic500,
                        requiredServerFiles: requiredServerFilesManifest.files
                    });
                });
            }
            if (config.output === 'standalone') {
                await nextBuildSpan.traceChild('output-standalone').traceAsyncFn(async ()=>{
                    await writeStandaloneDirectory(nextBuildSpan, distDir, pageKeys, denormalizedAppPages, outputFileTracingRoot, requiredServerFilesManifest, middlewareManifest, hasNodeMiddleware, hasInstrumentationHook, staticPages, loadedEnvFiles, appDir);
                });
            }
            if (postBuildSpinner) {
                const finalizingPageOptimizationEnd = process.hrtime(finalizingPageOptimizationStart);
                postBuildSpinner.setText(`Finalizing page optimization in ${(0, _durationtostring.hrtimeDurationToString)(finalizingPageOptimizationEnd)}`);
                postBuildSpinner.stopAndPersist();
            }
            console.log();
            if (debugOutput) {
                nextBuildSpan.traceChild('print-custom-routes').traceFn(()=>(0, _utils1.printCustomRoutes)({
                        redirects,
                        onMatchHeaders,
                        rewrites,
                        headers
                    }));
            }
            await nextBuildSpan.traceChild('print-tree-view').traceAsyncFn(()=>(0, _utils1.printTreeView)(pageKeys, pageInfos, {
                    pagesDir,
                    useStaticPages404,
                    pageExtensions: config.pageExtensions,
                    buildManifest,
                    middlewareManifest,
                    functionsConfigManifest,
                    hasGSPAndRevalidateZero
                }));
            if (bundler === _bundler.Bundler.Turbopack) {
                await nextBuildSpan.traceChild('write-route-bundle-stats').traceAsyncFn(()=>(0, _routebundlestats.writeRouteBundleStats)(pageKeys, buildManifest, distDir, dir));
            }
            await nextBuildSpan.traceChild('telemetry-flush').traceAsyncFn(()=>telemetry.flush());
            await shutdownPromise;
            if (_buildcontext.NextBuildContext.analyze) {
                await (0, _promises.cp)(_path.default.join(__dirname, '../bundle-analyzer'), _path.default.join(dir, '.next/diagnostics/analyze'), {
                    recursive: true
                });
                await (0, _promises.mkdir)(_path.default.join(dir, '.next/diagnostics/analyze/data'), {
                    recursive: true
                });
                // Write an index of routes for the route picker
                await (0, _promises.writeFile)(_path.default.join(dir, '.next/diagnostics/analyze/data/routes.json'), JSON.stringify(routesManifest.dynamicRoutes.map((r)=>r.page).concat(routesManifest.staticRoutes.map((r)=>r.page)), null, 2));
            }
        });
    } catch (e) {
        const telemetry = _shared.traceGlobals.get('telemetry');
        if (telemetry) {
            telemetry.record((0, _events.eventBuildFailed)({
                bundler: getBundlerForTelemetry(bundler),
                errorCode: getErrorCodeForTelemetry(e),
                durationInSeconds: Math.floor((Date.now() - buildStartTime) / 1000)
            }));
        }
        throw e;
    } finally{
        // @ts-expect-error Existence of staticWorker is checked here intentionally.
        if (staticWorker) {
            staticWorker.end();
        }
        // Ensure we wait for lockfile patching if present
        await _swc.lockfilePatchPromise.cur;
        // Backstop for builds that never reach the post-static-generation flush.
        flushTurbopackWarnings();
        // Flush telemetry before finishing (waits for async operations like setTimeout in debug mode)
        const telemetry = _shared.traceGlobals.get('telemetry');
        if (telemetry) {
            await telemetry.flush();
        }
        // Ensure all traces are flushed before finishing the command
        await (0, _trace.flushAllTraces)();
        (0, _swc.teardownTraceSubscriber)();
        if (traceUploadUrl && loadedConfig) {
            (0, _uploadtrace.default)({
                traceUploadUrl,
                mode: 'build',
                projectDir: dir,
                distDir: loadedConfig.distDir,
                isTurboSession: bundler === _bundler.Bundler.Turbopack,
                sync: true
            });
        }
    }
}
function errorFromUnsupportedSegmentConfig() {
    _log.error(`Invalid segment configuration export detected. This can cause unexpected behavior from the configs not being applied. You should see the relevant failures in the logs above. Please fix them to continue.`);
    process.exit(1);
}
function getBundlerForTelemetry(bundler) {
    switch(bundler){
        case _bundler.Bundler.Turbopack:
            return 'turbopack';
        case _bundler.Bundler.Rspack:
            return 'rspack';
        case _bundler.Bundler.Webpack:
            return 'webpack';
        default:
            throw Object.defineProperty(new Error(`unknown bundler: ${bundler}`), "__NEXT_ERROR_CODE", {
                value: "E826",
                enumerable: false,
                configurable: true
            });
    }
}
function getErrorCodeForTelemetry(err) {
    const code = (0, _errortelemetryutils.extractNextErrorCode)(err);
    if (code != null) {
        return code;
    }
    if (err instanceof Error && 'code' in err && typeof err.code === 'string') {
        return err.code;
    }
    if (err instanceof Error) {
        return err.name;
    }
    return 'Unknown';
}

//# sourceMappingURL=index.js.map