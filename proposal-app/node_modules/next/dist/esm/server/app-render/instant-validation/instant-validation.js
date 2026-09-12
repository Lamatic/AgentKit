import { jsx as _jsx } from "react/jsx-runtime";
import { InvariantError } from '../../../shared/lib/invariant-error';
import { RenderStage } from '../staged-rendering';
import { getServerModuleMap } from '../manifests-singleton';
import { runInSequentialTasks } from '../app-render-render-utils';
import { workAsyncStorage } from '../work-async-storage.external';
import { Phase, printDebugThrownValueForProspectiveRender } from '../prospective-render-utils';
import { getDigestForWellKnownError } from '../create-error-handler';
import { // NOTE: we're in the server layer, so these are client references
PlaceValidationBoundaryBelowThisLevel, SlotMarker } from '../../../client/components/instant-validation/boundary';
import { INSTANT_SLOT_MARKER_PREFIX, INSTANT_SLOT_MARKER_SUFFIX } from './boundary-constants';
import { getLayoutOrPageModule } from '../../lib/app-dir-module';
import { parseLoaderTree } from '../../../shared/lib/router/utils/parse-loader-tree';
import { Readable } from 'node:stream';
import { createNodeStreamWithLateRelease, createNodeStreamFromChunks } from './stream-utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createFromNodeStream } from 'react-server-dom-webpack/client';
import { addSearchParamsIfPageSegment, isGroupSegment, PAGE_SEGMENT_KEY, DEFAULT_SEGMENT_KEY, NOT_FOUND_SEGMENT_KEY } from '../../../shared/lib/segment';
import { isFrameworkErrorRoute, isImplicitValidationSegment } from './instant-config';
const filterStackFrame = process.env.NODE_ENV !== 'production' ? require('../../lib/source-maps').filterStackFrameDEV : undefined;
const findSourceMapURL = process.env.NODE_ENV !== 'production' ? require('../../lib/source-maps').findSourceMapURLDEV : undefined;
const debug = process.env.NEXT_PRIVATE_DEBUG_VALIDATION === '1' ? console.log : undefined;
function traverseRootSeedDataSegments(initialRSCPayload, processSegment) {
    const { flightRouterState, seedData } = getRootDataFromPayload(initialRSCPayload);
    const [rootSegment] = flightRouterState;
    const rootPath = stringifySegment(rootSegment);
    return traverseCacheNodeSegments(rootPath, flightRouterState, seedData, processSegment);
}
function traverseCacheNodeSegments(path, route, seedData, processSegment) {
    processSegment(path, seedData);
    const [_segment, childRoutes] = route;
    const [_node, parallelRoutesData, _loading, _isPartial] = seedData;
    for(const parallelRouteKey in childRoutes){
        const childSeedData = parallelRoutesData[parallelRouteKey];
        if (!childSeedData) {
            throw Object.defineProperty(new InvariantError(`Got unexpected empty seed data during instant validation`), "__NEXT_ERROR_CODE", {
                value: "E992",
                enumerable: false,
                configurable: true
            });
        }
        const childRoute = childRoutes[parallelRouteKey];
        // NOTE: if this is a __PAGE__ segment, it might have search params appended.
        // Whoever reads from the cache needs to append them as well.
        const [childSegment] = childRoute;
        const childPath = createChildSegmentPath(path, parallelRouteKey, childSegment);
        traverseCacheNodeSegments(childPath, childRoute, childSeedData, processSegment);
    }
}
function createChildSegmentPath(parentPath, parallelRouteKey, segment) {
    const parallelRoutePrefix = parallelRouteKey === 'children' ? '' : `@${encodeURIComponent(parallelRouteKey)}/`;
    return `${parentPath}/${parallelRoutePrefix}${stringifySegment(segment)}`;
}
function stringifySegment(segment) {
    return typeof segment === 'string' ? encodeURIComponent(segment) : encodeURIComponent(segment[0]) + '|' + segment[1] + '|' + segment[2];
}
/**
 * Splits an existing staged stream (represented as arrays of chunks)
 * into separate staged streams (also in arrays-of-chunks form), one for each segment.
 * */ export async function collectStagedSegmentData(prefetchKind, ComponentMod, renderFlightStream, fullPageChunks, fullPageDebugChunks, startTime, stageEndTimes, clientReferenceManifest, createDebugChannel) {
    const cache = createSegmentCache();
    let partialStages;
    switch(prefetchKind){
        case 1:
            {
                partialStages = [
                    RenderStage.ShellRuntime,
                    RenderStage.Runtime
                ];
                break;
            }
        case 3:
            {
                partialStages = [
                    RenderStage.Static,
                    RenderStage.Runtime
                ];
                break;
            }
    }
    const doStage = async (targetStage)=>{
        const endTime = targetStage !== RenderStage.Dynamic ? stageEndTimes[targetStage] : undefined;
        const firstStage = partialStages[0];
        return await collectSegmentDataForStage(ComponentMod, renderFlightStream, fullPageChunks, fullPageDebugChunks, clientReferenceManifest, createDebugChannel, cache, firstStage, targetStage, startTime, endTime);
    };
    for (const targetStage of partialStages){
        await doStage(targetStage);
    }
    const payload = await doStage(RenderStage.Dynamic);
    return {
        cache,
        payload
    };
}
async function collectSegmentDataForStage(ComponentMod, renderFlightStream, fullPageChunks, fullPageDebugChunks, clientReferenceManifest, createDebugChannel, cache, firstStage, targetStage, startTime, endTime) {
    const debugChannelAbortController = new AbortController();
    const debugStream = fullPageDebugChunks ? createNodeStreamFromChunks(fullPageDebugChunks, debugChannelAbortController.signal) : null;
    const { stream, controller } = createStagedStreamFromChunks(fullPageChunks);
    stream.on('end', ()=>{
        // When the stream finishes, we have to close the debug stream too,
        // but delay it to avoid "Connection closed." errors.
        setImmediate(()=>debugChannelAbortController.abort());
    });
    // Technically we're just re-encoding, so nothing new should be emitted,
    // but we add an environment name just in case.
    const environmentName = ()=>{
        const currentStage = controller.currentStage;
        switch(currentStage){
            case RenderStage.Before:
            case RenderStage.Static:
                return 'Prerender';
            case RenderStage.ShellRuntime:
            case RenderStage.Runtime:
                return 'Prefetch';
            case RenderStage.Dynamic:
                return 'Server';
            default:
                currentStage;
                throw Object.defineProperty(new InvariantError(`Invalid render stage: ${currentStage}`), "__NEXT_ERROR_CODE", {
                    value: "E881",
                    enumerable: false,
                    configurable: true
                });
        }
    };
    // Deserialize the payload partially so that we can traverse the structure.
    const serverConsumerManifest = {
        moduleLoading: null,
        moduleMap: clientReferenceManifest.rscModuleMapping,
        serverModuleMap: getServerModuleMap()
    };
    const payloadPromise = createFromNodeStream(stream, serverConsumerManifest, {
        findSourceMapURL,
        debugChannel: debugStream ?? undefined,
        startTime,
        // Each stage is decoded with an `endTime` corresponding to
        // when it finished rendering, so that we can avoid pointing to
        // IO that finished after the stage is done.
        // This needs to happen during the first deserialization, because
        // when we serialize the segments afterwards, React will clamp the
        // timestamps of IO to the current time, and we will lose the ability
        // to omit info about IO that hasn't resolved in this stage.
        endTime
    });
    // We expect the outer structure of the payload to be readable in any stage,
    // even if the segments are incomplete.
    // NOTE: This must be done after the `createFromNodeStream` call but *before*
    // the result is awaited, otherwise we'll deadlock.
    controller.advanceStage(firstStage);
    const payload = await payloadPromise;
    // Deconstruct the payload into separate streams per segment.
    // We have to preserve the stage information for each of them,
    // so that we can later render each segment in any stage we need.
    const { head } = getRootDataFromPayload(payload);
    const segments = new Map();
    traverseRootSeedDataSegments(payload, (segmentPath, seedData)=>{
        segments.set(segmentPath, createSegmentData(seedData));
    });
    const pendingTasks = [];
    const renderIntoStageEntry = async (data, stageEntry)=>{
        const segmentDebugChannel = stageEntry.debugChunks ? createDebugChannel() : undefined;
        const itemStream = renderFlightStream(ComponentMod, data, clientReferenceManifest.clientModules, {
            filterStackFrame,
            debugChannel: segmentDebugChannel == null ? void 0 : segmentDebugChannel.serverSide,
            environmentName,
            startTime,
            onError: onFlightRenderError
        });
        await Promise.all([
            // accumulate Flight chunks
            (async ()=>{
                for await (const chunk of itemStream){
                    if (controller.currentStage === RenderStage.Before) {
                        throw Object.defineProperty(new InvariantError('Unexpected chunk emitted in Before stage'), "__NEXT_ERROR_CODE", {
                            value: "E1462",
                            enumerable: false,
                            configurable: true
                        });
                    }
                    writeChunk(stageEntry, controller.currentStage, targetStage, chunk);
                }
            })(),
            // accumulate Debug chunks
            segmentDebugChannel && (async ()=>{
                for await (const chunk of segmentDebugChannel.clientSide.readable){
                    stageEntry.debugChunks.push(chunk);
                }
            })()
        ]);
    };
    // Each stage is rendered in a separate pass (passed in as targetStage),
    // so we only need two stages:
    // 1. the target stage
    // 2. the dynamic stage (for late-release debug info)
    await runInSequentialTasks(()=>{
        if (targetStage !== RenderStage.Dynamic) {
            controller.advanceStage(targetStage);
        }
        const withDebugChunks = !!fullPageDebugChunks;
        {
            let headCacheItem = cache.head;
            if (!headCacheItem) {
                headCacheItem = createSegmentCacheItem();
                cache.head = headCacheItem;
            }
            const stageEntry = getOrCreateStageEntry(headCacheItem, targetStage, withDebugChunks);
            pendingTasks.push(renderIntoStageEntry(head, stageEntry));
        }
        for (const [segmentPath, segmentData] of segments){
            let segmentCacheItem = cache.segments.get(segmentPath);
            if (!segmentCacheItem) {
                segmentCacheItem = createSegmentCacheItem();
                cache.segments.set(segmentPath, segmentCacheItem);
            }
            const stageEntry = getOrCreateStageEntry(segmentCacheItem, targetStage, withDebugChunks);
            pendingTasks.push(renderIntoStageEntry(segmentData, stageEntry));
        }
    }, ()=>{
        controller.advanceStage(RenderStage.Dynamic);
    });
    await Promise.all(pendingTasks);
    return payload;
}
function onFlightRenderError(error) {
    const digest = getDigestForWellKnownError(error);
    if (digest) {
        return digest;
    }
    // Forward existing digests
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string') {
        return error.digest;
    }
    // We don't need to log the errors because we would have already done that
    // when generating the original Flight stream for the whole page.
    if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
        const workStore = workAsyncStorage.getStore();
        printDebugThrownValueForProspectiveRender(error, (workStore == null ? void 0 : workStore.route) ?? 'unknown route', Phase.InstantValidation);
    }
}
/**
 * Turns accumulated stage chunks into a stream.
 * The stream starts out in Static stage, and can be advanced further
 * using the returned controller object.
 * Conceptually, this is similar to how we unblock more content
 * by advancing stages in a regular staged render.
 * */ function createStagedStreamFromChunks(stageChunks) {
    // The successive stages are supersets of one another,
    // so we can index into the dynamic chunks everywhere
    // and just look at the lengths of the Static/Runtime arrays
    const allChunks = stageChunks[RenderStage.Dynamic];
    let chunkIx = 0;
    let currentStage = RenderStage.Before;
    let closed = false;
    function emitNewChunks(chunks) {
        for(; chunkIx < chunks.length; chunkIx++){
            stream.push(allChunks[chunkIx]);
        }
    }
    function close() {
        closed = true;
        stream.push(null);
    }
    const stream = new Readable({
        read () {}
    });
    function advanceStage(stage) {
        if (closed) return true;
        // NOTE: we don't special handling for skipping stages,
        // emitNewChunks will emit anything that hasn't been emitted before.
        currentStage = stage;
        emitNewChunks(stageChunks[stage]);
        // If there's no more chunks after this stage, finish the stream.
        if (chunkIx >= allChunks.length) {
            close();
            return true;
        } else {
            return false;
        }
    }
    return {
        stream,
        controller: {
            get currentStage () {
                return currentStage;
            },
            advanceStage
        }
    };
}
function writeChunk(stageData, currentStage, targetStage, chunk) {
    if (currentStage <= targetStage) {
        stageData.chunks.push(chunk);
    }
    stageData.allChunks.push(chunk);
}
//===============================================================
// 3. Recombining segments into a new payload
//===============================================================
/**
 * Creates a late-release stream for a given payload.
 * When `renderSignal` is triggered, the stream will release late chunks
 * to provide extra debug info.
 * */ export async function createCombinedPayloadStream(ComponentMod, renderFlightStream, payload, extraChunksAbortController, renderSignal, clientReferenceManifest, startTime, isDebugChannelEnabled, createDebugChannel) {
    // Collect all the chunks so that we're not dependent on timing of the render.
    let isRenderable = true;
    const renderableChunks = [];
    const allChunks = [];
    const debugChunks = isDebugChannelEnabled ? [] : null;
    const debugChannel = isDebugChannelEnabled ? createDebugChannel() : null;
    let streamFinished;
    await runInSequentialTasks(()=>{
        const stream = renderFlightStream(ComponentMod, payload, clientReferenceManifest.clientModules, {
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide,
            startTime,
            onError (error) {
                const digest = getDigestForWellKnownError(error);
                if (digest) {
                    return digest;
                }
                // Forward existing digests
                if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string') {
                    return error.digest;
                }
                // We don't need to log the errors because we would have already done that
                // when generating the original Flight stream for the whole page.
                if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                    const workStore = workAsyncStorage.getStore();
                    printDebugThrownValueForProspectiveRender(error, (workStore == null ? void 0 : workStore.route) ?? 'unknown route', Phase.InstantValidation);
                }
            }
        });
        streamFinished = Promise.all([
            // Accumulate Flight chunks
            (async ()=>{
                for await (const chunk of stream){
                    allChunks.push(chunk);
                    if (isRenderable) {
                        renderableChunks.push(chunk);
                    }
                }
            })(),
            // Accumulate debug chunks
            debugChannel && (async ()=>{
                for await (const chunk of debugChannel.clientSide.readable){
                    debugChunks.push(chunk);
                }
            })()
        ]);
    }, ()=>{
        isRenderable = false;
        extraChunksAbortController.abort();
    });
    await streamFinished;
    return {
        stream: createNodeStreamWithLateRelease(renderableChunks, allChunks, renderSignal),
        debugStream: debugChunks ? createNodeStreamFromChunks(debugChunks, renderSignal) : null
    };
}
function getRootDataFromPayload(initialRSCPayload) {
    // FlightDataPath is an unsound type, hence the additional checks. The
    // valid shapes are a single root path with no segment prefix: 4 elements
    // ([tree, seedData, head, isHeadPartial], per getRSCPayload) or 3 when
    // reconstructed without the isHeadPartial flag (see the payload literals
    // in this module).
    const flightDataPaths = initialRSCPayload.f;
    if (flightDataPaths.length !== 1 || flightDataPaths[0].length !== 3 && flightDataPaths[0].length !== 4) {
        throw Object.defineProperty(new InvariantError('InitialRSCPayload does not match the expected shape during instant validation.'), "__NEXT_ERROR_CODE", {
            value: "E994",
            enumerable: false,
            configurable: true
        });
    }
    const flightRouterState = flightDataPaths[0][0];
    const seedData = flightDataPaths[0][1];
    // TODO: handle head
    const head = flightDataPaths[0][2];
    return {
        flightRouterState,
        seedData,
        head
    };
}
async function createValidationHead(cache, releaseSignal, clientReferenceManifest, stage) {
    const segmentCacheItem = cache.head;
    if (!segmentCacheItem) {
        throw Object.defineProperty(new InvariantError(`Missing segment data: <head>`), "__NEXT_ERROR_CODE", {
            value: "E1072",
            enumerable: false,
            configurable: true
        });
    }
    const stageEntry = getStageEntry(segmentCacheItem, stage);
    return await deserializeFromChunks(stageEntry.chunks, stageEntry.allChunks, stageEntry.debugChunks, releaseSignal, clientReferenceManifest, // NOTE: We're not passing an endTime, because the debug info has already been
    // truncated to the appropriate `endTime` when the segment cache was filled.
    {
        startTime: undefined,
        endTime: undefined
    });
}
/**
 * Deserializes a (partial possibly partial) RSC stream, given as a chunk-array.
 * If the stream is partial, we'll wait for `releaseSignal` to fire
 * and then complete the deserialization using `allChunks`.
 *
 * This is used to obtain a partially-complete model (that might contain unresolved holes)
 * and then release any late debug info from chunks that came later before we abort the render.
 * */ function deserializeFromChunks(partialChunks, allChunks, debugChunks, releaseSignal, clientReferenceManifest, timings) {
    const debugChannelAbortController = new AbortController();
    const debugStream = debugChunks ? createNodeStreamFromChunks(debugChunks, debugChannelAbortController.signal) : null;
    const serverConsumerManifest = {
        moduleLoading: null,
        moduleMap: clientReferenceManifest.rscModuleMapping,
        serverModuleMap: getServerModuleMap()
    };
    const segmentStream = partialChunks.length < allChunks.length ? createNodeStreamWithLateRelease(partialChunks, allChunks, releaseSignal) : createNodeStreamFromChunks(partialChunks);
    segmentStream.on('end', ()=>{
        // When the stream finishes, we have to close the debug stream too,
        // but delay it to avoid "Connection closed." errors.
        setImmediate(()=>debugChannelAbortController.abort());
    });
    return createFromNodeStream(segmentStream, serverConsumerManifest, {
        findSourceMapURL,
        debugChannel: debugStream ?? undefined,
        startTime: timings == null ? void 0 : timings.startTime,
        endTime: timings == null ? void 0 : timings.endTime
    });
}
function createSegmentData(seedData) {
    const [node, _parallelRoutesData, _unused, isPartial, varyParams] = seedData;
    return {
        node,
        isPartial,
        varyParams
    };
}
function getCacheNodeSeedDataFromSegment(data, slots) {
    return [
        data.node,
        slots,
        /* unused (previously `loading`) */ null,
        data.isPartial,
        data.varyParams
    ];
}
function createSegmentCache() {
    return {
        head: null,
        segments: new Map()
    };
}
function createSegmentCacheItem() {
    return {
        [RenderStage.Static]: null,
        [RenderStage.ShellRuntime]: null,
        [RenderStage.Runtime]: null,
        [RenderStage.Dynamic]: null
    };
}
function createSegmentCacheItemStageEntry(withDebugChunks) {
    return {
        allChunks: [],
        chunks: [],
        debugChunks: withDebugChunks ? [] : null
    };
}
function getOrCreateStageEntry(segmentCacheItem, stage, withDebugChunks) {
    let data = segmentCacheItem[stage];
    if (!data) {
        data = createSegmentCacheItemStageEntry(withDebugChunks);
        segmentCacheItem[stage] = data;
    }
    return data;
}
function getStageEntry(segmentCacheItem, stage) {
    const data = segmentCacheItem[stage];
    if (!data) {
        // Indicates that we didn't fill the cache at this stage.
        throw Object.defineProperty(new InvariantError(`Expected segment cache to have data for stage '${RenderStage[stage]}'`), "__NEXT_ERROR_CODE", {
            value: "E1461",
            enumerable: false,
            configurable: true
        });
    }
    return data;
}
/**
 * Whether this segment consumes a URL depth level. Each URL depth
 * represents a potential navigation boundary.
 *
 * The root segment ('') consumes depth 0. Regular segments like
 * 'dashboard' consume the next depth — whether or not they have a
 * layout. Route groups, __PAGE__, __DEFAULT__, and /_not-found don't
 * consume a depth — they share the boundary of their parent.
 */ function segmentConsumesURLDepth(segment) {
    // Dynamic segments (tuples) always consume a URL depth.
    if (typeof segment !== 'string') return true;
    // Route groups, pages, defaults, and not-found don't consume a depth.
    if (segment.startsWith(PAGE_SEGMENT_KEY) || isGroupSegment(segment) || segment === DEFAULT_SEGMENT_KEY || segment === NOT_FOUND_SEGMENT_KEY) {
        return false;
    }
    // Everything else consumes a depth, including the root segment ''.
    return true;
}
/**
 * Walks the LoaderTree to discover validation depth bounds.
 *
 * Each route group between URL segments represents a potential
 * shared/new boundary in a client navigation. When a user navigates
 * between sibling routes that share a route group layout, that
 * layout is already mounted — its Suspense boundaries are revealed
 * and don't cover new content below. By tracking the max group
 * depth at each URL depth, we can iterate all possible group
 * boundaries and validate that blocking code is always covered by
 * Suspense in the new tree. This is conservative: some boundaries
 * may not correspond to real navigations (e.g. a route group with
 * no siblings), but it ensures we don't miss real violations.
 *
 * The max is taken across all parallel slots. When slots have
 * different numbers of groups, the deepest slot determines the
 * iteration range. Shallower slots simply stay entirely shared
 * at group depths beyond their own group count — they run out
 * of groups before reaching the boundary, so their content
 * remains in the Dynamic stage.
 *
 * Returns an array where:
 * - length = max URL depth (number of URL-consuming segments)
 * - array[i] = max group depth at URL depth i (number of route group
 *   segments between this URL depth and the next)
 *
 * For example, a tree like:
 *   '' / (outer) / (inner) / dashboard / page
 * returns [2, 0] — URL depth 0 (root) has 2 group layers before
 * the next URL segment (dashboard), and URL depth 1 (dashboard) has
 * 0 group layers before the leaf.
 */ export function discoverValidationDepths(loaderTree) {
    const groupDepthsByUrlDepth = [];
    function recordGroupDepth(urlDepth, groupDepth) {
        while(groupDepthsByUrlDepth.length <= urlDepth){
            groupDepthsByUrlDepth.push(0);
        }
        if (groupDepth > groupDepthsByUrlDepth[urlDepth]) {
            groupDepthsByUrlDepth[urlDepth] = groupDepth;
        }
    }
    // urlDepth tracks the index of the current URL-consuming segment.
    // Groups accumulate at the same index. When the next URL segment
    // is reached, it increments the index and resets the group counter.
    // We start at -1 so the root segment '' increments to 0.
    function walk(tree, urlDepth, groupDepth) {
        const segment = tree[0];
        const { parallelRoutes } = parseLoaderTree(tree);
        const consumesDepth = segmentConsumesURLDepth(segment);
        let nextUrlDepth = urlDepth;
        let nextGroupDepth = groupDepth;
        if (consumesDepth) {
            nextUrlDepth = urlDepth + 1;
            nextGroupDepth = 0;
            recordGroupDepth(nextUrlDepth, 0);
        } else if (typeof segment === 'string' && isGroupSegment(segment) && segment !== '(__SLOT__)') {
            // Count real route groups but not the synthetic '(__SLOT__)' segment
            // that Next.js inserts for parallel slots. The synthetic group
            // can't be a real navigation boundary.
            nextGroupDepth++;
            recordGroupDepth(urlDepth, nextGroupDepth);
        }
        for(const key in parallelRoutes){
            walk(parallelRoutes[key], nextUrlDepth, nextGroupDepth);
        }
    }
    walk(loaderTree, -1, 0);
    return groupDepthsByUrlDepth;
}
export var ValidationPrefetchKind = /*#__PURE__*/ function(ValidationPrefetchKind) {
    /** App Shells, for `<Link>` without `prefetch={true}` */ ValidationPrefetchKind[ValidationPrefetchKind["Shell"] = 1] = "Shell";
    // TODO(app-shells): validate speculative prefetches
    // Speculative = 2,
    /** Behavior when Partial Prefetching is not enabled. */ ValidationPrefetchKind[ValidationPrefetchKind["LegacySpeculative"] = 3] = "LegacySpeculative";
    return ValidationPrefetchKind;
}({});
export async function createCombinedPayloadAtDepth(prefetchKind, initialRSCPayload, cache, initialLoaderTree, getDynamicParamFromSegment, query, depth, groupDepth, releaseSignal, boundaryState, clientReferenceManifest, useRuntimeStageForPartialSegments) {
    const workStore = workAsyncStorage.getStore();
    if (!workStore) {
        throw Object.defineProperty(new InvariantError('createCombinedPayloadAtDepth must run inside a WorkStore'), "__NEXT_ERROR_CODE", {
            value: "E1184",
            enumerable: false,
            configurable: true
        });
    }
    const { validationLevel, route } = workStore;
    let hasStaticSegments = false;
    let hasRuntimeSegments = false;
    // Index 0 is reserved for the root config. Slot markers start at 1.
    const slotStacks = [
        null
    ];
    /**
   * When a segment has multiple parallel routes (a fork), wrap each
   * slot's seed data with a slot marker component. The marker's index
   * in the component stack maps to `slotStacks` for per-slot error
   * attribution. Slot markers start at index 1 (index 0 is root).
   */ function wrapSlotsWithMarkers(slots, results) {
        const keys = Object.keys(slots);
        if (keys.length <= 1) return;
        for (const key of keys){
            const slotSeedData = slots[key];
            if (slotSeedData === null) continue;
            const result = results.get(key);
            const markerIndex = slotStacks.length;
            slotStacks.push((result == null ? void 0 : result.createInstantStack) ?? null);
            const markerName = `${INSTANT_SLOT_MARKER_PREFIX}${markerIndex - 1}${INSTANT_SLOT_MARKER_SUFFIX}`;
            const [node, parallelRoutesData, unused, isPartial, varyParams] = slotSeedData;
            slots[key] = [
                // eslint-disable-next-line @next/internal/no-ambiguous-jsx -- bundled in the server layer
                /*#__PURE__*/ _jsx(SlotMarker, {
                    name: markerName,
                    children: node
                }, "sm"),
                parallelRoutesData,
                unused,
                isPartial,
                varyParams
            ];
        }
    }
    function getSegment(loaderTree) {
        const dynamicParam = getDynamicParamFromSegment(loaderTree);
        if (dynamicParam) {
            return dynamicParam.treeSegment;
        }
        const segment = loaderTree[0];
        return query ? addSearchParamsIfPageSegment(segment, query) : segment;
    }
    async function buildSharedTreeSeedData(loaderTree, parentPath, key, urlDepthConsumed, groupDepthConsumed) {
        const { parallelRoutes } = parseLoaderTree(loaderTree);
        const segment = getSegment(loaderTree);
        const path = parentPath === null ? stringifySegment(segment) : createChildSegmentPath(parentPath, key, segment);
        debug == null ? void 0 : debug(`    ${path || '/'} - Dynamic`);
        const segmentCacheItem = cache.segments.get(path);
        if (!segmentCacheItem) {
            throw Object.defineProperty(new InvariantError(`Missing segment data: ${path}`), "__NEXT_ERROR_CODE", {
                value: "E995",
                enumerable: false,
                configurable: true
            });
        }
        const stageEntry = getStageEntry(segmentCacheItem, RenderStage.Dynamic);
        const dynamicChunks = stageEntry.chunks;
        const segmentData = await deserializeFromChunks(dynamicChunks, dynamicChunks, stageEntry.debugChunks, releaseSignal, clientReferenceManifest, null);
        const consumesUrlDepth = segmentConsumesURLDepth(segment);
        const isGroup = typeof segment === 'string' && isGroupSegment(segment) && segment !== '(__SLOT__)';
        // Advance counters for this segment before the boundary check,
        // mirroring how discoverValidationDepths counts. URL segments
        // increment urlDepthConsumed, groups increment groupDepthConsumed.
        // The synthetic '(__SLOT__)' segment is excluded — it can't be a
        // real navigation boundary.
        let nextUrlDepth = urlDepthConsumed;
        let currentGroupDepth = groupDepthConsumed;
        if (consumesUrlDepth) {
            nextUrlDepth++;
            currentGroupDepth = 0;
        } else if (isGroup) {
            currentGroupDepth++;
        }
        const pastUrlBoundary = nextUrlDepth > depth;
        const isBoundary = pastUrlBoundary && currentGroupDepth >= groupDepth;
        if (isBoundary) {
            debug == null ? void 0 : debug(`    ['${path}' is the boundary (url=${nextUrlDepth}, group=${currentGroupDepth})]`);
            const finalSegmentData = {
                ...segmentData,
                node: // eslint-disable-next-line @next/internal/no-ambiguous-jsx -- bundled in the server layer
                /*#__PURE__*/ _jsx(PlaceValidationBoundaryBelowThisLevel, {
                    id: path,
                    children: segmentData.node
                }, "c")
            };
            const slots = {};
            const slotResults = new Map();
            let requiresInstantUI = false;
            let createInstantStack = null;
            let bestConfigDepth = -1;
            // Collect the first mod file path from each slot's subtree.
            // Don't include the boundary segment's own layout/page — that
            // file DID render (it wraps the boundary). What didn't render
            // is the content inside the children slots.
            const slotModFilePaths = [];
            let firstModFilePath = null;
            for(const parallelRouteKey in parallelRoutes){
                const result = await buildNewTreeSeedData(parallelRoutes[parallelRouteKey], path, parallelRouteKey, 0 /* segmentDepth */ );
                slotResults.set(parallelRouteKey, result);
                slots[parallelRouteKey] = result.seedData;
                if (result.firstModFilePath !== null) {
                    slotModFilePaths.push(result.firstModFilePath);
                    if (firstModFilePath === null) {
                        firstModFilePath = result.firstModFilePath;
                    }
                }
                if (result.requiresInstantUI) {
                    requiresInstantUI = true;
                    if (result.configDepth > bestConfigDepth || result.configDepth === bestConfigDepth && parallelRouteKey === 'children') {
                        bestConfigDepth = result.configDepth;
                        createInstantStack = result.createInstantStack;
                    }
                }
            }
            // Only require this boundary to render if the subtree has an
            // instant config. Unconfigured slot subtrees are allowed to not
            // render (e.g. conditionally excluded by a layout).
            if (requiresInstantUI) {
                boundaryState.requiredIds.set(path, slotModFilePaths);
            }
            wrapSlotsWithMarkers(slots, slotResults);
            return {
                seedData: getCacheNodeSeedDataFromSegment(finalSegmentData, slots),
                requiresInstantUI,
                createInstantStack,
                firstModFilePath,
                configDepth: bestConfigDepth
            };
        }
        // Not at the boundary yet — keep walking as shared.
        const slots = {};
        const slotResults = new Map();
        let requiresInstantUI = false;
        let createInstantStack = null;
        let bestConfigDepth = -1;
        let firstModFilePath = null;
        for(const parallelRouteKey in parallelRoutes){
            const result = await buildSharedTreeSeedData(parallelRoutes[parallelRouteKey], path, parallelRouteKey, nextUrlDepth, currentGroupDepth);
            slotResults.set(parallelRouteKey, result);
            slots[parallelRouteKey] = result.seedData;
            if (firstModFilePath === null) {
                firstModFilePath = result.firstModFilePath;
            }
            if (result.requiresInstantUI) {
                requiresInstantUI = true;
                if (result.configDepth > bestConfigDepth || result.configDepth === bestConfigDepth && parallelRouteKey === 'children') {
                    bestConfigDepth = result.configDepth;
                    createInstantStack = result.createInstantStack;
                }
            }
        }
        wrapSlotsWithMarkers(slots, slotResults);
        return {
            seedData: getCacheNodeSeedDataFromSegment(segmentData, slots),
            requiresInstantUI,
            createInstantStack,
            firstModFilePath,
            configDepth: bestConfigDepth
        };
    }
    async function buildNewTreeSeedData(lt, parentPath, key, segmentDepth) {
        const { parallelRoutes } = parseLoaderTree(lt);
        const { mod: layoutOrPageMod, filePath: layoutOrPageFilePath } = await getLayoutOrPageModule(lt);
        const localModFilePath = layoutOrPageFilePath ?? null;
        const segment = getSegment(lt);
        const path = parentPath === null ? stringifySegment(segment) : createChildSegmentPath(parentPath, key, segment);
        let instantConfig = null;
        let localCreateInstantStack = null;
        if (layoutOrPageMod !== undefined) {
            instantConfig = layoutOrPageMod.instant ?? null;
            // When the default validation level is active and this is a page or
            // default segment without an explicit config, treat it as if
            // instant = true was exported. Framework-synthesized error
            // routes are excluded — see isFrameworkErrorRoute.
            if (instantConfig === null && validationLevel !== 'manual-warning' && validationLevel !== 'experimental-manual-error' && isImplicitValidationSegment(segment) && !isFrameworkErrorRoute(route)) {
                instantConfig = true;
            }
            if (instantConfig === true || typeof instantConfig === 'object' && instantConfig !== null) {
                const rawFactory = layoutOrPageMod.__debugCreateInstantConfigStack;
                localCreateInstantStack = typeof rawFactory === 'function' ? rawFactory : null;
            }
        }
        const segmentCacheItem = cache.segments.get(path);
        if (!segmentCacheItem) {
            throw Object.defineProperty(new InvariantError(`Missing segment data: ${path}`), "__NEXT_ERROR_CODE", {
                value: "E995",
                enumerable: false,
                configurable: true
            });
        }
        let stage;
        switch(prefetchKind){
            case 1:
                {
                    if (useRuntimeStageForPartialSegments) {
                        stage = RenderStage.Runtime;
                    } else {
                        stage = RenderStage.ShellRuntime;
                    }
                    break;
                }
            case 3:
                {
                    if (useRuntimeStageForPartialSegments) {
                        stage = RenderStage.Runtime;
                    } else {
                        // In legacy speculative prefetches, we always use static.
                        stage = RenderStage.Static;
                    }
                    break;
                }
        }
        switch(stage){
            case RenderStage.Static:
                {
                    hasStaticSegments = true;
                    break;
                }
            case RenderStage.ShellRuntime:
                {
                    break;
                }
            case RenderStage.Runtime:
                {
                    hasRuntimeSegments = true;
                    break;
                }
        }
        debug == null ? void 0 : debug(`    ${path || '/'} - ${RenderStage[stage]}`);
        const stageEntry = getStageEntry(segmentCacheItem, stage);
        const segmentData = await deserializeFromChunks(stageEntry.chunks, stageEntry.allChunks, stageEntry.debugChunks, releaseSignal, clientReferenceManifest, // NOTE: We're not passing an endTime, because the debug info has already been
        // truncated to the appropriate `endTime` when the segment cache was filled.
        {
            startTime: undefined,
            endTime: undefined
        });
        // Build children first, then determine requiresInstantUI.
        const slots = {};
        const slotResults = new Map();
        let childrenRequireInstantUI = false;
        let childCreateInstantStack = null;
        let bestChildConfigDepth = -1;
        let childFirstModFilePath = null;
        for(const parallelRouteKey in parallelRoutes){
            const childSegmentDepth = segmentConsumesURLDepth(segment) ? segmentDepth + 1 : segmentDepth;
            const result = await buildNewTreeSeedData(parallelRoutes[parallelRouteKey], path, parallelRouteKey, childSegmentDepth);
            slotResults.set(parallelRouteKey, result);
            slots[parallelRouteKey] = result.seedData;
            if (childFirstModFilePath === null) {
                childFirstModFilePath = result.firstModFilePath;
            }
            if (result.requiresInstantUI) {
                childrenRequireInstantUI = true;
                if (result.configDepth > bestChildConfigDepth || result.configDepth === bestChildConfigDepth && parallelRouteKey === 'children') {
                    bestChildConfigDepth = result.configDepth;
                    childCreateInstantStack = result.createInstantStack;
                }
            }
        }
        wrapSlotsWithMarkers(slots, slotResults);
        // Local config takes precedence over children.
        let requiresInstantUI;
        let createInstantStack;
        let configDepth;
        if (instantConfig === false) {
            requiresInstantUI = false;
            createInstantStack = null;
            configDepth = -1;
        } else if (instantConfig === true || typeof instantConfig === 'object' && instantConfig !== null) {
            requiresInstantUI = true;
            createInstantStack = localCreateInstantStack;
            configDepth = segmentDepth;
        } else {
            requiresInstantUI = childrenRequireInstantUI;
            createInstantStack = childCreateInstantStack;
            configDepth = bestChildConfigDepth;
        }
        // First mod we find in DFS order: this segment's own layout/page if
        // any, otherwise the first non-null we got from a child.
        const firstModFilePath = localModFilePath ?? childFirstModFilePath;
        return {
            seedData: getCacheNodeSeedDataFromSegment(segmentData, slots),
            requiresInstantUI,
            createInstantStack,
            firstModFilePath,
            configDepth
        };
    }
    const { seedData, requiresInstantUI, createInstantStack } = await buildSharedTreeSeedData(initialLoaderTree, null, null, 0 /* urlDepthConsumed */ , 0 /* groupDepthConsumed */ );
    if (!requiresInstantUI) {
        return null;
    }
    // Set the root config at index 0. This is the fallback for errors
    // that occur above any fork (no slot marker in the component stack).
    slotStacks[0] = createInstantStack;
    const { flightRouterState } = getRootDataFromPayload(initialRSCPayload);
    let headStage;
    switch(prefetchKind){
        case 1:
            {
                if (useRuntimeStageForPartialSegments) {
                    headStage = RenderStage.Runtime;
                } else {
                    headStage = RenderStage.ShellRuntime;
                }
                break;
            }
        case 3:
            {
                headStage = hasRuntimeSegments ? RenderStage.Runtime : RenderStage.Static;
                break;
            }
    }
    debug == null ? void 0 : debug(`    /_head - ${RenderStage[headStage]}`);
    let hasAmbiguousErrors;
    switch(prefetchKind){
        case 1:
            {
                // In a shell prefetch, holes are always ambiguous
                // (they can be either link data or dynamic data)
                // unless we're already overriding and using the runtime stage,
                // which resolves link data.
                hasAmbiguousErrors = !useRuntimeStageForPartialSegments;
                break;
            }
        case 3:
            {
                // In the old prefetching mechanism, holes in static segments are ambiguous
                // (they can be either runtime data or dynamic data).
                hasAmbiguousErrors = hasStaticSegments;
                break;
            }
    }
    const head = await createValidationHead(cache, releaseSignal, clientReferenceManifest, headStage);
    const payload = {
        ...initialRSCPayload,
        f: [
            [
                flightRouterState,
                seedData,
                head
            ]
        ]
    };
    return {
        payload,
        hasAmbiguousErrors,
        slotStacks
    };
}

//# sourceMappingURL=instant-validation.js.map