import { ReadonlyURLSearchParams } from './readonly-url-search-params';
export declare function unstable_isUnrecognizedActionError(): boolean;
export { redirect, permanentRedirect } from './redirect';
export { notFound } from './not-found';
export { forbidden } from './forbidden';
export { unauthorized } from './unauthorized';
export { unstable_rethrow } from './unstable-rethrow';
export { ReadonlyURLSearchParams };
export declare const RedirectType: {
    readonly push: "push";
    readonly replace: "replace";
};
