"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getRequestInsightKey: null,
    getRequestInsightKind: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getRequestInsightKey: function() {
        return _requestinsights.getRequestInsightKey;
    },
    getRequestInsightKind: function() {
        return _requestinsights.getRequestInsightKind;
    }
});
const _requestinsights = require("../../shared/lib/request-insights");

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=request-insights.js.map