import { LogSpanAllowList, NextVanillaSpanAllowlist } from './constants';
import { isThenable } from '../../../shared/lib/is-thenable';
const NEXT_OTEL_PERFORMANCE_PREFIX = process.env.NEXT_OTEL_PERFORMANCE_PREFIX;
const LOCAL_SPAN_RECORDER_KEY = Symbol.for('@next/local-span-recorder');
let api;
function getLocalSpanRecorder() {
    if (process.env.__NEXT_DEV_SERVER) {
        return globalThis[LOCAL_SPAN_RECORDER_KEY];
    } else {
        return undefined;
    }
}
// we want to allow users to use their own version of @opentelemetry/api if they
// want to, so we try to require it first, and if it fails we fall back to the
// version that is bundled with Next.js
// this is because @opentelemetry/api has to be synced with the version of
// @opentelemetry/tracing that is used, and we don't want to force users to use
// the version that is bundled with Next.js.
// the API is ~stable, so this should be fine
if (process.env.NEXT_RUNTIME === 'edge') {
    api = require('@opentelemetry/api');
} else {
    try {
        api = require('@opentelemetry/api');
    } catch (err) {
        api = require('next/dist/compiled/@opentelemetry/api');
    }
}
const { context, propagation, trace, SpanStatusCode, SpanKind, ROOT_CONTEXT } = api;
export class BubbledError extends Error {
    constructor(bubble, result){
        super(), this.bubble = bubble, this.result = result;
    }
}
export function isBubbledError(error) {
    if (typeof error !== 'object' || error === null) return false;
    return error instanceof BubbledError;
}
const closeSpanWithError = (span, error)=>{
    if (isBubbledError(error) && error.bubble) {
        span.setAttribute('next.bubble', true);
    } else {
        if (error) {
            span.recordException(error);
            span.setAttribute('error.type', error.name);
        }
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error == null ? void 0 : error.message
        });
    }
    span.end();
};
/** we use this map to propagate attributes from nested spans to the top span */ const rootSpanAttributesStore = new Map();
const rootSpanIdKey = api.createContextKey('next.rootSpanId');
let lastSpanId = 0;
const getSpanId = ()=>lastSpanId++;
const clientTraceDataSetter = {
    set (carrier, key, value) {
        carrier.push({
            key,
            value
        });
    }
};
class NextTracerImpl {
    /**
   * Returns an instance to the trace with configured name.
   * Since wrap / trace can be defined in any place prior to actual trace subscriber initialization,
   * This should be lazily evaluated.
   */ getTracerInstance() {
        return trace.getTracer('next.js', '0.0.1');
    }
    isOpenTelemetryEnabled() {
        var _tracerProvider_getDelegate_constructor, _tracerProvider_getDelegate;
        const activeSpan = trace.getSpan(context.active());
        if (activeSpan == null ? void 0 : activeSpan.isRecording()) {
            return true;
        }
        const tracerProvider = trace.getTracerProvider();
        if (!('getDelegate' in tracerProvider)) {
            return true;
        }
        return (tracerProvider.getDelegate == null ? void 0 : (_tracerProvider_getDelegate = tracerProvider.getDelegate.call(tracerProvider)) == null ? void 0 : (_tracerProvider_getDelegate_constructor = _tracerProvider_getDelegate.constructor) == null ? void 0 : _tracerProvider_getDelegate_constructor.name) !== 'NoopTracerProvider';
    }
    getContext() {
        return context;
    }
    getTracePropagationData() {
        const activeContext = context.active();
        const entries = [];
        propagation.inject(activeContext, entries, clientTraceDataSetter);
        return entries;
    }
    getActiveScopeSpan() {
        const localSpanRecorder = getLocalSpanRecorder();
        const activeLocalSpan = localSpanRecorder == null ? void 0 : localSpanRecorder.getActiveLocalSpan();
        if (activeLocalSpan && (localSpanRecorder == null ? void 0 : localSpanRecorder.isOpenTelemetryIsolatedSpan(activeLocalSpan))) {
            return activeLocalSpan;
        }
        const activeSpan = trace.getSpan(context.active());
        if (activeSpan || !process.env.__NEXT_DEV_SERVER) {
            return activeSpan;
        }
        return activeLocalSpan;
    }
    /**
   * Run `fn` with the active span cleared, so spans created inside become new
   * roots (or parent to incoming propagated context). Used for in-process
   * Node.js middleware so its span is a sibling of the request span, matching
   * edge middleware which runs in a detached sandbox.
   */ runWithDetachedContext(fn) {
        if (!NEXT_OTEL_PERFORMANCE_PREFIX && !this.isOpenTelemetryEnabled()) {
            return fn();
        }
        return context.with(ROOT_CONTEXT, fn);
    }
    withPropagatedContext(carrier, fn, getter, force = false) {
        const activeContext = context.active();
        if (!NEXT_OTEL_PERFORMANCE_PREFIX && !this.isOpenTelemetryEnabled() && !trace.getSpanContext(activeContext)) {
            return fn();
        }
        if (force) {
            const remoteContext = propagation.extract(ROOT_CONTEXT, carrier, getter);
            if (trace.getSpanContext(remoteContext)) {
                return context.with(remoteContext, fn);
            }
            // Preserve the current active span while still merging any extracted
            // baggage/context values from the carrier.
            const mergedContext = propagation.extract(activeContext, carrier, getter);
            return context.with(mergedContext, fn);
        }
        if (trace.getSpanContext(activeContext)) {
            // Active span is already set, too late to propagate.
            return fn();
        }
        const remoteContext = propagation.extract(activeContext, carrier, getter);
        return context.with(remoteContext, fn);
    }
    trace(...args) {
        const [type, fnOrOptions, fnOrEmpty] = args;
        const tracingEnabled = Boolean(NEXT_OTEL_PERFORMANCE_PREFIX) || this.isOpenTelemetryEnabled();
        const localSpanRecorder = getLocalSpanRecorder();
        const localSpanRecordingEnabled = (localSpanRecorder == null ? void 0 : localSpanRecorder.isLocalSpanRecordingEnabled()) ?? false;
        if (!tracingEnabled && !localSpanRecordingEnabled) {
            return typeof fnOrOptions === 'function' ? fnOrOptions() : fnOrEmpty();
        }
        // coerce options form overload
        const { fn, options } = typeof fnOrOptions === 'function' ? {
            fn: fnOrOptions,
            options: {}
        } : {
            fn: fnOrEmpty,
            options: {
                ...fnOrOptions
            }
        };
        const spanName = options.spanName ?? type;
        const parentSpan = options.parentSpan ?? this.getActiveScopeSpan();
        const isolatedParentSpan = parentSpan && (localSpanRecorder == null ? void 0 : localSpanRecorder.isOpenTelemetryIsolatedSpan(parentSpan)) ? parentSpan : undefined;
        const shouldDelegateSpan = !isolatedParentSpan && (NextVanillaSpanAllowlist.has(type) || process.env.NEXT_OTEL_VERBOSE === '1');
        const shouldTraceSpan = shouldDelegateSpan || ((localSpanRecorder == null ? void 0 : localSpanRecorder.isRequestInsightsEnabled()) ?? false);
        if (!shouldTraceSpan || options.hideSpan) {
            return fn();
        }
        // Trying to get active scoped span to assign parent. If option specifies parent span manually, will try to use it.
        let spanContext = isolatedParentSpan ? context.active() : this.getSpanContext(parentSpan);
        if (!spanContext) {
            spanContext = (context == null ? void 0 : context.active()) ?? ROOT_CONTEXT;
        }
        // Check if there's already a root span in the store for this trace
        // We are intentionally not checking whether there is an active context
        // from outside of nextjs to ensure that we can provide the same level
        // of telemetry when using a custom server
        const existingRootSpanId = spanContext.getValue(rootSpanIdKey);
        const isRootSpan = typeof existingRootSpanId !== 'number' || !rootSpanAttributesStore.has(existingRootSpanId);
        const spanId = getSpanId();
        options.attributes = {
            'next.span_category': 'nextjs',
            'next.span_name': spanName,
            'next.span_type': type,
            ...options.attributes
        };
        return context.with(spanContext.setValue(rootSpanIdKey, spanId), ()=>this.runWithActiveSpan(spanName, options, spanContext, tracingEnabled && shouldDelegateSpan, localSpanRecordingEnabled, isolatedParentSpan, (span)=>{
                let startTime;
                if (NEXT_OTEL_PERFORMANCE_PREFIX && type && LogSpanAllowList.has(type)) {
                    startTime = 'performance' in globalThis && 'measure' in performance ? globalThis.performance.now() : undefined;
                }
                let cleanedUp = false;
                const onCleanup = ()=>{
                    if (cleanedUp) return;
                    cleanedUp = true;
                    rootSpanAttributesStore.delete(spanId);
                    if (startTime) {
                        performance.measure(`${NEXT_OTEL_PERFORMANCE_PREFIX}:next-${(type.split('.').pop() || '').replace(/[A-Z]/g, (match)=>'-' + match.toLowerCase())}`, {
                            start: startTime,
                            end: performance.now()
                        });
                    }
                };
                if (isRootSpan) {
                    rootSpanAttributesStore.set(spanId, new Map(Object.entries(options.attributes ?? {})));
                }
                if (fn.length > 1) {
                    try {
                        return fn(span, (err)=>{
                            if (err) {
                                closeSpanWithError(span, err);
                            } else {
                                span.end();
                            }
                        });
                    } catch (err) {
                        closeSpanWithError(span, err);
                        throw err;
                    } finally{
                        onCleanup();
                    }
                }
                try {
                    const result = fn(span);
                    if (isThenable(result)) {
                        // If there's error make sure it throws
                        return result.then((res)=>{
                            span.end();
                            // Need to pass down the promise result,
                            // it could be react stream response with error { error, stream }
                            return res;
                        }).catch((err)=>{
                            closeSpanWithError(span, err);
                            throw err;
                        }).finally(onCleanup);
                    } else {
                        span.end();
                        onCleanup();
                    }
                    return result;
                } catch (err) {
                    closeSpanWithError(span, err);
                    onCleanup();
                    throw err;
                }
            }));
    }
    runWithActiveSpan(spanName, options, parentContext, tracingEnabled, localSpanRecordingEnabled, isolatedParentSpan, fn) {
        if (tracingEnabled) {
            return this.getTracerInstance().startActiveSpan(spanName, options, (span)=>fn(localSpanRecordingEnabled ? this.createLocalRecordingSpan(spanName, options, parentContext, span, isolatedParentSpan) : span));
        }
        const span = this.createLocalRecordingSpan(spanName, options, parentContext, undefined, isolatedParentSpan);
        const localSpanRecorder = getLocalSpanRecorder();
        return localSpanRecorder.withLocalSpan(span, ()=>localSpanRecorder.isOpenTelemetryIsolatedSpan(span) ? fn(span) : context.with(trace.setSpan(context.active(), span), fn, undefined, span));
    }
    createLocalRecordingSpan(name, options, parentContext, delegateSpan, isolatedParentSpan) {
        const parentSpanContext = (isolatedParentSpan == null ? void 0 : isolatedParentSpan.spanContext()) ?? trace.getSpanContext(parentContext);
        const delegateSpanContext = delegateSpan == null ? void 0 : delegateSpan.spanContext();
        return getLocalSpanRecorder().createLocalSpan({
            name,
            attributes: options.attributes,
            links: options.links,
            startTime: options.startTime,
            delegateSpan,
            traceId: (delegateSpanContext == null ? void 0 : delegateSpanContext.traceId) ?? (parentSpanContext == null ? void 0 : parentSpanContext.traceId),
            spanId: delegateSpanContext == null ? void 0 : delegateSpanContext.spanId,
            parentSpanId: parentSpanContext == null ? void 0 : parentSpanContext.spanId,
            isolateOpenTelemetry: isolatedParentSpan !== undefined
        });
    }
    wrap(...args) {
        const tracer = this;
        const [name, options, fn] = args.length === 3 ? args : [
            args[0],
            {},
            args[1]
        ];
        if (!NextVanillaSpanAllowlist.has(name) && process.env.NEXT_OTEL_VERBOSE !== '1' && !process.env.__NEXT_DEV_SERVER) {
            return fn;
        }
        return function() {
            let optionsObj = options;
            if (typeof optionsObj === 'function' && typeof fn === 'function') {
                optionsObj = optionsObj.apply(this, arguments);
            }
            const lastArgId = arguments.length - 1;
            const cb = arguments[lastArgId];
            if (typeof cb === 'function') {
                const scopeBoundCb = tracer.getContext().bind(context.active(), cb);
                return tracer.trace(name, optionsObj, (_span, done)=>{
                    arguments[lastArgId] = function(err) {
                        done == null ? void 0 : done(err);
                        return scopeBoundCb.apply(this, arguments);
                    };
                    return fn.apply(this, arguments);
                });
            } else {
                return tracer.trace(name, optionsObj, ()=>fn.apply(this, arguments));
            }
        };
    }
    startSpan(...args) {
        const [type, passedOptions] = args;
        const options = passedOptions ? {
            ...passedOptions,
            attributes: {
                'next.span_category': 'nextjs',
                ...passedOptions.attributes
            }
        } : {
            attributes: {
                'next.span_category': 'nextjs'
            }
        };
        const localSpanRecorder = getLocalSpanRecorder();
        const parentSpan = options.parentSpan ?? this.getActiveScopeSpan();
        const isolatedParentSpan = parentSpan && (localSpanRecorder == null ? void 0 : localSpanRecorder.isOpenTelemetryIsolatedSpan(parentSpan)) ? parentSpan : undefined;
        const parentContext = (isolatedParentSpan ? undefined : this.getSpanContext(parentSpan)) ?? context.active();
        const localSpanRecordingEnabled = (localSpanRecorder == null ? void 0 : localSpanRecorder.isLocalSpanRecordingEnabled()) ?? false;
        if (!localSpanRecordingEnabled) {
            return this.getTracerInstance().startSpan(type, options, parentContext);
        }
        const delegateSpan = !isolatedParentSpan && this.isOpenTelemetryEnabled() ? this.getTracerInstance().startSpan(type, options, parentContext) : undefined;
        return this.createLocalRecordingSpan(type, options, parentContext, delegateSpan, isolatedParentSpan);
    }
    getSpanContext(parentSpan) {
        const spanContext = parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined;
        return spanContext;
    }
    getRootSpanAttributes() {
        const spanId = context.active().getValue(rootSpanIdKey);
        return rootSpanAttributesStore.get(spanId);
    }
    setRootSpanAttribute(key, value) {
        const spanId = context.active().getValue(rootSpanIdKey);
        const attributes = rootSpanAttributesStore.get(spanId);
        if (attributes && !attributes.has(key)) {
            attributes.set(key, value);
        }
        if (process.env.__NEXT_DEV_SERVER) {
            var _getLocalSpanRecorder;
            const localSpan = (_getLocalSpanRecorder = getLocalSpanRecorder()) == null ? void 0 : _getLocalSpanRecorder.getActiveLocalSpan();
            if (localSpan) {
                localSpan.setAttribute(key, value);
            }
        }
    }
    withSpan(span, fn) {
        const recorder = getLocalSpanRecorder();
        if (recorder == null ? void 0 : recorder.isLocalRecordingSpan(span)) {
            return recorder.withLocalSpan(span, ()=>recorder.isOpenTelemetryIsolatedSpan(span) ? fn() : context.with(trace.setSpan(context.active(), span), fn));
        }
        return context.with(trace.setSpan(context.active(), span), fn);
    }
}
const getTracer = (()=>{
    const tracer = new NextTracerImpl();
    return ()=>tracer;
})();
export { getTracer, SpanStatusCode, SpanKind };

//# sourceMappingURL=tracer.js.map