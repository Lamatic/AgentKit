import '../require-hook';
import '../node-environment';
import { AfterContext } from '../after/after-context';
import { loadComponents } from '../load-components';
import { setHttpClientAndAgentOptions } from '../setup-http-agent-env';
import { workAsyncStorage } from '../app-render/work-async-storage.external';
import { workUnitAsyncStorage } from '../app-render/work-unit-async-storage.external';
import { getServerModuleMap } from '../app-render/manifests-singleton';
import { createSnapshot } from '../app-render/async-local-storage';
import { createRequestStore } from '../async-storage/request-store';
/* eslint-disable import/no-extraneous-dependencies */ import { decodeReply, decodeReplyFromAsyncIterable, createTemporaryReferenceSet } from 'react-server-dom-webpack/server';
export async function probeUseCache(msg) {
    try {
        setHttpClientAndAgentOptions({
            httpAgentOptions: msg.nextConfigSerializable.httpAgentOptions
        });
        // Populates the manifests singleton for the route via
        // `setManifestsSingleton` inside the compiled app-page module — same
        // mechanism a real request uses. The dev server tears the pool down
        // whenever it invalidates its own require/manifest caches (HMR, route
        // recompile) so the next probe lazy-spawns a worker with empty
        // `require.cache` and `loadManifest` caches. Without that teardown, a
        // second probe in the same worker would resolve user modules and manifests
        // from the first probe's cached state.
        //
        // Narrowed to `AppPageModule` because the probe is only set up from the dev
        // block in `generateCacheEntryImpl`, which is gated on
        // `outerWorkUnitStore.cacheSignal` — currently only set for app pages.
        // `'use cache'` in route handlers has no dev-mode hang protection at all
        // today (no probe, no dev-fill timeout); when that gate is broadened, this
        // loader will need to handle `AppRouteModule` and a different require
        // mechanism (route handlers don't expose `__next_app__`).
        const { ComponentMod } = await loadComponents({
            distDir: msg.distDir,
            page: msg.page,
            isAppPath: true,
            isDev: true,
            sriEnabled: false,
            needsManifestsForLegacyReasons: true
        });
        // Resolve the wrapped `'use cache'` function by its server reference
        // id. Same path `action-handler.ts` takes for server actions: server
        // module map → bundler module id → `__next_app__.require` → exported
        // function keyed by the action id.
        const serverModuleMap = getServerModuleMap();
        const entry = serverModuleMap[msg.id];
        if (!entry) {
            return false;
        }
        const actionMod = await ComponentMod.__next_app__.require(entry.id);
        const wrappedFn = actionMod[msg.id];
        if (typeof wrappedFn !== 'function') {
            return false;
        }
        // Decode the args with the worker's own server module map. See the
        // `EncodedArgumentsForProbe` comment for why we don't use the cache-map key
        // string here.
        const temporaryReferences = createTemporaryReferenceSet();
        let decoded;
        if (msg.encodedArguments.kind === 'string') {
            decoded = await decodeReply(msg.encodedArguments.data, serverModuleMap, {
                temporaryReferences
            });
        } else {
            const entries = msg.encodedArguments.entries.map(([key, value])=>{
                if (typeof value === 'string') {
                    return [
                        key,
                        value
                    ];
                }
                const bytes = Buffer.from(value.bytes, 'base64');
                return [
                    key,
                    new File([
                        bytes
                    ], '', {
                        type: value.type
                    })
                ];
            });
            decoded = await decodeReplyFromAsyncIterable({
                async *[Symbol.asyncIterator] () {
                    for (const pair of entries){
                        yield pair;
                    }
                }
            }, serverModuleMap, {
                temporaryReferences
            });
        }
        const args = decoded[2];
        const workStore = buildProbeWorkStore(msg);
        // The outer store is `'request'`-typed and built from the forwarded
        // snapshot so the cache body sees the same `headers` / `cookies` /
        // `draftMode` it would in a real fill. `cacheSignal` defaults to undefined,
        // which disables the dev-timeout/probe block in `generateCacheEntryImpl` —
        // the primary guard against a probe inside the worker spawning another
        // probe.
        const workUnitStore = createRequestStore({
            phase: 'render',
            headers: new Headers(msg.request.headers),
            onUpdateCookies: undefined,
            url: {
                pathname: msg.request.urlPathname,
                search: msg.request.urlSearch
            },
            rootParams: msg.request.rootParams,
            implicitTags: {
                tags: [],
                expirationsByCacheKind: new Map()
            },
            resumeDataCache: null,
            previewProps: undefined,
            isHmrRefresh: msg.request.isHmrRefresh,
            serverComponentsHmrCache: undefined,
            hmrRefreshHash: msg.request.hmrRefreshHash,
            fallbackParams: null
        });
        await workAsyncStorage.run(workStore, ()=>workUnitAsyncStorage.run(workUnitStore, wrappedFn.bind(null, ...args)));
        return true;
    } catch  {
        // Any error along the way — module resolution, decode, the actual run —
        // collapses to "the probe didn't complete in isolation," so the main thread
        // won't false-positive a deadlock.
        return false;
    }
}
function buildProbeWorkStore(msg) {
    // `after()` callbacks would duplicate the real fill's side effects — the
    // probe is a throwaway re-execution, not a second request. Same shape as the
    // validation-render `AfterContext` in `app-render.tsx`.
    const afterContext = new AfterContext({
        waitUntil (promise) {
            promise.catch(()=>{});
        },
        onClose () {},
        onTaskError () {}
    });
    return {
        isStaticGeneration: false,
        page: msg.page,
        route: msg.route,
        useCacheProbeMode: {
            timeoutMs: msg.timeoutMs
        },
        isDraftMode: msg.request.isDraftMode,
        useCacheTimeout: msg.nextConfigSerializable.useCacheTimeout,
        staticPageGenerationTimeout: msg.nextConfigSerializable.staticPageGenerationTimeout,
        cacheLifeProfiles: msg.nextConfigSerializable.cacheLifeProfiles,
        buildId: msg.buildId,
        deploymentId: msg.deploymentId,
        requestStartTime: msg.request.requestStartTime,
        // Empty values for cache-handler / RDC bookkeeping. The `useCacheProbeMode`
        // branch in `cache()` returns before any code that reads or writes these
        // fields, so the values can never be observed.
        previouslyRevalidatedTags: [],
        refreshTagsByCacheKind: new Map(),
        runInCleanSnapshot: createSnapshot(),
        shouldTrackFetchMetrics: false,
        reactServerErrorsByDigest: new Map(),
        afterContext,
        cacheComponentsEnabled: true,
        // In the probe the validation level is irrelevant because we do not perform validation
        // in this context.
        validationLevel: 'warning'
    };
}

//# sourceMappingURL=use-cache-probe-worker.js.map