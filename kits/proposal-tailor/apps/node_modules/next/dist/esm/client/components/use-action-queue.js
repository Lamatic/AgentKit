import React, { use, useMemo, useOptimistic } from 'react';
import { isThenable } from '../../shared/lib/is-thenable';
import { ACTION_REFRESH } from './router-reducer/router-reducer-types';
// The app router state lives outside of React, so we can import the dispatch
// method directly wherever we need it, rather than passing it around via props
// or context.
let dispatch = null;
/**
 * Called when the instant navigation test lock is released. If the router
 * is initialized, dispatches a soft refresh to fetch dynamic data. If not
 * (e.g. the lock was released before hydration finished), falls back to a
 * hard reload.
 */ export function refreshOnInstantNavigationUnlock() {
    if (process.env.__NEXT_EXPOSE_TESTING_API) {
        if (dispatch !== null) {
            dispatch({
                type: ACTION_REFRESH,
                bypassCacheInvalidation: true
            });
        } else {
            window.location.reload();
        }
    }
}
export function dispatchAppRouterAction(action) {
    if (dispatch === null) {
        throw Object.defineProperty(new Error('Internal Next.js error: Router action dispatched before initialization.'), "__NEXT_ERROR_CODE", {
            value: "E668",
            enumerable: false,
            configurable: true
        });
    }
    dispatch(action);
}
// Optimistic state setter for experimental_gesturePush. Only should be used
// during a gesture transition.
let setGestureRouterState = null;
export function dispatchGestureState(state) {
    if (setGestureRouterState === null) {
        throw Object.defineProperty(new Error('Internal Next.js error: Router action dispatched before initialization.'), "__NEXT_ERROR_CODE", {
            value: "E668",
            enumerable: false,
            configurable: true
        });
    }
    setGestureRouterState(state);
}
const __DEV__ = process.env.NODE_ENV !== 'production';
const promisesWithDebugInfo = __DEV__ ? new WeakMap() : null;
export function useActionQueue(actionQueue) {
    const [canonicalState, setState] = React.useState(actionQueue.state);
    // Wrap the canonical state in useOptimistic to support
    // experimental_gesturePush. During a gesture transition, this returns a fork
    // of the router state that represents the eventual target if/when the gesture
    // completes. Otherwise it returns the canonical state.
    const [state, setGesture] = useOptimistic(canonicalState);
    if (typeof window !== 'undefined') {
        setGestureRouterState = setGesture;
    }
    // Because of a known issue that requires to decode Flight streams inside the
    // render phase, we have to be a bit clever and assign the dispatch method to
    // a module-level variable upon initialization. The useState hook in this
    // module only exists to synchronize state that lives outside of React.
    // Ideally, what we'd do instead is pass the state as a prop to root.render;
    // this is conceptually how we're modeling the app router state, despite the
    // weird implementation details.
    let nextDispatch;
    if (process.env.NODE_ENV !== 'production') {
        const { useAppDevRenderingIndicator } = require('../../next-devtools/userspace/use-app-dev-rendering-indicator');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appDevRenderingIndicator = useAppDevRenderingIndicator();
        nextDispatch = (action)=>{
            appDevRenderingIndicator(()=>{
                actionQueue.dispatch(action, setState);
            });
        };
    } else {
        nextDispatch = (action)=>actionQueue.dispatch(action, setState);
    }
    if (typeof window !== 'undefined') {
        dispatch = nextDispatch;
    }
    // When navigating to a non-prefetched route, then App Router state will be
    // blocked until the server responds. We need to transfer the `_debugInfo`
    // from the underlying Flight response onto the top-level promise that is
    // passed to React (via `use`) so that the latency is accurately represented
    // in the React DevTools.
    const stateWithDebugInfo = useMemo(()=>{
        if (!__DEV__) {
            return state;
        }
        if (isThenable(state)) {
            // useMemo can't be used to cache a Promise since the memoized value is thrown
            // away when we suspend. So we use a WeakMap to cache the Promise with debug info.
            let promiseWithDebugInfo = promisesWithDebugInfo.get(state);
            if (promiseWithDebugInfo === undefined) {
                const debugInfo = [];
                promiseWithDebugInfo = Promise.resolve(state).then((asyncState)=>{
                    if (asyncState.debugInfo !== null) {
                        debugInfo.push(...asyncState.debugInfo);
                    }
                    return asyncState;
                });
                promiseWithDebugInfo._debugInfo = debugInfo;
                promisesWithDebugInfo.set(state, promiseWithDebugInfo);
            }
            return promiseWithDebugInfo;
        }
        return state;
    }, [
        state
    ]);
    return isThenable(stateWithDebugInfo) ? use(stateWithDebugInfo) : stateWithDebugInfo;
}

//# sourceMappingURL=use-action-queue.js.map