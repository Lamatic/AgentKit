import type { VaryParamsAccumulator } from '../app-render/vary-params';
export type SearchParams = {
    [key: string]: string | string[] | undefined;
};
export declare function createSearchParamsFromClient(underlyingSearchParams: SearchParams): Promise<SearchParams>;
export declare function createServerSearchParamsForMetadata(underlyingSearchParams: SearchParams): Promise<SearchParams>;
export declare function createServerSearchParamsForServerPage(underlyingSearchParams: SearchParams, varyParamsAccumulator: VaryParamsAccumulator | null): Promise<SearchParams>;
export declare function createPrerenderSearchParamsForClientPage(): Promise<SearchParams>;
/**
 * This is a variation of `makeErroringSearchParams` that always throws an
 * error on access, because accessing searchParams inside of `"use cache"` is
 * not allowed.
 */
export declare function makeErroringSearchParamsForUseCache(): Promise<SearchParams>;
