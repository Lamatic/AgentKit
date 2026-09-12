import { unpatchedSetImmediate } from '../node-environment-extensions/fast-set-immediate.external';
import { InvariantError } from '../../shared/lib/invariant-error';
const MAX_ACTIVE_DEV_VALIDATIONS = 100;
export class DevValidationScheduler {
    constructor(maxActiveValidations){
        this.maxActiveValidations = maxActiveValidations;
        this.currentValidationByDocument = new Map();
        if (maxActiveValidations < 1) {
            throw Object.defineProperty(new InvariantError('DevValidationScheduler requires at least one active validation'), "__NEXT_ERROR_CODE", {
                value: "E1441",
                enumerable: false,
                configurable: true
            });
        }
    }
    get size() {
        return this.currentValidationByDocument.size;
    }
    begin(htmlRequestId) {
        const previousController = this.currentValidationByDocument.get(htmlRequestId);
        if (previousController !== undefined) {
            this.currentValidationByDocument.delete(htmlRequestId);
            previousController.abort();
        }
        if (this.currentValidationByDocument.size >= this.maxActiveValidations) {
            const oldestEntry = this.currentValidationByDocument.entries().next().value;
            if (oldestEntry !== undefined) {
                const [oldestHtmlRequestId, oldestController] = oldestEntry;
                this.currentValidationByDocument.delete(oldestHtmlRequestId);
                oldestController.abort();
            }
        }
        const controller = new AbortController();
        this.currentValidationByDocument.set(htmlRequestId, controller);
        return {
            signal: controller.signal,
            finish: ()=>{
                // A superseded generation may settle after its replacement. Only the
                // current generation is allowed to remove this document's entry.
                if (this.currentValidationByDocument.get(htmlRequestId) === controller) {
                    this.currentValidationByDocument.delete(htmlRequestId);
                }
            }
        };
    }
}
// Only active validation work is retained. The hard cap also bounds the
// registry if user code suspends indefinitely and the work never settles.
const devValidationScheduler = new DevValidationScheduler(MAX_ACTIVE_DEV_VALIDATIONS);
export function beginDevValidation(htmlRequestId) {
    return devValidationScheduler.begin(htmlRequestId);
}
/**
 * Give incoming requests a chance to enter app rendering and supersede the
 * current validation before another expensive render attempt starts.
 *
 * The regular global `setImmediate` is patched by staged rendering and can run
 * inside the current timer task. The original immediate is required here so we
 * actually pass through the event-loop poll phase where HTTP requests arrive.
 */ export async function yieldToForegroundRequest(validationSignal) {
    if (validationSignal.aborted) {
        return false;
    }
    await new Promise((resolve)=>unpatchedSetImmediate(resolve));
    return !validationSignal.aborted;
}

//# sourceMappingURL=dev-validation-scheduler.js.map