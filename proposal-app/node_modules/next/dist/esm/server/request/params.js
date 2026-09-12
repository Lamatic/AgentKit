import { workAsyncStorage } from '../app-render/work-async-storage.external';
import { createVaryingParams, getMetadataVaryParamsAccumulator } from '../app-render/vary-params';
import { ReflectAdapter } from '../web/spec-extension/adapters/reflect';
import { throwToInterruptStaticGeneration, postponeWithTracking } from '../app-render/dynamic-rendering';
import { workUnitAsyncStorage, throwInvariantForMissingStore } from '../app-render/work-unit-async-storage.external';
import { InvariantError } from '../../shared/lib/invariant-error';
import { describeStringPropertyAccess, wellKnownProperties } from '../../shared/lib/utils/reflect-utils';
import { makeDevtoolsIOAwarePromise, makeFallbackParamsHangingPromise, makePromiseFromTrigger, trackFallbackParamsAccessed, RENDER_STAGES_BY_DATA_KIND } from '../dynamic-rendering-utils';
import { createDedupedByCallsiteServerErrorLoggerDev } from '../create-deduped-by-callsite-server-error-logger';
import { dynamicAccessAsyncStorage } from '../app-render/dynamic-access-async-storage.external';
import { isEmptyParams, hasFallbackRouteParams, allParamsAreRootParams } from '../lib/params-utils';
export function createParamsFromClient(underlyingParams) {
    const workStore = workAsyncStorage.getStore();
    if (!workStore) {
        throw Object.defineProperty(new InvariantError('Expected workStore to be initialized'), "__NEXT_ERROR_CODE", {
            value: "E1068",
            enumerable: false,
            configurable: true
        });
    }
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workUnitStore) {
        switch(workUnitStore.type){
            case 'prerender':
            case 'prerender-client':
            case 'prerender-ppr':
            case 'prerender-legacy':
                // Client params don't need additional vary tracking because by the
                // time they reach the client, the access would have already been
                // tracked by the server.
                const varyParamsAccumulator = null;
                return createStaticPrerenderParams(underlyingParams, null, workStore, workUnitStore, varyParamsAccumulator);
            case 'cache':
            case 'private-cache':
            case 'unstable-cache':
                throw Object.defineProperty(new InvariantError('createParamsFromClient should not be called in cache contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E736",
                    enumerable: false,
                    configurable: true
                });
            case 'prerender-runtime':
                throw Object.defineProperty(new InvariantError('createParamsFromClient should not be called in a runtime prerender.'), "__NEXT_ERROR_CODE", {
                    value: "E770",
                    enumerable: false,
                    configurable: true
                });
            case 'generate-static-params':
                throw Object.defineProperty(new InvariantError('createParamsFromClient should not be called inside generateStaticParams.'), "__NEXT_ERROR_CODE", {
                    value: "E1122",
                    enumerable: false,
                    configurable: true
                });
            case 'validation-client':
                {
                    if (workUnitStore.validationSamples) {
                        return createClientParamsInInstantValidation(underlyingParams, workStore, workUnitStore.validationSamples);
                    }
                    return makeUntrackedParams(underlyingParams);
                }
            case 'request':
                {
                    if (workUnitStore.validationSamples) {
                        return createClientParamsInInstantValidation(underlyingParams, workStore, workUnitStore.validationSamples);
                    }
                    if (process.env.NODE_ENV === 'development') {
                        const fallbackParams = workUnitStore.fallbackParams;
                        const userspaceParams = underlyingParams;
                        return createRenderParamsInDev(underlyingParams, userspaceParams, fallbackParams, workStore, workUnitStore);
                    } else {
                        return createRenderParamsInProd(underlyingParams);
                    }
                }
            default:
                workUnitStore;
        }
    }
    throwInvariantForMissingStore();
}
export function createServerParamsForMetadata(underlyingParams, optionalCatchAllParamName) {
    const metadataVaryParamsAccumulator = getMetadataVaryParamsAccumulator();
    return createServerParamsForServerSegment(underlyingParams, optionalCatchAllParamName, metadataVaryParamsAccumulator);
}
// routes always runs in RSC context so it is equivalent to a Server Page Component
export function createServerParamsForRoute(underlyingParams, varyParamsAccumulator = null) {
    const workStore = workAsyncStorage.getStore();
    if (!workStore) {
        throw Object.defineProperty(new InvariantError('Expected workStore to be initialized'), "__NEXT_ERROR_CODE", {
            value: "E1068",
            enumerable: false,
            configurable: true
        });
    }
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workUnitStore) {
        switch(workUnitStore.type){
            case 'prerender':
            case 'prerender-ppr':
            case 'prerender-legacy':
                return createStaticPrerenderParams(underlyingParams, null, workStore, workUnitStore, varyParamsAccumulator);
            case 'prerender-client':
            case 'validation-client':
                throw Object.defineProperty(new InvariantError('createServerParamsForRoute should not be called in client contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E1064",
                    enumerable: false,
                    configurable: true
                });
            case 'cache':
            case 'private-cache':
            case 'unstable-cache':
                throw Object.defineProperty(new InvariantError('createServerParamsForRoute should not be called in cache contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E738",
                    enumerable: false,
                    configurable: true
                });
            case 'generate-static-params':
                throw Object.defineProperty(new InvariantError('createServerParamsForRoute should not be called inside generateStaticParams.'), "__NEXT_ERROR_CODE", {
                    value: "E1131",
                    enumerable: false,
                    configurable: true
                });
            case 'prerender-runtime':
                {
                    throw Object.defineProperty(new InvariantError('createServerParamsForRoute should not be called in runtime prerenders.'), "__NEXT_ERROR_CODE", {
                        value: "E1367",
                        enumerable: false,
                        configurable: true
                    });
                }
            case 'request':
                if (process.env.NODE_ENV === 'development') {
                    const fallbackParams = workUnitStore.fallbackParams;
                    const userspaceParams = underlyingParams;
                    return createRenderParamsInDev(underlyingParams, userspaceParams, fallbackParams, workStore, workUnitStore);
                } else {
                    return createRenderParamsInProd(underlyingParams);
                }
            default:
                workUnitStore;
        }
    }
    throwInvariantForMissingStore();
}
export function createServerParamsForServerSegment(underlyingParams, optionalCatchAllParamName, varyParamsAccumulator) {
    const workStore = workAsyncStorage.getStore();
    if (!workStore) {
        throw Object.defineProperty(new InvariantError('Expected workStore to be initialized'), "__NEXT_ERROR_CODE", {
            value: "E1068",
            enumerable: false,
            configurable: true
        });
    }
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workUnitStore) {
        switch(workUnitStore.type){
            case 'prerender':
            case 'prerender-client':
            case 'prerender-ppr':
            case 'prerender-legacy':
                return createStaticPrerenderParams(underlyingParams, optionalCatchAllParamName, workStore, workUnitStore, varyParamsAccumulator);
            case 'validation-client':
                throw Object.defineProperty(new InvariantError('createServerParamsForServerSegment should not be called in client contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E1101",
                    enumerable: false,
                    configurable: true
                });
            case 'cache':
            case 'private-cache':
            case 'unstable-cache':
                throw Object.defineProperty(new InvariantError('createServerParamsForServerSegment should not be called in cache contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E743",
                    enumerable: false,
                    configurable: true
                });
            case 'generate-static-params':
                throw Object.defineProperty(new InvariantError('createServerParamsForServerSegment should not be called inside generateStaticParams.'), "__NEXT_ERROR_CODE", {
                    value: "E1120",
                    enumerable: false,
                    configurable: true
                });
            case 'prerender-runtime':
                return createRuntimePrerenderParams(underlyingParams, optionalCatchAllParamName, workStore, workUnitStore, varyParamsAccumulator);
            case 'request':
                {
                    return createRenderParamsForPage(workStore, workUnitStore, underlyingParams, optionalCatchAllParamName, varyParamsAccumulator);
                }
            default:
                workUnitStore;
        }
    }
    throwInvariantForMissingStore();
}
export function createPrerenderParamsForClientSegment(underlyingParams) {
    const workStore = workAsyncStorage.getStore();
    if (!workStore) {
        throw Object.defineProperty(new InvariantError('Missing workStore in createPrerenderParamsForClientSegment'), "__NEXT_ERROR_CODE", {
            value: "E773",
            enumerable: false,
            configurable: true
        });
    }
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workUnitStore) {
        switch(workUnitStore.type){
            case 'prerender':
            case 'prerender-client':
                const fallbackParams = workUnitStore.fallbackRouteParams;
                if (fallbackParams) {
                    for(let key in underlyingParams){
                        if (fallbackParams.has(key)) {
                            // This params object has one or more fallback params, so we need
                            // to consider the awaiting of this params object "dynamic". Since
                            // we are in cacheComponents mode we encode this as a promise that never
                            // resolves.
                            return makeFallbackParamsHangingPromise(workUnitStore.renderSignal, workStore.route, '`params`', workUnitStore);
                        }
                    }
                }
                break;
            case 'validation-client':
                throw Object.defineProperty(new InvariantError('createPrerenderParamsForClientSegment should not be called in validation contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E1099",
                    enumerable: false,
                    configurable: true
                });
                break;
            case 'cache':
            case 'private-cache':
            case 'unstable-cache':
                throw Object.defineProperty(new InvariantError('createPrerenderParamsForClientSegment should not be called in cache contexts.'), "__NEXT_ERROR_CODE", {
                    value: "E734",
                    enumerable: false,
                    configurable: true
                });
            case 'generate-static-params':
                throw Object.defineProperty(new InvariantError('createPrerenderParamsForClientSegment should not be called inside generateStaticParams.'), "__NEXT_ERROR_CODE", {
                    value: "E1126",
                    enumerable: false,
                    configurable: true
                });
            case 'prerender-runtime':
            case 'prerender-ppr':
            case 'prerender-legacy':
            case 'request':
                break;
            default:
                workUnitStore;
        }
    }
    // We're prerendering in a mode that does not abort. We resolve the promise without
    // any tracking because we're just transporting a value from server to client where the tracking
    // will be applied.
    return Promise.resolve(underlyingParams);
}
function createStaticPrerenderParams(underlyingParams, optionalCatchAllParamName, workStore, prerenderStore, varyParamsAccumulator) {
    switch(prerenderStore.type){
        case 'prerender':
            {
                let userspaceParams = underlyingParams;
                if (varyParamsAccumulator !== null) {
                    userspaceParams = createVaryingParams(varyParamsAccumulator, underlyingParams, optionalCatchAllParamName);
                }
                if (isEmptyParams(underlyingParams)) {
                    // This route has no params.
                    return makeUntrackedParams(userspaceParams);
                }
                const fallbackParams = prerenderStore.fallbackRouteParams;
                if (hasFallbackRouteParams(underlyingParams, fallbackParams)) {
                    // This params object has one or more fallback params, so we need
                    // to consider the awaiting of this params object dynamic.
                    return makeHangingParams(underlyingParams, workStore, prerenderStore);
                }
                // All params are static.
                const { stagedRendering } = prerenderStore;
                if (stagedRendering) {
                    // Even if all params are static, we need to exclude them from the app shell
                    // by delaying them to the static stage. However, root params are allowed in shells,
                    // so if all the params are root params, they can be included as well.
                    if (!allParamsAreRootParams(underlyingParams, prerenderStore.rootParams)) {
                        const staticParamsStage = RENDER_STAGES_BY_DATA_KIND.staticLinkData;
                        return stagedRendering.delayUntilStage(staticParamsStage, 'params', userspaceParams);
                    }
                }
                return makeUntrackedParams(userspaceParams);
            }
        case 'prerender-client':
            {
                const fallbackParams = prerenderStore.fallbackRouteParams;
                if (fallbackParams) {
                    for(const key in underlyingParams){
                        if (fallbackParams.has(key)) {
                            // This params object has one or more fallback params, so we need
                            // to consider the awaiting of this params object "dynamic". Since
                            // we are in cacheComponents mode we encode this as a promise that never
                            // resolves.
                            return makeHangingParams(underlyingParams, workStore, prerenderStore);
                        }
                    }
                }
                break;
            }
        case 'prerender-ppr':
            {
                const fallbackParams = prerenderStore.fallbackRouteParams;
                if (fallbackParams) {
                    for(const key in underlyingParams){
                        if (fallbackParams.has(key)) {
                            return makeErroringParams(underlyingParams, fallbackParams, workStore, prerenderStore);
                        }
                    }
                }
                break;
            }
        case 'prerender-legacy':
            break;
        default:
            prerenderStore;
    }
    let userspaceParams = underlyingParams;
    if (varyParamsAccumulator !== null) {
        userspaceParams = createVaryingParams(varyParamsAccumulator, underlyingParams, optionalCatchAllParamName);
    }
    return makeUntrackedParams(userspaceParams);
}
function createRuntimePrerenderParams(underlyingParams, optionalCatchAllParamName, workStore, workUnitStore, varyParamsAccumulator) {
    let userspaceParams = underlyingParams;
    if (varyParamsAccumulator !== null) {
        userspaceParams = createVaryingParams(varyParamsAccumulator, underlyingParams, optionalCatchAllParamName);
    }
    if (isEmptyParams(underlyingParams)) {
        // This route has no params.
        return makeUntrackedParams(userspaceParams);
    }
    const { stagedRendering } = workUnitStore;
    if (!stagedRendering) {
        // If there's no staging, we're in a prospective runtime prerender.
        if (workUnitStore.isSessionShell) {
            // If we're warming up for a session shell, params should be hanging,
            // because they'll be a hanging input in the final prerender.
            return makeHangingParams(underlyingParams, workStore, workUnitStore);
        } else {
            return makeUntrackedParams(userspaceParams);
        }
    }
    // We don't have fallbackParams in runtime prerenders, so we don't know
    // when params are static. However, root params are static by definition,
    // so we can at least check for that.
    // Note that resolving them without a delay is valid because root params are
    // allowed in shells.
    if (allParamsAreRootParams(underlyingParams, workUnitStore.rootParams)) {
        return makeUntrackedParams(userspaceParams);
    }
    // Semantically, we should resolve static params in the static stage.
    // But params are link data, and we need to recover a param-less session shell,
    // so we delay all params until the runtime stage instead.
    const staticParamsStage = RENDER_STAGES_BY_DATA_KIND.runtimeLinkData;
    return stagedRendering.delayUntilStage(staticParamsStage, 'params', userspaceParams);
}
function createRenderParamsForPage(workStore, workUnitStore, underlyingParams, optionalCatchAllParamName, varyParamsAccumulator) {
    const { stagedRendering, asyncApiPromises, validationSamples } = workUnitStore;
    // Distinguish the params that we expose to userspace (potentially wrapped in proxies)
    // and the underlying object containing params values. We do this because wrappers
    // like `instrumentParamsPromiseWithDevWarnings` need to be able to get the known param names
    // without triggering other wrapper proxies.
    let userspaceParams = underlyingParams;
    if (validationSamples) {
        userspaceParams = createServerParamsProxyForInstantValidation(underlyingParams, workStore, validationSamples);
    }
    if (varyParamsAccumulator) {
        userspaceParams = createVaryingParams(varyParamsAccumulator, userspaceParams, optionalCatchAllParamName);
    }
    if (stagedRendering && asyncApiPromises) {
        return createStagedRenderParams(workStore, workUnitStore, stagedRendering, asyncApiPromises, underlyingParams, userspaceParams);
    }
    // No staged rendering = no cacheComponents, or cacheComponents prod without cachedNavigations
    if (process.env.NODE_ENV === 'development') {
        const fallbackParams = workUnitStore.fallbackParams;
        return createRenderParamsInDev(underlyingParams, userspaceParams, fallbackParams, workStore, workUnitStore);
    } else {
        return createRenderParamsInProd(userspaceParams);
    }
}
function createStagedRenderParams(workStore, workUnitStore, stagedRendering, asyncApiPromises, underlyingParams, userspaceParams) {
    const promise = createStagedRenderParamsImpl(workUnitStore, stagedRendering, asyncApiPromises, underlyingParams, userspaceParams);
    if (process.env.NODE_ENV === 'development') {
        return instrumentParamsPromiseWithDevWarnings(underlyingParams, promise, workStore);
    } else {
        return promise;
    }
}
function createStagedRenderParamsImpl(workUnitStore, stagedRendering, asyncApiPromises, /** The actual param values, without any instrumentation */ underlyingParams, /** The params object to return to userspace, possibly wrapped in a proxy */ userspaceParams) {
    // If the route has no params, they should resolve immediately.
    if (isEmptyParams(underlyingParams)) {
        return makeUntrackedParams(userspaceParams);
    }
    // If we have fallback params, then they should always resolve in the runtime link data stage.
    // We do this indirectly via the shared params parent for better debug info.
    if (hasFallbackRouteParams(underlyingParams, workUnitStore.fallbackParams)) {
        return createParamsPromiseFromTrigger(asyncApiPromises.sharedParamsParent, userspaceParams);
    }
    // All params are static.
    // If we're rendering with shells, even static params must be delayed to exclude them from the shell.
    // However, root params are allowed in shells, so if all the params are root params, they can be included as well.
    if (!allParamsAreRootParams(underlyingParams, workUnitStore.rootParams)) {
        // For a dynamic request we generally want to recover a static shell,
        // so static params can resolve in the static stage, because session
        // shells are handled with a separate render.
        // However, in dev we might need to recover a session shell for instant validation.
        // This is indicated by `needsSessionShell`.
        const staticParamsStage = workUnitStore.needsSessionShell ? RENDER_STAGES_BY_DATA_KIND.runtimeLinkData : RENDER_STAGES_BY_DATA_KIND.staticLinkData;
        return stagedRendering.delayUntilStage(staticParamsStage, 'params', userspaceParams);
    }
    return makeUntrackedParams(userspaceParams);
}
function createParamsPromiseFromTrigger(trigger, userspaceParams) {
    if (process.env.NODE_ENV === 'development') {
        // We wrap each instance of params in a `new Promise()`, which lets us show each
        // await a different set of values. This is important when all awaits
        // are in third party which would otherwise track all the way to the
        // internal params.
        const promise = new Promise((resolve, reject)=>{
            trigger.then(()=>resolve(userspaceParams), reject);
        });
        promise.catch(noop);
        // @ts-expect-error
        promise.displayName = 'params';
        return promise;
    } else {
        return makePromiseFromTrigger(trigger, userspaceParams);
    }
}
function noop() {}
function createServerParamsProxyForInstantValidation(underlyingParams, workStore, validationSamples) {
    const { createExhaustiveParamsProxy } = require('../app-render/instant-validation/instant-samples');
    const declaredParams = new Set(Object.keys(validationSamples.params ?? {}));
    return createExhaustiveParamsProxy(underlyingParams, declaredParams, workStore.route);
}
function createClientParamsInInstantValidation(underlyingParams, workStore, validationSamples) {
    const { createExhaustiveParamsProxy } = require('../app-render/instant-validation/instant-samples');
    const declaredParams = new Set(Object.keys((validationSamples == null ? void 0 : validationSamples.params) ?? {}));
    const proxiedUnderlying = createExhaustiveParamsProxy(underlyingParams, declaredParams, workStore.route);
    return Promise.resolve(proxiedUnderlying);
}
function createRenderParamsInProd(userspaceParams) {
    return makeUntrackedParams(userspaceParams);
}
function createRenderParamsInDev(underlyingParams, userpaceParams, fallbackParams, workStore, requestStore) {
    return makeDynamicallyTrackedParamsWithDevWarnings(underlyingParams, userpaceParams, hasFallbackRouteParams(underlyingParams, fallbackParams), workStore, requestStore);
}
const CachedParams = new WeakMap();
const fallbackParamsProxyHandler = {
    get: function get(target, prop, receiver) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            const originalMethod = ReflectAdapter.get(target, prop, receiver);
            return ({
                [prop]: (...args)=>{
                    // Record against the store that's active at access time: the
                    // hanging promise is cached by params object across prerender
                    // stores, so the store that created it may not be the one that's
                    // rendering when it's finally awaited.
                    const workUnitStore = workUnitAsyncStorage.getStore();
                    if (workUnitStore !== undefined) {
                        trackFallbackParamsAccessed(workUnitStore);
                    }
                    const store = dynamicAccessAsyncStorage.getStore();
                    if (store) {
                        store.abortController.abort(Object.defineProperty(new Error(`Accessed fallback \`params\` during prerendering.`), "__NEXT_ERROR_CODE", {
                            value: "E691",
                            enumerable: false,
                            configurable: true
                        }));
                    }
                    return new Proxy(originalMethod.apply(target, args), fallbackParamsProxyHandler);
                }
            })[prop];
        }
        return ReflectAdapter.get(target, prop, receiver);
    }
};
function makeHangingParams(underlyingParams, workStore, prerenderStore) {
    const cachedParams = CachedParams.get(underlyingParams);
    if (cachedParams) {
        return cachedParams;
    }
    const promise = new Proxy(makeFallbackParamsHangingPromise(prerenderStore.renderSignal, workStore.route, '`params`', // This promise is created for every segment on a fallback route whether
    // or not it reads params, so recording the access at creation would mark
    // every render. The access is tracked in the proxy traps instead.
    null), fallbackParamsProxyHandler);
    CachedParams.set(underlyingParams, promise);
    return promise;
}
function makeErroringParams(underlyingParams, fallbackParams, workStore, prerenderStore) {
    const cachedParams = CachedParams.get(underlyingParams);
    if (cachedParams) {
        return cachedParams;
    }
    const augmentedUnderlying = {
        ...underlyingParams
    };
    // We don't use makeResolvedReactPromise here because params
    // supports copying with spread and we don't want to unnecessarily
    // instrument the promise with spreadable properties of ReactPromise.
    const promise = Promise.resolve(augmentedUnderlying);
    CachedParams.set(underlyingParams, promise);
    Object.keys(underlyingParams).forEach((prop)=>{
        if (wellKnownProperties.has(prop)) {
        // These properties cannot be shadowed because they need to be the
        // true underlying value for Promises to work correctly at runtime
        } else {
            if (fallbackParams.has(prop)) {
                Object.defineProperty(augmentedUnderlying, prop, {
                    get () {
                        const expression = describeStringPropertyAccess('params', prop);
                        // In most dynamic APIs we also throw if `dynamic = "error"` however
                        // for params is only dynamic when we're generating a fallback shell
                        // and even when `dynamic = "error"` we still support generating dynamic
                        // fallback shells
                        // TODO remove this comment when cacheComponents is the default since there
                        // will be no `dynamic = "error"`
                        if (prerenderStore.type === 'prerender-ppr') {
                            // PPR Prerender (no cacheComponents)
                            postponeWithTracking(workStore.route, expression, prerenderStore.dynamicTracking);
                        } else {
                            // Legacy Prerender
                            throwToInterruptStaticGeneration(expression, workStore, prerenderStore);
                        }
                    },
                    enumerable: true
                });
            }
        }
    });
    return promise;
}
function makeUntrackedParams(underlyingParams) {
    const cachedParams = CachedParams.get(underlyingParams);
    if (cachedParams) {
        return cachedParams;
    }
    const promise = Promise.resolve(underlyingParams);
    CachedParams.set(underlyingParams, promise);
    return promise;
}
function makeDynamicallyTrackedParamsWithDevWarnings(underlyingParams, userspaceParams, hasFallbackParams, workStore, requestStore) {
    const cachedParams = CachedParams.get(underlyingParams);
    if (cachedParams) {
        return cachedParams;
    }
    // We don't use makeResolvedReactPromise here because params
    // supports copying with spread and we don't want to unnecessarily
    // instrument the promise with spreadable properties of ReactPromise.
    const promise = hasFallbackParams ? makeDevtoolsIOAwarePromise(userspaceParams, requestStore, RENDER_STAGES_BY_DATA_KIND.runtimeLinkData) : Promise.resolve(userspaceParams);
    const proxiedPromise = instrumentParamsPromiseWithDevWarnings(underlyingParams, promise, workStore);
    CachedParams.set(underlyingParams, proxiedPromise);
    return proxiedPromise;
}
function instrumentParamsPromiseWithDevWarnings(underlyingParams, promise, workStore) {
    // Track which properties we should warn for.
    const proxiedProperties = new Set();
    Object.keys(underlyingParams).forEach((prop)=>{
        if (wellKnownProperties.has(prop)) {
        // These properties cannot be shadowed because they need to be the
        // true underlying value for Promises to work correctly at runtime
        } else {
            proxiedProperties.add(prop);
        }
    });
    return new Proxy(promise, {
        get (target, prop, receiver) {
            if (typeof prop === 'string') {
                if (// We are accessing a property that was proxied to the promise instance
                proxiedProperties.has(prop)) {
                    const expression = describeStringPropertyAccess('params', prop);
                    warnForSyncAccess(workStore.route, expression);
                }
            }
            return ReflectAdapter.get(target, prop, receiver);
        },
        set (target, prop, value, receiver) {
            if (typeof prop === 'string') {
                proxiedProperties.delete(prop);
            }
            return ReflectAdapter.set(target, prop, value, receiver);
        },
        ownKeys (target) {
            const expression = '`...params` or similar expression';
            warnForSyncAccess(workStore.route, expression);
            return Reflect.ownKeys(target);
        }
    });
}
const warnForSyncAccess = createDedupedByCallsiteServerErrorLoggerDev(createParamsAccessError);
function createParamsAccessError(route, expression) {
    const prefix = route ? `Route "${route}" ` : 'This route ';
    return Object.defineProperty(new Error(`${prefix}used ${expression}. ` + `\`params\` is a Promise and must be unwrapped with \`await\` or \`React.use()\` before accessing its properties. ` + `Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis`), "__NEXT_ERROR_CODE", {
        value: "E834",
        enumerable: false,
        configurable: true
    });
}

//# sourceMappingURL=params.js.map