import { jsx as _jsx } from "react/jsx-runtime";
import './app-globals';
import ReactDOMClient from 'react-dom/client';
import React from 'react';
// TODO: Explicitly import from client.browser
// eslint-disable-next-line import/no-extraneous-dependencies
import { createFromReadableStream as createFromReadableStreamBrowser, createFromFetch as createFromFetchBrowser } from 'react-server-dom-webpack/client';
import { HeadManagerContext } from '../shared/lib/head-manager-context.shared-runtime';
import { onRecoverableError } from './react-client-callbacks/on-recoverable-error';
import { onCaughtError, onUncaughtError } from './react-client-callbacks/error-boundary-callbacks';
import { callServer } from './app-call-server';
import { findSourceMapURL } from './app-find-source-map-url';
import { createMutableActionQueue } from './components/app-router-instance';
import AppRouter from './components/app-router';
import { createInitialRouterState } from './components/router-reducer/create-initial-router-state';
import { MissingSlotContext } from '../shared/lib/app-router-context.shared-runtime';
import { createInitialRSCPayloadFromFallbackPrerender } from './flight-data-helpers';
import { getDeploymentId } from '../shared/lib/deployment-id';
import { setNavigationBuildId } from './navigation-build-id';
import { initializeRouterTransitionModules } from './components/router-transition';
/// <reference types="react-dom/experimental" />
const createFromReadableStream = createFromReadableStreamBrowser;
const createFromFetch = createFromFetchBrowser;
const appElement = document;
// Instant Navigation Testing API: captured once at module init. When truthy,
// this is the fetch promise for the static RSC payload (set by an injected
// <script> tag in the static shell HTML).
const instantTestStaticFetch = self.__next_instant_test ? self.__next_instant_test : undefined;
const encoder = new TextEncoder();
let initialServerDataBuffer = undefined;
let initialServerDataWriter = undefined;
let initialServerDataLoaded = false;
let initialServerDataFlushed = false;
let initialFormStateData = null;
function nextServerDataCallback(seg) {
    if (seg[0] === 0) {
        initialServerDataBuffer = [];
    } else if (seg[0] === 1) {
        if (!initialServerDataBuffer) throw Object.defineProperty(new Error('Unexpected server data: missing bootstrap script.'), "__NEXT_ERROR_CODE", {
            value: "E18",
            enumerable: false,
            configurable: true
        });
        if (initialServerDataWriter) {
            initialServerDataWriter.enqueue(encoder.encode(seg[1]));
        } else {
            initialServerDataBuffer.push(seg[1]);
        }
    } else if (seg[0] === 2) {
        initialFormStateData = seg[1];
    } else if (seg[0] === 3) {
        if (!initialServerDataBuffer) throw Object.defineProperty(new Error('Unexpected server data: missing bootstrap script.'), "__NEXT_ERROR_CODE", {
            value: "E18",
            enumerable: false,
            configurable: true
        });
        // Decode the base64 string back to binary data.
        const binaryString = atob(seg[1]);
        const decodedChunk = new Uint8Array(binaryString.length);
        for(var i = 0; i < binaryString.length; i++){
            decodedChunk[i] = binaryString.charCodeAt(i);
        }
        if (initialServerDataWriter) {
            initialServerDataWriter.enqueue(decodedChunk);
        } else {
            initialServerDataBuffer.push(decodedChunk);
        }
    }
}
function isStreamErrorOrUnfinished(ctr) {
    // If `desiredSize` is null, it means the stream is closed or errored. If it is lower than 0, the stream is still unfinished.
    return ctr.desiredSize === null || ctr.desiredSize < 0;
}
// There might be race conditions between `nextServerDataRegisterWriter` and
// `DOMContentLoaded`. The former will be called when React starts to hydrate
// the root, the latter will be called when the DOM is fully loaded.
// For streaming, the former is called first due to partial hydration.
// For non-streaming, the latter can be called first.
// Hence, we use two variables `initialServerDataLoaded` and
// `initialServerDataFlushed` to make sure the writer will be closed and
// `initialServerDataBuffer` will be cleared in the right time.
function nextServerDataRegisterWriter(ctr) {
    if (initialServerDataBuffer) {
        initialServerDataBuffer.forEach((val)=>{
            ctr.enqueue(typeof val === 'string' ? encoder.encode(val) : val);
        });
        if (initialServerDataLoaded && !initialServerDataFlushed) {
            // Instant Navigation Testing API: don't close or error the inline
            // Flight stream. The static shell has no inline Flight data, so the
            // stream is empty. Closing it would cause React to log an error about
            // missing data. Leaving it open lets React treat any holes as
            // "still suspended." Hydration uses the separately fetched RSC payload
            // (self.__next_instant_test), not this stream.
            if (isStreamErrorOrUnfinished(ctr)) {
                if (!instantTestStaticFetch) {
                    ctr.error(Object.defineProperty(new Error('The connection to the page was unexpectedly closed, possibly due to the stop button being clicked, loss of Wi-Fi, or an unstable internet connection.'), "__NEXT_ERROR_CODE", {
                        value: "E117",
                        enumerable: false,
                        configurable: true
                    }));
                }
            } else {
                ctr.close();
            }
            initialServerDataFlushed = true;
            initialServerDataBuffer = undefined;
        }
    }
    initialServerDataWriter = ctr;
}
// When `DOMContentLoaded`, we can close all pending writers to finish hydration.
const DOMContentLoaded = function() {
    if (initialServerDataWriter && !initialServerDataFlushed) {
        initialServerDataWriter.close();
        initialServerDataFlushed = true;
        initialServerDataBuffer = undefined;
    }
    initialServerDataLoaded = true;
};
// It's possible that the DOM is already loaded.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
} else {
    // Delayed in marco task to ensure it's executed later than hydration
    setTimeout(DOMContentLoaded);
}
const nextServerDataLoadingGlobal = self.__next_f = self.__next_f || [];
// Consume all buffered chunks and clear the global data array right after to release memory.
// Otherwise it will be retained indefinitely.
nextServerDataLoadingGlobal.forEach(nextServerDataCallback);
nextServerDataLoadingGlobal.length = 0;
// Patch its push method so subsequent chunks are handled (but not actually pushed to the array).
nextServerDataLoadingGlobal.push = nextServerDataCallback;
let readable = new ReadableStream({
    start (controller) {
        nextServerDataRegisterWriter(controller);
    }
});
if (process.env.NODE_ENV !== 'production') {
    // @ts-expect-error
    readable.name = 'hydration';
}
// When Cache Components is enabled, tee the inlined Flight stream so we can
// truncate a clone at the static stage byte boundary and cache it. We don't
// know if `l` is present until React decodes the payload, so always tee and
// cancel the clone if not needed.
let initialFlightStreamForCache = null;
if (process.env.__NEXT_CACHE_COMPONENTS && process.env.__NEXT_EXPERIMENTAL_CACHED_NAVIGATIONS) {
    const [forReact, forCache] = readable.tee();
    readable = forReact;
    initialFlightStreamForCache = forCache;
}
let debugChannel;
if (process.env.__NEXT_DEV_SERVER && process.env.__NEXT_REACT_DEBUG_CHANNEL && typeof window !== 'undefined') {
    const { createDebugChannel } = // TODO(browser-variant): migrate to a .ts/.browser.ts split so the browser bundle drops the server branch; see scripts/generate-browser-variant-aliases.mjs
    // ast-grep-ignore: no-typeof-window-require-tsx
    require('./dev/debug-channel');
    debugChannel = createDebugChannel(undefined);
}
let initialServerResponse;
if (instantTestStaticFetch) {
    // Instant Navigation Testing API: hydrate from the static RSC payload
    // fetch kicked off by an injected <script> tag, instead of the inline
    // Flight data (which is not present in the static shell).
    initialServerResponse = Promise.resolve(createFromFetch(instantTestStaticFetch, {
        callServer,
        findSourceMapURL,
        debugChannel,
        // The static fetch response is a partial stream (static-only Flight
        // data with no dynamic content). Allow it to close without error so
        // React treats dynamic holes as still-suspended rather than
        // triggering error recovery.
        unstable_allowPartialStream: true
    })).then(async (initialRSCPayload)=>{
        return createInitialRSCPayloadFromFallbackPrerender(await instantTestStaticFetch, initialRSCPayload);
    });
} else if (// @ts-expect-error
window.__NEXT_CLIENT_RESUME) {
    const clientResumeFetch = // @ts-expect-error
    window.__NEXT_CLIENT_RESUME;
    initialServerResponse = Promise.resolve(createFromFetch(clientResumeFetch, {
        callServer,
        findSourceMapURL,
        debugChannel
    })).then(async (fallbackInitialRSCPayload)=>createInitialRSCPayloadFromFallbackPrerender(await clientResumeFetch, fallbackInitialRSCPayload));
} else {
    initialServerResponse = createFromReadableStream(readable, {
        callServer,
        findSourceMapURL,
        debugChannel,
        startTime: 0
    });
}
function ServerRoot({ initialRSCPayload, actionQueue, webSocket, staticIndicatorState }) {
    const router = /*#__PURE__*/ _jsx(AppRouter, {
        actionQueue: actionQueue,
        globalErrorState: initialRSCPayload.G,
        webSocket: webSocket,
        staticIndicatorState: staticIndicatorState
    });
    if (process.env.NODE_ENV === 'development' && initialRSCPayload.m) {
        // We provide missing slot information in a context provider only during development
        // as we log some additional information about the missing slots in the console.
        return /*#__PURE__*/ _jsx(MissingSlotContext, {
            value: initialRSCPayload.m,
            children: router
        });
    }
    return router;
}
const StrictModeIfEnabled = process.env.__NEXT_STRICT_MODE_APP ? React.StrictMode : React.Fragment;
function Root({ children }) {
    if (process.env.__NEXT_TEST_MODE) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(()=>{
            window.__NEXT_HYDRATED = true;
            window.__NEXT_HYDRATED_AT = performance.now();
            window.__NEXT_HYDRATED_CB?.();
        }, []);
    }
    return children;
}
const enableTransitionIndicator = process.env.__NEXT_TRANSITION_INDICATOR;
function noDefaultTransitionIndicator() {
    return ()=>{};
}
const reactRootOptions = {
    onDefaultTransitionIndicator: enableTransitionIndicator ? undefined : noDefaultTransitionIndicator,
    onRecoverableError,
    onCaughtError,
    onUncaughtError
};
export async function hydrate(instrumentationModules, assetPrefix) {
    let staticIndicatorState;
    let webSocket;
    if (process.env.__NEXT_DEV_SERVER) {
        const { createWebSocket } = require('./dev/hot-reloader/app/web-socket');
        staticIndicatorState = {
            pathname: null,
            appIsrManifest: null
        };
        webSocket = createWebSocket(assetPrefix, staticIndicatorState);
    }
    const initialRSCPayload = await initialServerResponse;
    // Initialize the offline module to register browser event listeners
    // (offline/online) before any components hydrate.
    if (process.env.__NEXT_USE_OFFLINE) {
        require('./components/offline');
    }
    // setNavigationBuildId should be called only once, during JS initialization
    // and before any components have hydrated.
    if (initialRSCPayload.b) {
        setNavigationBuildId(initialRSCPayload.b);
    } else {
        setNavigationBuildId(getDeploymentId());
    }
    initializeRouterTransitionModules(instrumentationModules);
    const initialTimestamp = Date.now();
    const actionQueue = createMutableActionQueue(createInitialRouterState({
        navigatedAt: initialTimestamp,
        initialRSCPayload,
        initialFlightStreamForCache,
        location: window.location
    }));
    const reactEl = /*#__PURE__*/ _jsx(StrictModeIfEnabled, {
        children: /*#__PURE__*/ _jsx(HeadManagerContext.Provider, {
            value: {
                appDir: true
            },
            children: /*#__PURE__*/ _jsx(Root, {
                children: /*#__PURE__*/ _jsx(ServerRoot, {
                    initialRSCPayload: initialRSCPayload,
                    actionQueue: actionQueue,
                    webSocket: webSocket,
                    staticIndicatorState: staticIndicatorState
                })
            })
        })
    });
    if (document.documentElement.id === '__next_error__') {
        let element = reactEl;
        // Server rendering failed, fall back to client-side rendering
        if (process.env.NODE_ENV !== 'production') {
            const { RootLevelDevOverlayElement } = require('../next-devtools/userspace/app/client-entry');
            // Note this won't cause hydration mismatch because we are doing CSR w/o hydration
            element = /*#__PURE__*/ _jsx(RootLevelDevOverlayElement, {
                children: element
            });
        }
        ReactDOMClient.createRoot(appElement, reactRootOptions).render(element);
    } else {
        React.startTransition(()=>{
            ReactDOMClient.hydrateRoot(appElement, reactEl, {
                ...reactRootOptions,
                formState: initialFormStateData
            });
        });
    }
    // TODO-APP: Remove this logic when Float has GC built-in in development.
    if (process.env.__NEXT_DEV_SERVER) {
        const { linkGc } = require('./app-link-gc');
        linkGc();
    }
}

//# sourceMappingURL=app-index.js.map