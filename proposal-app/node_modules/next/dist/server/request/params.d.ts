import type { VaryParamsAccumulator } from '../app-render/vary-params';
export type ParamValue = string | Array<string> | undefined;
export type Params = Record<string, ParamValue>;
export declare function createParamsFromClient(underlyingParams: Params): Promise<Params>;
export type CreateServerParamsForMetadata = typeof createServerParamsForMetadata;
export declare function createServerParamsForMetadata(underlyingParams: Params, optionalCatchAllParamName: string | null): Promise<Params>;
export declare function createServerParamsForRoute(underlyingParams: Params, varyParamsAccumulator?: VaryParamsAccumulator | null): Promise<Params>;
export declare function createServerParamsForServerSegment(underlyingParams: Params, optionalCatchAllParamName: string | null, varyParamsAccumulator: VaryParamsAccumulator | null): Promise<Params>;
export declare function createPrerenderParamsForClientSegment(underlyingParams: Params): Promise<Params>;
