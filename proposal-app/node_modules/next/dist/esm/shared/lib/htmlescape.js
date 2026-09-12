// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE
const ESCAPE_LOOKUP = {
    '&': '\\u0026',
    '>': '\\u003e',
    '<': '\\u003c',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};
export const ESCAPE_REGEX = /[&><\u2028\u2029]/g;
const ATTRIBUTE_ESCAPE_LOOKUP = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
    '<': '&lt;',
    '>': '&gt;'
};
const ATTRIBUTE_ESCAPE_REGEX = /[&"'<>]/g;
export function htmlEscapeJsonString(str) {
    return str.replace(ESCAPE_REGEX, (match)=>ESCAPE_LOOKUP[match]);
}
export function htmlEscapeAttributeString(str) {
    return str.replace(ATTRIBUTE_ESCAPE_REGEX, (match)=>ATTRIBUTE_ESCAPE_LOOKUP[match]);
}

//# sourceMappingURL=htmlescape.js.map