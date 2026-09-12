export const DEFAULT_MAX_POSTPONED_STATE_SIZE = '100 MB';
// 100MB in bytes. Not using the parseSizeLimit for performance as parseMaxPostponedStateSize is in the hot path for rendering.
const DEFAULT_MAX_POSTPONED_STATE_SIZE_BYTES = 104857600;
function parseSizeLimit(size) {
    const bytes = require('next/dist/compiled/bytes').parse(size);
    if (bytes === null || isNaN(bytes) || bytes < 1) {
        return undefined;
    }
    return bytes;
}
/**
 * Parses the maxPostponedStateSize config value, using the default if not provided.
 */ export function parseMaxPostponedStateSize(size) {
    if (!size) {
        return DEFAULT_MAX_POSTPONED_STATE_SIZE_BYTES;
    }
    return parseSizeLimit(size);
}

//# sourceMappingURL=size-limit.js.map