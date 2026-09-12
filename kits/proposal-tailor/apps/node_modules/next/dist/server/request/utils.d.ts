import type { WorkStore } from '../app-render/work-async-storage.external';
import type { WorkUnitStore } from '../app-render/work-unit-async-storage.external';
export declare function throwWithStaticGenerationBailoutErrorWithDynamicError(route: string, expression: string): never;
export declare function throwForSearchParamsAccessInUseCache(workStore: WorkStore, constructorOpt: Function): never;
export declare function isRequestApiAllowedInCurrentPhase(workUnitStore: WorkUnitStore): boolean;
