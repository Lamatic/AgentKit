import type { FlightRouterState } from '../../shared/lib/app-router-types';
import type { ClientInstrumentationModules, RouterTransitionPrefetchIntent, RouterTransitionType } from '../router-transition-types';
export declare function initializeRouterTransitionModules(modules: ClientInstrumentationModules): void;
export declare function startRouterTransition(url: string, type: RouterTransitionType, fromTree: FlightRouterState, prefetchIntent: RouterTransitionPrefetchIntent | null): void;
