import { getModuleBuildInfo } from '../get-module-build-info';
import { stringifyRequest } from '../../stringify-request';
import { WEBPACK_RESOURCE_QUERIES } from '../../../../lib/constants';
import { loadEntrypoint } from '../../../load-entrypoint';
import { isMetadataRoute } from '../../../../lib/metadata/is-metadata-route';
function getCacheHandlersSetup(cacheHandlersStringified, contextifyImportPath) {
    const cacheHandlers = JSON.parse(cacheHandlersStringified || '{}');
    const definedCacheHandlers = Object.entries(cacheHandlers).filter((entry)=>Boolean(entry[1]));
    const cacheHandlerImports = [];
    const edgeCacheHandlersRegistration = [];
    for (const [index, [kind, handlerPath]] of definedCacheHandlers.entries()){
        const cacheHandlerVarName = `edgeCacheHandler_${index}`;
        const cacheHandlerImportPath = contextifyImportPath(handlerPath);
        cacheHandlerImports.push(`import ${cacheHandlerVarName} from ${JSON.stringify(cacheHandlerImportPath)}`);
        edgeCacheHandlersRegistration.push(`edgeCacheHandlers[${JSON.stringify(kind)}] = ${cacheHandlerVarName}`);
    }
    return {
        cacheHandlerImports: cacheHandlerImports.join('\n') || '\n',
        edgeCacheHandlersRegistration: edgeCacheHandlersRegistration.join('\n') || '\n'
    };
}
const EdgeAppRouteLoader = async function() {
    const { page, absolutePagePath, preferredRegion, appDirLoader: appDirLoaderBase64 = '', middlewareConfig: middlewareConfigBase64 = '', cacheHandler, cacheHandlers: cacheHandlersStringified } = this.getOptions();
    const appDirLoader = Buffer.from(appDirLoaderBase64, 'base64').toString();
    const middlewareConfig = JSON.parse(Buffer.from(middlewareConfigBase64, 'base64').toString());
    const cacheHandlersSetup = getCacheHandlersSetup(cacheHandlersStringified, (handlerPath)=>this.utils.contextify(this.context || this.rootContext, handlerPath));
    const incrementalCacheHandler = cacheHandler ? this.utils.contextify(this.context || this.rootContext, cacheHandler) : null;
    // Ensure we only run this loader for as a module.
    if (!this._module) throw Object.defineProperty(new Error('This loader is only usable as a module'), "__NEXT_ERROR_CODE", {
        value: "E433",
        enumerable: false,
        configurable: true
    });
    const buildInfo = getModuleBuildInfo(this._module);
    buildInfo.nextEdgeSSR = {
        isServerComponent: !isMetadataRoute(page),
        page: page,
        isAppDir: true
    };
    buildInfo.route = {
        page,
        absolutePagePath,
        preferredRegion,
        middlewareConfig
    };
    const stringifiedPagePath = stringifyRequest(this, absolutePagePath);
    const modulePath = `${appDirLoader}${stringifiedPagePath.substring(1, stringifiedPagePath.length - 1)}?${WEBPACK_RESOURCE_QUERIES.edgeSSREntry}`;
    return await loadEntrypoint('edge-app-route', {
        VAR_USERLAND: modulePath,
        VAR_PAGE: page
    }, cacheHandlersSetup, {
        incrementalCacheHandler
    });
};
export default EdgeAppRouteLoader;

//# sourceMappingURL=index.js.map