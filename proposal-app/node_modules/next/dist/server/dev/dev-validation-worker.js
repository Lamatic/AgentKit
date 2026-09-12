"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    applyHmrUpdate: null,
    invalidateCaches: null,
    runDevValidation: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    applyHmrUpdate: function() {
        return applyHmrUpdate;
    },
    invalidateCaches: function() {
        return invalidateCaches;
    },
    runDevValidation: function() {
        return runDevValidation;
    }
});
require("../require-hook");
require("../node-environment");
const _path = require("path");
const _fs = require("fs");
const _url = require("url");
const _installbindings = require("../../build/swc/install-bindings");
const _installcodeframe = require("../lib/install-code-frame");
const _loadcomponents = require("../load-components");
const _setuphttpagentenv = require("../setup-http-agent-env");
const _devvalidationerrordelivery = require("../app-render/dev-validation-error-delivery");
const _devvalidationevents = require("../app-render/dev-validation-events");
const _loadmanifestexternal = require("../load-manifest.external");
const _requirecache = require("./require-cache");
const _manifestssingleton = require("../app-render/manifests-singleton");
const _patcherrorinspect = require("../patch-error-inspect");
/**
 * Resolves a chunk's source map by reading the `.map` file the bundler emitted
 * next to it, for chunks inside `distDir`.
 *
 * The main thread answers the same question through the Turbopack project
 * handle, which cannot cross a thread boundary. Reading from disk is
 * project-free and, more importantly, does not depend on the chunk having been
 * evaluated in this thread: Node.js caches source maps per isolate, and the
 * worker never renders server components, so it holds maps only for the chunks
 * `loadComponents` pulled in. Frames arriving in the transported payload can
 * point at any chunk the main render touched.
 *
 * Reading from disk covers the chunks, because the worker only runs under
 * Turbopack (see `next-dev-server.ts`), which writes a `.map` beside every one
 * of them. A module the server updated in place has no chunk of its own and is
 * covered instead by this thread applying the same update (see
 * `applyHmrUpdate`), which leaves its inline map in Node.js' cache here. Frames
 * from dependencies that are not bundled never reach this point, because
 * `filterStackFrameDEV` drops `node_modules` and `node:` frames; bundled
 * dependencies appear as chunks inside `distDir` like any other code.
 */ function createDiskSourceMapLookup(distDir) {
    // The frames carry resolved paths, so compare against the resolved `distDir`
    // to keep the containment check meaningful when the project sits behind a
    // symlink.
    let canonicalDistDir = distDir;
    try {
        canonicalDistDir = (0, _fs.realpathSync)(distDir);
    } catch  {}
    const payloads = new Map();
    return function findSourceMapPayloadOnDisk(sourceURL) {
        let chunkPath = sourceURL;
        if (chunkPath.startsWith('file://')) {
            try {
                chunkPath = (0, _url.fileURLToPath)(chunkPath);
            } catch  {
                return undefined;
            }
        }
        if (!(0, _path.isAbsolute)(chunkPath)) {
            // Not an emitted chunk, e.g. `<anonymous>`.
            return undefined;
        }
        const cached = payloads.get(chunkPath);
        if (cached !== undefined || payloads.has(chunkPath)) {
            return cached;
        }
        let payload;
        const relativePath = (0, _path.relative)(canonicalDistDir, chunkPath);
        // Only chunks emitted into `distDir` have a source map to point at, and
        // this keeps the lookup from reading arbitrary paths off disk.
        if (!relativePath.startsWith('..') && !(0, _path.isAbsolute)(relativePath)) {
            try {
                payload = JSON.parse((0, _fs.readFileSync)(chunkPath + '.map', 'utf8'));
            } catch  {
                payload = undefined;
            }
        }
        payloads.set(chunkPath, payload);
        return payload;
    };
}
// Match the main dev server (`next-dev-server.ts`), which raises this so the
// server captures deeper stacks. React's owner-stack capture during the
// validation prerenders depends on it, so without it the worker's errors lose
// their owner-stack source attribution.
try {
    Error.stackTraceLimit = 50;
} catch  {}
// The lifecycle markers E2E tests read from the CLI. Emitted on the worker's
// stdout (piped to the parent) so they interleave with the parent's captured
// output the same way the in-process `runWithDevValidationLogging` markers do.
// Gated on the same test env that path checks.
const isTestLoggingEnabled = !!(process.env.__NEXT_TEST_MODE && process.env.NEXT_TEST_LOG_VALIDATION);
/**
 * Adapts the pool's supersede flag into an `AbortSignal` the validation passes
 * check at their depth/yield boundaries. The pool shares an `Int32Array`-backed
 * `SharedArrayBuffer` whose first slot the main thread flips to non-zero (with
 * `Atomics.store` + `Atomics.notify`) when a newer navigation supersedes this
 * one. We wait for that notification with `Atomics.waitAsync`, which is
 * event-driven rather than polled. A validation that finishes without being
 * superseded calls `cleanup()`, which wakes our own still-pending wait so it
 * leaves no waiter (and no retained buffer) behind.
 */ function createSupersedeSignal(abortBuffer) {
    const controller = new AbortController();
    const flag = new Int32Array(abortBuffer);
    if (Atomics.load(flag, 0) !== 0) {
        controller.abort();
        return {
            signal: controller.signal,
            cleanup: ()=>{}
        };
    }
    let settled = false;
    const wait = Atomics.waitAsync(flag, 0, 0);
    if (wait.async) {
        wait.value.then(()=>{
            if (settled) {
                return;
            }
            settled = true;
            // Woken either by a real supersede or by `cleanup()`; only the former
            // leaves the flag set.
            if (Atomics.load(flag, 0) !== 0) {
                controller.abort();
            }
        });
    } else if (Atomics.load(flag, 0) !== 0) {
        // The flag flipped between the load above and the wait.
        controller.abort();
    }
    return {
        signal: controller.signal,
        cleanup: ()=>{
            if (!settled) {
                Atomics.notify(flag, 0);
            }
        }
    };
}
/**
 * Waits out the test-only validation delay, resolving early if the render is
 * superseded. Mirrors the delay in `runWithDevValidationLogging` so scheduler
 * tests observe the same in-flight window on the worker path.
 */ async function applyTestValidationDelay(signal) {
    const delayMs = Number(process.env.NEXT_TEST_DEV_VALIDATION_DELAY_MS);
    if (!Number.isFinite(delayMs) || delayMs <= 0 || signal.aborted) {
        return;
    }
    await new Promise((resolve)=>{
        const finishDelay = ()=>{
            clearTimeout(timeout);
            signal.removeEventListener('abort', finishDelay);
            resolve();
        };
        const timeout = setTimeout(finishDelay, delayMs);
        signal.addEventListener('abort', finishDelay, {
            once: true
        });
    });
}
/**
 * Registers the client reference manifests of the pages that supplied client
 * references to the render being validated, beyond the validated route's own
 * manifest. This thread has its own manifests singleton, which `loadComponents`
 * seeds with only the validated route, so without these the dev-only cross-page
 * lookup in `createProxiedClientReferenceManifest` has no other manifest to
 * search and decoding the transported payload fails. Usually a no-op, since the
 * main thread only records a page when React's I/O tracking actually carried a
 * reference across pages.
 */ async function registerAdditionalClientReferenceManifests(distDir, pages) {
    if (pages.length === 0) {
        return;
    }
    // Set by `loadComponents`. One server actions manifest covers the whole app,
    // so the pages registered here share the validated route's.
    const serverActionsManifest = (0, _manifestssingleton.getServerActionsManifest)();
    await Promise.all(pages.map(async (page)=>{
        const clientReferenceManifest = await (0, _loadcomponents.loadClientReferenceManifestForPage)(distDir, page);
        if (clientReferenceManifest) {
            (0, _manifestssingleton.setManifestsSingleton)({
                page,
                clientReferenceManifest,
                serverActionsManifest
            });
        }
    }));
}
async function applyHmrUpdate(update) {
    if (typeof __turbopack_server_hmr_apply__ !== 'function') {
        return 'no-runtime';
    }
    try {
        __turbopack_server_hmr_apply__(update);
    } catch  {
        // The dev server responds to the same failure by re-evaluating every
        // module from disk. This thread cannot be repaired in place either, so the
        // caller drops it.
        return 'failed';
    }
    return 'applied';
}
async function invalidateCaches(filePaths, evictModules) {
    if (evictModules) {
        (0, _requirecache.deleteCache)(filePaths);
        return;
    }
    for (const filePath of filePaths){
        (0, _loadmanifestexternal.clearManifestCache)(filePath);
    }
}
async function runDevValidation(message, abortBuffer) {
    // Load the native SWC bindings and wire the code-frame renderer so the errors
    // logged below render with a source-mapped code frame, matching the
    // in-process dev output (the E2E tests snapshot the CLI text between the
    // validation markers). The `build/swc` graph these pull in is bundled as a
    // runtime external (see `next-runtime.webpack-config.js`), so it resolves
    // from the installed `next/dist` tree rather than being compiled into this
    // worker bundle, the same way the unbundled build worker loads it.
    await (0, _installbindings.installBindings)();
    (0, _installcodeframe.installCodeFrameSupport)();
    (0, _patcherrorinspect.setBundlerFindSourceMapImplementation)(createDiskSourceMapLookup(message.distDir));
    (0, _setuphttpagentenv.setHttpClientAndAgentOptions)({
        httpAgentOptions: message.nextConfigSerializable.httpAgentOptions
    });
    // Populates the manifests singleton for the route via `setManifestsSingleton`
    // inside `loadComponents`, exactly as a real request does. The pool tears the
    // worker down on HMR / route recompile so the next validation reloads from a
    // clean require cache.
    const { ComponentMod } = await (0, _loadcomponents.loadComponents)({
        distDir: message.distDir,
        page: message.page,
        isAppPath: true,
        isDev: true,
        sriEnabled: false,
        needsManifestsForLegacyReasons: true
    });
    await registerAdditionalClientReferenceManifests(message.distDir, message.additionalClientReferenceManifestPages);
    const { signal, cleanup } = createSupersedeSignal(abortBuffer);
    if (isTestLoggingEnabled) {
        console.log((0, _devvalidationevents.formatValidationEvent)({
            type: 'validation_start',
            requestId: message.requestId,
            url: message.request.urlPathname + message.request.urlSearch,
            responseFinished: message.responseFinished
        }));
    }
    try {
        if (isTestLoggingEnabled) {
            await applyTestValidationDelay(signal);
        }
        if (signal.aborted) {
            return null;
        }
        // Crossing into the app-page bundle: the entire validation runs there, so
        // the client prerenders use the same React the user's client components
        // resolve through `ComponentMod`.
        const validationErrors = await ComponentMod.routeModule.runValidationInDev(ComponentMod, message, signal);
        if (validationErrors === undefined || signal.aborted) {
            return null;
        }
        const errors = [];
        for (const validationError of validationErrors){
            // Log to the worker's stderr; `node-environment` +
            // `installCodeFrameSupport` render the source-mapped stack and code frame
            // there, matching the in-process CLI output.
            console.error(validationError);
            if (validationError instanceof Error) {
                errors.push(validationError);
            }
        }
        if (errors.length === 0) {
            return null;
        }
        return await (0, _devvalidationerrordelivery.serializeValidationErrorsToFlight)(ComponentMod, errors);
    } finally{
        cleanup();
        if (isTestLoggingEnabled) {
            console.log((0, _devvalidationevents.formatValidationEvent)({
                type: signal.aborted ? 'validation_aborted' : 'validation_end',
                requestId: message.requestId,
                url: message.request.urlPathname + message.request.urlSearch
            }));
        }
    }
}

//# sourceMappingURL=dev-validation-worker.js.map