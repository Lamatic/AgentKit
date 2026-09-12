"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    allRequiredBoundariesRendered: null,
    createValidationBoundaryTracking: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    allRequiredBoundariesRendered: function() {
        return allRequiredBoundariesRendered;
    },
    createValidationBoundaryTracking: function() {
        return createValidationBoundaryTracking;
    }
});
function createValidationBoundaryTracking() {
    return {
        requiredIds: new Map(),
        renderedIds: new Set()
    };
}
function allRequiredBoundariesRendered(state) {
    for (const id of state.requiredIds.keys()){
        if (!state.renderedIds.has(id)) {
            return false;
        }
    }
    return true;
}

//# sourceMappingURL=boundary-tracking.js.map