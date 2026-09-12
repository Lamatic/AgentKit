export interface DevValidationGeneration {
    readonly signal: AbortSignal;
    finish(): void;
}
export declare class DevValidationScheduler {
    private readonly maxActiveValidations;
    private readonly currentValidationByDocument;
    constructor(maxActiveValidations: number);
    get size(): number;
    begin(htmlRequestId: string): DevValidationGeneration;
}
export declare function beginDevValidation(htmlRequestId: string): DevValidationGeneration;
/**
 * Give incoming requests a chance to enter app rendering and supersede the
 * current validation before another expensive render attempt starts.
 *
 * The regular global `setImmediate` is patched by staged rendering and can run
 * inside the current timer task. The original immediate is required here so we
 * actually pass through the event-loop poll phase where HTTP requests arrive.
 */
export declare function yieldToForegroundRequest(validationSignal: AbortSignal): Promise<boolean>;
