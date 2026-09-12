/**
 * Takes a URL and does the following things.
 *  - Replaces `index.html` with `/`
 *  - Makes sure all URLs are have a trailing `/`
 *  - Removes query string
 */
export declare function normalizeURL(url: string): string;
/**
 * Normalizes an app route so it represents the actual request path. Essentially
 * performing the following transformations:
 *
 * - `/(dashboard)/user/[id]/page` to `/user/[id]`
 * - `/(dashboard)/account/page` to `/account`
 * - `/user/[id]/page` to `/user/[id]`
 * - `/account/page` to `/account`
 * - `/page` to `/`
 * - `/(dashboard)/user/[id]/route` to `/user/[id]`
 * - `/(dashboard)/account/route` to `/account`
 * - `/user/[id]/route` to `/user/[id]`
 * - `/account/route` to `/account`
 * - `/route` to `/`
 * - `/` to `/`
 *
 * @param route the app route to normalize
 * @returns the normalized pathname
 */
export declare function normalizeAppPath(route: string): string;
/**
 * Gets the possible URLs from a directory.
 */
export declare function getUrlFromPagesDirectories(urlPrefix: string, directories: string[]): RegExp[];
export declare function getUrlFromAppDirectory(urlPrefix: string, directories: string[]): RegExp[];
export declare function execOnce<TArgs extends any[], TResult>(fn: (...args: TArgs) => TResult): (...args: TArgs) => TResult;
