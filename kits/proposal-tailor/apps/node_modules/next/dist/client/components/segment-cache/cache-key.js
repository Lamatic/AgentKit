// TypeScript trick to simulate opaque types, like in Flow.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createCacheKey: null,
    splitPathnameIntoParts: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createCacheKey: function() {
        return createCacheKey;
    },
    splitPathnameIntoParts: function() {
        return splitPathnameIntoParts;
    }
});
function createCacheKey(originalHref, nextUrl) {
    const originalUrl = new URL(originalHref);
    const cacheKey = {
        pathname: originalUrl.pathname,
        search: originalUrl.search,
        nextUrl: nextUrl
    };
    return cacheKey;
}
function splitPathnameIntoParts(pathname) {
    const parts = [];
    let start = 0;
    for(let i = 0; i < pathname.length; i++){
        if (pathname.charCodeAt(i) === 47 /* '/' */ ) {
            if (i > start) {
                parts.push(pathname.slice(start, i));
            }
            start = i + 1;
        }
    }
    if (start < pathname.length) {
        parts.push(pathname.slice(start));
    }
    return parts;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=cache-key.js.map