import type { ReadonlyReducerState, ReducerState, RefreshAction } from '../router-reducer-types';
import { FreshnessPolicy } from '../ppr-navigations';
export declare function refreshReducer(state: ReadonlyReducerState, action: RefreshAction): ReducerState;
export declare function refreshDynamicData(state: ReadonlyReducerState, freshnessPolicy: FreshnessPolicy.RefreshAll | FreshnessPolicy.HMRRefresh, signal: AbortSignal | undefined): ReducerState;
