/**
 * Normalizes the raw RSC header value. Only the literal string "1" is treated
 * as a valid RSC request marker; malformed or repeated values are ignored.
 */ export function isRSCRequestHeader(value) {
    return value === '1';
}

//# sourceMappingURL=is-rsc-request.js.map