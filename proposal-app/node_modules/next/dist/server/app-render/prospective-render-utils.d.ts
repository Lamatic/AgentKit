export declare enum Phase {
    ProspectiveRender = "the prospective render",
    SegmentCollection = "segment collection",
    InstantValidation = "instant validation"
}
export declare function printDebugThrownValueForProspectiveRender(thrownValue: unknown, route: string, phase: Phase): undefined;
