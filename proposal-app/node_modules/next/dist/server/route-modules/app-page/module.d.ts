import type { AppPageRouteDefinition } from '../../route-definitions/app-page-route-definition';
import type RenderResult from '../../render-result';
import type { RenderOpts } from '../../app-render/types';
import { type NextParsedUrlQuery } from '../../request-meta';
import type { LoaderTree } from '../../lib/app-dir-module';
import type { PrerenderManifest } from '../../../build';
import { renderToHTMLOrFlight, type AppSharedContext } from '../../app-render/app-render';
import type { DevValidationWorkerMessage } from '../../app-render/dev-validation-worker-globals';
import { RouteModule, type RouteModuleOptions, type RouteModuleHandleContext } from '../route-module';
import * as vendoredContexts from './vendored/contexts/entrypoints';
import type { BaseNextRequest, BaseNextResponse } from '../../base-http';
import type { ServerComponentsHmrCache } from '../../response-cache';
import type { OpaqueFallbackRouteParams } from '../../request/fallback-params';
import type { DeepReadonly } from '../../../shared/lib/deep-readonly';
import type { UrlWithParsedQuery } from 'url';
import type { IncomingMessage } from 'http';
/**
 * The AppPageModule is the type of the module exported by the bundled app page
 * module.
 */
export type AppPageModule = typeof import('../../../build/templates/app-page');
type AppPageUserlandModule = {
    /**
     * The tree created in next-app-loader that holds component segments and modules
     */
    loaderTree: LoaderTree;
};
export interface AppPageRouteHandlerContext extends RouteModuleHandleContext {
    page: string;
    query: NextParsedUrlQuery;
    fallbackRouteParams: OpaqueFallbackRouteParams | null;
    renderOpts: RenderOpts;
    serverComponentsHmrCache?: ServerComponentsHmrCache;
    sharedContext: AppSharedContext;
}
export type AppPageRouteModuleOptions = RouteModuleOptions<AppPageRouteDefinition, AppPageUserlandModule>;
export declare class AppPageRouteModule extends RouteModule<AppPageRouteDefinition, AppPageUserlandModule> {
    private matchers;
    match(pathname: string, prerenderManifest: DeepReadonly<PrerenderManifest>): import("./helpers/prerender-manifest-matcher").PrerenderManifestMatch | null;
    private normalizers;
    normalizeUrl(req: IncomingMessage | BaseNextRequest, parsedUrl: UrlWithParsedQuery): false | undefined;
    render(req: BaseNextRequest, res: BaseNextResponse, context: AppPageRouteHandlerContext): Promise<RenderResult>;
    /**
     * Worker entry point for dev Cache Components dev validation. The dev
     * validation worker reloads this route's module and calls this so the whole
     * validation runs inside the app-page bundle's React instance (the same one
     * the user's client components resolve through `componentMod`), rebuilding
     * the render context from the transported `message`. `componentMod` is the
     * reloaded module the worker holds; it's passed in because the route module
     * has no back-reference to it. Returns the validation errors for the worker
     * to serialize and the main thread to deliver to the dev overlay.
     */
    runValidationInDev(componentMod: AppPageModule, message: DevValidationWorkerMessage, abortSignal: AbortSignal): Promise<Array<unknown> | undefined>;
    private pathCouldBeIntercepted;
    getVaryHeader(resolvedPathname: string, interceptionRoutePatterns: RegExp[]): string;
}
declare const vendored: {
    'react-rsc': typeof import("./vendored/rsc/entrypoints") | undefined;
    'react-ssr': typeof import("./vendored/ssr/entrypoints") | undefined;
    contexts: typeof vendoredContexts;
};
export { renderToHTMLOrFlight, vendored };
export default AppPageRouteModule;
