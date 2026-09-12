"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    MIN_PREFETCHABLE_STALE: null,
    MIN_PRERENDERABLE_EXPIRE: null,
    MIN_SHELL_STALE: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    MIN_PREFETCHABLE_STALE: function() {
        return MIN_PREFETCHABLE_STALE;
    },
    MIN_PRERENDERABLE_EXPIRE: function() {
        return MIN_PRERENDERABLE_EXPIRE;
    },
    MIN_SHELL_STALE: function() {
        return MIN_SHELL_STALE;
    }
});
const _invarianterror = require("../../shared/lib/invariant-error");
const MIN_PRERENDERABLE_EXPIRE = 300 // 5 minutes
;
const MIN_PREFETCHABLE_STALE = 30 // 30 seconds
;
const MIN_SHELL_STALE = 300 // 5 minutes
;
if (process.env.NODE_ENV !== 'production') {
    if (MIN_PREFETCHABLE_STALE > MIN_SHELL_STALE) {
        throw Object.defineProperty(new _invarianterror.InvariantError('MIN_PREFETCHABLE_STALE must not exceed MIN_SHELL_STALE.'), "__NEXT_ERROR_CODE", {
            value: "E1422",
            enumerable: false,
            configurable: true
        });
    }
}

//# sourceMappingURL=constants.js.map