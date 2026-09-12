/**
 * This function allows you to indicate that the code following it performs
 * I/O or accesses dynamic data sources such as `new Date()` or `Math.random()`.
 *
 * During prerendering it will prevent the prerender from continuing past this
 * point, creating a dynamic boundary. Inside `"use cache"` scopes or during
 * a real request it resolves immediately.
 *
 * Unlike `connection()`, `io()` does not require an actual HTTP request and
 * can be used freely inside cache scopes and client components.
 */
export declare function io(): Promise<void>;
