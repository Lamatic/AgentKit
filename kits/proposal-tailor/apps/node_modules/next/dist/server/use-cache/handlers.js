"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getCacheHandler: null,
    getCacheHandlerEntries: null,
    getCacheHandlers: null,
    getDevTieredCacheHandler: null,
    getPrivateCacheHandler: null,
    initializeCacheHandlers: null,
    isBuiltInCacheHandler: null,
    isCustomCacheHandler: null,
    isMemoryCacheDisabled: null,
    setCacheHandler: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getCacheHandler: function() {
        return getCacheHandler;
    },
    getCacheHandlerEntries: function() {
        return getCacheHandlerEntries;
    },
    getCacheHandlers: function() {
        return getCacheHandlers;
    },
    getDevTieredCacheHandler: function() {
        return getDevTieredCacheHandler;
    },
    getPrivateCacheHandler: function() {
        return getPrivateCacheHandler;
    },
    initializeCacheHandlers: function() {
        return initializeCacheHandlers;
    },
    isBuiltInCacheHandler: function() {
        return isBuiltInCacheHandler;
    },
    isCustomCacheHandler: function() {
        return isCustomCacheHandler;
    },
    isMemoryCacheDisabled: function() {
        return isMemoryCacheDisabled;
    },
    setCacheHandler: function() {
        return setCacheHandler;
    }
});
const _default = require("../lib/cache-handlers/default");
const _tieredcachehandler = require("./tiered-cache-handler");
const debug = process.env.NEXT_PRIVATE_DEBUG_CACHE ? (message, ...args)=>{
    console.log(`use-cache: ${message}`, ...args);
} : undefined;
const handlersSymbol = Symbol.for('@next/cache-handlers');
const handlersMapSymbol = Symbol.for('@next/cache-handlers-map');
const handlersSetSymbol = Symbol.for('@next/cache-handlers-set');
const privateHandlerSymbol = Symbol.for('@next/cache-handlers-private');
const builtInHandlersSymbol = Symbol.for('@next/cache-handlers-built-in');
const devFrontHandlersSymbol = Symbol.for('@next/cache-handlers-dev-fronts');
const devTieredHandlersSymbol = Symbol.for('@next/cache-handlers-dev-tiered');
const memoryCacheDisabledSymbol = Symbol.for('@next/cache-handlers-memory-disabled');
/**
 * The in-memory size used for the dev-only built-in handlers (the private
 * handler, the size-0 replacement, and the per-kind front handlers for custom
 * kinds). Mirrors the framework default so `cacheMaxMemorySize: 0` does not
 * disable caching in development.
 */ const DEV_MEMORY_CACHE_SIZE = 50 * 1024 * 1024;
/**
 * The reference to the cache handlers. We store the cache handlers on the
 * global object so that we can access the same instance across different
 * boundaries (such as different copies of the same module).
 */ const reference = globalThis;
