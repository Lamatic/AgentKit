import type { ParsedUrlQuery } from 'querystring';
export interface ParsedUrl {
    auth: string | null;
    hash: string;
    hostname: string | null;
    href: string;
    origin?: string | null;
    pathname: string;
    port: string | null;
    protocol: string | null;
    query: ParsedUrlQuery;
    search: string;
    slashes: boolean | null;
}
export declare function parseUrl(url: string): ParsedUrl;
