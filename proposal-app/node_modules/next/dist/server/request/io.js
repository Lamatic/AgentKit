"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "io", {
    enumerable: true,
    get: function() {
        return io;
    }
});
const _workasyncstorageexternal = require("../app-render/work-async-storage.external");
const _workunitasyncstorageexternal = require("../app-render/work-unit-async-storage.external");
const _dynamicrenderingutils = require("../dynamic-rendering-utils");
const _stagedrendering = require("../app-render/staged-rendering");
const _pprremovederror = require("../../shared/lib/ppr-removed-error");
const _utils = require("./utils");
// A fulfilled thenable that React can unwrap synchronously via `use()` without
// ever suspending. Reusing a single instance avoids allocating on every call.
const resolvedIOPromise = Promise.resolve(undefined);
resolvedIOPromise.status = 'fulfilled';
resolvedIOPromise.value = undefined;
function io() {
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (workStore && workUnitStore) {
        if (workUnitStore && !(0, _utils.isRequestApiAllowedInCurrentPhase)(workUnitStore)) {
            throw Object.defineProperty(new Error(`Route ${workStore.route} used \`io()\` inside \`after()\` while rendering. The \`io()\` function is not allowed in this scope. See more info here: https://nextjs.org/docs/app/api-reference/functions/after`), "__NEXT_ERROR_CODE", {
                value: "E1380",
                enumerable: false,
                configurable: true
            });
        }
        switch(workUnitStore.type){
            case 'request':
                // For dev renders we instrument the promise so it will show up in
                // React Suspense Devtools and, if also doing `instant` validation,
                // ensure it resolves in the right stage for staged rendering
                // In production we just let it resolve immediately because we're doing
                // a dynamic SSR or resume render and have no need to delay anything
                // after this call
                if (process.env.NODE_ENV === 'development') {
                    if (workUnitStore.asyncApiPromises) {
                        return workUnitStore.asyncApiPromises.io;
                    }
                    return (0, _dynamicrenderingutils.makeDevtoolsIOAwarePromise)(undefined, workUnitStore, _stagedrendering.RenderStage.Dynamic);
                } else if (workUnitStore.asyncApiPromises) {
                    return workUnitStore.asyncApiPromises.io;
                }
                return resolvedIOPromise;
            case 'prerender':
            case 'prerender-client':
            case 'prerender-runtime':
                // When prerendering with Cache Components we consider `io()` to be
                // actual IO if not in a cache scope and we can avoid actually executing
                // anything after it by making it return a hanging promise.
                return (0, _dynamicrenderingutils.makeDynamicHangingPromise)(workUnitStore.renderSignal, workStore.route, '`io()`');
            case 'prerender-ppr':
                // Dead code to be removed when we eliminate legacy ppr code
                (0, _pprremovederror.throwPrerenderPPRRemovedError)();
                break;
            case 'cache':
            case 'private-cache':
            case 'unstable-cache':
            // Inside cache scopes, io() resolves immediately.
            // Caches can contain IO-dependent code like new Date() — it will
            // simply return the value at cache-fill time.
            // ...
            // intentional fallthrough
            case 'generate-static-params':
            // generateStaticParams runs at build time. There is no prerender
            // to stall so we resolve immediately.
            // ...
            // intentional fallthrough
            case 'validation-client':
            // io() is usable in client components, resolve immediately.
            // The reason we take this position is most io shielding you would do
            // in a browser is for sync IO as there aren't many non-fetch based IO
            // operations you can do in the browser that have meaningful latency.
            // So while you might use
            // ...
            // intentional fallthrough
            case 'prerender-legacy':
                // Without cache components, IO is not inherently dynamic.
                // Resolve immediately rather than interrupting static generation.
                return resolvedIOPromise;
            default:
                workUnitStore;
        }
    }
    // No work store — we're outside the Next.js rendering context (e.g. in
    // a client component on the browser or in a standalone script). Resolve
    // immediately.
    return resolvedIOPromise;
}

//# sourceMappingURL=io.js.map