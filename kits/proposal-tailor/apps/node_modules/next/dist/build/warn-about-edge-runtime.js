"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    warnAboutEdgeRuntime: null,
    warnAboutPreferredRegion: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    warnAboutEdgeRuntime: function() {
        return warnAboutEdgeRuntime;
    },
    warnAboutPreferredRegion: function() {
        return warnAboutPreferredRegion;
    }
});
const _log = /*#__PURE__*/ _interop_require_wildcard(require("./output/log"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function warnAboutEdgeRuntime() {
    // Webpack build workers each run in a separate process with their own
    // warnOnce cache, so the same warning would be emitted once per worker.
    // Suppress in workers; the main build process emits the warning once during
    // the "Collecting page data" phase.
    if (process.env.NEXT_PRIVATE_BUILD_WORKER) return;
    _log.warnOnce(`The Edge Runtime is deprecated. You can use the "nodejs" runtime instead. Learn more: https://nextjs.org/docs/messages/edge-runtime-deprecated`);
}
function warnAboutPreferredRegion() {
    if (process.env.NEXT_PRIVATE_BUILD_WORKER) return;
    _log.warnOnce(`The "preferredRegion" route segment config is deprecated. Learn more: https://nextjs.org/docs/messages/preferred-region-deprecated`);
}

//# sourceMappingURL=warn-about-edge-runtime.js.map