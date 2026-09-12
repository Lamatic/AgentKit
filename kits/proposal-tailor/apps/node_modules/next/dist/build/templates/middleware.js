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
    // backwards compat for non-adapter setups
    default: function() {
        return _default;
    },
    handler: function() {
        return handler;
    }
});
require("../adapter/setup-node-env.external");
const _globals = require("../../server/web/globals");
const _adapter = require("../../server/web/adapter");
const _incrementalcache = require("../../server/lib/incremental-cache");
const _VAR_USERLAND = /*#__PURE__*/ _interop_require_wildcard(require("VAR_USERLAND"));
const _isnextroutererror = require("../../client/components/is-next-router-error");
const _utils = require("../../server/web/utils");
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
const mod = {
    ..._VAR_USERLAND
};
const page = 'VAR_DEFINITION_PAGE';
const isProxy = page === '/proxy' || page === '/src/proxy';
const handlerUserland = (isProxy ? mod.proxy : mod.middleware) || mod.default;
class ProxyMissingExportError extends Error {
    constructor(message){
        super(message);
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
        // Stack isn't useful here, remove it considering it spams logs during development.
        this.stack = '';
    }
}
// TODO: This spams logs during development. Find a better way to handle this.
// Removing this will spam "fn is not a function" logs which is worse.
if (typeof handlerUserland !== 'function') {
    throw new ProxyMissingExportError(`The ${isProxy ? 'Proxy' : 'Middleware'} file "${page}" must export a function named \`${isProxy ? 'proxy' : 'middleware'}\` or a default function.`);
}
// Proxy will only sent out the FetchEvent to next server,
// so load instrumentation module here and track the error inside proxy module.
function errorHandledHandler(fn) {
    return async (...args)=>{
        try {
            return await fn(...args);
        } catch (err) {
            // In development, error the navigation API usage in runtime,
            // since it's not allowed to be used in proxy as it's outside of react component tree.
            if (process.env.NODE_ENV !== 'production') {
                if ((0, _isnextroutererror.isNextRouterError)(err)) {
                    err.message = `Next.js navigation API is not allowed to be used in ${isProxy ? 'Proxy' : 'Middleware'}.`;
                    throw err;
                }
            }
            const req = args[0];
            const url = new URL(req.url);
            const resource = url.pathname + url.search;
            await (0, _globals.edgeInstrumentationOnRequestError)(err, {
                path: resource,
                method: req.method,
                headers: Object.fromEntries(req.headers.entries())
            }, {
                routerKind: 'Pages Router',
                routePath: '/proxy',
                routeType: 'proxy',
                revalidateReason: undefined
            });
            throw err;
        }
    };
}
const internalHandler = async (opts)=>{
    if (process.env.NEXT_RUNTIME !== 'edge') {
        var _opts_request_requestMeta, _opts_request_requestMeta1;
        // This mirrors what `RouteModule#prepare` does for routes
        // edge runtime handles loading instrumentation at the edge adapter level
        const { join, relative } = require('node:path');
        const { ensureInstrumentationRegistered } = require('../../server/lib/router-utils/instrumentation-globals.external');
        const absoluteProjectDir = join(/* turbopackIgnore: true */ process.cwd(), ((_opts_request_requestMeta = opts.request.requestMeta) == null ? void 0 : _opts_request_requestMeta.relativeProjectDir) || '');
        const absoluteDistDir = (_opts_request_requestMeta1 = opts.request.requestMeta) == null ? void 0 : _opts_request_requestMeta1.distDir;
        const distDir = absoluteDistDir ? relative(absoluteProjectDir, absoluteDistDir) : '.next';
        await ensureInstrumentationRegistered(absoluteProjectDir, distDir);
    }
    return (0, _adapter.adapter)({
        ...opts,
        IncrementalCache: _incrementalcache.IncrementalCache,
        incrementalCacheHandler,
        page,
        handler: errorHandledHandler(handlerUserland)
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
                name: page
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

//# sourceMappingURL=middleware.js.map