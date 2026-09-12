import type { IncomingHttpHeaders } from 'http';
export type ReadonlyHeaders = Headers & {
    /** @deprecated Method unavailable on `ReadonlyHeaders`. Read more: https://nextjs.org/docs/app/api-reference/functions/headers */
    append(...args: any[]): void;
    /** @deprecated Method unavailable on `ReadonlyHeaders`. Read more: https://nextjs.org/docs/app/api-reference/functions/headers */
    set(...args: any[]): void;
    /** @deprecated Method unavailable on `ReadonlyHeaders`. Read more: https://nextjs.org/docs/app/api-reference/functions/headers */
    delete(...args: any[]): void;
};
export declare class HeadersAdapter extends Headers {
    private readonly headers;
    constructor(headers: IncomingHttpHeaders);
    /**
     * Seals a Headers instance to prevent modification by throwing an error when
     * any mutating method is called.
     *
     * The sealed view stays live. Later writes to `headers` remain visible
     * through it.
     *
     * `hidden` omits the given header names from every read operation (`get`,
     * `has`, `getSetCookie`, `forEach`, and iteration). The names must be
     * lowercase. The underlying headers are neither copied nor mutated, so hidden
     * headers remain available to the framework.
     */
    static seal(headers: Headers, hidden?: ReadonlySet<string>): ReadonlyHeaders;
    /**
     * @param headers
     * @returns A fresh object identity backed by the original value
     */
    static fresh(headers: ReadonlyHeaders): ReadonlyHeaders;
    /**
     * Merges a header value into a string. This stores multiple values as an
     * array, so we need to merge them into a string.
     *
     * @param value a header value
     * @returns a merged header value (a string)
     */
    private merge;
    /**
     * Creates a Headers instance from a plain object or a Headers instance.
     *
     * @param headers a plain object or a Headers instance
     * @returns a headers instance
     */
    static from(headers: IncomingHttpHeaders | Headers): Headers;
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callbackfn: (value: string, name: string, parent: Headers) => void, thisArg?: any): void;
    entries(): HeadersIterator<[string, string]>;
    keys(): HeadersIterator<string>;
    values(): HeadersIterator<string>;
    [Symbol.iterator](): HeadersIterator<[string, string]>;
}
