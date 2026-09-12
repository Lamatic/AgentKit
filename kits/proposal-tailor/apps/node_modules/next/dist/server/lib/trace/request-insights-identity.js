"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getRequestInsightsIdentity: null,
    runWithRequestInsightsIdentity: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getRequestInsightsIdentity: function() {
        return getRequestInsightsIdentity;
    },
    runWithRequestInsightsIdentity: function() {
        return runWithRequestInsightsIdentity;
    }
});
const _asynclocalstorage = require("../../app-render/async-local-storage");
// This storage covers the part of BaseServer request handling that runs before
// App Render creates workAsyncStorage. Once available, workStore remains the
// primary identity source for locally recorded spans.
const REQUEST_INSIGHTS_IDENTITY_STORAGE_KEY = Symbol.for('@next/request-insights-identity-storage');
function getRequestInsightsIdentityStorage() {
    const globalStore = globalThis;
    return globalStore[REQUEST_INSIGHTS_IDENTITY_STORAGE_KEY] ??= (0, _asynclocalstorage.createAsyncLocalStorage)();
}
function runWithRequestInsightsIdentity(identity, fn) {
    return getRequestInsightsIdentityStorage().run(identity, fn);
}
function getRequestInsightsIdentity() {
    return getRequestInsightsIdentityStorage().getStore();
}

//# sourceMappingURL=request-insights-identity.js.map