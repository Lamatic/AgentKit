import type { FocusAndScrollRef, PrefetchKind } from '../../client/components/router-reducer/router-reducer-types';
import type { Params } from '../../server/request/params';
import type { FlightRouterState, FlightSegmentPath, CacheNode, LoadingModuleData } from './app-router-types';
import React from 'react';
export interface NavigateOptions {
    scroll?: boolean;
    /**
     * Transition types to apply when navigating. These types are passed to
     * [`React.addTransitionType`](https://react.dev/reference/react/addTransitionType)
     * inside the navigation transition, enabling
     * [`<ViewTransition>`](https://react.dev/reference/react/ViewTransition) components
     * to apply different animations based on the type of navigation.
     */
    transitionTypes?: string[];
}
export interface PrefetchOptions {
    kind: PrefetchKind;
    onInvalidate?: () => void;
}
export interface AppRouterInstance {
    /**
     * Navigate to the previous history entry.
     */
    back(): void;
    /**
     * Navigate to the next history entry.
     */
    forward(): void;
    /**
     * Refresh the current page.
     */
    refresh(): void;
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push(href: string, options?: NavigateOptions): void;
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace(href: string, options?: NavigateOptions): void;
    /**
     * Prefetch the provided href.
     */
    prefetch(href: string, options?: PrefetchOptions): void;
    /**
     * Perform a gesture navigation using prefetched data.
     * Only available when experimental.gestureTransition is enabled.
     * @experimental
     */
    experimental_gesturePush?(href: string, options?: NavigateOptions): void;
    /**
     * An opaque string identifier scoped to the current route segment.
     *
     * Changes when the surrounding segment is freshly created by a push or
     * replace navigation. Stays the same for back/forward navigations,
     * `router.refresh()`, and search-param/hash-only changes.
     *
     * Intended to be passed to a React `key` to opt out of state preservation
     * on fresh navigations:
     *
     * ```tsx
     * <form key={useRouter().bfcacheId}>
     * ```
     *
     * In most cases, prefer resetting state explicitly in an event handler, or
     * deriving a key from your data (e.g. a draft id from the server). Use
     * `bfcacheId` only when those patterns aren't a fit.
     */
    bfcacheId: string;
}
export declare const AppRouterContext: React.Context<AppRouterInstance | null>;
export declare const LayoutRouterContext: React.Context<{
    parentTree: FlightRouterState;
    parentCacheNode: CacheNode;
    parentSegmentPath: FlightSegmentPath | null;
    parentParams: Params;
    parentLoadingData: LoadingModuleData | null;
    debugNameContext: string;
    url: string;
    isActive: boolean;
} | null>;
export declare const GlobalLayoutRouterContext: React.Context<{
    tree: FlightRouterState;
    focusAndScrollRef: FocusAndScrollRef;
    nextUrl: string | null;
    previousNextUrl: string | null;
}>;
export declare const TemplateContext: React.Context<React.ReactNode>;
export declare const MissingSlotContext: React.Context<Set<string>>;
