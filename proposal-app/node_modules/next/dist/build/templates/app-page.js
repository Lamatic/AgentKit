"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    __next_app__: null,
    handler: null,
    routeModule: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    __next_app__: function() {
        return __next_app__;
    },
    handler: function() {
        return handler;
    },
    routeModule: function() {
        return routeModule;
    }
});
0 && __export(require("../../server/app-render/entry-base"));
const _apppageruntime = require("./app-page-runtime");
const _interopdefault = require("../../server/app-render/interop-default");
_export_star(require("../../server/app-render/entry-base"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
// INJECT:tree
// INJECT:__next_app_require__
// INJECT:__next_app_load_chunk__
const entrypoint = (0, _apppageruntime.createAppPageEntrypoint)({
    tree,
    page: 'VAR_DEFINITION_PAGE',
    pathname: 'VAR_DEFINITION_PATHNAME',
    require: __next_app_require__,
    loadChunk: __next_app_load_chunk__,
    interopDefault: _interopdefault.interopDefault
});
const __next_app__ = entrypoint.__next_app__;
const routeModule = entrypoint.routeModule;
const handler = entrypoint.handler;

//# sourceMappingURL=app-page.js.map