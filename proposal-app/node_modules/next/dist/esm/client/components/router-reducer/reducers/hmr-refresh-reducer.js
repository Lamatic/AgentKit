import { refreshDynamicData } from './refresh-reducer';
import { FreshnessPolicy } from '../ppr-navigations';
export function hmrRefreshReducer(state, action) {
    // HMR actions may wait behind a Server Action in the router queue. If a newer
    // generation superseded this one before it started, don't install a refresh
    // tree whose request is already canceled.
    if (action.signal?.aborted) {
        return state;
    }
    return refreshDynamicData(state, FreshnessPolicy.HMRRefresh, action.signal);
}

//# sourceMappingURL=hmr-refresh-reducer.js.map