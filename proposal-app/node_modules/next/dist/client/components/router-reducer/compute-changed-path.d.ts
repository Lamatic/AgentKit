import type { FlightRouterState, Segment } from '../../../shared/lib/app-router-types';
import type { Params } from '../../../server/request/params';
export declare const segmentToSourcePagePathname: (segment: Segment) => string;
export declare function extractPathFromFlightRouterState(flightRouterState: FlightRouterState): string | undefined;
export declare function extractSourcePageFromFlightRouterState(flightRouterState: FlightRouterState): string | undefined;
export declare function computeChangedPath(treeA: FlightRouterState, treeB: FlightRouterState): string | null;
/**
 * Recursively extracts dynamic parameters from FlightRouterState.
 */
export declare function getSelectedParams(currentTree: FlightRouterState, params?: Params): Params;
