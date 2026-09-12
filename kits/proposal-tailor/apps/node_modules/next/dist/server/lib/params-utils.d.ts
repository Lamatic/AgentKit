import type { OpaqueFallbackRouteParams } from '../request/fallback-params';
import type { Params } from '../request/params';
export declare function hasNonRootStaticParams(params: Params, rootParams: Params, fallbackParams: OpaqueFallbackRouteParams | null | undefined): boolean;
export declare function allParamsAreRootParams(underlyingParams: Params, rootParams: Params): boolean;
export declare function isEmptyParams(params: Params): boolean;
export declare function hasFallbackRouteParams(underlyingParams: Params, fallbackParams: OpaqueFallbackRouteParams | null | undefined): boolean;
