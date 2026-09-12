/**
 * Returns the current git branch name for the given working directory, or
 * undefined if it cannot be determined (not a git repo, detached HEAD,
 * git not installed, etc.). Prefers VERCEL_GIT_COMMIT_REF when set.
 */
export declare function getGitBranch(cwd: string): string | undefined;
/**
 * Returns the current git commit SHA for the given working directory, or
 * undefined if it cannot be determined. Prefers VERCEL_GIT_COMMIT_SHA when
 * set.
 */
export declare function getGitCommit(cwd: string): string | undefined;
