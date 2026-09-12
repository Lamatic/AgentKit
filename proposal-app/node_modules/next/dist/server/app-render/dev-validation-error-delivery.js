"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "serializeValidationErrorsToFlight", {
    enumerable: true,
    get: function() {
        return serializeValidationErrorsToFlight;
    }
});
const _streamops = require("./stream-ops");
const _manifestssingleton = require("./manifests-singleton");
const _errortelemetryutils = require("../../lib/error-telemetry-utils");
const filterStackFrame = process.env.NODE_ENV !== 'production' ? require('../lib/source-maps').filterStackFrameDEV : undefined;
async function serializeValidationErrorsToFlight(componentMod, errors) {
    const errorCodes = new Map();
    for (const err of errors){
        const code = (0, _errortelemetryutils.extractNextErrorCode)(err);
        if (code !== undefined) {
            errorCodes.set(err, code);
        }
    }
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    const stream = (0, _streamops.renderToNodeFlightStream)(componentMod, {
        errors,
        errorCodes
    }, clientModules, {
        filterStackFrame
    });
    const chunks = [];
    for await (const chunk of stream){
        chunks.push(chunk);
    }
    return chunks;
}

//# sourceMappingURL=dev-validation-error-delivery.js.map