import '../../server/web/globals';
import { adapter } from '../../server/web/adapter';
import { IncrementalCache } from '../../server/lib/incremental-cache';
import { wrapApiHandler } from '../../server/api-utils';
// OPTIONAL_IMPORT:incrementalCacheHandler
// Import the userland code.
import handlerUserland from 'VAR_USERLAND';
import { toNodeOutgoingHttpHeaders } from '../../server/web/utils';
const page = 'VAR_DEFINITION_PAGE';
if (typeof handlerUserland !== 'function') {
    throw Object.defineProperty(new Error(`The Edge Function "pages${page}" must export a \`default\` function`), "__NEXT_ERROR_CODE", {
        value: "E1011",
        enumerable: false,
        configurable: true
    });
}
const internalHandler = (opts)=>{
    return adapter({
        ...opts,
        IncrementalCache,
        incrementalCacheHandler,
        page: 'VAR_DEFINITION_PATHNAME',
        handler: wrapApiHandler(page, handlerUserland)
    });
};
export async function handler(request, ctx) {
    const result = await internalHandler({
        request: {
            url: request.url,
            method: request.method,
            headers: toNodeOutgoingHttpHeaders(request.headers),
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
// backwards compat
export default internalHandler;

//# sourceMappingURL=pages-edge-api.js.map