"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    NestedDynamicUseCacheError: null,
    UseCacheDeadlockError: null,
    UseCacheTimeoutError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    NestedDynamicUseCacheError: function() {
        return NestedDynamicUseCacheError;
    },
    UseCacheDeadlockError: function() {
        return UseCacheDeadlockError;
    },
    UseCacheTimeoutError: function() {
        return UseCacheTimeoutError;
    }
});
class UseCacheTimeoutError extends Error {
    constructor(){
        super('Filling a cache during prerender timed out, likely because request-specific arguments such as params, searchParams, cookies() or dynamic data were used inside "use cache".');
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E236",
            enumerable: false,
            configurable: true
        });
    }
}
class UseCacheDeadlockError extends Error {
    constructor(){
        super('Filling a "use cache" entry appears to be stuck on shared state from the outer render scope. The same function completed when run in isolation, which usually means a module-scoped value (for example a top-level Map used to dedupe fetches) is joining a promise created outside the cache. "use cache" already dedupes calls with the same arguments — within a request and across requests on the same server instance — so the surrounding dedupe layer is both unnecessary and the likely cause. Remove it and rely on "use cache" alone for deduping.');
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E1181",
            enumerable: false,
            configurable: true
        });
    }
}
class NestedDynamicUseCacheError extends Error {
    constructor(){
        super('This "use cache" has a dynamic cache life that was propagated to its parent.');
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E1243",
            enumerable: false,
            configurable: true
        });
        this.name = 'Nested dynamic "use cache"';
    }
}

//# sourceMappingURL=use-cache-errors.js.map