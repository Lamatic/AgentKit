import type { AppRouteRouteModule } from '../route-modules/app-route/module';
import './globals';
import { type EdgeHandler } from './adapter';
import { type CacheHandler as IncrementalCacheHandler } from '../lib/incremental-cache';
import type { CacheHandler } from '../lib/cache-handlers/types';
export interface WrapOptions {
    page: string;
    cacheHandlers?: Record<string, CacheHandler>;
    incrementalCacheHandler?: typeof IncrementalCacheHandler;
}
/**
 * EdgeRouteModuleWrapper is a wrapper around a route module.
 *
 * Note that this class should only be used in the edge runtime.
 */
export declare class EdgeRouteModuleWrapper {
    private readonly routeModule;
    private readonly cacheHandlers;
    private readonly matcher;
    /**
     * The constructor is wrapped with private to ensure that it can only be
     * constructed by the static wrap method.
     *
     * @param routeModule the route module to wrap
     */
    private constructor();
    /**
     * This will wrap a module with the EdgeModuleWrapper and return a function
     * that can be used as a handler for the edge runtime.
     *
     * @param module the module to wrap
     * @param options any options that should be passed to the adapter and
     *                override the ones passed from the runtime
     * @returns a function that can be used as a handler for the edge runtime
     */
    static wrap(routeModule: AppRouteRouteModule, options: WrapOptions): EdgeHandler;
    private handler;
}
