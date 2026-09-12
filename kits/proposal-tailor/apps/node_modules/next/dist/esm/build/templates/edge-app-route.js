var _self___RSC_MANIFEST;
import { setManifestsSingleton } from '../../server/app-render/manifests-singleton';
import { EdgeRouteModuleWrapper } from '../../server/web/edge-route-module-wrapper';
// Import the userland code.
import * as module from 'VAR_USERLAND';
import { toNodeOutgoingHttpHeaders } from '../../server/web/utils';
// OPTIONAL_IMPORT:incrementalCacheHandler
// INJECT_RAW:cacheHandlerImports
const maybeJSONParse = (str)=>str ? JSON.parse(str) : undefined;
const rscManifest = (_self___RSC_MANIFEST = self.__RSC_MANIFEST) == null ? void 0 : _self___RSC_MANIFEST['VAR_PAGE'];
const rscServerManifest = maybeJSONParse(self.__RSC_SERVER_MANIFEST);
if (rscManifest && rscServerManifest) {
    setManifestsSingleton({
        page: 'VAR_PAGE',
        clientReferenceManifest: rscManifest,
        serverActionsManifest: rscServerManifest
    });
}
export const ComponentMod = module;
const edgeCacheHandlers = {};
// INJECT_RAW:edgeCacheHandlersRegistration
const internalHandler = EdgeRouteModuleWrapper.wrap(module.routeModule, {
    page: 'VAR_PAGE',
    cacheHandlers: edgeCacheHandlers,
    incrementalCacheHandler
});
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
                name: 'VAR_PAGE'
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

//# sourceMappingURL=edge-app-route.js.map