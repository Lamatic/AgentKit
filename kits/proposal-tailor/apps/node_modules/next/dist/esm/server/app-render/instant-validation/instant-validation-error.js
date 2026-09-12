const INSTANT_VALIDATION_ERROR_DIGEST = 'INSTANT_VALIDATION_ERROR';
/** Check if an error is an exhaustive samples validation error (by digest). */ export function isInstantValidationError(err) {
    return !!(err && typeof err === 'object' && err instanceof Error && err.digest === INSTANT_VALIDATION_ERROR_DIGEST);
}
export class InstantValidationError extends Error {
    constructor(...args){
        super(...args), this.digest = INSTANT_VALIDATION_ERROR_DIGEST;
    }
}

//# sourceMappingURL=instant-validation-error.js.map