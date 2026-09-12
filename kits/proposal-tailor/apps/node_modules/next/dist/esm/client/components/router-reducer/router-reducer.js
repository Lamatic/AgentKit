import { ACTION_NAVIGATE, ACTION_SERVER_PATCH, ACTION_RESTORE, ACTION_REFRESH, ACTION_HMR_REFRESH, ACTION_SERVER_ACTION } from './router-reducer-types';
import { navigateReducer } from './reducers/navigate-reducer';
import { serverPatchReducer } from './reducers/server-patch-reducer';
import { restoreReducer } from './reducers/restore-reducer';
import { refreshReducer } from './reducers/refresh-reducer';
import { serverActionReducer } from './reducers/server-action-reducer';
/**
 * Reducer that handles the app-router state updates.
 */ function clientReducer(state, action) {
    switch(action.type){
        case ACTION_NAVIGATE:
            {
                return navigateReducer(state, action);
            }
        case ACTION_SERVER_PATCH:
            {
                return serverPatchReducer(state, action);
            }
        case ACTION_RESTORE:
            {
                return restoreReducer(state, action);
            }
        case ACTION_REFRESH:
            {
                return refreshReducer(state, action);
            }
        case ACTION_HMR_REFRESH:
            {
                if (process.env.NODE_ENV === 'development') {
                    const { hmrRefreshReducer } = require('./reducers/hmr-refresh-reducer');
                    return hmrRefreshReducer(state, action);
                } else {
                    throw Object.defineProperty(new Error('hmrRefresh can only be used in development mode. Please use refresh instead.'), "__NEXT_ERROR_CODE", {
                        value: "E485",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
        case ACTION_SERVER_ACTION:
            {
                return serverActionReducer(state, action);
            }
        // This case should never be hit as dispatch is strongly typed.
        default:
            throw Object.defineProperty(new Error('Unknown action'), "__NEXT_ERROR_CODE", {
                value: "E295",
                enumerable: false,
                configurable: true
            });
    }
}
function serverReducer(state, _action) {
    return state;
}
// we don't run the client reducer on the server, so we use a noop function for better tree shaking
export const reducer = typeof window === 'undefined' ? serverReducer : clientReducer;

//# sourceMappingURL=router-reducer.js.map