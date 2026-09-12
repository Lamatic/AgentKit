import type { NextConfig } from '../../config-shared';
import type { AppRouteRouteDefinition } from '../../route-definitions/app-route-route-definition';
import type { AppSegmentConfig } from '../../../build/segment-config/app/app-segment-config';
import type { NextRequest } from '../../web/spec-extension/request';
import type { DeepReadonly } from '../../../shared/lib/deep-readonly';
import type { __ApiPreviewProps } from '../../api-utils';
import { RouteModule, type RouteModuleHandleContext, type RouteModuleOptions } from '../route-module';
import { type WorkStoreContext } from '../../async-storage/work-store';
import { type HTTP_METHOD } from '../../web/http';
import * as serverHooks from '../../../client/components/hooks-server-context';
import * as sharedModules from './shared-modules';
import type { RenderOptsPartial } from '../../app-render/types';
import type { AppSegment } from '../../../build/segment-config/app/app-segments';
import { type RedirectError } from '../../../client/components/redirect-error';
export declare class WrappedNextRouterError {
    readonly error: RedirectError;
    readonly headers?: Headers | undefined;
    constructor(error: RedirectError, headers?: Headers | undefined);
}
/**
 * The AppRouteModule is the type of the module exported by the bundled App
 * Route module.
 */
export type AppRouteModule = typeof import('../../../build/templates/app-route');
export type AppRouteSharedContext = {
    buildId: string;
    deploymentId: string;
};
/**
 * AppRouteRouteHandlerContext is the context that is passed to the route
 * handler for app routes.
 */
export interface AppRouteRouteHandlerContext extends RouteModuleHandleContext {
    renderOpts: WorkStoreContext['renderOpts'] & Pick<RenderOptsPartial, 'onInstrumentationRequestError'> & CollectedCacheInfo;
    previewProps: DeepReadonly<__ApiPreviewProps>;
    sharedContext: AppRouteSharedContext;
}
type CollectedCacheInfo = {
    collectedTags?: string;
    collectedRevalidate?: number;
    collectedExpire?: number;
    collectedStale?: number;
};
/**
 * AppRouteHandlerFnContext is the context that is passed to the handler as the
 * second argument.
 */
type AppRouteHandlerFnContext = {
    params?: Promise<Record<string, string | string[] | undefined>>;
};
/**
 * Handler function for app routes. If a non-Response value is returned, an error
 * will be thrown.
 */
export type AppRouteHandlerFn = (
/**
 * Incoming request object.
 */
req: NextRequest, 
/**
 * Context properties on the request (including the parameters if this was a
 * dynamic route).
 */
ctx: AppRouteHandlerFnContext) => unknown;
/**
 * AppRouteHandlers describes the handlers for app routes that is provided by
 * the userland module.
 */
export type AppRouteHandlers = {
    [method in HTTP_METHOD]?: AppRouteHandlerFn;
};
/**
 * AppRouteUserlandModule is the userland module that is provided for app
 * routes. This contains all the user generated code.
 */
export type AppRouteUserlandModule = AppRouteHandlers & Pick<AppSegmentConfig, 'dynamic' | 'revalidate' | 'dynamicParams' | 'fetchCache'> & Pick<AppSegment, 'generateStaticParams'>;
/**
 * AppRouteRouteModuleOptions is the options that are passed to the app route
 * module from the bundled code.
 */
export interface AppRouteRouteModuleOptions extends Omit<RouteModuleOptions<AppRouteRouteDefinition, AppRouteUserlandModule>, 'userland'> {
    readonly userland: () => AppRouteUserlandModule | Promise<AppRouteUserlandModule>;
    readonly resolvedPagePath: string;
    readonly nextConfigOutput: NextConfig['output'];
    /**
     * Optional synchronous getter that returns the live userland module. When
     * provided (Turbopack dev mode), it is called on every request so that
     * server HMR updates are picked up without re-executing the entry chunk.
     * Using require() instead of import() keeps this synchronous so the time
     * spent here is not incorrectly attributed to application-code in timing.
     */
    readonly getUserland?: () => AppRouteUserlandModule;
}
/**
 * AppRouteRouteHandler is the handler for app routes.
 */
export declare class AppRouteRouteModule extends RouteModule<AppRouteRouteDefinition, AppRouteUserlandModule> {
    /**
     * A reference to the request async storage.
     */
    readonly workUnitAsyncStorage: import("../../app-render/work-unit-async-storage.external").WorkUnitAsyncStorage;
    /**
     * A reference to the static generation async storage.
     */
    readonly workAsyncStorage: import("../../app-render/work-async-storage.external").WorkAsyncStorage;
    /**
     * An interface to call server hooks which interact with the underlying
     * storage.
     */
    readonly serverHooks: typeof serverHooks;
    static readonly sharedModules: typeof sharedModules;
    /**
     * A reference to the mutation related async storage, such as mutations of
     * cookies.
     */
    readonly actionAsyncStorage: import("../../app-render/action-async-storage.external").ActionAsyncStorage;
    readonly resolvedPagePath: string;
    readonly nextConfigOutput: NextConfig['output'] | undefined;
    private readonly _lazyUserland;
    private readonly _getUserland?;
    private _methods;
    private _hasNonStaticMethods;
    private _dynamic;
    get userland(): AppRouteUserlandModule;
    /**
     * Ensures the userland module is fully loaded before it's accessed via
     * `userland`. Required for route files that use top-level await, where
     * require() returns a promise instead of the module directly. Must be called
     * before accessing `userland` in contexts where the module may not yet be
     * resolved (e.g. the export/static-generation worker).
     */
    ensureUserland(): Promise<void>;
    constructor({ userland, getUserland, definition, distDir, relativeProjectDir, resolvedPagePath, nextConfigOutput, }: AppRouteRouteModuleOptions);
    private _onUserlandLoaded;
    /**
     * Returns the handler function for the given HTTP method.
     * Must be called after ensureUserland() has resolved so that _methods is
     * populated.
     */
    private resolveHandler;
    /**
     * Returns the handler for the given method using a live userland snapshot.
     * Used in Turbopack dev mode to pick up server HMR updates. The userland
     * is fetched synchronously via require() so no async overhead is added.
     */
    private resolveHandlerFromUserland;
    private do;
    handle(req: NextRequest, context: AppRouteRouteHandlerContext): Promise<Response>;
}
export default AppRouteRouteModule;
/**
 * Gets all the method names for handlers that are not considered static.
 *
 * @param handlers the handlers from the userland module
 * @returns the method names that are not considered static or false if all
 *          methods are static
 */
export declare function hasNonStaticMethods(handlers: AppRouteHandlers): boolean;
