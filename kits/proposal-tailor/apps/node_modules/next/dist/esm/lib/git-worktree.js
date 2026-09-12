import { readFileSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import findUp from 'next/dist/compiled/find-up';
function getGitProjectRoot(dotGitFile) {
    try {
        const gitWorktreePath = readFileSync(dotGitFile, 'utf8').match(/^gitdir:\s*(.+?)\s*$/m);
        if (!gitWorktreePath) return undefined;
        // The format here is <project>/.git/worktrees/<name>
        // So we are trying to get to project directory
        return dirname(dirname(dirname(resolve(dotGitFile, gitWorktreePath[1]))));
    } catch  {
        return undefined;
    }
}
export function getGitWorktreeInfo(cwd) {
    const found = findUp.sync('.git', {
        cwd,
        type: 'file'
    });
    if (!found) return undefined;
    const projectRoot = getGitProjectRoot(found);
    if (!projectRoot) return undefined;
    return {
        worktreeRoot: dirname(found),
        mainRepoRoot: projectRoot,
        isChild: dirname(found).startsWith(projectRoot)
    };
}
export function listLinkedWorktreeRoots(mainRepoRoot) {
    const worktreesDir = join(mainRepoRoot, '.git', 'worktrees');
    let names;
    try {
        names = readdirSync(worktreesDir);
    } catch  {
        return [];
    }
    const roots = [];
    for (const name of names){
        try {
            const gitdir = readFileSync(join(worktreesDir, name, 'gitdir'), 'utf8').trim();
            if (gitdir) roots.push(dirname(gitdir));
        } catch  {}
    }
    return roots;
}

//# sourceMappingURL=git-worktree.js.map