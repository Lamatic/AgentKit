"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    ReactServerPrerenderResult: null,
    ReactServerResult: null,
    ReplayableNodeStream: null,
    createReactServerPrerenderResult: null,
    createReactServerPrerenderResultFromRender: null,
    processPrelude: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ReactServerPrerenderResult: function() {
        return ReactServerPrerenderResult;
    },
    ReactServerResult: function() {
        return ReactServerResult;
    },
    ReplayableNodeStream: function() {
        return ReplayableNodeStream;
    },
    createReactServerPrerenderResult: function() {
        return createReactServerPrerenderResult;
    },
    createReactServerPrerenderResultFromRender: function() {
        return createReactServerPrerenderResultFromRender;
    },
    processPrelude: function() {
        return processPrelude;
    }
});
const _invarianterror = require("../../shared/lib/invariant-error");
function isWebStream(stream) {
    return typeof stream.tee === 'function';
}
class ReactServerResult {
    constructor(stream){
        if (process.env.__NEXT_USE_NODE_STREAMS && !isWebStream(stream)) {
            this._stream = null;
            this._replayable = new ReplayableNodeStream(stream);
        } else {
            this._stream = stream;
            this._replayable = null;
        }
    }
    tee() {
        if (this._replayable) {
            return this._replayable.createReplayStream();
        }
        if (this._stream === null) {
            throw Object.defineProperty(new Error('Cannot tee a ReactServerResult that has already been consumed'), "__NEXT_ERROR_CODE", {
                value: "E106",
                enumerable: false,
                configurable: true
            });
        }
        if (isWebStream(this._stream)) {
            const tee = this._stream.tee();
            this._stream = tee[0];
            return tee[1];
        }
        if (process.env.NEXT_RUNTIME === 'edge') {
            throw Object.defineProperty(new _invarianterror.InvariantError('Node.js Readable cannot be teed in the edge runtime'), "__NEXT_ERROR_CODE", {
                value: "E1149",
                enumerable: false,
                configurable: true
            });
        } else {
            let Readable;
            if (process.env.TURBOPACK) {
                Readable = require('node:stream').Readable;
            } else {
                Readable = __non_webpack_require__('node:stream').Readable;
            }
            const webStream = Readable.toWeb(this._stream);
            const tee = webStream.tee();
            this._stream = Readable.fromWeb(tee[0]);
            return Readable.fromWeb(tee[1]);
        }
    }
    consume() {
        if (this._replayable) {
            const stream = this._replayable.createReplayStream();
            this._replayable.dispose();
            this._replayable = null;
            return stream;
        }
        if (this._stream === null) {
            throw Object.defineProperty(new Error('Cannot consume a ReactServerResult that has already been consumed'), "__NEXT_ERROR_CODE", {
                value: "E470",
                enumerable: false,
                configurable: true
            });
        }
        const stream = this._stream;
        this._stream = null;
        return stream;
    }
}
class ReplayableNodeStream {
    constructor(stream){
        this._chunks = [];
        this._done = false;
        this._error = null;
        this._subscribers = new Set();
        stream.on('data', (chunk)=>{
            const buf = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
            if (this._chunks !== null) {
                this._chunks.push(buf);
            }
            for (const sub of this._subscribers){
                sub.onChunk(buf);
            }
        });
        stream.on('end', ()=>{
            this._done = true;
            for (const sub of this._subscribers){
                sub.onEnd();
            }
            this._subscribers.clear();
        });
        stream.on('error', (err)=>{
            this._error = err;
            for (const sub of this._subscribers){
                sub.onError(err);
            }
            this._subscribers.clear();
        });
    }
    /**
   * Creates a new Node.js Readable stream that first emits all buffered chunks,
   * then forwards any new chunks from the source as they arrive.
   *
   * Buffered chunks are delivered via _read() (pull-based) rather than pushed
   * eagerly. This is critical because createReplayStream() is called outside
   * of AsyncLocalStorage context, and eagerly pushing chunks triggers internal
   * Node.js stream scheduling (process.nextTick for maybeReadMore) that
   * captures the empty ALS context. By deferring to _read(), chunks are only
   * delivered when the consumer reads, which happens inside the correct ALS
   * scope (e.g. during Fizz's performWork).
   */ createReplayStream() {
        if (this._chunks === null) {
            throw Object.defineProperty(new _invarianterror.InvariantError('Cannot create a replay stream after the ReplayableNodeStream has been disposed.'), "__NEXT_ERROR_CODE", {
                value: "E1156",
                enumerable: false,
                configurable: true
            });
        }
        let ReadableCtor;
        if (process.env.NEXT_RUNTIME === 'edge') {
            throw Object.defineProperty(new _invarianterror.InvariantError('Node.js Readable cannot be teed in the edge runtime'), "__NEXT_ERROR_CODE", {
                value: "E1149",
                enumerable: false,
                configurable: true
            });
        } else {
            if (process.env.__NEXT_BUNDLER === 'Webpack' || process.env.__NEXT_BUNDLER === 'Rspack') {
                ReadableCtor = __non_webpack_require__('node:stream').Readable;
            } else {
                ReadableCtor = require('node:stream').Readable;
            }
        }
        const bufferedChunks = this._chunks.slice();
        let bufferIndex = 0;
        let bufferDrained = false;
        const isDone = this._done;
        const sourceError = this._error;
        const stream = new ReadableCtor({
            read () {
                if (!bufferDrained) {
                    bufferDrained = true;
                    for(let i = bufferIndex; i < bufferedChunks.length; i++){
                        this.push(bufferedChunks[i]);
                    }
                    bufferIndex = bufferedChunks.length;
                    if (isDone) {
                        this.push(null);
                    }
                }
            }
        });
        if (sourceError) {
            stream.destroy(sourceError);
            return stream;
        }
        if (isDone) {
            return stream;
        }
        const subscriber = {
            onChunk: (chunk)=>{
                stream.push(chunk);
            },
            onEnd: ()=>{
                stream.push(null);
            },
            onError: (err)=>{
                stream.destroy(err);
            }
        };
        this._subscribers.add(subscriber);
        stream.on('close', ()=>{
            this._subscribers.delete(subscriber);
        });
        return stream;
    }
    /**
   * Clears the buffered chunks and all subscriber references. After calling
   * this, no new replay streams can be created.
   */ dispose() {
        this._chunks = null;
    }
}
async function createReactServerPrerenderResult(underlying) {
    const chunks = [];
    const { prelude } = await underlying;
    const reader = prelude.getReader();
    while(true){
        const { done, value } = await reader.read();
        if (done) {
            return new ReactServerPrerenderResult(chunks);
        } else {
            chunks.push(value);
        }
    }
}
async function createReactServerPrerenderResultFromRender(underlying) {
    const chunks = [];
    if (isWebStream(underlying)) {
        const reader = underlying.getReader();
        while(true){
            const { done, value } = await reader.read();
            if (done) {
                break;
            } else {
                chunks.push(value);
            }
        }
    } else {
        for await (const chunk of underlying){
            chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
        }
    }
    return new ReactServerPrerenderResult(chunks);
}
class ReactServerPrerenderResult {
    assertChunks(expression) {
        if (this._chunks === null) {
            throw Object.defineProperty(new _invarianterror.InvariantError(`Cannot \`${expression}\` on a ReactServerPrerenderResult that has already been consumed.`), "__NEXT_ERROR_CODE", {
                value: "E593",
                enumerable: false,
                configurable: true
            });
        }
        return this._chunks;
    }
    consumeChunks(expression) {
        const chunks = this.assertChunks(expression);
        this.consume();
        return chunks;
    }
    consume() {
        this._chunks = null;
    }
    constructor(chunks){
        this._chunks = chunks;
    }
    asChunks() {
        const chunks = this.assertChunks('asChunks()');
        return chunks;
    }
    asUnclosingStream() {
        const chunks = this.assertChunks('asUnclosingStream()');
        return createUnclosingStream(chunks);
    }
    consumeAsUnclosingStream() {
        const chunks = this.consumeChunks('consumeAsUnclosingStream()');
        return createUnclosingStream(chunks);
    }
    asStream() {
        const chunks = this.assertChunks('asStream()');
        return createClosingStream(chunks);
    }
    consumeAsStream() {
        const chunks = this.consumeChunks('consumeAsStream()');
        return createClosingStream(chunks);
    }
}
function createUnclosingStream(chunks) {
    let i = 0;
    return new ReadableStream({
        async pull (controller) {
            if (i < chunks.length) {
                controller.enqueue(chunks[i++]);
            }
        // we intentionally keep the stream open. The consumer will clear
        // out chunks once finished and the remaining memory will be GC'd
        // when this object goes out of scope
        }
    });
}
function createClosingStream(chunks) {
    let i = 0;
    return new ReadableStream({
        async pull (controller) {
            if (i < chunks.length) {
                controller.enqueue(chunks[i++]);
            } else {
                controller.close();
            }
        }
    });
}
async function processPrelude(unprocessedPrelude) {
    const [prelude, peek] = unprocessedPrelude.tee();
    const reader = peek.getReader();
    const firstResult = await reader.read();
    reader.cancel();
    const preludeIsEmpty = firstResult.done === true;
    return {
        prelude,
        preludeIsEmpty
    };
}

//# sourceMappingURL=app-render-prerender-utils.js.map