"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createHTMLErrorHandler: null,
    createReactServerErrorHandler: null,
    getDigestForWellKnownError: null,
    isUserLandError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createHTMLErrorHandler: function() {
        return createHTMLErrorHandler;
    },
    createReactServerErrorHandler: function() {
        return createReactServerErrorHandler;
    },
    getDigestForWellKnownError: function() {
        return getDigestForWellKnownError;
    },
    isUserLandError: function() {
        return isUserLandError;
    }
});
const _stringhash = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/string-hash"));
const _formatservererror = require("../../lib/format-server-error");
const _tracer = require("../lib/trace/tracer");
const _pipereadable = require("../pipe-readable");
const _bailouttocsr = require("../../shared/lib/lazy-dynamic/bailout-to-csr");
const _hooksservercontext = require("../../client/components/hooks-server-context");
const _isnextroutererror = require("../../client/components/is-next-router-error");
const _dynamicrendering = require("./dynamic-rendering");
const _iserror = require("../../lib/is-error");
const _errortelemetryutils = require("../../lib/error-telemetry-utils");
const _reactlargeshellerror = require("./react-large-shell-error");
const _instantvalidationerror = require("./instant-validation/instant-validation-error");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getDigestForWellKnownError(error) {
    // If we're bailing out to CSR, we don't need to log the error.
    if ((0, _bailouttocsr.isBailoutToCSRError)(error)) return error.digest;
    // If this is a navigation error, we don't need to log the error.
    if ((0, _isnextroutererror.isNextRouterError)(error)) return error.digest;
    // If this error occurs, we know that we should be stopping the static
    // render. This is only thrown in static generation when PPR is not enabled,
    // which causes the whole page to be marked as dynamic. We don't need to
    // tell the user about this error, as it's not actionable.
    if ((0, _hooksservercontext.isDynamicServerError)(error)) return error.digest;
    // If this is a prerender interrupted error, we don't need to log the error.
    if ((0, _dynamicrendering.isPrerenderInterruptedError)(error)) return error.digest;
    if ((0, _instantvalidationerror.isInstantValidationError)(error)) return error.digest;
    return undefined;
}
function createReactServerErrorHandler(shouldFormatError, isBuildTimePrerendering, reactServerErrors, onReactServerRenderError, spanToRecordOn) {
    return (thrownValue)=>{
        var _err_message;
        // If the response was closed, we don't need to log the error.
        if ((0, _pipereadable.isAbortError)(thrownValue)) return;
        const digest = getDigestForWellKnownError(thrownValue);
        if (digest) {
            return digest;
        }
        if ((0, _reactlargeshellerror.isReactLargeShellError)(thrownValue)) {
            // TODO: Aggregate
            console.error(thrownValue);
            return undefined;
        }
        let err = (0, _iserror.getProperError)(thrownValue);
        let silenceLog = false;
        // If the error already has a digest, respect the original digest,
        // so it won't get re-generated into another new error.
        if (err.digest) {
            const originalError = reactServerErrors.get(err.digest);
            if (originalError) {
                // This error crossed a react-server boundary (e.g. from a `'use cache'`
                // render). Reaching the handler means it surfaced (it wasn't caught in
                // userland), so stamp the digest onto the original to mark it surfaced.
                // If the original was recorded as `invalidDynamicUsageError` without a
                // digest (a cache that aborted across the boundary), this is what lets
                // the dev overlay dedup: the separate forwarding checks for that digest
                // and skips it.
                originalError.digest ??= err.digest;
                if (process.env.NODE_ENV === 'production') {
                    // In production we use the recovered original (de-obfuscated!) error
                    // for reporting, and don't log it again as it was already logged in
                    // the original environment.
                    err = originalError;
                    silenceLog = true;
                }
            }
        } else {
            // TODO-APP: look at using webcrypto instead of string-hash. Requires a promise to be awaited.
            err.digest = typeof thrownValue === 'string' ? (0, _stringhash.default)(thrownValue).toString() : (0, _errortelemetryutils.createDigestWithErrorCode)(err, (0, _stringhash.default)(err.message + (err.stack || '')).toString());
        }
        // @TODO by putting this here and not at the top it is possible that
        // we don't error the build in places we actually expect to
        if (!reactServerErrors.has(err.digest)) {
            reactServerErrors.set(err.digest, err);
        }
        // Format server errors in development to add more helpful error messages
        if (shouldFormatError) {
            (0, _formatservererror.formatServerError)(err);
        }
        // Don't log the suppressed error during export
        if (!(isBuildTimePrerendering && (err == null ? void 0 : (_err_message = err.message) == null ? void 0 : _err_message.includes('The specific message is omitted in production builds to avoid leaking sensitive details.')))) {
            // Record exception on the provided span if available, otherwise try active span.
            const span = spanToRecordOn ?? (0, _tracer.getTracer)().getActiveScopeSpan();
            if (span) {
                span.recordException(err);
                span.setAttribute('error.type', err.name);
                span.setStatus({
                    code: _tracer.SpanStatusCode.ERROR,
                    message: err.message
                });
            }
            onReactServerRenderError(err, silenceLog);
        }
        return err.digest;
    };
}
function createHTMLErrorHandler(shouldFormatError, isBuildTimePrerendering, reactServerErrors, allCapturedErrors, onHTMLRenderSSRError, spanToRecordOn) {
    return (thrownValue, errorInfo)=>{
        var _err_message;
        if ((0, _reactlargeshellerror.isReactLargeShellError)(thrownValue)) {
            // TODO: Aggregate
            console.error(thrownValue);
            return undefined;
        }
        let isSSRError = true;
        allCapturedErrors.push(thrownValue);
        // If the response was closed, we don't need to log the error.
        if ((0, _pipereadable.isAbortError)(thrownValue)) return;
        const digest = getDigestForWellKnownError(thrownValue);
        if (digest) {
            return digest;
        }
        const err = (0, _iserror.getProperError)(thrownValue);
        // If the error already has a digest, respect the original digest,
        // so it won't get re-generated into another new error.
        if (err.digest) {
            if (reactServerErrors.has(err.digest)) {
                // This error is likely an obfuscated error from react-server.
                // We recover the original error here.
                thrownValue = reactServerErrors.get(err.digest);
                isSSRError = false;
            } else {
            // The error is not from react-server but has a digest
            // from other means so we don't need to produce a new one
            }
        } else {
            err.digest = (0, _errortelemetryutils.createDigestWithErrorCode)(err, (0, _stringhash.default)(err.message + ((errorInfo == null ? void 0 : errorInfo.componentStack) || err.stack || '')).toString());
        }
        // Format server errors in development to add more helpful error messages
        if (shouldFormatError) {
            (0, _formatservererror.formatServerError)(err);
        }
        // Don't log the suppressed error during export
        if (!(isBuildTimePrerendering && (err == null ? void 0 : (_err_message = err.message) == null ? void 0 : _err_message.includes('The specific message is omitted in production builds to avoid leaking sensitive details.')))) {
            // HTML errors contain RSC errors as well, filter them out before reporting
            if (isSSRError) {
                // Record exception on the provided span if available, otherwise try active span.
                const span = spanToRecordOn ?? (0, _tracer.getTracer)().getActiveScopeSpan();
                if (span) {
                    span.recordException(err);
                    span.setAttribute('error.type', err.name);
                    span.setStatus({
                        code: _tracer.SpanStatusCode.ERROR,
                        message: err.message
                    });
                }
                onHTMLRenderSSRError(err, errorInfo);
            }
        }
        return err.digest;
    };
}
function isUserLandError(err) {
    return !(0, _pipereadable.isAbortError)(err) && !(0, _bailouttocsr.isBailoutToCSRError)(err) && !(0, _isnextroutererror.isNextRouterError)(err);
}

//# sourceMappingURL=create-error-handler.js.map