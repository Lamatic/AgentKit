export interface GitWorktreeInfo {
    worktreeRoot: string;
    mainRepoRoot: string;
    isChild: boolean;
}
export declare function getGitWorktreeInfo(cwd: string): GitWorktreeInfo | undefined;
export declare function listLinkedWorktreeRoots(mainRepoRoot: string): string[];
