export type IssueBucketState = {
    hasNormal: boolean;
    hasInstant: boolean;
    hasAny: boolean;
    insightsOnly: boolean;
    variant: 'issue' | 'insight';
};
export declare function getIssueBucketState(normalErrorCount: number, instantErrorCount: number): IssueBucketState;
