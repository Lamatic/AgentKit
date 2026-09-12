import type { Params } from '../../server/request/params';
import type { ReadonlyURLSearchParams } from './readonly-url-search-params';
export declare function instrumentParamsForClientValidation<TPArams extends Params>(underlyingParams: TPArams): TPArams;
export declare function expectCompleteParamsInClientValidation(expression: string): void;
export declare function instrumentSearchParamsForClientValidation(underlyingSearchParams: ReadonlyURLSearchParams): ReadonlyURLSearchParams;
