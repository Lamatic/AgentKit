/** Check if an error is an exhaustive samples validation error (by digest). */
export declare function isInstantValidationError(err: unknown): err is InstantValidationError;
export declare class InstantValidationError extends Error {
    digest: string;
}
