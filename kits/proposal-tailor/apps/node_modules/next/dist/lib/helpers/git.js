"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getGitBranch: null,
    getGitCommit: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getGitBranch: function() {
        return getGitBranch;
    },
    getGitCommit: function() {
        return getGitCommit;
    }
});
const _child_process = require("child_process");
function gitExec(args, cwd) {
    return (0, _child_process.execSync)(`git ${args}`, {
        cwd,
        timeout: 2000,
        stdio: [
            'ignore',
            'pipe',
            'ignore'
        ]
    }).toString().trim();
}
function getGitBranch(cwd) {
    if (process.env.VERCEL_GIT_COMMIT_REF) {
        return process.env.VERCEL_GIT_COMMIT_REF;
    }
    try {
        // symbolic-ref --short HEAD: returns the branch name for regular branches,
        // works on repos with no commits, and exits non-zero in detached HEAD state
        // (caught below and treated as unknown).
        return gitExec('symbolic-ref --short HEAD', cwd);
    } catch  {
        return undefined;
    }
}
function getGitCommit(cwd) {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        return process.env.VERCEL_GIT_COMMIT_SHA;
    }
    try {
        return gitExec('rev-parse HEAD', cwd);
    } catch  {
        return undefined;
    }
}

//# sourceMappingURL=git.js.map