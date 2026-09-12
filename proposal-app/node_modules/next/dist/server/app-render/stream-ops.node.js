/**
 * Node.js stream operations for the rendering pipeline.
 * Loaded by stream-ops.ts when process.env.__NEXT_USE_NODE_STREAMS is true.
 *
 * AnyStream = AnyStreamType so the exported type surface matches stream-ops.web.ts,
 * allowing the switcher to assign either module without casts.
 * Rendering uses pipeable APIs; continue functions wrap the existing web
 * transforms via Readable.fromWeb() on their output.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    chainStreams: null,
    continueDynamicHTMLResumeNode: null,
    continueDynamicHTMLResumeWeb: null,
    continueDynamicPrerender: null,
    continueFizzStream: null,
    continueStaticFallbackPrerender: null,
    continueStaticPrerender: null,
    createDocumentClosingStream: null,
    createNodeInlinedDataStream: null,
    createOnHeadersCallback: null,
    createPendingStream: null,
    createWebInlinedDataStream: null,
    getClientPrerender: null,
    getServerPrerender: null,
    pipeRuntimePrefetchTransform: null,
    processPrelude: null,
    renderToNodeFizzStream: null,
    renderToNodeFlightStream: null,
    renderToWebFizzStream: null,
    renderToWebFlightStream: null,
    resumeAndAbort: null,
    resumeToFizzStream: null,
    streamToBuffer: null,
    streamToString: null,
    teeStream: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    chainStreams: function() {
        return chainStreams;
    },
    continueDynamicHTMLResumeNode: function() {
        return continueDynamicHTMLResumeNode;
    },
    continueDynamicHTMLResumeWeb: function() {
        return continueDynamicHTMLResumeWeb;
    },
    continueDynamicPrerender: function() {
        return continueDynamicPrerender;
    },
    continueFizzStream: function() {
        return continueFizzStream;
    },
    continueStaticFallbackPrerender: function() {
        return continueStaticFallbackPrerender;
    },
    continueStaticPrerender: function() {
        return continueStaticPrerender;
    },
    createDocumentClosingStream: function() {
        return createDocumentClosingStream;
    },
    createNodeInlinedDataStream: function() {
        return createNodeInlinedDataStream;
    },
    createOnHeadersCallback: function() {
        return createOnHeadersCallback;
    },
    createPendingStream: function() {
        return createPendingStream;
    },
    createWebInlinedDataStream: function() {
        return createWebInlinedDataStream;
    },
    getClientPrerender: function() {
        return getClientPrerender;
    },
    getServerPrerender: function() {
        return getServerPrerender;
    },
    pipeRuntimePrefetchTransform: function() {
        return pipeRuntimePrefetchTransform;
    },
    processPrelude: function() {
        return processPrelude;
    },
    renderToNodeFizzStream: function() {
        return renderToNodeFizzStream;
    },
    renderToNodeFlightStream: function() {
        return renderToNodeFlightStream;
    },
    renderToWebFizzStream: function() {
        return _streamopsweb.renderToWebFizzStream;
    },
    renderToWebFlightStream: function() {
        return _streamopsweb.renderToWebFlightStream;
    },
    resumeAndAbort: function() {
        return resumeAndAbort;
    },
    resumeToFizzStream: function() {
        return resumeToFizzStream;
    },
    streamToBuffer: function() {
        return streamToBuffer;
    },
    streamToString: function() {
        return streamToString;
    },
    teeStream: function() {
        return teeStream;
    }
});
const _server = require("react-dom/server");
const _static = require("react-dom/static");
const _nodestream = require("node:stream");
const _nodebuffer = require("node:buffer");
const _nodewebstreamshelper = require("../stream-utils/node-web-streams-helper");
const _uint8arrayhelpers = require("../stream-utils/uint8array-helpers");
const _encodedtags = require("../stream-utils/encoded-tags");
const _nodebufferedtransformstream = require("../stream-utils/node-buffered-transform-stream");
const _constants = require("../../shared/lib/errors/constants");
const _htmlescape = require("../../shared/lib/htmlescape");
const _useflightresponse = require("./use-flight-response");
const _apprenderprerenderutils = require("./app-render-prerender-utils");
const _detachedpromise = require("../../lib/detached-promise");
const _tracer = require("../lib/trace/tracer");
const _constants1 = require("../lib/trace/constants");
const _scheduler = require("../../lib/scheduler");
const _streamopsweb = require("./stream-ops.web");
function nodeReadableToWebReadableStream(stream) {
    if (stream instanceof ReadableStream) {
        return stream;
    }
    // Readable.toWeb returns stream/web ReadableStream which is structurally
    // identical to the global ReadableStream<Uint8Array>.
    return _nodestream.Readable.toWeb(stream);
}
function webToReadable(stream) {
    if (stream instanceof _nodestream.Readable) {
        return stream;
    }
    return _nodestream.Readable.fromWeb(stream);
}
// ---------------------------------------------------------------------------
// Flight data injection – Node.js Transform that passes HTML chunks through
// while pulling from a separate data stream and interleaving its chunks.
// ---------------------------------------------------------------------------
function createFlightDataInjectionTransform(dataStream, delayDataUntilFirstHtmlChunk) {
    let htmlStreamFinished = false;
    let pull = null;
    let donePulling = false;
    function startOrContinuePulling(target) {
        if (!pull) {
            pull = startPulling(target);
        }
        return pull;
    }
    async function startPulling(target) {
        if (delayDataUntilFirstHtmlChunk) {
            // Buffer the inlined data stream until we've left the current Task so
            // it's inserted after flushing the shell.
            await (0, _scheduler.atLeastOneTask)();
        }
        try {
            const iterator = dataStream[Symbol.asyncIterator]();
            while(true){
                const { done, value } = await iterator.next();
                if (done) {
                    donePulling = true;
                    return;
                }
                // Prioritize HTML over RSC data: the SSR render produces HTML from
                // the same RSC stream, so yield a task to let HTML flush first.
                if (!delayDataUntilFirstHtmlChunk && !htmlStreamFinished) {
                    await (0, _scheduler.atLeastOneTask)();
                }
                target.push(value);
            }
        } catch (err) {
            target.destroy(err);
        }
    }
    const nodeTransform = new _nodestream.Transform({
        transform (chunk, _encoding, callback) {
            this.push(chunk);
            if (delayDataUntilFirstHtmlChunk) {
                startOrContinuePulling(this);
            }
            callback();
        },
        flush (callback) {
            htmlStreamFinished = true;
            if (donePulling) {
                callback();
                return;
            }
            startOrContinuePulling(this).then(()=>callback(), (err)=>callback(err));
        }
    });
    if (!delayDataUntilFirstHtmlChunk) {
        startOrContinuePulling(nodeTransform);
    }
    return nodeTransform;
}
// ---------------------------------------------------------------------------
// Head insertion – Node.js Transform that inserts server-generated HTML
// (e.g. <script>, <style>) right before </head>, or prepends it if no
// </head> tag is found (PPR resume case).
// ---------------------------------------------------------------------------
function createHeadInsertionTransform(insert) {
    let inserted = false;
    let hasBytes = false;
    return new _nodestream.Transform({
        async transform (chunk, _encoding, callback) {
            hasBytes = true;
            try {
                const insertion = await insert();
                if (inserted) {
                    if (insertion) {
                        this.push(Buffer.from(insertion));
                    }
                    this.push(chunk);
                } else {
                    const index = (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.CLOSED.HEAD);
                    if (index !== -1) {
                        if (insertion) {
                            const encodedInsertion = Buffer.from(insertion);
                            const merged = Buffer.allocUnsafe(chunk.length + encodedInsertion.length);
                            merged.set(chunk.slice(0, index));
                            merged.set(encodedInsertion, index);
                            merged.set(chunk.slice(index), index + encodedInsertion.length);
                            this.push(merged);
                        } else {
                            this.push(chunk);
                        }
                        inserted = true;
                    } else {
                        if (insertion) {
                            this.push(Buffer.from(insertion));
                        }
                        this.push(chunk);
                        inserted = true;
                    }
                }
                callback();
            } catch (err) {
                callback(err);
            }
        },
        async flush (callback) {
            try {
                if (hasBytes) {
                    const insertion = await insert();
                    if (insertion) {
                        this.push(Buffer.from(insertion));
                    }
                }
                callback();
            } catch (err) {
                callback(err);
            }
        }
    });
}
// ---------------------------------------------------------------------------
// Metadata transform – Node.js Transform that finds the «nxt-icon» meta mark
// and replaces it with a script tag (or removes it if inside <head>).
// ---------------------------------------------------------------------------
function createMetadataTransform(insert) {
    let chunkIndex = -1;
    let isMarkRemoved = false;
    return new _nodestream.Transform({
        async transform (chunk, _encoding, callback) {
            let iconMarkIndex = -1;
            let closedHeadIndex = -1;
            chunkIndex++;
            if (isMarkRemoved) {
                this.push(chunk);
                callback();
                return;
            }
            try {
                let iconMarkLength = 0;
                iconMarkIndex = (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.META.ICON_MARK);
                if (iconMarkIndex === -1) {
                    this.push(chunk);
                    callback();
                    return;
                }
                iconMarkLength = _encodedtags.ENCODED_TAGS.META.ICON_MARK.length;
                if (chunk[iconMarkIndex + iconMarkLength] === 47) {
                    iconMarkLength += 2;
                } else {
                    iconMarkLength++;
                }
                if (chunkIndex === 0) {
                    closedHeadIndex = (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.CLOSED.HEAD);
                    if (iconMarkIndex < closedHeadIndex) {
                        const replaced = Buffer.allocUnsafe(chunk.length - iconMarkLength);
                        replaced.set(chunk.subarray(0, iconMarkIndex));
                        replaced.set(chunk.subarray(iconMarkIndex + iconMarkLength), iconMarkIndex);
                        chunk = replaced;
                    } else {
                        const insertion = await insert();
                        const encodedInsertion = Buffer.from(insertion);
                        const insertionLength = encodedInsertion.length;
                        const replaced = Buffer.allocUnsafe(chunk.length - iconMarkLength + insertionLength);
                        replaced.set(chunk.subarray(0, iconMarkIndex));
                        replaced.set(encodedInsertion, iconMarkIndex);
                        replaced.set(chunk.subarray(iconMarkIndex + iconMarkLength), iconMarkIndex + insertionLength);
                        chunk = replaced;
                    }
                    isMarkRemoved = true;
                } else {
                    const insertion = await insert();
                    const encodedInsertion = Buffer.from(insertion);
                    const insertionLength = encodedInsertion.length;
                    const replaced = Buffer.allocUnsafe(chunk.length - iconMarkLength + insertionLength);
                    replaced.set(chunk.subarray(0, iconMarkIndex));
                    replaced.set(encodedInsertion, iconMarkIndex);
                    replaced.set(chunk.subarray(iconMarkIndex + iconMarkLength), iconMarkIndex + insertionLength);
                    chunk = replaced;
                    isMarkRemoved = true;
                }
                this.push(chunk);
                callback();
            } catch (err) {
                callback(err);
            }
        }
    });
}
// ---------------------------------------------------------------------------
// Deferred suffix – Node.js Transform that appends a suffix string after the
// first HTML chunk, deferring via queueMicrotask so the chunk flushes first.
// ---------------------------------------------------------------------------
function createDeferredSuffixTransform(suffix) {
    let flushed = false;
    const encodedSuffix = Buffer.from(suffix);
    return new _nodestream.Transform({
        transform (chunk, _encoding, callback) {
            this.push(chunk);
            if (!flushed) {
                flushed = true;
                queueMicrotask(()=>{
                    this.push(encodedSuffix);
                });
            }
            callback();
        },
        flush (callback) {
            if (!flushed) {
                this.push(encodedSuffix);
            }
            callback();
        }
    });
}
// ---------------------------------------------------------------------------
// Move suffix – Node.js Transform that strips </body></html> from its
// original position and re-appends it at the very end of the stream, so any
// content injected after the suffix still appears before the closing tags.
// ---------------------------------------------------------------------------
function createMoveSuffixTransform() {
    let foundSuffix = false;
    return new _nodestream.Transform({
        transform (chunk, _encoding, callback) {
            if (foundSuffix) {
                this.push(chunk);
                callback();
                return;
            }
            const index = (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML);
            if (index > -1) {
                foundSuffix = true;
                if (chunk.length === _encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML.length) {
                    callback();
                    return;
                }
                const before = chunk.slice(0, index);
                this.push(before);
                if (chunk.length > _encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML.length + index) {
                    const after = chunk.slice(index + _encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML.length);
                    this.push(after);
                }
            } else {
                this.push(chunk);
            }
            callback();
        },
        flush (callback) {
            this.push(_encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML);
            callback();
        }
    });
}
// ---------------------------------------------------------------------------
// data-dpl-id insertion – Node.js Transform that inserts a `data-dpl-id`
// attribute on the opening <html tag for deployment identification.
// ---------------------------------------------------------------------------
function createHtmlDataDplIdTransform(dplId) {
    let didTransform = false;
    return new _nodestream.Transform({
        transform (chunk, _encoding, callback) {
            if (didTransform) {
                this.push(chunk);
                callback();
                return;
            }
            const htmlTagIndex = (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.OPENING.HTML);
            if (htmlTagIndex === -1) {
                this.push(chunk);
                callback();
                return;
            }
            const insertionPoint = htmlTagIndex + _encodedtags.ENCODED_TAGS.OPENING.HTML.length;
            const encodedAttribute = Buffer.from(` data-dpl-id="${dplId}"`);
            const modified = Buffer.allocUnsafe(chunk.length + encodedAttribute.length);
            modified.set(chunk.subarray(0, insertionPoint));
            modified.set(encodedAttribute, insertionPoint);
            modified.set(chunk.subarray(insertionPoint), insertionPoint + encodedAttribute.length);
            this.push(modified);
            didTransform = true;
            callback();
        }
    });
}
// ---------------------------------------------------------------------------
// Root layout validator – Node.js Transform that checks whether <html> and
// <body> tags are present in the streamed output.  Dev-only; appends an
// error template when tags are missing so the error overlay can display it.
// ---------------------------------------------------------------------------
function createRootLayoutValidatorTransform() {
    let foundHtml = false;
    let foundBody = false;
    return new _nodestream.Transform({
        transform (chunk, _encoding, callback) {
            if (!foundHtml && (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.OPENING.HTML) > -1) {
                foundHtml = true;
            }
            if (!foundBody && (0, _uint8arrayhelpers.indexOfUint8Array)(chunk, _encodedtags.ENCODED_TAGS.OPENING.BODY) > -1) {
                foundBody = true;
            }
            this.push(chunk);
            callback();
        },
        flush (callback) {
            const missingTags = [];
            if (!foundHtml) missingTags.push('html');
            if (!foundBody) missingTags.push('body');
            if (missingTags.length) {
                this.push(Buffer.from(`<html id="__next_error__">
            <template
              data-next-error-message="Missing ${missingTags.map((c)=>`<${c}>`).join(missingTags.length > 1 ? ' and ' : '')} tags in the root layout.\nRead more at https://nextjs.org/docs/messages/missing-root-layout-tags"
              data-next-error-digest="${_constants.MISSING_ROOT_TAGS_ERROR}"
              data-next-error-stack=""
            ></template>
          `));
            }
            callback();
        }
    });
}
function renderToNodeFlightStream(ComponentMod, payload, clientModules, opts) {
    if (!ComponentMod.renderToPipeableStream) {
        throw Object.defineProperty(new Error('renderToPipeableStream is not implemented'), "__NEXT_ERROR_CODE", {
            value: "E1153",
            enumerable: false,
            configurable: true
        });
    }
    // `renderToPipeableStream` has no `signal` option (unlike the Web
    // `renderToReadableStream`), so pull `signal` out of the options and abort
    // the returned pipeable ourselves when it fires. We drop the listener when
    // the passthrough closes so a finished render's `pipeable` isn't retained by
    // the request signal, which can outlive it.
    const { signal, ...renderOptions } = opts ?? {};
    const pt = new _nodestream.PassThrough();
    const pipeable = ComponentMod.renderToPipeableStream(payload, clientModules, renderOptions);
    pipeable.pipe(pt);
    if (signal) {
        if (signal.aborted) {
            pipeable.abort(signal.reason);
        } else {
            const onAbort = ()=>pipeable.abort(signal.reason);
            signal.addEventListener('abort', onAbort, {
                once: true
            });
            pt.on('close', ()=>signal.removeEventListener('abort', onAbort));
        }
    }
    return pt;
}
async function renderToNodeFizzStream(element, streamOptions, options) {
    const pt = new _nodestream.PassThrough();
    const shellReady = new _detachedpromise.DetachedPromise();
    const allReady = new _detachedpromise.DetachedPromise();
    const deferPipe = (options == null ? void 0 : options.waitForAllReady) === true;
    const pipeable = (0, _tracer.getTracer)().trace(_constants1.AppRenderSpan.renderToReadableStream, ()=>(0, _server.renderToPipeableStream)(element, {
            ...streamOptions,
            onHeaders: streamOptions == null ? void 0 : streamOptions.onHeaders,
            onShellReady () {
                var _streamOptions_onShellReady;
                streamOptions == null ? void 0 : (_streamOptions_onShellReady = streamOptions.onShellReady) == null ? void 0 : _streamOptions_onShellReady.call(streamOptions);
                shellReady.resolve();
            },
            onShellError (error) {
                var _streamOptions_onShellError;
                streamOptions == null ? void 0 : (_streamOptions_onShellError = streamOptions.onShellError) == null ? void 0 : _streamOptions_onShellError.call(streamOptions, error);
                shellReady.reject(error);
            },
            onAllReady () {
                var _streamOptions_onAllReady;
                streamOptions == null ? void 0 : (_streamOptions_onAllReady = streamOptions.onAllReady) == null ? void 0 : _streamOptions_onAllReady.call(streamOptions);
                if (deferPipe) {
                    pipeable.pipe(pt);
                }
                allReady.resolve();
            },
            onError: streamOptions == null ? void 0 : streamOptions.onError
        }));
    await (0, _tracer.getTracer)().trace(_constants1.AppRenderSpan.waitShellReady, ()=>shellReady.promise);
    if (!deferPipe) {
        await (0, _scheduler.waitAtLeastOneReactRenderTask)();
        pipeable.pipe(pt);
    }
    return {
        stream: pt,
        allReady: allReady.promise,
        abort: (reason)=>pipeable.abort(reason)
    };
}
async function resumeToFizzStream(element, postponedState, streamOptions, runInContext) {
    const run = runInContext ?? ((fn)=>fn());
    const pt = new _nodestream.PassThrough();
    const shellReady = new _detachedpromise.DetachedPromise();
    const allReady = new _detachedpromise.DetachedPromise();
    const pipeable = await run(()=>(0, _server.resumeToPipeableStream)(element, postponedState, {
            ...streamOptions,
            onShellReady () {
                var _streamOptions_onShellReady;
                streamOptions == null ? void 0 : (_streamOptions_onShellReady = streamOptions.onShellReady) == null ? void 0 : _streamOptions_onShellReady.call(streamOptions);
                shellReady.resolve();
            },
            onShellError (error) {
                var _streamOptions_onShellError;
                streamOptions == null ? void 0 : (_streamOptions_onShellError = streamOptions.onShellError) == null ? void 0 : _streamOptions_onShellError.call(streamOptions, error);
                shellReady.reject(error);
            },
            onAllReady () {
                var _streamOptions_onAllReady;
                streamOptions == null ? void 0 : (_streamOptions_onAllReady = streamOptions.onAllReady) == null ? void 0 : _streamOptions_onAllReady.call(streamOptions);
                allReady.resolve();
            }
        }));
    pipeable.pipe(pt);
    await shellReady.promise;
    return {
        stream: pt,
        allReady: allReady.promise,
        abort: (reason)=>pipeable.abort(reason)
    };
}
async function resumeAndAbort(element, postponed, opts) {
    var _opts_signal;
    const pt = new _nodestream.PassThrough();
    const pipeable = await (0, _server.resumeToPipeableStream)(element, postponed, opts);
    pipeable.pipe(pt);
    pipeable.abort(opts == null ? void 0 : (_opts_signal = opts.signal) == null ? void 0 : _opts_signal.reason);
    return pt;
}
async function continueFizzStream(renderStream, { suffix, inlinedDataStream, isStaticGeneration, allReady, deploymentId, getServerInsertedHTML, getServerInsertedMetadata, validateRootLayout }) {
    // Suffix itself might contain close tags at the end, so we need to split it.
    const suffixUnclosed = suffix ? suffix.split(_nodewebstreamshelper.CLOSE_TAG, 1)[0] : null;
    if (isStaticGeneration) {
        if (allReady) {
            await allReady;
        }
    } else {
        // Otherwise, we want to make sure Fizz is done with all microtasky work
        // before we start pulling the stream and cause a flush.
        await (0, _scheduler.waitAtLeastOneReactRenderTask)();
    }
    // Pipe the render stream through Node.js Transforms:
    // 1. Buffer – coalesces chunks written in the same microtask into one Uint8Array
    // 2. Flight data injection – interleaves RSC data chunks with the HTML stream
    // 3. Head insertion – inserts server-generated HTML before </head>
    const buffered = (0, _nodebufferedtransformstream.createNodeBufferedTransformStream)();
    webToReadable(renderStream).pipe(buffered);
    let source = buffered;
    if (deploymentId) {
        const dplId = createHtmlDataDplIdTransform(deploymentId);
        source.pipe(dplId);
        source = dplId;
    }
    // Metadata (icon mark replacement)
    const metadata = createMetadataTransform(getServerInsertedMetadata);
    source.pipe(metadata);
    source = metadata;
    // Insert suffix content
    if (suffixUnclosed != null && suffixUnclosed.length > 0) {
        const deferredSuffix = createDeferredSuffixTransform(suffixUnclosed);
        source.pipe(deferredSuffix);
        source = deferredSuffix;
    }
    // Flight data injection – interleaves RSC data chunks with the HTML stream
    if (inlinedDataStream) {
        const flightInjection = createFlightDataInjectionTransform(webToReadable(inlinedDataStream), true);
        source.pipe(flightInjection);
        source = flightInjection;
    }
    if (validateRootLayout) {
        const rootLayoutValidator = createRootLayoutValidatorTransform();
        source.pipe(rootLayoutValidator);
        source = rootLayoutValidator;
    }
    // Close tags should always be deferred to the end
    const moveSuffix = createMoveSuffixTransform();
    source.pipe(moveSuffix);
    source = moveSuffix;
    // Head insertion – inserts server-generated HTML before </head>
    const headInsertion = createHeadInsertionTransform(getServerInsertedHTML);
    source.pipe(headInsertion);
    source = headInsertion;
    return source;
}
async function continueStaticPrerender(prerenderStream, opts) {
    const webResult = await (0, _nodewebstreamshelper.continueStaticPrerender)(nodeReadableToWebReadableStream(prerenderStream), {
        ...opts,
        inlinedDataStream: nodeReadableToWebReadableStream(opts.inlinedDataStream)
    });
    return webToReadable(webResult);
}
async function continueDynamicPrerender(prerenderStream, opts) {
    const webResult = await (0, _nodewebstreamshelper.continueDynamicPrerender)(nodeReadableToWebReadableStream(prerenderStream), opts);
    return webToReadable(webResult);
}
async function continueStaticFallbackPrerender(prerenderStream, opts) {
    const webResult = await (0, _nodewebstreamshelper.continueStaticFallbackPrerender)(nodeReadableToWebReadableStream(prerenderStream), {
        ...opts,
        inlinedDataStream: nodeReadableToWebReadableStream(opts.inlinedDataStream)
    });
    return webToReadable(webResult);
}
async function continueDynamicHTMLResumeNode(renderStream, { delayDataUntilFirstHtmlChunk, inlinedDataStream, getServerInsertedHTML, getServerInsertedMetadata, deploymentId }) {
    await (0, _scheduler.waitAtLeastOneReactRenderTask)();
    const buffered = (0, _nodebufferedtransformstream.createNodeBufferedTransformStream)();
    webToReadable(renderStream).pipe(buffered);
    let source = buffered;
    if (deploymentId) {
        const dplId = createHtmlDataDplIdTransform(deploymentId);
        source.pipe(dplId);
        source = dplId;
    }
    const headInsertion = createHeadInsertionTransform(getServerInsertedHTML);
    source.pipe(headInsertion);
    source = headInsertion;
    const metadata = createMetadataTransform(getServerInsertedMetadata);
    source.pipe(metadata);
    source = metadata;
    const flightInjection = createFlightDataInjectionTransform(webToReadable(inlinedDataStream), delayDataUntilFirstHtmlChunk);
    source.pipe(flightInjection);
    source = flightInjection;
    const moveSuffix = createMoveSuffixTransform();
    source.pipe(moveSuffix);
    source = moveSuffix;
    return source;
}
async function continueDynamicHTMLResumeWeb(renderStream, opts) {
    const webResult = await (0, _nodewebstreamshelper.continueDynamicHTMLResume)(nodeReadableToWebReadableStream(renderStream), {
        ...opts,
        inlinedDataStream: nodeReadableToWebReadableStream(opts.inlinedDataStream)
    });
    return webToReadable(webResult);
}
function chainStreams(...streams) {
    if (streams.length === 0) {
        const pt = new _nodestream.PassThrough();
        pt.end();
        return pt;
    }
    if (streams.length === 1) {
        return streams[0];
    }
    const out = new _nodestream.PassThrough();
    let i = 0;
    function pipeNext() {
        if (i >= streams.length) {
            out.end();
            return;
        }
        const current = webToReadable(streams[i++]);
        current.pipe(out, {
            end: false
        });
        current.on('end', pipeNext);
        current.on('error', (err)=>out.destroy(err));
    }
    pipeNext();
    return out;
}
async function streamToBuffer(stream) {
    return (0, _nodewebstreamshelper.streamToBuffer)(nodeReadableToWebReadableStream(stream));
}
async function streamToString(stream) {
    return (0, _nodewebstreamshelper.streamToString)(nodeReadableToWebReadableStream(stream));
}
function createWebInlinedDataStream(source, nonce, formState) {
    const webSource = nodeReadableToWebReadableStream(source);
    const webResult = (0, _useflightresponse.createInlinedDataReadableStream)(webSource, nonce, formState);
    return webToReadable(webResult);
}
function createNodeInlinedDataStream(source, nonce, formState) {
    const startScriptTag = nonce ? `<script nonce="${(0, _htmlescape.htmlEscapeAttributeString)(nonce)}">` : '<script>';
    const dataStream = webToReadable(source);
    const pt = new _nodestream.PassThrough();
    // Write initial bootstrap instructions
    let scriptContents = `(self.__next_f=self.__next_f||[]).push(${(0, _htmlescape.htmlEscapeJsonString)(JSON.stringify([
        INLINE_FLIGHT_PAYLOAD_BOOTSTRAP
    ]))})`;
    if (formState != null) {
        scriptContents += `;self.__next_f.push(${(0, _htmlescape.htmlEscapeJsonString)(JSON.stringify([
            INLINE_FLIGHT_PAYLOAD_FORM_STATE,
            formState
        ]))})`;
    }
    pt.push(Buffer.from(`${startScriptTag}${scriptContents}</script>`));
    // Pull from the flight data stream and wrap each chunk in a <script> tag
    pullFlightData(dataStream, pt, startScriptTag);
    return pt;
}
const INLINE_FLIGHT_PAYLOAD_BOOTSTRAP = 0;
const INLINE_FLIGHT_PAYLOAD_DATA = 1;
const INLINE_FLIGHT_PAYLOAD_FORM_STATE = 2;
const INLINE_FLIGHT_PAYLOAD_BINARY = 3;
async function pullFlightData(dataStream, output, startScriptTag) {
    function waitForReadableOrEnd() {
        if (dataStream.readableLength > 0 || dataStream.readableEnded) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject)=>{
            function cleanup() {
                dataStream.removeListener('readable', onDone);
                dataStream.removeListener('end', onDone);
                dataStream.removeListener('error', onError);
            }
            function onDone() {
                cleanup();
                resolve();
            }
            function onError(err) {
                cleanup();
                reject(err);
            }
            dataStream.on('readable', onDone);
            dataStream.on('end', onDone);
            dataStream.on('error', onError);
        });
    }
    try {
        while(true){
            const chunk = dataStream.read();
            if (chunk !== null) {
                let htmlInlinedData;
                if ((0, _nodebuffer.isUtf8)(chunk)) {
                    const decodedString = chunk.toString('utf-8');
                    htmlInlinedData = (0, _htmlescape.htmlEscapeJsonString)(JSON.stringify([
                        INLINE_FLIGHT_PAYLOAD_DATA,
                        decodedString
                    ]));
                } else {
                    const base64 = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength).toString('base64');
                    htmlInlinedData = (0, _htmlescape.htmlEscapeJsonString)(JSON.stringify([
                        INLINE_FLIGHT_PAYLOAD_BINARY,
                        base64
                    ]));
                }
                output.push(Buffer.from(`${startScriptTag}self.__next_f.push(${htmlInlinedData})</script>`));
                continue;
            }
            if (dataStream.readableEnded) {
                output.end();
                return;
            }
            await waitForReadableOrEnd();
        }
    } catch (err) {
        output.destroy(err);
    }
}
function createPendingStream() {
    return new _nodestream.PassThrough();
}
function createDocumentClosingStream() {
    const webStream = (0, _nodewebstreamshelper.createDocumentClosingStream)();
    return webToReadable(webStream);
}
function createOnHeadersCallback(appendHeader) {
    return (headers)=>{
        headers.forEach((value, key)=>{
            appendHeader(key, value);
        });
    };
}
function pipeRuntimePrefetchTransform(stream, sentinel, isPartial, staleTime) {
    const webStream = nodeReadableToWebReadableStream(stream);
    const transformed = webStream.pipeThrough((0, _nodewebstreamshelper.createRuntimePrefetchTransformStream)(sentinel, isPartial, staleTime));
    return webToReadable(transformed);
}
async function processPrelude(unprocessedPrelude) {
    const [prelude, peek] = nodeReadableToWebReadableStream(unprocessedPrelude).tee();
    const reader = peek.getReader();
    const firstResult = await reader.read();
    reader.cancel();
    return {
        prelude: webToReadable(prelude),
        preludeIsEmpty: firstResult.done === true
    };
}
function getServerPrerender(ComponentMod) {
    return ComponentMod.prerender;
}
const getClientPrerender = _static.prerender;
function teeStream(stream) {
    const replayable = new _apprenderprerenderutils.ReplayableNodeStream(stream);
    return [
        replayable.createReplayStream(),
        replayable.createReplayStream()
    ];
}

//# sourceMappingURL=stream-ops.node.js.map