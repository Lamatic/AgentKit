"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startTypeChecking", {
    enumerable: true,
    get: function() {
        return startTypeChecking;
    }
});
const _log = /*#__PURE__*/ _interop_require_wildcard(require("./output/log"));
const _worker = require("../lib/worker");
const _spinner = /*#__PURE__*/ _interop_require_default(require("./spinner"));
const _events = require("../telemetry/events");
const _iserror = /*#__PURE__*/ _interop_require_default(require("../lib/is-error"));
const _durationtostring = require("./duration-to-string");
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
 * TypeScript setup and type checking run in a worker so the compiler's memory
 * can be released before the rest of the build continues.
 *
 * Since it is impossible to pass a function from main thread to a worker,
 * instead of running "next/lib/typescript/runTypeCheck" in a worker,
 * we will run entire "next/lib/verify-typescript-setup" in a worker instead.
 */ function verifyAndRunTypeScript(dir, distDir, strictRouteTypes, shouldRunTypeCheck, tsconfigPath, typedRoutes, disableStaticImages, cacheDir, enableWorkerThreads, hasAppDir, hasPagesDir, appDir, pagesDir, debugBuildPaths, useTypeScriptCli, onFirstCliOutput) {
    let impl;
    let typeCheckWorker;
    if (shouldRunTypeCheck && !useTypeScriptCli) {
        typeCheckWorker = new _worker.Worker(require.resolve('../lib/verify-typescript-setup'), {
            exposedMethods: [
                'verifyAndRunTypeScriptInWorker'
            ],
            debuggerPortOffset: -1,
            isolatedMemory: false,
            numWorkers: 1,
            enableWorkerThreads,
            maxRetries: 0
        });
        impl = typeCheckWorker.verifyAndRunTypeScriptInWorker;
    } else {
        // No worker: either we are not type-checking (just writing setup files), or
        // the CLI checker runs `tsc` in-process. Avoid the worker overhead.
        impl = require('../lib/verify-typescript-setup').verifyAndRunTypeScript;
    }
    return impl({
        dir,
        distDir,
        strictRouteTypes,
        shouldRunTypeCheck,
        tsconfigPath,
        typedRoutes,
        disableStaticImages,
        cacheDir,
        hasAppDir,
        hasPagesDir,
        appDir,
        pagesDir,
        debugBuildPaths,
        useTypeScriptCli,
        onFirstCliOutput
    }).then((result)=>{
        typeCheckWorker == null ? void 0 : typeCheckWorker.end();
        return result;
    }).catch(()=>{
        // The error is already logged (in the worker for the API checker, or
        // directly for the in-process CLI checker); we simply exit to prevent the
        // `Jest worker encountered 1 child process exceptions, exceeding retry
        // limit` message from showing up.
        process.exit(1);
    });
}
async function startTypeChecking({ cacheDir, config, dir, nextBuildSpan, pagesDir, telemetry, appDir, debugBuildPaths }) {
    const ignoreTypeScriptErrors = Boolean(config.typescript.ignoreBuildErrors);
    const useTypeScriptCli = Boolean(config.experimental.useTypeScriptCli);
    if (ignoreTypeScriptErrors) {
        _log.info('Skipping validation of types');
    }
    let typeCheckingSpinnerPrefixText;
    let typeCheckingSpinner;
    if (!ignoreTypeScriptErrors) {
        typeCheckingSpinnerPrefixText = 'Running TypeScript';
    }
    if (typeCheckingSpinnerPrefixText) {
        typeCheckingSpinner = (0, _spinner.default)(typeCheckingSpinnerPrefixText);
    }
    const typeCheckAndLintStart = process.hrtime();
    try {
        var _createSpinner;
        const [verifyResult, typeCheckEnd] = await nextBuildSpan.traceChild('run-typescript').traceAsyncFn(()=>verifyAndRunTypeScript(dir, config.distDir, Boolean(config.experimental.strictRouteTypes), !ignoreTypeScriptErrors, config.typescript.tsconfigPath, Boolean(config.typedRoutes), config.images.disableStaticImages, cacheDir, config.experimental.workerThreads, !!appDir, !!pagesDir, appDir, pagesDir, debugBuildPaths, useTypeScriptCli, // Stop the spinner before as soon as the subprocess reports output.
            useTypeScriptCli && typeCheckingSpinner ? ()=>typeCheckingSpinner.stop() : undefined).then((resolved)=>{
                const checkEnd = process.hrtime(typeCheckAndLintStart);
                return [
                    resolved,
                    checkEnd
                ];
            }));
        if (typeCheckingSpinner) {
            typeCheckingSpinner.stop();
        }
        (_createSpinner = (0, _spinner.default)(`Finished TypeScript${ignoreTypeScriptErrors ? ' config validation' : ''} in ${(0, _durationtostring.hrtimeDurationToString)(typeCheckEnd)}`)) == null ? void 0 : _createSpinner.stopAndPersist();
        if (!ignoreTypeScriptErrors && verifyResult) {
            var _verifyResult_result, _verifyResult_result1, _verifyResult_result2;
            telemetry.record((0, _events.eventTypeCheckCompleted)({
                durationInSeconds: typeCheckEnd[0],
                typescriptVersion: verifyResult.version,
                inputFilesCount: (_verifyResult_result = verifyResult.result) == null ? void 0 : _verifyResult_result.inputFilesCount,
                totalFilesCount: (_verifyResult_result1 = verifyResult.result) == null ? void 0 : _verifyResult_result1.totalFilesCount,
                incremental: (_verifyResult_result2 = verifyResult.result) == null ? void 0 : _verifyResult_result2.incremental,
                typeCheckMode: verifyResult.typeCheckMode
            }));
        }
    } catch (err) {
        // prevent showing jest-worker internal error as it
        // isn't helpful for users and clutters output
        if ((0, _iserror.default)(err) && err.message === 'Call retries were exceeded') {
            await telemetry.flush();
            process.exit(1);
        }
        throw err;
    }
}

//# sourceMappingURL=type-check.js.map