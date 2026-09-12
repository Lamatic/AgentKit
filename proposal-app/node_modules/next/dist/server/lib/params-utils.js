"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    allParamsAreRootParams: null,
    hasFallbackRouteParams: null,
    hasNonRootStaticParams: null,
    isEmptyParams: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    allParamsAreRootParams: function() {
        return allParamsAreRootParams;
    },
    hasFallbackRouteParams: function() {
        return hasFallbackRouteParams;
    },
    hasNonRootStaticParams: function() {
        return hasNonRootStaticParams;
    },
    isEmptyParams: function() {
        return isEmptyParams;
    }
});
function hasNonRootStaticParams(params, rootParams, fallbackParams) {
    for(const paramName in params){
        if (!Object.hasOwn(rootParams, paramName) && isStaticParam(paramName, fallbackParams)) {
            return true;
        }
    }
    return false;
}
function isStaticParam(paramName, fallbackParams) {
    // NOTE: Assume that undefined fallback params mean that all of the params are static.
    if (!fallbackParams) return true;
    // If the param isn't a fallback param, it must be static.
    return !fallbackParams.has(paramName);
}
function allParamsAreRootParams(underlyingParams, rootParams) {
    for(const paramName in underlyingParams){
        if (!Object.hasOwn(rootParams, paramName)) {
            return false;
        }
    }
    return true;
}
function isEmptyParams(params) {
    for(const _paramKey in params){
        return false;
    }
    return true;
}
function hasFallbackRouteParams(underlyingParams, fallbackParams) {
    if (fallbackParams) {
        for(let key in underlyingParams){
            if (fallbackParams.has(key)) {
                return true;
            }
        }
    }
    return false;
}

//# sourceMappingURL=params-utils.js.map