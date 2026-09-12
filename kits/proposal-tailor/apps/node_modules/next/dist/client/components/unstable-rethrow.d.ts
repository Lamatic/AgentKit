/**
 * This function should be used to rethrow internal Next.js errors so that they can be handled by the framework.
 * When wrapping an API that uses errors to interrupt control flow, you should use this function before you do any error handling.
 * This function will rethrow the error if it is a Next.js error so it can be handled, otherwise it will do nothing.
 *
 * In the browser bundle this module is aliased to `./unstable-rethrow.browser`, which performs a
 * subset of these checks (the server-only ones can never occur in the browser). This default
 * module holds the full server logic and is used on every server runtime (Node, edge) and in any
 * context where the alias does not apply.
 *
 * Read more: [Next.js Docs: `unstable_rethrow`](https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow)
 */
export declare function unstable_rethrow(error: unknown): void;
