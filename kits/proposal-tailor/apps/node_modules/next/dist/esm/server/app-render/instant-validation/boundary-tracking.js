export function createValidationBoundaryTracking() {
    return {
        requiredIds: new Map(),
        renderedIds: new Set()
    };
}
export function allRequiredBoundariesRendered(state) {
    for (const id of state.requiredIds.keys()){
        if (!state.renderedIds.has(id)) {
            return false;
        }
    }
    return true;
}

//# sourceMappingURL=boundary-tracking.js.map