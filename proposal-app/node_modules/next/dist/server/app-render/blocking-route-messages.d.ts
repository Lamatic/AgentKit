export declare function createRuntimeBodyError(route: string): Error;
export declare function createDynamicBodyError(route: string): Error;
export declare function createRuntimeBodyErrorInNavigation(route: string): Error;
export declare function createLinkBodyErrorInNavigation(route: string): Error;
export declare function createDynamicBodyErrorInNavigation(route: string): Error;
/**
 * NOTE: Prefer `createRuntimeBodyError` or `createDynamicBodyError`.
 * Only use this in situations like build-time static validation, where
 * we can't pinpoint a more specific reason.
 */
export declare function createDynamicOrRuntimeBodyError(route: string): Error;
export declare function createLinkMetadataError(route: string): Error;
export declare function createRuntimeMetadataError(route: string): Error;
export declare function createDynamicMetadataError(route: string): Error;
export declare function createLinkViewportError(route: string): Error;
export declare function createRuntimeViewportError(route: string): Error;
export declare function createDynamicViewportError(route: string): Error;
/**
 * NOTE: Prefer `createRuntimeViewportError` or `createDynamicViewportError`.
 * Only use this in situations like build-time static validation, where
 * we can't pinpoint a more specific reason.
 */
export declare function createDynamicOrRuntimeViewportError(route: string): Error;
/**
 * NOTE: Prefer `createRuntimeMetadataError` or `createDynamicMetadataError`.
 * Only use this in situations like build-time static validation, where
 * we can't pinpoint a more specific reason.
 */
export declare function createDynamicOrRuntimeMetadataError(route: string): Error;
export declare function logBuildDebugHint(route: string): void;
