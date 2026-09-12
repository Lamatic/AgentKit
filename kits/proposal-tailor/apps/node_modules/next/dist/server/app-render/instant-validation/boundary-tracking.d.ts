export type ValidationBoundaryTracking = {
    /**
     * Map from boundary id (the SegmentPath where a validation boundary is
     * placed) to the file paths of modules inside that boundary's subtree.
     * When the boundary spans multiple parallel slots, each slot contributes
     * its own first-found module path so all unrendered segments can be
     * reported together.
     */
    requiredIds: Map<string, string[]>;
    renderedIds: Set<string>;
};
export declare function createValidationBoundaryTracking(): ValidationBoundaryTracking;
export declare function allRequiredBoundariesRendered(state: ValidationBoundaryTracking): boolean;
