"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cacheLife", {
    enumerable: true,
    get: function() {
        return cacheLife;
    }
});
const _workasyncstorageexternal = require("../app-render/work-async-storage.external");
const _workunitasyncstorageexternal = require("../app-render/work-unit-async-storage.external");
const _cachelifeprofile = require("./cache-life-profile");
function cacheLife(profile) {
    if (!process.env.__NEXT_USE_CACHE) {
        throw Object.defineProperty(new Error('`cacheLife()` is only available with the `cacheComponents` config.'), "__NEXT_ERROR_CODE", {
            value: "E887",
            enumerable: false,
            configurable: true
        });
    }
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    switch(workUnitStore == null ? void 0 : workUnitStore.type){
        case 'prerender':
        case 'prerender-client':
        case 'validation-client':
        case 'prerender-runtime':
        case 'prerender-ppr':
        case 'prerender-legacy':
        case 'request':
        case 'unstable-cache':
        case 'generate-static-params':
        case undefined:
            throw Object.defineProperty(new Error('`cacheLife()` can only be called inside a "use cache" function.'), "__NEXT_ERROR_CODE", {
                value: "E818",
                enumerable: false,
                configurable: true
            });
        case 'cache':
        case 'private-cache':
            break;
        default:
            workUnitStore;
    }
    if (typeof profile === 'string') {
        const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
        if (!workStore) {
            throw Object.defineProperty(new Error('`cacheLife()` can only be called during App Router rendering at the moment.'), "__NEXT_ERROR_CODE", {
                value: "E820",
                enumerable: false,
                configurable: true
            });
        }
        // TODO: This should be globally available and not require an AsyncLocalStorage.
        const configuredProfile = workStore.cacheLifeProfiles[profile];
        if (configuredProfile === undefined) {
            if (workStore.cacheLifeProfiles[profile.trim()]) {
                throw Object.defineProperty(new Error(`Unknown \`cacheLife()\` profile "${profile}" is not configured in next.config.js\n` + `Did you mean "${profile.trim()}" without the spaces?`), "__NEXT_ERROR_CODE", {
                    value: "E816",
                    enumerable: false,
                    configurable: true
                });
            }
            throw Object.defineProperty(new Error(`Unknown \`cacheLife()\` profile "${profile}" is not configured in next.config.js\n` + 'module.exports = {\n' + '  cacheLife: {\n' + `    "${profile}": ...\n` + '  }\n' + '}'), "__NEXT_ERROR_CODE", {
                value: "E888",
                enumerable: false,
                configurable: true
            });
        }
        profile = configuredProfile;
    } else if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
        throw Object.defineProperty(new Error('Invalid `cacheLife()` option. Either pass a profile name or object.'), "__NEXT_ERROR_CODE", {
            value: "E814",
            enumerable: false,
            configurable: true
        });
    } else {
        profile = (0, _cachelifeprofile.validateAndNormalizeCacheLifeProfile)(profile, {
            kind: 'inline'
        });
    }
    if (profile.revalidate !== undefined) {
        // Track the explicit revalidate time.
        if (workUnitStore.explicitRevalidate === undefined || workUnitStore.explicitRevalidate > profile.revalidate) {
            workUnitStore.explicitRevalidate = profile.revalidate;
        }
    }
    if (profile.expire !== undefined) {
        // Track the explicit expire time.
        if (workUnitStore.explicitExpire === undefined || workUnitStore.explicitExpire > profile.expire) {
            workUnitStore.explicitExpire = profile.expire;
        }
    }
    if (profile.stale !== undefined) {
        // Track the explicit stale time.
        if (workUnitStore.explicitStale === undefined || workUnitStore.explicitStale > profile.stale) {
            workUnitStore.explicitStale = profile.stale;
        }
    }
}

//# sourceMappingURL=cache-life.js.map