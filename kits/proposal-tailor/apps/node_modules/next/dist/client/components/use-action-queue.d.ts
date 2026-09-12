import type { AppRouterActionQueue } from './app-router-instance';
import { type AppRouterState, type ReducerActions, type ReducerState } from './router-reducer/router-reducer-types';
/**
 * Called when the instant navigation test lock is released. If the router
 * is initialized, dispatches a soft refresh to fetch dynamic data. If not
 * (e.g. the lock was released before hydration finished), falls back to a
 * hard reload.
 */
export declare function refreshOnInstantNavigationUnlock(): void;
export declare function dispatchAppRouterAction(action: ReducerActions): void;
export declare function dispatchGestureState(state: ReducerState): void;
export declare function useActionQueue(actionQueue: AppRouterActionQueue): AppRouterState;
