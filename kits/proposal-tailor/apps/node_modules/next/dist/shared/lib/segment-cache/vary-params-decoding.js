/**
 * Vary Params Decoding
 *
 * This module is shared between server and client.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "readVaryParams", {
    enumerable: true,
    get: function() {
        return readVaryParams;
    }
});
/**
 * Synchronously drains a vary params `AsyncIterable`, adding each yielded name
 * to `target`.
 *
 * By the time this runs (on the client, or in collectSegmentData), the Flight
 * stream has been fully buffered, so every yielded value is already
 * materialized and can be read without awaiting. We force each iterator result
 * to resolve synchronously using the same `.then(noop)` trick React uses
 * internally, then read its `status`/`value` directly.
 *
 * We add "every param yielded up to the point the stream suspends": a
 * normally-closed iterable drains fully, while one left hanging (a sync-I/O
 * abort, or a `close()` whose row hasn't flushed yet) drains to the prefix
 * already in the stream. Both are correct — a segment's param accesses are all
 * flushed as they happen during its render, so the prefix is exactly the set
 * the response depends on. We therefore never need the terminating `done` row
 * to be present; it's only stream hygiene.
 */ function drainVaryParams(iterable, target) {
    const iterator = iterable[Symbol.asyncIterator]();
    while(true){
        const chunk = iterator.next();
        // Attach a no-op listener to force Flight to synchronously resolve the
        // chunk. A freshly-arrived result may be in an intermediate
        // 'resolved_model' state (data received but not unwrapped); calling
        // .then() transitions it to 'fulfilled', making the value available
        // synchronously. (A native Promise has no `status` and simply reads as
        // not-fulfilled below, so this can never hang.)
        chunk.then(noop, noop);
        if (chunk.status !== 'fulfilled' || chunk.value === undefined) {
            // The stream suspended here. Everything yielded before this point has
            // already been added.
            return;
        }
        const step = chunk.value;
        if (step.done) {
            return;
        }
        target.add(step.value);
    }
}
function readVaryParams(iterable, rootIterable) {
    if (iterable === null || iterable === undefined || rootIterable === null || rootIterable === undefined) {
        return null;
    }
    const varyParams = new Set();
    drainVaryParams(iterable, varyParams);
    drainVaryParams(rootIterable, varyParams);
    return varyParams;
}
const noop = ()=>{};

//# sourceMappingURL=vary-params-decoding.js.map