function initializeCacheHandlers(cacheMaxMemorySize) {
    // If the cache handlers have already been initialized, don't do it again.
    if (reference[handlersMapSymbol]) {
        debug == null ? void 0 : debug('cache handlers already initialized');
        return false;
    }
    debug == null ? void 0 : debug('initializing cache handlers');
    const handlersMap = new Map();
    reference[handlersMapSymbol] = handlersMap;
    const builtInHandlers = new Set();
    reference[builtInHandlersSymbol] = builtInHandlers;
    // In development, `cacheMaxMemorySize: 0` would make the built-in default
    // handler a no-op, so every reload would miss. Use a real in-memory size
    // instead so dev stays fast; the "use cache" wrapper forces a dynamic cache
    // life for this case so it still behaves close to "no cache" (serve stale,
    // regenerate in the background). Production keeps the no-op handler.
    const builtInSize = process.env.__NEXT_DEV_SERVER && cacheMaxMemorySize === 0 ? DEV_MEMORY_CACHE_SIZE : cacheMaxMemorySize;
    // Initialize the cache from the symbol contents first.
    if (reference[handlersSymbol]) {
        let fallback;
        if (reference[handlersSymbol].DefaultCache) {
            debug == null ? void 0 : debug('setting "default" cache handler from symbol');
            fallback = reference[handlersSymbol].DefaultCache;
        } else {
            debug == null ? void 0 : debug('setting "default" cache handler from default');
            fallback = (0, _default.createDefaultCacheHandler)(builtInSize);
            builtInHandlers.add(fallback);
        }
        handlersMap.set('default', fallback);
        if (reference[handlersSymbol].RemoteCache) {
            debug == null ? void 0 : debug('setting "remote" cache handler from symbol');
            handlersMap.set('remote', reference[handlersSymbol].RemoteCache);
        } else {
            debug == null ? void 0 : debug('setting "remote" cache handler from default');
            handlersMap.set('remote', fallback);
        }
    } else {
        const handler = (0, _default.createDefaultCacheHandler)(builtInSize);
        builtInHandlers.add(handler);
        debug == null ? void 0 : debug('setting "default" cache handler from default');
        handlersMap.set('default', handler);
        debug == null ? void 0 : debug('setting "remote" cache handler from default');
        handlersMap.set('remote', handler);
    }
    // Create a set of the cache handlers.
    reference[handlersSetSymbol] = new Set(handlersMap.values());
    // In development we add dedicated built-in in-memory handlers so that reloads
    // are fast. These are always built-in handlers, never a user-configured one,
    // and are gated on the dev server so production behaves exactly as
    // configured.
    if (process.env.__NEXT_DEV_SERVER) {
        reference[memoryCacheDisabledSymbol] = cacheMaxMemorySize === 0;
        // Private caches are persisted here so reloads are fast. Private entries
        // can hold data specific to the incoming request (for example, derived from
        // its cookies or headers), so this is never the user-configured `default`
        // alias. Sized so it still caches under `cacheMaxMemorySize: 0` (otherwise
        // it would become the no-op stub and private reloads would miss).
        reference[privateHandlerSymbol] = (0, _default.createDefaultCacheHandler)(DEV_MEMORY_CACHE_SIZE);
        // Built-in front handlers, one per custom kind, and the tiered handlers
        // that place a front in front of a (possibly slow or remote) backing
        // handler so cache hits resolve in a microtask, are both created per kind
        // in `setCacheHandler`.
        reference[devFrontHandlersSymbol] = new Map();
        reference[devTieredHandlersSymbol] = new Map();
    }
    return true;
}
function getCacheHandler(kind) {
    // This should never be called before initializeCacheHandlers.
    if (!reference[handlersMapSymbol]) {
        throw Object.defineProperty(new Error('Cache handlers not initialized'), "__NEXT_ERROR_CODE", {
            value: "E649",
            enumerable: false,
            configurable: true
        });
    }
    return reference[handlersMapSymbol].get(kind);
}
function getPrivateCacheHandler() {
    // This should never be called before initializeCacheHandlers.
    if (!reference[handlersMapSymbol]) {
        throw Object.defineProperty(new Error('Cache handlers not initialized'), "__NEXT_ERROR_CODE", {
            value: "E649",
            enumerable: false,
            configurable: true
        });
    }
    return reference[privateHandlerSymbol];
}
function isMemoryCacheDisabled() {
    return reference[memoryCacheDisabledSymbol] ?? false;
}
function isCustomCacheHandler(kind) {
    var _reference_devFrontHandlersSymbol;
    if (!process.env.__NEXT_DEV_SERVER) {
        return false;
    }
    return ((_reference_devFrontHandlersSymbol = reference[devFrontHandlersSymbol]) == null ? void 0 : _reference_devFrontHandlersSymbol.has(kind)) ?? false;
}
function isBuiltInCacheHandler(kind) {
    var _reference_handlersMapSymbol, _reference_builtInHandlersSymbol;
    const handler = (_reference_handlersMapSymbol = reference[handlersMapSymbol]) == null ? void 0 : _reference_handlersMapSymbol.get(kind);
    return handler !== undefined && Boolean((_reference_builtInHandlersSymbol = reference[builtInHandlersSymbol]) == null ? void 0 : _reference_builtInHandlersSymbol.has(handler));
}
function getDevTieredCacheHandler(kind) {
    var _reference_devTieredHandlersSymbol;
    if (!process.env.__NEXT_DEV_SERVER) {
        return undefined;
    }
    return (_reference_devTieredHandlersSymbol = reference[devTieredHandlersSymbol]) == null ? void 0 : _reference_devTieredHandlersSymbol.get(kind);
}
function getCacheHandlers() {
    const handlersSet = reference[handlersSetSymbol];
    if (!handlersSet) {
        return undefined;
    }
    if (process.env.__NEXT_DEV_SERVER) {
        return iterateCacheHandlersWithDevBuiltIns(handlersSet);
    }
    return handlersSet.values();
}
/**
 * Yields the registered handlers plus the dev-only built-in handlers (the
 * private handler and the per-kind front handlers). The built-in handlers are
 * not part of the registered set, but tag operations must still reach them:
 * their `updateTags` writes the shared tags manifest that their `get` consults,
 * so `revalidateTag` can invalidate their entries.
 */ function* iterateCacheHandlersWithDevBuiltIns(handlersSet) {
    yield* handlersSet;
    const privateHandler = reference[privateHandlerSymbol];
    if (privateHandler) {
        yield privateHandler;
    }
    const devFrontHandlers = reference[devFrontHandlersSymbol];
    if (devFrontHandlers) {
        yield* devFrontHandlers.values();
    }
}
function getCacheHandlerEntries() {
    const handlersMap = reference[handlersMapSymbol];
    if (!handlersMap) {
        return undefined;
    }
    if (process.env.__NEXT_DEV_SERVER) {
        return iterateCacheHandlerEntriesWithDevBuiltIns(handlersMap);
    }
    return handlersMap.entries();
}
/**
 * Yields the registered entries plus the dev-only private handler under its
 * kind, so that per-kind tag operations (`refreshTags` / `getExpiration` for
 * implicit tags) apply to private entries. Custom-kind front handlers are
 * intentionally omitted: the backing handler (already in the map) is
 * authoritative for that kind's `getExpiration`, and a front entry is discarded
 * via that same value.
 */ function* iterateCacheHandlerEntriesWithDevBuiltIns(handlersMap) {
    yield* handlersMap.entries();
    const privateHandler = reference[privateHandlerSymbol];
    if (privateHandler) {
        const privateEntry = [
            'private',
            privateHandler
        ];
        yield privateEntry;
    }
}
function setCacheHandler(kind, cacheHandler) {
    // This should never be called before initializeCacheHandlers.
    if (!reference[handlersMapSymbol] || !reference[handlersSetSymbol]) {
        throw Object.defineProperty(new Error('Cache handlers not initialized'), "__NEXT_ERROR_CODE", {
            value: "E649",
            enumerable: false,
            configurable: true
        });
    }
    debug == null ? void 0 : debug('setting cache handler for "%s"', kind);
    reference[handlersMapSymbol].set(kind, cacheHandler);
    reference[handlersSetSymbol].add(cacheHandler);
    // A user-configured handler may be slow or remote. In development, give it a
    // dedicated built-in in-memory front handler so cache hits resolve in a
    // microtask, and pair the two into a tiered handler the wrapper reads
    // through. Both are created alongside registration so their lifecycle matches
    // the backing handler's, and the front handler's presence is the signal that
    // this kind is backed by a real handler (see `isCustomCacheHandler`). Being a
    // built-in default handler, the front inherits the dev minimum retention, so
    // a short-`expire` value still hits the front instead of falling through to
    // the slow backing on every read.
    if (process.env.__NEXT_DEV_SERVER) {
        var _reference_devFrontHandlersSymbol, _reference_devTieredHandlersSymbol;
        const frontHandler = (0, _default.createDefaultCacheHandler)(DEV_MEMORY_CACHE_SIZE);
        (_reference_devFrontHandlersSymbol = reference[devFrontHandlersSymbol]) == null ? void 0 : _reference_devFrontHandlersSymbol.set(kind, frontHandler);
        (_reference_devTieredHandlersSymbol = reference[devTieredHandlersSymbol]) == null ? void 0 : _reference_devTieredHandlersSymbol.set(kind, (0, _tieredcachehandler.createTieredCacheHandler)(frontHandler, cacheHandler));
    }
}

//# sourceMappingURL=handlers.js.map