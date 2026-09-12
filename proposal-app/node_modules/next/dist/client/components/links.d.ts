import type { FlightRouterState } from '../../shared/lib/app-router-types';
import type { AppRouterInstance } from '../../shared/lib/app-router-context.shared-runtime';
import { type PrefetchTaskFetchStrategy } from './segment-cache/types';
import { type PrefetchTask } from './segment-cache/scheduler';
type LinkElement = HTMLAnchorElement | SVGAElement;
type Element = LinkElement | HTMLFormElement;
type LinkOrFormInstanceShared = {
    router: AppRouterInstance;
    fetchStrategy: PrefetchTaskFetchStrategy;
    isVisible: boolean;
    prefetchTask: PrefetchTask | null;
};
export type FormInstance = LinkOrFormInstanceShared & {
    prefetchHref: string;
    setOptimisticLinkStatus: null;
};
type PrefetchableLinkInstance = LinkOrFormInstanceShared & {
    ownerStack: string | null | undefined;
    prefetchHref: string;
    setOptimisticLinkStatus: (status: {
        pending: boolean;
    }) => void;
};
type NonPrefetchableLinkInstance = LinkOrFormInstanceShared & {
    ownerStack: string | null | undefined;
    prefetchHref: null;
    setOptimisticLinkStatus: (status: {
        pending: boolean;
    }) => void;
};
export type LinkInstance = PrefetchableLinkInstance | NonPrefetchableLinkInstance;
export declare const PENDING_LINK_STATUS: {
    pending: boolean;
};
export declare const IDLE_LINK_STATUS: {
    pending: boolean;
};
export declare function setLinkForCurrentNavigation(link: LinkInstance | null): void;
export declare function unmountLinkForCurrentNavigation(link: LinkInstance): void;
/**
 * Returns the link instance that initiated the most recent navigation.
 * Returns null if the navigation was not initiated by a link click.
 *
 * Used by the Instant Navigation Testing API in dev mode to match the
 * fetch strategy of the link during cache-miss navigations.
 */
export declare function getLinkForCurrentNavigation(): LinkInstance | null;
export declare function mountLinkInstance(element: LinkElement, href: string, router: AppRouterInstance, fetchStrategy: PrefetchTaskFetchStrategy, prefetchEnabled: boolean, setOptimisticLinkStatus: (status: {
    pending: boolean;
}) => void, ownerStack: string | null | undefined): LinkInstance;
export declare function mountFormInstance(element: HTMLFormElement, href: string, router: AppRouterInstance, fetchStrategy: PrefetchTaskFetchStrategy): void;
export declare function unmountPrefetchableInstance(element: Element): void;
export declare function onLinkVisibilityChanged(element: Element, isVisible: boolean): void;
export declare function onNavigationIntent(element: HTMLAnchorElement | SVGAElement, unstable_upgradeToDynamicPrefetch: boolean): void;
export declare function pingVisibleLinks(nextUrl: string | null, tree: FlightRouterState): void;
export {};
