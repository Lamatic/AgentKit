import { workUnitAsyncStorage } from '../../server/app-render/work-unit-async-storage.external';
import { workAsyncStorage } from '../../server/app-render/work-async-storage.external';
import { createExhaustiveParamsProxy, createExhaustiveURLSearchParamsProxy, trackMissingSampleErrorAndThrow } from '../../server/app-render/instant-validation/instant-samples';
import { InstantValidationError } from '../../server/app-render/instant-validation/instant-validation-error';
export function instrumentParamsForClientValidation(underlyingParams) {
    const workStore = workAsyncStorage.getStore();
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workStore && workUnitStore) {
        switch(workUnitStore.type){
            case 'validation-client':
                {
                    if (workUnitStore.validationSamples) {
                        const declaredKeys = new Set(Object.keys(workUnitStore.validationSamples.params ?? {}));
                        return createExhaustiveParamsProxy(underlyingParams, declaredKeys, workStore.route);
                    }
                    break;
                }
            case 'prerender-runtime':
            case 'prerender-client':
            case 'prerender-legacy':
            case 'prerender-ppr':
            case 'prerender':
            case 'cache':
            case 'request':
            case 'private-cache':
            case 'unstable-cache':
            case 'generate-static-params':
                break;
            default:
                workUnitStore;
        }
    }
    return underlyingParams;
}
export function expectCompleteParamsInClientValidation(expression) {
    const workStore = workAsyncStorage.getStore();
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workStore && workUnitStore) {
        switch(workUnitStore.type){
            case 'validation-client':
                {
                    if (workUnitStore.validationSamples) {
                        const fallbackParams = workUnitStore.fallbackRouteParams;
                        if (fallbackParams && fallbackParams.size > 0) {
                            const missingParams = Array.from(fallbackParams.keys());
                            trackMissingSampleErrorAndThrow(Object.defineProperty(new InstantValidationError(`Route "${workStore.route}" called ${expression} but param${missingParams.length > 1 ? 's' : ''} ${missingParams.map((p)=>`"${p}"`).join(', ')} ${missingParams.length > 1 ? 'are' : 'is'} not defined in the \`unstable_samples\` of \`instant\`. ` + `${expression} requires all route params to be provided.`), "__NEXT_ERROR_CODE", {
                                value: "E1191",
                                enumerable: false,
                                configurable: true
                            }));
                        }
                    }
                    break;
                }
            case 'prerender-runtime':
            case 'prerender-client':
            case 'prerender-legacy':
            case 'prerender-ppr':
            case 'prerender':
            case 'cache':
            case 'request':
            case 'private-cache':
            case 'unstable-cache':
            case 'generate-static-params':
                break;
            default:
                workUnitStore;
        }
    }
}
export function instrumentSearchParamsForClientValidation(underlyingSearchParams) {
    const workStore = workAsyncStorage.getStore();
    const workUnitStore = workUnitAsyncStorage.getStore();
    if (workStore && workUnitStore) {
        switch(workUnitStore.type){
            case 'validation-client':
                {
                    if (workUnitStore.validationSamples) {
                        const declaredKeys = new Set(Object.keys(workUnitStore.validationSamples.searchParams ?? {}));
                        return createExhaustiveURLSearchParamsProxy(underlyingSearchParams, declaredKeys, workStore.route);
                    }
                    break;
                }
            case 'prerender-runtime':
            case 'prerender-client':
            case 'prerender-legacy':
            case 'prerender-ppr':
            case 'prerender':
            case 'cache':
            case 'request':
            case 'private-cache':
            case 'unstable-cache':
            case 'generate-static-params':
                break;
            default:
                workUnitStore;
        }
    }
    return underlyingSearchParams;
}

//# sourceMappingURL=instant-samples.js.map