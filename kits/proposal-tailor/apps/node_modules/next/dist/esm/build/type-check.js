import * as Log from './output/log';
import { Worker } from '../lib/worker';
import createSpinner from './spinner';
import { eventTypeCheckCompleted } from '../telemetry/events';
import isError from '../lib/is-error';
import { hrtimeDurationToString } from './duration-to-string';
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
        typeCheckWorker = new Worker(require.resolve('../lib/verify-typescript-setup'), {
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
export async function startTypeChecking({ cacheDir, config, dir, nextBuildSpan, pagesDir, telemetry, appDir, debugBuildPaths }) {
    const ignoreTypeScriptErrors = Boolean(config.typescript.ignoreBuildErrors);
    const useTypeScriptCli = Boolean(config.experimental.useTypeScriptCli);
    if (ignoreTypeScriptErrors) {
        Log.info('Skipping validation of types');
    }
    let typeCheckingSpinnerPrefixText;
    let typeCheckingSpinner;
    if (!ignoreTypeScriptErrors) {
        typeCheckingSpinnerPrefixText = 'Running TypeScript';
    }
    if (typeCheckingSpinnerPrefixText) {
        typeCheckingSpinner = createSpinner(typeCheckingSpinnerPrefixText);
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
        (_createSpinner = createSpinner(`Finished TypeScript${ignoreTypeScriptErrors ? ' config validation' : ''} in ${hrtimeDurationToString(typeCheckEnd)}`)) == null ? void 0 : _createSpinner.stopAndPersist();
        if (!ignoreTypeScriptErrors && verifyResult) {
            var _verifyResult_result, _verifyResult_result1, _verifyResult_result2;
            telemetry.record(eventTypeCheckCompleted({
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
        if (isError(err) && err.message === 'Call retries were exceeded') {
            await telemetry.flush();
            process.exit(1);
        }
        throw err;
    }
}

//# sourceMappingURL=type-check.js.map