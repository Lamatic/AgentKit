import type { FlightDataPath, FlightRouterState, PrefetchHints, HeadData } from '../../shared/lib/app-router-types';
import type { PreloadCallbacks } from './types';
import type { LoaderTree } from '../lib/app-dir-module';
import type { AppRenderContext } from './app-render';
/**
 * Use router state to decide at what common layout to render the page.
 * This can either be the common layout between two pages or a specific place to start rendering from using the "refetch" marker in the tree.
 */
export declare function walkTreeWithFlightRouterState({ loaderTreeToFilter, parentParams, flightRouterState, parentIsInsideSharedLayout, rscHead, injectedCSS, injectedJS, injectedFontPreloadTags, rootLayoutIncluded, ctx, preloadCallbacks, MetadataOutlet, hintTree, }: {
    loaderTreeToFilter: LoaderTree;
    parentParams: {
        [key: string]: string | string[];
    };
    flightRouterState?: FlightRouterState;
    rscHead: HeadData;
    parentIsInsideSharedLayout?: boolean;
    injectedCSS: Set<string>;
    injectedJS: Set<string>;
    injectedFontPreloadTags: Set<string>;
    rootLayoutIncluded: boolean;
    ctx: AppRenderContext;
    preloadCallbacks: PreloadCallbacks;
    MetadataOutlet: React.ComponentType;
    hintTree: PrefetchHints | null;
}): Promise<FlightDataPath[]>;
/**
 * A simplified version of `walkTreeWithFlightRouterState` that doesn't skip any layouts
 * but returns a result of the same shape.
 * Intended to be used for instant validation, where we need the complete tree.
 */
export declare function createFullTreeFlightDataForNavigation({ loaderTree, rscHead, injectedCSS, injectedJS, injectedFontPreloadTags, ctx, preloadCallbacks, MetadataOutlet, }: {
    loaderTree: LoaderTree;
    flightRouterState?: FlightRouterState;
    rscHead: HeadData;
    injectedCSS: Set<string>;
    injectedJS: Set<string>;
    injectedFontPreloadTags: Set<string>;
    ctx: AppRenderContext;
    preloadCallbacks: PreloadCallbacks;
    MetadataOutlet: React.ComponentType;
}): Promise<[rootSegment: FlightDataPath]>;
