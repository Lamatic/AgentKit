import type { AppPageModule } from '../route-modules/app-page/module';
/**
 * Encodes dev-validation errors into the RSC Flight bytes the dev overlay
 * revives. Must run in the runtime that produced the errors (the in-process
 * render or the validation worker) so the encode uses the matching
 * client-reference manifest and captures the live `Error` objects with their
 * stacks and digests. The error codes ride along in a side-channel `Map`
 * because React doesn't revive `__NEXT_ERROR_CODE` during RSC deserialization;
 * RSC preserves object identity, so the revived map keys reference the same
 * errors.
 */
export declare function serializeValidationErrorsToFlight(componentMod: AppPageModule, errors: Error[]): Promise<Uint8Array[]>;
