import { getModuleBuildInfo } from './get-module-build-info';
import { stringifyRequest } from '../stringify-request';
const nextEdgeFunctionLoader = function nextEdgeFunctionLoader() {
    const { absolutePagePath, page, rootDir, preferredRegion, middlewareConfig: middlewareConfigBase64, cacheHandler } = this.getOptions();
    const stringifiedPagePath = stringifyRequest(this, absolutePagePath);
    const stringifiedCacheHandlerPath = cacheHandler ? stringifyRequest(this, cacheHandler) : null;
    const buildInfo = getModuleBuildInfo(this._module);
    const middlewareConfig = JSON.parse(Buffer.from(middlewareConfigBase64, 'base64').toString());
    buildInfo.route = {
        page: page || '/',
        absolutePagePath,
        preferredRegion,
        middlewareConfig
    };
    buildInfo.nextEdgeApiFunction = {
        page: page || '/'
    };
    buildInfo.rootDir = rootDir;
    return `
        import 'next/dist/esm/server/web/globals'
        import { adapter } from 'next/dist/esm/server/web/adapter'
        import { IncrementalCache } from 'next/dist/esm/server/lib/incremental-cache'
        import { wrapApiHandler } from 'next/dist/esm/server/api-utils'
        ${stringifiedCacheHandlerPath ? `import incrementalCacheHandler from ${stringifiedCacheHandlerPath}` : 'const incrementalCacheHandler = null'}

        import handler from ${stringifiedPagePath}

        if (typeof handler !== 'function') {
          throw new Error('The Edge Function "pages${page}" must export a \`default\` function');
        }

        export default function nHandler (opts) {
          return adapter({
              ...opts,
              IncrementalCache,
              incrementalCacheHandler,
              page: ${JSON.stringify(page)},
              handler: wrapApiHandler(${JSON.stringify(page)}, handler),
          })
        }
    `;
};
export default nextEdgeFunctionLoader;

//# sourceMappingURL=next-edge-function-loader.js.map