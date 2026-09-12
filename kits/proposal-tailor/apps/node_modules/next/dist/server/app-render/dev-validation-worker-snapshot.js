"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "buildDevValidationSnapshot", {
    enumerable: true,
    get: function() {
        return buildDevValidationSnapshot;
    }
});
const _helpers = require("../base-http/helpers");
async function buildDevValidationSnapshot(ctx, instantInputs, staticInputs, prefetchMode, fallbackRouteParams, devRenderDidError) {
    const requestStore = staticInputs.requestStore;
    const responseFinished = !(0, _helpers.isNodeNextResponse)(ctx.res) || ctx.res.originalResponse.writableFinished;
    // The instant and static inputs may share one debug channel, so drain each
    // channel only once.
    const chunksByChannel = new WeakMap();
    const getDebugChunksOnce = async (channel)=>{
        if (!channel) {
            return null;
        }
        let chunks = chunksByChannel.get(channel);
        if (!chunks) {
            chunks = [];
            for await (const chunk of channel){
                chunks.push(chunk);
            }
            chunksByChannel.set(channel, chunks);
        }
        return chunks;
    };
    const toSerializedInputs = async (inputs)=>({
            accumulatedChunks: inputs.accumulatedChunks,
            debugChunks: await getDebugChunksOnce(inputs.debugChannelClient),
            startTime: inputs.startTime,
            stageEndTimes: inputs.stageEndTimes
        });
    return {
        page: ctx.workStore.page,
        route: ctx.workStore.route,
        requestId: ctx.requestId,
        responseFinished,
        prefetchMode,
        devRenderDidError,
        nonce: ctx.nonce,
        query: ctx.query,
        request: {
            headers: [
                ...requestStore.headers.entries()
            ],
            urlPathname: requestStore.url.pathname,
            urlSearch: requestStore.url.search,
            rootParams: requestStore.rootParams,
            isDraftMode: requestStore.draftMode.isEnabled,
            isHmrRefresh: requestStore.isHmrRefresh ?? false,
            hmrRefreshHash: requestStore.hmrRefreshHash,
            requestStartTime: ctx.workStore.requestStartTime
        },
        interpolatedParams: ctx.interpolatedParams,
        requestFallbackRouteParams: ctx.fallbackRouteParams,
        fallbackRouteParams,
        optimisticRouting: ctx.renderOpts.experimental.optimisticRouting,
        forceStatic: ctx.workStore.forceStatic,
        validationLevel: ctx.workStore.validationLevel,
        implicitTags: ctx.implicitTags.tags,
        additionalClientReferenceManifestPages: ctx.workStore.additionalClientReferenceManifestPages ? [
            ...ctx.workStore.additionalClientReferenceManifestPages
        ] : [],
        isDebugChannelEnabled: !!ctx.renderOpts.setReactDebugChannel,
        renderOpts: {
            images: ctx.renderOpts.images,
            allowEmptyStaticShell: ctx.renderOpts.allowEmptyStaticShell
        },
        instantInputs: instantInputs ? await toSerializedInputs(instantInputs) : null,
        staticInputs: await toSerializedInputs(staticInputs)
    };
}

//# sourceMappingURL=dev-validation-worker-snapshot.js.map