import type { LoaderTree } from '../../lib/app-dir-module';
import type { Segment } from '../../../shared/lib/app-router-types';
import type { InstantSample } from '../../../build/segment-config/app/app-segment-config';
/**
 * True when an unconfigured segment should be treated as implicitly
 * validated under a non-manual default validation level. Only page and
 * default segments qualify — layouts do not validate on their own.
 */
export declare function isImplicitValidationSegment(segment: Segment): boolean;
/**
 * Routes for the framework-synthesized error and not-found entries. They
 * have no user-configurable escape hatch (the framework supplies the page
 * when the user hasn't), so they're excluded from implicit validation under
 * a non-manual default validation level. Even when the user provides their
 * own `global-error` or root `not-found`, these pages are special-purpose
 * error UI — opting them into validation is something the user can do
 * explicitly via `instant`.
 */
export declare function isFrameworkErrorRoute(route: string | undefined): boolean;
/**
 * Matches any `prefetch` config that enables Partial Prefetching for the
 * segment: 'partial' or 'unstable_eager'. A route with Partial Prefetching
 * enabled also runtime-caches its navigations, so this gates the runtime
 * prefetch spawn.
 */
export declare function anySegmentHasPartialPrefetchingEnabled(tree: LoaderTree): Promise<boolean>;
export declare function isPageAllowedToBlock(tree: LoaderTree): Promise<boolean>;
export declare const anySegmentNeedsInstantValidationInDev: (arg: LoaderTree) => Promise<boolean>;
export declare const anySegmentNeedsInstantValidationInBuild: (arg: LoaderTree) => Promise<boolean>;
export declare const resolveInstantConfigSamplesForPage: (tree: LoaderTree) => Promise<InstantSample[] | null>;
