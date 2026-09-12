"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    handler: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    // backwards compat
    default: function() {
        return _default;
    },
    handler: function() {
        return handler;
    }
});
require("../../server/web/globals");
const _adapter = require("../../server/web/adapter");
const _incrementalcache = require("../../server/lib/incremental-cache");
const _apiutils = require("../../server/api-utils");
const _VAR_USERLAND = /*#__PURE__*/ _interop_require_default(require("VAR_USERLAND"));
const _utils = require("../../server/web/utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const page = 'VAR_DEFINITION_PAGE';
if (typeof _VAR_USERLAND.default !== 'function') {
    throw Object.defineProperty(new Error(`The Edge Function "pages${page}" must export a \`default\` function`), "__NEXT_ERROR_CODE", {
        value: "E1011",
        enumerable: false,
        configurable: true
    });
}
const internalHandler = (opts)=>{
    return (0, _adapter.adapter)({
        ...opts,
        IncrementalCache: _incrementalcache.IncrementalCache,
        incrementalCacheHandler,
        page: 'VAR_DEFINITION_PATHNAME',
        handler: (0, _apiutils.wrapApiHandler)(page, _VAR_USERLAND.default)
    });
};
async function handler(request, ctx) {
    const result = await internalHandler({
        request: {
            url: request.url,
            method: request.method,
            headers: (0, _utils.toNodeOutgoingHttpHeaders)(request.headers),
            nextConfig: {
                basePath: process.env.__NEXT_BASE_PATH,
                i18n: process.env.__NEXT_I18N_CONFIG,
                trailingSlash: Boolean(process.env.__NEXT_TRAILING_SLASH),
                experimental: {
                    cacheLife: process.env.__NEXT_CACHE_LIFE,
                    authInterrupts: Boolean(process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS),
                    clientParamParsingOrigins: process.env.__NEXT_CLIENT_PARAM_PARSING_ORIGINS
                }
            },
            page: {
                name: 'VAR_DEFINITION_PATHNAME'
            },
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body ?? undefined : undefined,
            waitUntil: ctx.waitUntil,
            requestMeta: ctx.requestMeta,
            signal: ctx.signal || new AbortController().signal
        }
    });
    ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, result.waitUntil);
    return result.response;
}
const _default = internalHandler;

//# sourceMappingURL=pages-edge-api.js.map