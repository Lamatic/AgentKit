#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "nextDev", {
    enumerable: true,
    get: function() {
        return nextDev;
    }
});
const _cpuprofile = require("../server/lib/cpu-profile");
const _utils = require("../server/lib/utils");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../build/output/log"));
const _getprojectdir = require("../lib/get-project-dir");
const _profilesdir = require("../lib/profiles-dir");
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _shared = require("../trace/shared");
const _storage = require("../telemetry/storage");
const _findpagesdir = require("../lib/find-pages-dir");
const _fileexists = require("../lib/file-exists");
const _getnpxcommand = require("../lib/helpers/get-npx-command");
const _mkcert = require("../lib/mkcert");
const _uploadtrace = /*#__PURE__*/ _interop_require_default(require("../trace/upload-trace"));
const _env = require("@next/env");
const _child_process = require("child_process");
const _getreservedport = require("../lib/helpers/get-reserved-port");
const _getcachedirectory = require("../lib/helpers/get-cache-directory");
const _git = require("../lib/helpers/git");
const _os = /*#__PURE__*/ _interop_require_default(require("os"));
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodeevents = require("node:events");
const _timers = require("timers");
const _trace = require("../trace");
const _bundler = require("../lib/bundler");
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
let dir;
let child;
// distDir is received from the child process via IPC, used for telemetry and trace.
let distDir;
let isTurbopack;
let traceUploadUrl;
let sessionStopHandled = false;
let devSpanAttrs = {
    'rage-restart': false,
    'missing-next-dir': false
};
const sessionStarted = Date.now();
const sessionSpan = (0, _trace.trace)('next-dev');
// If the user restarts the dev server within this window we count it as a "rage restart".
const RAGE_RESTART_THRESHOLD_MS = 90000;
// Single shared file for all projects — keyed by project directory path.
const DEV_STATE_FILE = _path.default.join((0, _getcachedirectory.getCacheDirectory)('nextjs-nodejs'), 'dev-state.json');
// How long should we wait for the child to cleanly exit after sending
// SIGINT/SIGTERM to the child process before sending SIGKILL?
const CHILD_EXIT_TIMEOUT_MS = parseInt(process.env.NEXT_EXIT_TIMEOUT_MS ?? '100', 10);
const handleSessionStop = async (signal)=>{
    if (signal != null && (child == null ? void 0 : child.pid)) child.kill(signal);
    if (sessionStopHandled) return;
    sessionStopHandled = true;
    // Capture the child's exit code if it has already exited and caused the
    // session stop (via the 'exit' event), otherwise assume success (0).
    const exitCode = (child == null ? void 0 : child.exitCode) || 0;
    if (signal != null && (child == null ? void 0 : child.pid) && child.exitCode === null && child.signalCode === null) {
        let exitTimeout = setTimeout(()=>{
            child == null ? void 0 : child.kill('SIGKILL');
        }, CHILD_EXIT_TIMEOUT_MS);
        await (0, _nodeevents.once)(child, 'exit').catch(()=>{});
        (0, _timers.clearTimeout)(exitTimeout);
    }
    sessionSpan.stop();
    try {
        const { eventCliSessionStopped } = require('../telemetry/events/session-stopped');
        let pagesDir = !!_shared.traceGlobals.get('pagesDir');
        let appDir = !!_shared.traceGlobals.get('appDir');
        if (typeof _shared.traceGlobals.get('pagesDir') === 'undefined' || typeof _shared.traceGlobals.get('appDir') === 'undefined') {
            const pagesResult = (0, _findpagesdir.findPagesDir)(dir);
            appDir = !!pagesResult.appDir;
            pagesDir = !!pagesResult.pagesDir;
        }
        const telemetry = _shared.traceGlobals.get('telemetry') || new _storage.Telemetry({
            distDir: _path.default.join(dir, distDir || '.next')
        });
        telemetry.record(eventCliSessionStopped({
            cliCommand: 'dev',
            turboFlag: isTurbopack,
            durationMilliseconds: Date.now() - sessionStarted,
            pagesDir,
            appDir
        }), true);
        telemetry.flushDetached('dev', dir);
    } catch (_) {
    // errors here aren't actionable so don't add
    // noise to the output
    }
    if (traceUploadUrl && distDir) {
        (0, _uploadtrace.default)({
            traceUploadUrl,
            mode: 'dev',
            projectDir: dir,
            distDir,
            isTurboSession: isTurbopack
        });
        writeDevState();
    }
    // Save CPU profile if it was enabled (before exiting)
    (0, _cpuprofile.saveCpuProfile)();
    // ensure we re-enable the terminal cursor before exiting
    // the program, or the cursor could remain hidden
    process.stdout.write('\x1B[?25h');
    process.stdout.write('\n');
    process.exit(exitCode);
};
process.on('SIGINT', ()=>handleSessionStop('SIGINT'));
process.on('SIGTERM', ()=>handleSessionStop('SIGTERM'));
// exit event must be synchronous
process.on('exit', ()=>{
    child == null ? void 0 : child.kill('SIGKILL');
    // Catch aggressive kills (e.g. OOM, unhandled exception) that bypass handleSessionStop.
    // SIGKILL of the parent cannot be caught; for all other exits this ensures state is written.
    if (!sessionStopHandled) {
        writeDevState();
    }
});
const nextDev = async (options, portSource, directory)=>{
    // Note: parseBundlerArgs can only decide on Turbopack or webpack.
    // Rspack can be configured via next.config.js but next.config.js is not loaded in the main process, only in the child process.
    isTurbopack = (0, _bundler.parseBundlerArgs)(options) === _bundler.Bundler.Turbopack;
    dir = (0, _getprojectdir.getProjectDir)(process.env.NEXT_PRIVATE_DEV_DIR || directory);
    // Check if pages dir exists and warn if not
    if (!await (0, _fileexists.fileExists)(dir, _fileexists.FileType.Directory)) {
        (0, _utils.printAndExit)(`> No such directory exists as the project root: ${dir}`);
    }
    if (options.experimentalCpuProf) {
        _log.info(`CPU profiling enabled. Profile will be saved to .next-profiles/ on exit (Ctrl+C).`);
    }
    async function preflight(skipOnReboot) {
        const { getPackageVersion, getDependencies } = await Promise.resolve(require('../lib/get-package-version'));
        const [sassVersion, nodeSassVersion] = await Promise.all([
            getPackageVersion({
                cwd: dir,
                name: 'sass'
            }),
            getPackageVersion({
                cwd: dir,
                name: 'node-sass'
            })
        ]);
        if (sassVersion && nodeSassVersion) {
            _log.warn('Your project has both `sass` and `node-sass` installed as dependencies, but should only use one or the other. ' + 'Please remove the `node-sass` dependency from your project. ' + ' Read more: https://nextjs.org/docs/messages/duplicate-sass');
        }
        if (!skipOnReboot) {
            const { dependencies, devDependencies } = await getDependencies({
                cwd: dir
            });
            // Warn if @next/font is installed as a dependency. Ignore `workspace:*` to not warn in the Next.js monorepo.
            if (dependencies['@next/font'] || devDependencies['@next/font'] && devDependencies['@next/font'] !== 'workspace:*') {
                const command = (0, _getnpxcommand.getNpxCommand)(dir);
                _log.warn('Your project has `@next/font` installed as a dependency, please use the built-in `next/font` instead. ' + 'The `@next/font` package will be removed in Next.js 14. ' + `You can migrate by running \`${command} @next/codemod@latest built-in-next-font .\`. Read more: https://nextjs.org/docs/messages/built-in-next-font`);
            }
        }
    }
    let port = options.port;
    if ((0, _getreservedport.isPortIsReserved)(port)) {
        (0, _utils.printAndExit)((0, _getreservedport.getReservedPortExplanation)(port), 1);
    }
    // If neither --port nor PORT were specified, it's okay to retry new ports.
    const allowRetry = portSource === 'default';
    // We do not set a default host value here to prevent breaking
    // some set-ups that rely on listening on other interfaces
    const host = options.hostname;
    if (options.experimentalUploadTrace && !process.env.NEXT_TRACE_UPLOAD_DISABLED) {
        traceUploadUrl = options.experimentalUploadTrace;
    }
    if (traceUploadUrl) {
        let isRageRestart = false;
        let distDirCleared = false;
        try {
            if (_nodefs.default.existsSync(DEV_STATE_FILE)) {
                const allState = JSON.parse(_nodefs.default.readFileSync(DEV_STATE_FILE, 'utf8'));
                const state = allState[dir];
                if ((state == null ? void 0 : state.stopTime) && Date.now() - state.stopTime < RAGE_RESTART_THRESHOLD_MS) {
                    // Only flag as a rage restart if the git branch hasn't changed. If
                    // either the stored or current branch is unknown, skip the comparison
                    // and fall back to time-only detection.
                    const storedBranch = state.gitBranch;
                    const currentBranch = (0, _git.getGitBranch)(dir);
                    const branchChanged = storedBranch && currentBranch && storedBranch !== currentBranch;
                    if (!branchChanged) {
                        isRageRestart = true;
                    }
                }
                if ((state == null ? void 0 : state.distDirPath) && !_nodefs.default.existsSync(state.distDirPath)) {
                    distDirCleared = true;
                }
            }
        } catch  {
        // Corrupt file — leave both flags false
        }
        devSpanAttrs = {
            'rage-restart': isRageRestart,
            'missing-next-dir': distDirCleared
        };
    }
    const enabledFeatures = Object.fromEntries(Object.entries({
        serverFastRefreshDisabled: options.serverFastRefresh === false,
        experimentalCpuProf: options.experimentalCpuProf
    }).filter(([_, value])=>value));
    for (const [key, value] of Object.entries(enabledFeatures)){
        sessionSpan.setAttribute(`feature.${key}`, value);
    }
    (0, _trace.initializeTraceState)({
        ...(0, _trace.exportTraceState)(),
        defaultParentSpanId: sessionSpan.getId()
    });
    const devServerOptions = {
        dir,
        port,
        allowRetry,
        isDev: true,
        hostname: host,
        serverFastRefresh: options.serverFastRefresh
    };
    const startServerPath = require.resolve('../server/lib/start-server');
    async function startServer(startServerOptions) {
        return new Promise((resolve)=>{
            let resolved = false;
            const defaultEnv = _env.initialEnv || process.env;
            const nodeOptions = (0, _utils.getParsedNodeOptions)();
            let maxOldSpaceSize = (0, _utils.getMaxOldSpaceSize)();
            if (!maxOldSpaceSize && !process.env.NEXT_DISABLE_MEM_OVERRIDE) {
                const totalMem = _os.default.totalmem();
                const totalMemInMB = Math.floor(totalMem / 1024 / 1024);
                maxOldSpaceSize = Math.floor(totalMemInMB * 0.5).toString();
                nodeOptions['max-old-space-size'] = maxOldSpaceSize;
                // Ensure the max_old_space_size is not also set.
                delete nodeOptions['max_old_space_size'];
            }
            if (options.disableSourceMaps) {
                delete nodeOptions['enable-source-maps'];
            } else {
                nodeOptions['enable-source-maps'] = true;
            }
            const nodeDebugType = (0, _utils.getNodeDebugType)(nodeOptions);
            const originalAddress = nodeDebugType === undefined ? undefined : nodeOptions[nodeDebugType];
            delete nodeOptions.inspect;
            delete nodeOptions['inspect-brk'];
            delete nodeOptions['inspect_brk'];
            if (nodeDebugType !== undefined) {
                const address = (0, _utils.getParsedDebugAddress)(originalAddress);
                address.port = address.port === 0 ? 0 : address.port + 1;
                nodeOptions[nodeDebugType] = (0, _utils.formatDebugAddress)(address);
            } else if (options.inspect) {
                const address = options.inspect === true ? (0, _utils.getParsedDebugAddress)(true) : options.inspect;
                nodeOptions.inspect = (0, _utils.formatDebugAddress)(address);
            }
            const { nodeOptions: formattedNodeOptions, execArgv } = (0, _utils.formatNodeOptions)(nodeOptions);
            child = (0, _child_process.fork)(startServerPath, {
                stdio: 'inherit',
                execArgv,
                env: {
                    ...defaultEnv,
                    ...isTurbopack ? {
                        TURBOPACK: process.env.TURBOPACK
                    } : undefined,
                    __NEXT_DEV_SERVER: '1',
                    NEXT_PRIVATE_START_TIME: process.env.NEXT_PRIVATE_START_TIME,
                    NEXT_PRIVATE_WORKER: '1',
                    NEXT_PRIVATE_TRACE_ID: _shared.traceId,
                    NEXT_PRIVATE_ENABLED_FEATURES: JSON.stringify(enabledFeatures),
                    NEXT_PRIVATE_DEV_SPAN_ATTRS: JSON.stringify(devSpanAttrs),
                    NODE_EXTRA_CA_CERTS: startServerOptions.selfSignedCertificate ? startServerOptions.selfSignedCertificate.rootCA : defaultEnv.NODE_EXTRA_CA_CERTS,
                    NODE_OPTIONS: formattedNodeOptions,
                    // There is a node.js bug on MacOS which causes closing file watchers to be really slow.
                    // This limits the number of watchers x mitigate the issue.
                    // https://github.com/nodejs/node/issues/29949
                    WATCHPACK_WATCHER_LIMIT: _os.default.platform() === 'darwin' ? '20' : undefined,
                    // Enable CPU profiling if requested
                    ...options.experimentalCpuProf ? {
                        NEXT_CPU_PROF: '1',
                        NEXT_CPU_PROF_DIR: (0, _profilesdir.ensureProfilesDir)(dir),
                        __NEXT_PRIVATE_CPU_PROFILE: 'dev-server'
                    } : undefined,
                    ...process.env.NEXT_TURBOPACK_TRACING ? {
                        NEXT_TURBOPACK_TRACING: process.env.NEXT_TURBOPACK_TRACING
                    } : undefined
                }
            });
            child.on('message', (msg)=>{
                if (msg && typeof msg === 'object') {
                    if (msg.nextWorkerReady) {
                        child == null ? void 0 : child.send({
                            nextWorkerOptions: startServerOptions
                        });
                    } else if (msg.nextServerReady && !resolved) {
                        if (msg.port) {
                            // Store the used port in case a random one was selected, so that
                            // it can be re-used on automatic dev server restarts.
                            port = parseInt(msg.port, 10);
                        }
                        if (msg.distDir) {
                            // Store the distDir from the child process for telemetry and trace uploads.
                            distDir = msg.distDir;
                        }
                        resolved = true;
                        resolve();
                    }
                }
            });
            child.on('exit', async (code, signal)=>{
                if (sessionStopHandled || signal) {
                    return;
                }
                if (code === _utils.RESTART_EXIT_CODE) {
                    // Starting the dev server will overwrite the `.next/trace` file, so we
                    // must upload the existing contents before restarting the server to
                    // preserve the metrics.
                    if (traceUploadUrl && distDir) {
                        (0, _uploadtrace.default)({
                            traceUploadUrl,
                            mode: 'dev',
                            projectDir: dir,
                            distDir,
                            isTurboSession: isTurbopack,
                            sync: true
                        });
                    }
                    // Reset the start time so "Ready in X" reflects the restart
                    // duration, not time since the original process started.
                    process.env.NEXT_PRIVATE_START_TIME = Date.now().toString();
                    return startServer({
                        ...startServerOptions,
                        port
                    });
                }
                // Call handler (e.g. upload telemetry). Don't try to send a signal to
                // the child, as it has already exited.
                await handleSessionStop(/* signal */ null);
            });
        });
    }
    const runDevServer = async (reboot)=>{
        try {
            if (!!options.experimentalHttps) {
                _log.warn('Self-signed certificates are currently an experimental feature, use with caution.');
                let certificate;
                const key = options.experimentalHttpsKey;
                const cert = options.experimentalHttpsCert;
                const rootCA = options.experimentalHttpsCa;
                if (key && cert) {
                    certificate = {
                        key: _path.default.resolve(key),
                        cert: _path.default.resolve(cert),
                        rootCA: rootCA ? _path.default.resolve(rootCA) : undefined
                    };
                } else {
                    certificate = await (0, _mkcert.createSelfSignedCertificate)(host);
                }
                await startServer({
                    ...devServerOptions,
                    selfSignedCertificate: certificate
                });
            } else {
                await startServer(devServerOptions);
            }
            await preflight(reboot);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
    await runDevServer(false);
};
function writeDevState() {
    if (!traceUploadUrl || !dir) return;
    try {
        _nodefs.default.mkdirSync(_path.default.dirname(DEV_STATE_FILE), {
            recursive: true
        });
        let state = {};
        try {
            state = JSON.parse(_nodefs.default.readFileSync(DEV_STATE_FILE, 'utf8'));
        } catch  {
        // File missing or corrupt — start with empty state
        }
        // Eagerly remove entries that are stale (older than threshold) or invalid
        // (future timestamps from clock skew or corruption).
        const now = Date.now();
        const cutoff = now - RAGE_RESTART_THRESHOLD_MS;
        for (const key of Object.keys(state)){
            var _state_key;
            const t = (_state_key = state[key]) == null ? void 0 : _state_key.stopTime;
            if (!t || t < cutoff || t > now) {
                delete state[key];
            }
        }
        // Update current project
        const gitBranch = (0, _git.getGitBranch)(dir);
        state[dir] = {
            stopTime: Date.now(),
            distDirPath: _path.default.join(dir, distDir ?? '.next'),
            ...gitBranch ? {
                gitBranch
            } : {}
        };
        const { sync: writeFileAtomicSync } = require('next/dist/compiled/write-file-atomic');
        writeFileAtomicSync(DEV_STATE_FILE, JSON.stringify(state));
    } catch  {
    // Best effort — don't interfere with shutdown
    }
}

//# sourceMappingURL=next-dev.js.map