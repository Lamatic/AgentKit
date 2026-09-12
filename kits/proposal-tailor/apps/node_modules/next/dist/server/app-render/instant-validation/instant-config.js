"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    anySegmentHasPartialPrefetchingEnabled: null,
    anySegmentNeedsInstantValidationInBuild: null,
    anySegmentNeedsInstantValidationInDev: null,
    isFrameworkErrorRoute: null,
    isImplicitValidationSegment: null,
    isPageAllowedToBlock: null,
    resolveInstantConfigSamplesForPage: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    anySegmentHasPartialPrefetchingEnabled: function() {
        return anySegmentHasPartialPrefetchingEnabled;
    },
    anySegmentNeedsInstantValidationInBuild: function() {
        return anySegmentNeedsInstantValidationInBuild;
    },
    anySegmentNeedsInstantValidationInDev: function() {
        return anySegmentNeedsInstantValidationInDev;
    },
    isFrameworkErrorRoute: function() {
        return isFrameworkErrorRoute;
    },
    isImplicitValidationSegment: function() {
        return isImplicitValidationSegment;
    },
    isPageAllowedToBlock: function() {
        return isPageAllowedToBlock;
    },
    resolveInstantConfigSamplesForPage: function() {
        return resolveInstantConfigSamplesForPage;
    }
});
const _appdirmodule = require("../../lib/app-dir-module");
const _parseloadertree = require("../../../shared/lib/router/utils/parse-loader-tree");
const _segment = require("../../../shared/lib/segment");
const _entryconstants = require("../../../shared/lib/entry-constants");
const _workasyncstorageexternal = require("../work-async-storage.external");
const _invarianterror = require("../../../shared/lib/invariant-error");
function isImplicitValidationSegment(segment) {
    const key = typeof segment === 'string' ? segment : segment[0];
    return key === _segment.PAGE_SEGMENT_KEY || key.startsWith(_segment.PAGE_SEGMENT_KEY) || key === _segment.DEFAULT_SEGMENT_KEY;
}
function isFrameworkErrorRoute(route) {
    return route === _entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE || route === _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE;
}
async function anySegmentHasPartialPrefetchingEnabled(tree) {
    const { mod: layoutOrPageMod } = await (0, _appdirmodule.getLayoutOrPageModule)(tree);
    // TODO(restart-on-cache-miss): Does this work correctly for client page/layout modules?
    const prefetchConfig = layoutOrPageMod ? layoutOrPageMod.prefetch : undefined;
    if (prefetchConfig === 'partial' || prefetchConfig === 'unstable_eager') {
        return true;
    }
    const { parallelRoutes } = (0, _parseloadertree.parseLoaderTree)(tree);
    for(const parallelRouteKey in parallelRoutes){
        const parallelRoute = parallelRoutes[parallelRouteKey];
        const hasChildPartialPrefetching = await anySegmentHasPartialPrefetchingEnabled(parallelRoute);
        if (hasChildPartialPrefetching) {
            return true;
        }
    }
    return false;
}
async function isPageAllowedToBlock(tree) {
    const { mod: layoutOrPageMod } = await (0, _appdirmodule.getLayoutOrPageModule)(tree);
    // TODO(restart-on-cache-miss): Does this work correctly for client page/layout modules?
    const instantConfig = layoutOrPageMod ? layoutOrPageMod.instant : undefined;
    // If we encounter a non-false instant config before a instant=false,
    // the page isn't allowed to block. The config expresses a requirement for
    // instant UI, so we should make sure that a static shell exists.
    // (even if it'd use runtime prefetching for client navs)
    if (instantConfig !== undefined) {
        if (instantConfig === false) {
            return true;
        } else {
            return false;
        }
    }
    const { parallelRoutes } = (0, _parseloadertree.parseLoaderTree)(tree);
    for(const parallelRouteKey in parallelRoutes){
        const parallelRoute = parallelRoutes[parallelRouteKey];
        const subtreeIsBlocking = await isPageAllowedToBlock(parallelRoute);
        if (subtreeIsBlocking) {
            return true;
        }
    }
    return false;
}
var VALIDATION_LEVEL = /*#__PURE__*/ function(VALIDATION_LEVEL) {
    VALIDATION_LEVEL[VALIDATION_LEVEL["WARNING"] = 0] = "WARNING";
    VALIDATION_LEVEL[VALIDATION_LEVEL["ERROR"] = 1] = "ERROR";
    return VALIDATION_LEVEL;
}(VALIDATION_LEVEL || {});
/**
 * Walks the loader tree and checks if any segment has an `instant` config
 * that needs validating for the given mode.
 *
 * - Explicit `instant` exports are checked against mode.
 * - Page and default segments without an explicit config get implicit
 *   validation when the default validation level applies to this mode.
 * - `unstable_disableValidation` on any segment kills validation for
 *   the whole tree.
 */ async function anySegmentNeedsInstantValidation(rootTree, level) {
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    if (!workStore) {
        throw Object.defineProperty(new _invarianterror.InvariantError('anySegmentNeedsInstantValidation must run inside a WorkStore'), "__NEXT_ERROR_CODE", {
            value: "E1185",
            enumerable: false,
            configurable: true
        });
    }
    const { validationLevel } = workStore;
    let baseValidationLevel = 0;
    let manualValidation = false;
    switch(validationLevel){
        case 'manual-warning':
            manualValidation = true;
        // intentional fallthrough
        case 'warning':
            baseValidationLevel = 0;
            break;
        case 'experimental-manual-error':
            manualValidation = true;
        // intentional fallthrough
        case 'experimental-error':
            baseValidationLevel = 1;
            break;
        default:
            validationLevel;
    }
    const applyDefaultValidation = // We need to be validating the right level
    level <= baseValidationLevel && // We need to not be in manual validation mode
    !manualValidation && // We don't validate framework internal routes by default
    !isFrameworkErrorRoute(workStore.route);
    let needsValidation = false;
    let disabled = false;
    async function visit(tree) {
        if (disabled) return;
        const { mod: layoutOrPageMod } = await (0, _appdirmodule.getLayoutOrPageModule)(tree);
        const instantConfig = layoutOrPageMod ? layoutOrPageMod.instant : undefined;
        if (instantConfig === false) {
        // Explicit opt-out. Doesn't itself trigger validation.
        } else if (instantConfig === true) {
            // Explicit opt-in using the default level.
            if (level <= baseValidationLevel) {
                needsValidation = true;
            }
        } else if (typeof instantConfig === 'object' && instantConfig !== null) {
            if (instantConfig.unstable_disableValidation === true || level === 0 && instantConfig.unstable_disableDevValidation === true || level === 1 && instantConfig.unstable_disableBuildValidation === true) {
                disabled = true;
                return;
            }
            if (instantConfig.level !== undefined) {
                const configuredLevel = instantConfig.level === 'experimental-error' ? 1 : 0;
                if (level <= configuredLevel) {
                    needsValidation = true;
                }
            } else if (level <= baseValidationLevel) {
                needsValidation = true;
            }
        } else if (applyDefaultValidation && isImplicitValidationSegment(tree[0])) {
            // No explicit config. Implicit validation applies to page/default
            // segments when the default level is active for this mode.
            needsValidation = true;
        }
        const { parallelRoutes } = (0, _parseloadertree.parseLoaderTree)(tree);
        for(const parallelRouteKey in parallelRoutes){
            await visit(parallelRoutes[parallelRouteKey]);
            if (disabled) return;
        }
    }
    await visit(rootTree);
    if (disabled) {
        return false;
    }
    return needsValidation;
}
const anySegmentNeedsInstantValidationInDev = cacheScopedToWorkStore(async (rootTree)=>anySegmentNeedsInstantValidation(rootTree, 0));
const anySegmentNeedsInstantValidationInBuild = cacheScopedToWorkStore(async (rootTree)=>anySegmentNeedsInstantValidation(rootTree, 1));
const resolveInstantConfigSamplesForPage = async (tree)=>{
    const { mod: layoutOrPageMod } = await (0, _appdirmodule.getLayoutOrPageModule)(tree);
    const instantConfig = layoutOrPageMod ? layoutOrPageMod.instant : undefined;
    let samples = null;
    if (instantConfig !== undefined && typeof instantConfig === 'object' && instantConfig.unstable_samples) {
        samples = instantConfig.unstable_samples;
    }
    // The samples from inner segments override samples from outer segments,
    // i.e. a page overrides the samples from a layout.
    // We do not perform any merging logic.
    const { parallelRoutes } = (0, _parseloadertree.parseLoaderTree)(tree);
    for(const parallelRouteKey in parallelRoutes){
        if (parallelRouteKey !== 'children') {
            continue;
        }
        const childTree = parallelRoutes[parallelRouteKey];
        const childSamples = await resolveInstantConfigSamplesForPage(childTree);
        if (childSamples !== null) {
            samples = childSamples;
        }
    }
    return samples;
};
/**
 * A simple cache wrapper for 1-argument functions.
 * The cache will live as long as the current WorkStore,
 * i.e. it's scoped to a single request.
 */ function cacheScopedToWorkStore(func) {
    const resultsPerWorkStore = new WeakMap();
    return (arg)=>{
        const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
        if (!workStore) {
            throw Object.defineProperty(new _invarianterror.InvariantError(`${func.name || 'cacheScopedToWorkStore callee'} must run inside a WorkStore`), "__NEXT_ERROR_CODE", {
                value: "E1186",
                enumerable: false,
                configurable: true
            });
        }
        let results = resultsPerWorkStore.get(workStore);
        if (results && results.has(arg)) {
            return results.get(arg);
        }
        const result = func(arg);
        if (!results) {
            results = new WeakMap();
            resultsPerWorkStore.set(workStore, results);
        }
        results.set(arg, result);
        return result;
    };
}

//# sourceMappingURL=instant-config.js.map