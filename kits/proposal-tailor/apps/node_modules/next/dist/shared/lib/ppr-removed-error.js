"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "throwPrerenderPPRRemovedError", {
    enumerable: true,
    get: function() {
        return throwPrerenderPPRRemovedError;
    }
});
const _invarianterror = require("./invariant-error");
function throwPrerenderPPRRemovedError() {
    throw Object.defineProperty(new _invarianterror.InvariantError('The prerender-ppr work unit type has been removed. This code path should be unreachable.'), "__NEXT_ERROR_CODE", {
        value: "E1158",
        enumerable: false,
        configurable: true
    });
}

//# sourceMappingURL=ppr-removed-error.js.map