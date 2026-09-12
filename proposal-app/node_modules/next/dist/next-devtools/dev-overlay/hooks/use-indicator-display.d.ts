import type { CacheIndicatorState } from '../cache-indicator';
import { Status } from '../components/devtools-indicator/status-indicator';
type CacheBadge = 'cold' | 'bypass';
/**
 * What the dev-tools indicator should display right now: either a status pill
 * (rendering/compiling, or the bare logo when `None`) with no cache badge, or a
 * persistent "Cold cache" / "Cache disabled" badge with no pill.
 */
export type IndicatorDisplay = 
/**
 * A status pill (or the bare logo when `None`); no cache badge.
 */
{
    status: Status;
    cacheBadge: null;
}
/**
 * A persistent cache badge; no status pill.
 */
 | {
    status: Status.None;
    cacheBadge: CacheBadge;
};
/**
 * Owns the dev-tools indicator's displayed state as a single state machine,
 * driven by the raw server signals (compiling, rendering, cache status). It
 * absorbs brief activity before showing the rendering pill, bridges compile
 * gaps, and hands the pill off to the persistent cache badge atomically so the
 * indicator never collapses to a bare logo between the two.
 */
export declare function useIndicatorDisplay(building: boolean, rendering: boolean, cacheIndicator: CacheIndicatorState): IndicatorDisplay;
export {};
