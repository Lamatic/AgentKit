export function hasNonRootStaticParams(params, rootParams, fallbackParams) {
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
export function allParamsAreRootParams(underlyingParams, rootParams) {
    for(const paramName in underlyingParams){
        if (!Object.hasOwn(rootParams, paramName)) {
            return false;
        }
    }
    return true;
}
export function isEmptyParams(params) {
    for(const _paramKey in params){
        return false;
    }
    return true;
}
export function hasFallbackRouteParams(underlyingParams, fallbackParams) {
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