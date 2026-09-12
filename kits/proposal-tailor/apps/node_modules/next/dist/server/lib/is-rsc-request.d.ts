/**
 * Normalizes the raw RSC header value. Only the literal string "1" is treated
 * as a valid RSC request marker; malformed or repeated values are ignored.
 */
export declare function isRSCRequestHeader(value: string | string[] | null | undefined): boolean;
