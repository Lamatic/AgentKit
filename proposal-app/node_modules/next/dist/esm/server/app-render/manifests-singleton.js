import { InvariantError } from '../../shared/lib/invariant-error';
import { normalizeAppPath } from '../../shared/lib/router/utils/app-paths';
import { pathHasPrefix } from '../../shared/lib/router/utils/path-has-prefix';
import { removePathPrefix } from '../../shared/lib/router/utils/remove-path-prefix';
import { mightBeServerReferenceId } from '../../shared/lib/server-reference-info';
import { wellKnownProperties } from '../../shared/lib/utils/reflect-utils';
import { workAsyncStorage } from './work-async-storage.external';
export function getActionNotFoundError(actionId) {
    return Object.defineProperty(new Error(`Failed to find Server Action${actionId ? ` "${actionId}"` : ''}. This request might be from an older or newer deployment.\nRead more: https://nextjs.org/docs/messages/failed-to-find-server-action`), "__NEXT_ERROR_CODE", {
        value: "E974",
        enumerable: false,
        configurable: true
    });
}
export function getInvalidServerReferenceIdError(id) {
    // `id` is arbitrary client-provided input. Unlike the not-found case, it has
    // not passed the length gate and can reach this error via a malformed server
    // reference in an action payload, so it may be of any length and contain
    // control characters. `JSON.stringify` escapes newlines and quotes so it
    // can't forge log lines, and truncating overly long ids prevents log
    // flooding. Ids at or below the cap are logged in full so that we only add an
    // ellipsis to ids that are meaningfully longer than the truncated length.
    const encoded = JSON.stringify(id.length > MAX_LOGGED_SERVER_REFERENCE_ID_LENGTH ? id.slice(0, TRUNCATED_SERVER_REFERENCE_ID_LENGTH) + '…' : id);
    return Object.defineProperty(new Error(`The Server Reference ID did not match the expected format. Received ${encoded}.\nRead more: https://nextjs.org/docs/messages/failed-to-find-server-action`), "__NEXT_ERROR_CODE", {
        value: "E1442",
        enumerable: false,
        configurable: true
    });
}
// Ids at or below the cap are logged in full. Longer ids are truncated to the
// shorter length and marked with an ellipsis, so the cap leaves headroom over
// the truncated length rather than ellipsizing ids that are barely too long.
const MAX_LOGGED_SERVER_REFERENCE_ID_LENGTH = 100;
const TRUNCATED_SERVER_REFERENCE_ID_LENGTH = 90;
// This is a global singleton that is, among other things, also used to
// encode/decode bound args of server function closures. This can't be using a
// AsyncLocalStorage as it might happen at the module level.
const MANIFESTS_SINGLETON = Symbol.for('next.server.manifests');
const globalThisWithManifests = globalThis;
function createProxiedClientReferenceManifest(clientReferenceManifestsPerRoute) {
    const createMappingProxy = (prop)=>{
        return new Proxy({}, {
            get (_, id) {
                const workStore = workAsyncStorage.getStore();
                if (workStore) {
                    var _clientReferenceManifestsPerRoute_get;
                    const currentManifest = (_clientReferenceManifestsPerRoute_get = clientReferenceManifestsPerRoute.get(workStore.route)) == null ? void 0 : _clientReferenceManifestsPerRoute_get.clientReferenceManifest;
                    if (currentManifest == null ? void 0 : currentManifest[prop][id]) {
                        return currentManifest[prop][id];
                    }
                    // In development, we also check all other manifests to see if the
                    // module exists there. This is to support a scenario where React's
                    // I/O tracking (dev-only) creates a connection from one page to
                    // another through an emitted async I/O node that references client
                    // components from the other page, e.g. in owner props.
                    // TODO: Maybe we need to add a `debugBundlerConfig` option to React
                    // to avoid this workaround. The current workaround has the
                    // disadvantage that one might accidentally or intentionally share
                    // client references across pages (e.g. by storing them in a global
                    // variable), which would then only be caught in production.
                    if (process.env.NODE_ENV !== 'production') {
                        for (const [route, { page, clientReferenceManifest }] of clientReferenceManifestsPerRoute){
                            if (route === workStore.route) {
                                continue;
                            }
                            const entry = clientReferenceManifest[prop][id];
                            if (entry !== undefined) {
                                if (process.env.__NEXT_DEV_SERVER) {
                                    // The dev validation worker rebuilds this registry in its
                                    // own thread, seeded with only the route it validates, so
                                    // it has to be told which other manifests it needs.
                                    workStore.additionalClientReferenceManifestPages ??= new Set();
                                    workStore.additionalClientReferenceManifestPages.add(page);
                                }
                                return entry;
                            }
                        }
                    }
                } else {
                    // If there's no work store defined, we can assume that a client
                    // reference manifest is needed during module evaluation, e.g. to
                    // create a server function using a higher-order function. This
                    // might also use client components which need to be serialized by
                    // Flight, and therefore client references need to be resolvable. In
                    // that case we search all page manifests to find the module.
                    for (const { clientReferenceManifest } of clientReferenceManifestsPerRoute.values()){
                        const entry = clientReferenceManifest[prop][id];
                        if (entry !== undefined) {
                            return entry;
                        }
                    }
                }
                return undefined;
            }
        });
    };
    const mappingProxies = new Map();
    return new Proxy({}, {
        get (_, prop) {
            const workStore = workAsyncStorage.getStore();
            switch(prop){
                case 'moduleLoading':
                case 'entryCSSFiles':
                case 'entryJSFiles':
                    {
                        if (!workStore) {
                            throw Object.defineProperty(new InvariantError(`Cannot access "${prop}" without a work store.`), "__NEXT_ERROR_CODE", {
                                value: "E952",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        const registeredManifest = clientReferenceManifestsPerRoute.get(workStore.route);
                        if (!registeredManifest) {
                            throw Object.defineProperty(new InvariantError(`The client reference manifest for route "${workStore.route}" does not exist.`), "__NEXT_ERROR_CODE", {
                                value: "E951",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        return registeredManifest.clientReferenceManifest[prop];
                    }
                case 'clientModules':
                case 'rscModuleMapping':
                case 'edgeRscModuleMapping':
                case 'ssrModuleMapping':
                case 'edgeSSRModuleMapping':
                    {
                        let proxy = mappingProxies.get(prop);
                        if (!proxy) {
                            proxy = createMappingProxy(prop);
                            mappingProxies.set(prop, proxy);
                        }
                        return proxy;
                    }
                default:
                    {
                        throw Object.defineProperty(new InvariantError(`This is a proxied client reference manifest. The property "${String(prop)}" is not handled.`), "__NEXT_ERROR_CODE", {
                            value: "E953",
                            enumerable: false,
                            configurable: true
                        });
                    }
            }
        }
    });
}
/**
 * This function creates a Flight-acceptable server module map proxy from our
 * Server Reference Manifest similar to our client module map. This is because
 * our manifest contains a lot of internal Next.js data that are relevant to the
 * runtime, workers, etc. that React doesn't need to know.
 */ function createServerModuleMap() {
    return new Proxy(Object.create(null), {
        get: (target, id, receiver)=>{
            var _getServerActionsManifest__id, _getServerActionsManifest_;
            // React's debug serialization can probe the module map like a plain object.
            // These probes are not server reference lookups.
            if (typeof id !== 'string') {
                return Reflect.get(target, id, receiver);
            }
            if (wellKnownProperties.has(id)) {
                return Reflect.get(target, id, receiver);
            }
            if (!mightBeServerReferenceId(id)) {
                throw getInvalidServerReferenceIdError(id);
            }
            const workers = (_getServerActionsManifest_ = getServerActionsManifest()[process.env.NEXT_RUNTIME === 'edge' ? 'edge' : 'node']) == null ? void 0 : (_getServerActionsManifest__id = _getServerActionsManifest_[id]) == null ? void 0 : _getServerActionsManifest__id.workers;
            if (!workers) {
                throw getActionNotFoundError(id);
            }
            const workStore = workAsyncStorage.getStore();
            let workerEntry;
            if (workStore) {
                workerEntry = workers[normalizeWorkerPageName(workStore.page)];
            } else {
                // If there's no work store defined, we can assume that a server
                // module map is needed during module evaluation, e.g. to create a
                // server action using a higher-order function. Therefore it should be
                // safe to return any entry from the manifest that matches the action
                // ID. They all refer to the same module ID, which must also exist in
                // the current page bundle. TODO: This is currently not guaranteed in
                // Turbopack, and needs to be fixed.
                workerEntry = Object.values(workers).at(0);
            }
            if (!workerEntry) {
                throw getActionNotFoundError(id);
            }
            const { moduleId, async } = workerEntry;
            return {
                id: moduleId,
                name: id,
                chunks: [],
                async
            };
        }
    });
}
/**
 * The flight entry loader keys actions by bundlePath. bundlePath corresponds
 * with the relative path (including 'app') to the page entrypoint.
 */ function normalizeWorkerPageName(pageName) {
    if (pathHasPrefix(pageName, 'app')) {
        return pageName;
    }
    return 'app' + pageName;
}
/**
 * Converts a bundlePath (relative path to the entrypoint) to a routable page
 * name.
 */ function denormalizeWorkerPageName(bundlePath) {
    return normalizeAppPath(removePathPrefix(bundlePath, 'app'));
}
/**
 * Checks if the requested action has a worker for the current page.
 * If not, it returns the first worker that has a handler for the action.
 */ export function selectWorkerForForwarding(actionId, pageName) {
    var _serverActionsManifest__actionId;
    const serverActionsManifest = getServerActionsManifest();
    const workers = (_serverActionsManifest__actionId = serverActionsManifest[process.env.NEXT_RUNTIME === 'edge' ? 'edge' : 'node'][actionId]) == null ? void 0 : _serverActionsManifest__actionId.workers;
    // There are no workers to handle this action, nothing to forward to.
    if (!workers) {
        return;
    }
    // If there is an entry for the current page, we don't need to forward.
    if (workers[normalizeWorkerPageName(pageName)]) {
        return;
    }
    // Otherwise, grab the first worker that has a handler for this action id.
    return denormalizeWorkerPageName(Object.keys(workers)[0]);
}
export function setManifestsSingleton({ page, clientReferenceManifest, serverActionsManifest: rawServerActionsManifest }) {
    const existingSingleton = globalThisWithManifests[MANIFESTS_SINGLETON];
    const route = normalizeAppPath(page);
    const serverActionsManifest = {
        encryptionKey: rawServerActionsManifest.encryptionKey,
        // Use null-prototypes for the action objects to prevent prototype pollution
        // from affecting action ID lookups.
        node: Object.assign(Object.create(null), rawServerActionsManifest.node),
        edge: Object.assign(Object.create(null), rawServerActionsManifest.edge)
    };
    if (existingSingleton) {
        existingSingleton.clientReferenceManifestsPerRoute.set(route, {
            page,
            clientReferenceManifest
        });
        existingSingleton.serverActionsManifest = serverActionsManifest;
    } else {
        const clientReferenceManifestsPerRoute = new Map([
            [
                route,
                {
                    page,
                    clientReferenceManifest
                }
            ]
        ]);
        const proxiedClientReferenceManifest = createProxiedClientReferenceManifest(clientReferenceManifestsPerRoute);
        globalThisWithManifests[MANIFESTS_SINGLETON] = {
            clientReferenceManifestsPerRoute,
            proxiedClientReferenceManifest,
            serverActionsManifest,
            serverModuleMap: createServerModuleMap()
        };
    }
}
function getManifestsSingleton() {
    const manifestSingleton = globalThisWithManifests[MANIFESTS_SINGLETON];
    if (!manifestSingleton) {
        throw Object.defineProperty(new InvariantError('The manifests singleton was not initialized.'), "__NEXT_ERROR_CODE", {
            value: "E950",
            enumerable: false,
            configurable: true
        });
    }
    return manifestSingleton;
}
export function getClientReferenceManifest() {
    return getManifestsSingleton().proxiedClientReferenceManifest;
}
export function getServerActionsManifest() {
    return getManifestsSingleton().serverActionsManifest;
}
export function getServerModuleMap() {
    return getManifestsSingleton().serverModuleMap;
}

//# sourceMappingURL=manifests-singleton.js.map