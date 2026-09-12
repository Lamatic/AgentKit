"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getUseCacheProbe: null,
    setUseCacheProbe: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getUseCacheProbe: function() {
        return getUseCacheProbe;
    },
    setUseCacheProbe: function() {
        return setUseCacheProbe;
    }
});
// Cross-module handoff for the `'use cache'` hang-detection probe. A symbol on
// `globalThis` decouples the dev-server entry point (which installs the
// jest-worker pool) from the read site inside `use-cache-wrapper.ts` — avoiding
// a direct import of dev-only code from the use-cache module. In any process
// where the symbol is not set (prod, edge, unit tests, the probe worker itself)
// `getUseCacheProbe()` returns undefined, which doubles as the recursion guard
// against a probe spawning another probe.
const SYMBOL = Symbol.for('next.dev.useCacheProbe');
function setUseCacheProbe(fn) {
    ;
    globalThis[SYMBOL] = fn;
}
function getUseCacheProbe() {
    return globalThis[SYMBOL];
}

//# sourceMappingURL=use-cache-probe-globals.js.map