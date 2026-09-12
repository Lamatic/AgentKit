"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getGitWorktreeInfo: null,
    listLinkedWorktreeRoots: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getGitWorktreeInfo: function() {
        return getGitWorktreeInfo;
    },
    listLinkedWorktreeRoots: function() {
        return listLinkedWorktreeRoots;
    }
});
const _fs = require("fs");
const _path = require("path");
const _findup = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/find-up"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getGitProjectRoot(dotGitFile) {
    try {
        const gitWorktreePath = (0, _fs.readFileSync)(dotGitFile, 'utf8').match(/^gitdir:\s*(.+?)\s*$/m);
        if (!gitWorktreePath) return undefined;
        // The format here is <project>/.git/worktrees/<name>
        // So we are trying to get to project directory
        return (0, _path.dirname)((0, _path.dirname)((0, _path.dirname)((0, _path.resolve)(dotGitFile, gitWorktreePath[1]))));
    } catch  {
        return undefined;
    }
}
function getGitWorktreeInfo(cwd) {
    const found = _findup.default.sync('.git', {
        cwd,
        type: 'file'
    });
    if (!found) return undefined;
    const projectRoot = getGitProjectRoot(found);
    if (!projectRoot) return undefined;
    return {
        worktreeRoot: (0, _path.dirname)(found),
        mainRepoRoot: projectRoot,
        isChild: (0, _path.dirname)(found).startsWith(projectRoot)
    };
}
function listLinkedWorktreeRoots(mainRepoRoot) {
    const worktreesDir = (0, _path.join)(mainRepoRoot, '.git', 'worktrees');
    let names;
    try {
        names = (0, _fs.readdirSync)(worktreesDir);
    } catch  {
        return [];
    }
    const roots = [];
    for (const name of names){
        try {
            const gitdir = (0, _fs.readFileSync)((0, _path.join)(worktreesDir, name, 'gitdir'), 'utf8').trim();
            if (gitdir) roots.push((0, _path.dirname)(gitdir));
        } catch  {}
    }
    return roots;
}

//# sourceMappingURL=git-worktree.js.map