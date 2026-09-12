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
        return getRequestInsightKey;
    },
    getRequestInsightKind: function() {
        return getRequestInsightKind;
    }
});
function getRequestInsightKind(insight) {
    return insight.kind ?? 'request';
}
function getRequestInsightKey(insight) {
    return `${getRequestInsightKind(insight)}:${insight.requestId}`;
}

//# sourceMappingURL=request-insights.js.map