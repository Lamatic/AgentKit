import { RedirectStatusCode } from './redirect-status-code';
import { isRedirectError, REDIRECT_ERROR_CODE } from './redirect-error';
import { actionAsyncStorage } from './server-async-storage';
export function getRedirectError(url, type, statusCode = RedirectStatusCode.TemporaryRedirect) {
    const error = Object.defineProperty(new Error(REDIRECT_ERROR_CODE), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
    });
    error.digest = `${REDIRECT_ERROR_CODE};${type};${url};${statusCode};`;
    return error;
}
/**
 * This function allows you to redirect the user to another URL. It can be used in
 * [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components),
 * [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), and
 * [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).
 *
 * - In a Server Component, this will insert a meta tag to redirect the user to the target page.
 * - In a Route Handler, it will serve a 307 to the caller.
 * - In a Server Action, it will perform a client-side navigation when JavaScript is available or serve a 303 for a progressive enhancement form submission.
 * - In a Server Action, type defaults to 'push' and 'replace' elsewhere.
 *
 * Read more: [Next.js Docs: `redirect`](https://nextjs.org/docs/app/api-reference/functions/redirect)
 */ export function redirect(/** The URL to redirect to */ url, type) {
    type ??= actionAsyncStorage?.getStore()?.isAction ? 'push' : 'replace';
    throw getRedirectError(url, type, RedirectStatusCode.TemporaryRedirect);
}
/**
 * This function allows you to redirect the user to another URL. It can be used in
 * [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components),
 * [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), and
 * [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).
 *
 * - In a Server Component, this will insert a meta tag to redirect the user to the target page.
 * - In a Route Handler, it will serve a 308 to the caller.
 * - In a Server Action, it will perform a client-side navigation when JavaScript is available or serve a 303 for a progressive enhancement form submission.
 *
 * Read more: [Next.js Docs: `redirect`](https://nextjs.org/docs/app/api-reference/functions/redirect)
 */ export function permanentRedirect(/** The URL to redirect to */ url, type = 'replace') {
    throw getRedirectError(url, type, RedirectStatusCode.PermanentRedirect);
}
export function getURLFromRedirectError(error) {
    if (!isRedirectError(error)) return null;
    // Slices off the beginning of the digest that contains the code and the
    // separating ';'.
    return error.digest.split(';').slice(2, -2).join(';');
}
export function getRedirectTypeFromError(error) {
    if (!isRedirectError(error)) {
        throw Object.defineProperty(new Error('Not a redirect error'), "__NEXT_ERROR_CODE", {
            value: "E260",
            enumerable: false,
            configurable: true
        });
    }
    return error.digest.split(';', 2)[1];
}
export function getRedirectStatusCodeFromError(error) {
    if (!isRedirectError(error)) {
        throw Object.defineProperty(new Error('Not a redirect error'), "__NEXT_ERROR_CODE", {
            value: "E260",
            enumerable: false,
            configurable: true
        });
    }
    return Number(error.digest.split(';').at(-2));
}

//# sourceMappingURL=redirect.js.map