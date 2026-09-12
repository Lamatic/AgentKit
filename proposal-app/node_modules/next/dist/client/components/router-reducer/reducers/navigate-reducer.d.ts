import type { NavigateAction, ReadonlyReducerState, ReducerState } from '../router-reducer-types';
export declare const DYNAMIC_STALETIME_MS: number;
export declare const STATIC_STALETIME_MS: number;
export declare function navigateReducer(state: ReadonlyReducerState, action: NavigateAction): ReducerState;
