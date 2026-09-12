"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    VaryParamsAccumulator: null,
    accumulateRootVaryParam: null,
    accumulateVaryParam: null,
    createResponseVaryParamsAccumulator: null,
    createVaryParamsAccumulator: null,
    createVaryingParams: null,
    createVaryingSearchParams: null,
    emptyVaryParamsAccumulator: null,
    finishAccumulatingVaryParams: null,
    getMetadataVaryParamsAccumulator: null,
    getRootParamsVaryParamsAccumulator: null,
    getViewportVaryParamsAccumulator: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    VaryParamsAccumulator: function() {
        return VaryParamsAccumulator;
    },
    accumulateRootVaryParam: function() {
        return accumulateRootVaryParam;
    },
    accumulateVaryParam: function() {
        return accumulateVaryParam;
    },
    createResponseVaryParamsAccumulator: function() {
        return createResponseVaryParamsAccumulator;
    },
    createVaryParamsAccumulator: function() {
        return createVaryParamsAccumulator;
    },
    createVaryingParams: function() {
        return createVaryingParams;
    },
    createVaryingSearchParams: function() {
        return createVaryingSearchParams;
    },
    emptyVaryParamsAccumulator: function() {
        return emptyVaryParamsAccumulator;
    },
    finishAccumulatingVaryParams: function() {
        return finishAccumulatingVaryParams;
    },
    getMetadataVaryParamsAccumulator: function() {
        return getMetadataVaryParamsAccumulator;
    },
    getRootParamsVaryParamsAccumulator: function() {
        return getRootParamsVaryParamsAccumulator;
    },
    getViewportVaryParamsAccumulator: function() {
        return getViewportVaryParamsAccumulator;
    }
});
const _workunitasyncstorageexternal = require("./work-unit-async-storage.external");
class VaryParamsAccumulator {
    /**
   * Records that a param was accessed. Yields the name into the stream the
   * first time it's seen; subsequent accesses of the same name are no-ops.
   */ add(paramName) {
        if (this._done || this._seen.has(paramName)) {
            return;
        }
        this._seen.add(paramName);
        if (this._resolve !== null) {
            this._resolve({
                value: paramName,
                done: false
            });
            this._resolve = null;
        } else {
            this._buffer.push(paramName);
        }
    }
    /** Ends the iteration. Best-effort: if skipped (e.g. on a sync-I/O abort),
   * the consumer simply reads the params yielded so far. */ close() {
        if (this._done) {
            return;
        }
        this._done = true;
        if (this._resolve !== null) {
            this._resolve({
                value: undefined,
                done: true
            });
            this._resolve = null;
        }
    }
    [Symbol.asyncIterator]() {
        return {
            next: ()=>{
                if (this._buffer.length > 0) {
                    return Promise.resolve({
                        value: this._buffer.shift(),
                        done: false
                    });
                }
                if (this._done) {
                    return Promise.resolve({
                        value: undefined,
                        done: true
                    });
                }
                return new Promise((resolve)=>{
                    this._resolve = resolve;
                });
            }
        };
    }
    constructor(){
        this._resolve = null;
        this._done = false;
        this._buffer = [];
        // The set of param names already yielded. Doubles as the dedupe guard so the
        // same name is never emitted twice.
        this._seen = new Set();
    }
}
const emptyVaryParamsAccumulator = new VaryParamsAccumulator();
emptyVaryParamsAccumulator.close();
function createResponseVaryParamsAccumulator() {
    // Create the head and rootParams accumulators as top-level fields.
    // Segment accumulators are added to the segments set as they are created.
    const head = new VaryParamsAccumulator();
    const rootParams = new VaryParamsAccumulator();
    const segments = new Set();
    return {
        head,
        rootParams,
        segments
    };
}
function createVaryParamsAccumulator() {
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (!workUnitStore) {
        return null;
    }
    const responseAccumulator = (0, _workunitasyncstorageexternal.getVaryParamsAccumulator)(workUnitStore);
    if (!responseAccumulator) {
        return null;
    }
    const accumulator = new VaryParamsAccumulator();
    responseAccumulator.segments.add(accumulator);
    return accumulator;
}
function getMetadataVaryParamsAccumulator() {
    var _getVaryParamsAccumulator;
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (!workUnitStore) {
        return null;
    }
    return ((_getVaryParamsAccumulator = (0, _workunitasyncstorageexternal.getVaryParamsAccumulator)(workUnitStore)) == null ? void 0 : _getVaryParamsAccumulator.head) ?? null;
}
const getViewportVaryParamsAccumulator = getMetadataVaryParamsAccumulator;
function getRootParamsVaryParamsAccumulator() {
    var _getVaryParamsAccumulator;
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (!workUnitStore) {
        return null;
    }
    return ((_getVaryParamsAccumulator = (0, _workunitasyncstorageexternal.getVaryParamsAccumulator)(workUnitStore)) == null ? void 0 : _getVaryParamsAccumulator.rootParams) ?? null;
}
function accumulateVaryParam(accumulator, paramName) {
    accumulator.add(paramName);
}
function accumulateRootVaryParam(paramName) {
    const rootParamsAccumulator = getRootParamsVaryParamsAccumulator();
    if (rootParamsAccumulator !== null) {
        accumulateVaryParam(rootParamsAccumulator, paramName);
    }
}
function createVaryingParams(accumulator, originalParamsObject, optionalCatchAllParamName) {
    if (optionalCatchAllParamName !== null) {
        // When there's an optional catch-all param with no value (e.g.,
        // [[...slug]] at /), the param doesn't exist as a property on the params
        // object. Use a Proxy to track all param access — both existing params
        // and the missing optional param — including enumeration patterns like
        // Object.keys(), spread, for...in, and `in` checks.
        return new Proxy(originalParamsObject, {
            get (target, prop, receiver) {
                if (typeof prop === 'string') {
                    if (prop === optionalCatchAllParamName || Object.prototype.hasOwnProperty.call(target, prop)) {
                        accumulateVaryParam(accumulator, prop);
                    }
                }
                return Reflect.get(target, prop, receiver);
            },
            has (target, prop) {
                if (prop === optionalCatchAllParamName) {
                    accumulateVaryParam(accumulator, optionalCatchAllParamName);
                }
                return Reflect.has(target, prop);
            },
            ownKeys (target) {
                // Enumerating the params object means the user's code may depend on
                // which params are present, so conservatively track the optional
                // param as accessed.
                accumulateVaryParam(accumulator, optionalCatchAllParamName);
                return Reflect.ownKeys(target);
            }
        });
    }
    // When there's no optional catch-all, all params exist as properties on the
    // object, so we can use defineProperty getters instead of a Proxy. This is
    // faster because the engine can optimize property access on regular objects
    // more aggressively than Proxy trap calls.
    const underlyingParamsWithVarying = {};
    for(const paramName in originalParamsObject){
        Object.defineProperty(underlyingParamsWithVarying, paramName, {
            get () {
                accumulateVaryParam(accumulator, paramName);
                return originalParamsObject[paramName];
            },
            enumerable: true
        });
    }
    return underlyingParamsWithVarying;
}
function createVaryingSearchParams(accumulator, originalSearchParamsObject) {
    // Search params have no fixed schema, so any access — missing-key reads, `in`
    // checks, or enumeration — must register as varying. A Proxy is required
    // (rather than per-property getters) so that enumeration of an empty
    // searchParams object still triggers a vary. All accesses bucket into the
    // single sentinel '?'; the segment is keyed by the whole query string.
    // TODO: Split into per-param tracking if the cache key evolves.
    return new Proxy(originalSearchParamsObject, {
        get (target, prop, receiver) {
            if (typeof prop === 'string') {
                accumulateVaryParam(accumulator, '?');
            }
            return Reflect.get(target, prop, receiver);
        },
        has (target, prop) {
            if (typeof prop === 'string') {
                accumulateVaryParam(accumulator, '?');
            }
            return Reflect.has(target, prop);
        },
        ownKeys (target) {
            accumulateVaryParam(accumulator, '?');
            return Reflect.ownKeys(target);
        }
    });
}
function finishAccumulatingVaryParams(responseAccumulator) {
    responseAccumulator.head.close();
    responseAccumulator.rootParams.close();
    for (const segmentAccumulator of responseAccumulator.segments){
        segmentAccumulator.close();
    }
}

//# sourceMappingURL=vary-params.js.map