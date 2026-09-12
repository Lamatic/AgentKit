export declare enum RenderStage {
    Before = 1,
    ShellStatic = 11,
    Static = 13,
    ShellRuntime = 21,
    Runtime = 23,
    Dynamic = 30,
    Abandoned = 40
}
export type AdvanceableRenderStage = Exclude<RenderStage, RenderStage.Before | RenderStage.Abandoned>;
export declare const RENDER_STAGE_ADVANCE_ORDER: AdvanceableRenderStage[];
export declare function getNextStage(stage: Exclude<AdvanceableRenderStage, RenderStage.Dynamic>): AdvanceableRenderStage;
export declare function isAdvanceableRenderStage(stage: RenderStage): stage is AdvanceableRenderStage;
export declare enum SyncIOMode {
    /** Sync IO does not error in any stage. */
    Untracked = 1,
    /** Before `partialPrefetching`: Sync IO errors in static stages, and is allowed otherwise. */
    AllowedInRuntimeOrDynamic = 2,
    /** After `partialPrefetching`: Sync IO errors in all stages other than dynamic. */
    AllowedInDynamic = 3
}
export declare class StagedRenderingController {
    private abortSignal;
    private abandonController;
    private syncIOMode;
    readonly finalStage: AdvanceableRenderStage | null;
    currentStage: RenderStage;
    syncInterruptReason: Error | null;
    triggers: Record<AdvanceableRenderStage, StageTrigger>;
    constructor({ abortSignal, abandonController, syncIO, finalStage, }: {
        abortSignal: AbortSignal | null;
        abandonController: AbortController | null;
        syncIO: SyncIOMode;
        finalStage: AdvanceableRenderStage | null;
    });
    onStage(stage: AdvanceableRenderStage, callback: () => void): void;
    shouldTrackSyncInterrupt(): boolean;
    /** Note: only call this if `shouldTrackSyncInterrupt()` returned true */
    syncInterruptCurrentStageWithReason(reason: Error): void;
    getSyncInterruptReason(): Error | null;
    getStageEndTime(stage: Exclude<AdvanceableRenderStage, RenderStage.Dynamic>): number;
    private abandonRender;
    advanceStage(targetStage: AdvanceableRenderStage): void;
    private resolveStage;
    private getStagePromise;
    waitForStage(stage: AdvanceableRenderStage): Promise<void>;
    delayUntilStage<T>(stage: AdvanceableRenderStage, displayName: string | undefined, resolvedValue: T): Promise<T>;
}
type StageTrigger = {
    state: 'pending' | 'triggered' | 'cancelled';
    triggeredAt: number | null;
    promise: Promise<void>;
    _listeners: Array<() => void>;
    _resolvePromise: () => void;
    _rejectPromise: (reason: unknown) => void;
};
export {};
