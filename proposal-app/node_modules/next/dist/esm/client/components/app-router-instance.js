import { ACTION_REFRESH, ACTION_SERVER_ACTION, ACTION_NAVIGATE, ACTION_RESTORE, ACTION_HMR_REFRESH, PrefetchKind, ScrollBehavior } from './router-reducer/router-reducer-types';
import { reducer } from './router-reducer/router-reducer';
import { addTransitionType, startTransition } from 'react';
import { isThenable } from '../../shared/lib/is-thenable';
import { FetchStrategy } from './segment-cache/types';
import { prefetch as prefetchWithSegmentCache } from './segment-cache/prefetch';
import { navigate } from './segment-cache/navigation';
import { dispatchAppRouterAction, dispatchGestureState } from './use-action-queue';
import { resetKnownRoutes } from './segment-cache/optimistic-routes';
import { FreshnessPolicy } from './router-reducer/ppr-navigations';
import { addBasePath } from '../add-base-path';
import { isExternalURL } from './app-router-utils';
import { setLinkForCurrentNavigation } from './links';
import { isJavaScriptURLString } from '../lib/javascript-url';
import { startRouterTransition } from './router-transition';
function runRemainingActions(actionQueue, settledAction, setState) {
    // Only advance the queue if the settled action is still at its head. If a
    // navigation discarded this action, the navigation took its place and is
    // still in flight — starting the next queued action now would run it
    // against router state that doesn't include the navigation yet.
    if (actionQueue.pending === settledAction) {
        actionQueue.pending = settledAction.next;
        if (actionQueue.pending !== null) {
            runAction({
                actionQueue,
                action: actionQueue.pending,
                setState
            });
            return;
        }
    }
    if (actionQueue.pending === null && actionQueue.needsRefresh) {
        // The queue is idle; flush the refresh requested by a discarded server
        // action that revalidated data.
        actionQueue.needsRefresh = false;
        actionQueue.dispatch({
            type: ACTION_REFRESH
        }, setState);
    }
}
async function runAction({ actionQueue, action, setState }) {
    const prevState = actionQueue.state;
    actionQueue.pending = action;
    const payload = action.payload;
    const actionResult = actionQueue.action(prevState, payload);
    function handleResult(nextState) {
        // if we discarded this action, the state should also be discarded
        if (action.discarded) {
            // Check if the discarded server action revalidated data
            if (action.payload.type === ACTION_SERVER_ACTION && action.payload.didRevalidate) {
                // The server action was discarded but it revalidated data,
                // mark that we need to refresh after all actions complete
                actionQueue.needsRefresh = true;
            }
            // This can't advance the queue (this action is no longer its head), but
            // if the queue has already drained, it flushes the refresh now.
            runRemainingActions(actionQueue, action, setState);
            return;
        }
        actionQueue.state = nextState;
        runRemainingActions(actionQueue, action, setState);
        action.resolve(nextState);
    }
    // if the action is a promise, set up a callback to resolve it
    if (isThenable(actionResult)) {
        actionResult.then(handleResult, (err)=>{
            runRemainingActions(actionQueue, action, setState);
            action.reject(err);
        });
    } else {
        handleResult(actionResult);
    }
}
function dispatchAction(actionQueue, payload, setState) {
    let resolvers = {
        resolve: setState,
        reject: ()=>{}
    };
    // most of the action types are async with the exception of restore
    // it's important that restore is handled quickly since it's fired on the popstate event
    // and we don't want to add any delay on a back/forward nav
    // this only creates a promise for the async actions
    if (payload.type !== ACTION_RESTORE) {
        // Create the promise and assign the resolvers to the object.
        const deferredPromise = new Promise((resolve, reject)=>{
            resolvers = {
                resolve,
                reject
            };
        });
        startTransition(()=>{
            // we immediately notify React of the pending promise -- the resolver is attached to the action node
            // and will be called when the associated action promise resolves
            setState(deferredPromise);
        });
    }
    const newAction = {
        payload,
        next: null,
        resolve: resolvers.resolve,
        reject: resolvers.reject
    };
    // Check if the queue is empty
    if (actionQueue.pending === null) {
        // The queue is empty, so add the action and start it immediately
        // Mark this action as the last in the queue
        actionQueue.last = newAction;
        runAction({
            actionQueue,
            action: newAction,
            setState
        });
    } else if (payload.type === ACTION_NAVIGATE || payload.type === ACTION_RESTORE) {
        // Navigations (including back/forward) take priority over any pending actions.
        // Mark the pending action as discarded (so the state is never applied) and start the navigation action immediately.
        actionQueue.pending.discarded = true;
        // The rest of the current queue should still execute after this navigation.
        // (Note that it can't contain any earlier navigations, because we always put those into `actionQueue.pending` by calling `runAction`)
        newAction.next = actionQueue.pending.next;
        if (actionQueue.last === actionQueue.pending) {
            actionQueue.last = newAction;
        }
        runAction({
            actionQueue,
            action: newAction,
            setState
        });
    } else {
        // The queue is not empty, so add the action to the end of the queue
        // It will be started by runRemainingActions after the previous action finishes
        if (actionQueue.last !== null) {
            actionQueue.last.next = newAction;
        }
        actionQueue.last = newAction;
    }
}
let globalActionQueue = null;
export function createMutableActionQueue(initialState) {
    const actionQueue = {
        state: initialState,
        dispatch: (payload, setState)=>dispatchAction(actionQueue, payload, setState),
        action: async (state, action)=>{
            const result = reducer(state, action);
            return result;
        },
        pending: null,
        last: null
    };
    if (typeof window !== 'undefined') {
        // The action queue is lazily created on hydration, but after that point
        // it doesn't change. So we can store it in a global rather than pass
        // it around everywhere via props/context.
        if (globalActionQueue !== null) {
            throw Object.defineProperty(new Error('Internal Next.js Error: createMutableActionQueue was called more ' + 'than once'), "__NEXT_ERROR_CODE", {
                value: "E624",
                enumerable: false,
                configurable: true
            });
        }
        globalActionQueue = actionQueue;
    }
    return actionQueue;
}
export function getCurrentAppRouterState() {
    return globalActionQueue !== null ? globalActionQueue.state : null;
}
function getAppRouterActionQueue() {
    if (globalActionQueue === null) {
        throw Object.defineProperty(new Error('Internal Next.js error: Router action dispatched before initialization.'), "__NEXT_ERROR_CODE", {
            value: "E668",
            enumerable: false,
            configurable: true
        });
    }
    return globalActionQueue;
}
export function dispatchNavigateAction(href, navigateType, scrollBehavior, linkInstanceRef, transitionTypes, prefetchIntent) {
    // TODO: This stuff could just go into the reducer. Leaving as-is for now
    // since we're about to rewrite all the router reducer stuff anyway.
    if (transitionTypes) {
        for (const type of transitionTypes){
            addTransitionType(type);
        }
    }
    const url = new URL(addBasePath(href), location.href);
    if (process.env.__NEXT_APP_NAV_FAIL_HANDLING) {
        window.next.__pendingUrl = url;
    }
    setLinkForCurrentNavigation(linkInstanceRef);
    startRouterTransition(href, navigateType, getAppRouterActionQueue().state.tree, prefetchIntent);
    dispatchAppRouterAction({
        type: ACTION_NAVIGATE,
        url,
        isExternalUrl: isExternalURL(url),
        locationSearch: location.search,
        scrollBehavior,
        navigateType
    });
}
export function dispatchTraverseAction(href, historyState) {
    startRouterTransition(href, 'traverse', getAppRouterActionQueue().state.tree, null);
    dispatchAppRouterAction({
        type: ACTION_RESTORE,
        url: new URL(href),
        historyState
    });
}
/**
 * (Experimental) Perform a gesture navigation. This dispatches through React's
 * useOptimistic instead of the main action queue, allowing the state to be
 * shown during a gesture transition and discarded when the canonical navigation
 * completes.
 *
 * Only available when experimental.gestureTransition is enabled.
 */ function gesturePush(href, options) {
    if (process.env.__NEXT_GESTURE_TRANSITION) {
        // TODO: Trigger a prefetch so the cache starts populating if there isn't
        // already a prefetch for this route.
        if (isJavaScriptURLString(href)) {
            throw Object.defineProperty(new Error('Next.js has blocked a javascript: URL as a security precaution.'), "__NEXT_ERROR_CODE", {
                value: "E978",
                enumerable: false,
                configurable: true
            });
        }
        const state = getCurrentAppRouterState();
        if (state === null) {
            return;
        }
        const url = new URL(addBasePath(href), location.href);
        if (isExternalURL(url)) {
            return;
        }
        // Fork the router state for the duration of the gesture transition.
        const currentUrl = new URL(state.canonicalUrl, location.href);
        const scrollBehavior = options?.scroll === false ? ScrollBehavior.NoScroll : ScrollBehavior.Default;
        // This is a special freshness policy that prevents dynamic requests from
        // being spawned. During the gesture, we should only show the cached
        // prefetched UI, not dynamic data.
        // TODO: In the case of navigations to an unknown route, this will still
        // end up performing a dynamic request. The plan is to do prefetch instead.
        // There's a separate TODO for this.
        const freshnessPolicy = FreshnessPolicy.Gesture;
        const forkedGestureState = navigate(state, url, currentUrl, state.renderedSearch, state.cache, state.tree, state.nextUrl, freshnessPolicy, scrollBehavior, 'push');
        dispatchGestureState(forkedGestureState);
    }
}
// Tracks the newest HMR refresh generation so that a newer refresh can abort
// the request of the one it supersedes. Development only.
let activeHmrRefreshController = null;
/**
 * The app router that is exposed through `useRouter`. These are public API
 * methods. Internal Next.js code should call the lower level methods directly
 * (although there's lots of existing code that doesn't do that).
 */ export const publicAppRouterInstance = {
    back: ()=>window.history.back(),
    forward: ()=>window.history.forward(),
    prefetch: // Unlike the old implementation, the Segment Cache doesn't store its
    // data in the router reducer state; it writes into a global mutable
    // cache. So we don't need to dispatch an action.
    (href, options)=>{
        if (isJavaScriptURLString(href)) {
            throw Object.defineProperty(new Error('Next.js has blocked a javascript: URL as a security precaution.'), "__NEXT_ERROR_CODE", {
                value: "E978",
                enumerable: false,
                configurable: true
            });
        }
        const actionQueue = getAppRouterActionQueue();
        const prefetchKind = options?.kind ?? PrefetchKind.AUTO;
        // We don't currently offer a way to issue a runtime prefetch via `router.prefetch()`.
        // This will be possible when we update its API to not take a PrefetchKind.
        let fetchStrategy;
        switch(prefetchKind){
            case PrefetchKind.AUTO:
                {
                    // We default to PPR. We'll discover whether or not the route supports it with the initial prefetch.
                    fetchStrategy = FetchStrategy.PPR;
                    break;
                }
            case PrefetchKind.FULL:
                {
                    fetchStrategy = FetchStrategy.Full;
                    break;
                }
            default:
                {
                    prefetchKind;
                    // Despite typescript thinking that this can't happen,
                    // we might get an unexpected value from user code.
                    // We don't know what they want, but we know they want a prefetch,
                    // so use the default.
                    fetchStrategy = FetchStrategy.PPR;
                }
        }
        prefetchWithSegmentCache(href, actionQueue.state.nextUrl, actionQueue.state.tree, fetchStrategy, options?.onInvalidate ?? null);
    },
    replace: (href, options)=>{
        if (isJavaScriptURLString(href)) {
            throw Object.defineProperty(new Error('Next.js has blocked a javascript: URL as a security precaution.'), "__NEXT_ERROR_CODE", {
                value: "E978",
                enumerable: false,
                configurable: true
            });
        }
        startTransition(()=>{
            dispatchNavigateAction(href, 'replace', options?.scroll === false ? ScrollBehavior.NoScroll : ScrollBehavior.Default, null, options?.transitionTypes, null);
        });
    },
    push: (href, options)=>{
        if (isJavaScriptURLString(href)) {
            throw Object.defineProperty(new Error('Next.js has blocked a javascript: URL as a security precaution.'), "__NEXT_ERROR_CODE", {
                value: "E978",
                enumerable: false,
                configurable: true
            });
        }
        startTransition(()=>{
            dispatchNavigateAction(href, 'push', options?.scroll === false ? ScrollBehavior.NoScroll : ScrollBehavior.Default, null, options?.transitionTypes, null);
        });
    },
    refresh: ()=>{
        startTransition(()=>{
            dispatchAppRouterAction({
                type: ACTION_REFRESH
            });
        });
    },
    hmrRefresh: ()=>{
        if (process.env.NODE_ENV !== 'development') {
            throw Object.defineProperty(new Error('hmrRefresh can only be used in development mode. Please use refresh instead.'), "__NEXT_ERROR_CODE", {
                value: "E485",
                enumerable: false,
                configurable: true
            });
        } else {
            // Reset the known routes table so that route predictions are cleared
            // when routes change during development.
            resetKnownRoutes();
            let signal;
            if (process.env.__NEXT_SERVER_COMPONENTS_HMR_CANCELLATION) {
                // Abort the superseded generation before scheduling the new one, so its
                // request is torn down as early as possible. Halting (not rejecting)
                // makes the abort safe regardless of order.
                activeHmrRefreshController?.abort();
                activeHmrRefreshController = new AbortController();
                signal = activeHmrRefreshController.signal;
            }
            startTransition(()=>{
                dispatchAppRouterAction({
                    type: ACTION_HMR_REFRESH,
                    signal
                });
            });
        }
    },
    // Default value. Each route segment provides its own value at runtime. Refer
    // to `useRouter()`.
    bfcacheId: '0'
};
// Conditionally add experimental_gesturePush when gestureTransition is enabled
if (process.env.__NEXT_GESTURE_TRANSITION) {
    ;
    publicAppRouterInstance.experimental_gesturePush = gesturePush;
}
// Exists for debugging purposes. Don't use in application code.
if (typeof window !== 'undefined' && window.next) {
    window.next.router = publicAppRouterInstance;
}

//# sourceMappingURL=app-router-instance.js.map