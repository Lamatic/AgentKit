"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    findRootDirAndLockFiles: null,
    warnDuplicatedLockFiles: null,
    warnRootBoundary: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    findRootDirAndLockFiles: function() {
        return findRootDirAndLockFiles;
    },
    warnDuplicatedLockFiles: function() {
        return warnDuplicatedLockFiles;
    },
    warnRootBoundary: function() {
        return warnRootBoundary;
    }
});
const _path = require("path");
const _fs = require("fs");
const _os = require("os");
const _findup = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/find-up"));
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../build/output/log"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function toRealPath(path) {
    try {
        return _fs.realpathSync.native(path);
    } catch  {
        return path;
    }
}
// `homedir()` throws when it cannot determine a home directory, and returns an
// empty string on some platforms. an empty value would match every directory,
// so treat both as "no home directory".
function findHomeDir() {
    try {
        return toRealPath((0, _os.homedir)()) || undefined;
    } catch  {
        return undefined;
    }
}
// if `descendant` is inside of `ancestor` or `descendant` == `ancestor`
function isAncestorOrSelf(ancestor, descendant) {
    const rel = (0, _path.relative)(ancestor, descendant);
    return rel === '' || !rel.startsWith('..') && !(0, _path.isAbsolute)(rel);
}
// if `descendant` is inside of `ancestor`
function isStrictAncestor(ancestor, descendant) {
    const rel = (0, _path.relative)(ancestor, descendant);
    return rel !== '' && !rel.startsWith('..') && !(0, _path.isAbsolute)(rel);
}
// true for a git worktree (its git dir has a `commondir` file);
// this method returns false for a submodule.
function isGitWorktree(dir, gitFile) {
    let contents;
    try {
        contents = (0, _fs.readFileSync)(gitFile, 'utf8');
    } catch  {
        return false;
    }
    // Match the behavior in git:
    // https://github.com/git/git/blob/13c7afec212fc97ce257d15601659314c6673d6c/setup.c#L1007-L1018
    const match = /^gitdir: (.+?)[\r\n]*$/s.exec(contents);
    if (!match) return false;
    const gitDir = (0, _path.resolve)(dir, match[1]);
    return (0, _fs.existsSync)((0, _path.join)(gitDir, 'commondir'));
}
// finds the first git repository or git worktree above the
// current working directory. we limit the project root to
// inside a worktree or git repository. this is because if
// you use worktrees, you may have lock files from the
// parent git repo that are in folders that are not relevant
// to watch.
function findGitBoundary(cwd) {
    let isWorktree = false;
    const gitDir = _findup.default.sync((dir)=>{
        var _statSync;
        const candidate = (0, _path.join)(dir, '.git');
        const isDirectory = (_statSync = (0, _fs.statSync)(candidate, {
            throwIfNoEntry: false
        })) == null ? void 0 : _statSync.isDirectory();
        isWorktree = !isDirectory && isGitWorktree(dir, candidate);
        return isDirectory || isWorktree ? dir : undefined;
    }, {
        cwd,
        type: 'directory'
    });
    if (!gitDir) return undefined;
    return {
        type: isWorktree ? 'worktree' : 'repository',
        dir: toRealPath(gitDir)
    };
}
const LOCK_FILES = [
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'bun.lock',
    'bun.lockb'
];
// Dedicated workspace-root files. pnpm and Lerna declare the root this way.
const WORKSPACE_MARKERS = [
    'pnpm-workspace.yaml',
    'lerna.json'
];
// npm, Yarn, and Bun declare the root via a package.json `workspaces` field,
// which may be an array or an object (e.g. Yarn's `{ packages: [...] }`).
function hasWorkspacesField(packageJson) {
    try {
        return JSON.parse((0, _fs.readFileSync)(packageJson, 'utf8')).workspaces != null;
    } catch  {
        return false;
    }
}
function findWorkspaceMarker(directory) {
    for (const name of WORKSPACE_MARKERS){
        const markerPath = (0, _path.join)(directory, name);
        if ((0, _fs.existsSync)(markerPath)) {
            return markerPath;
        }
    }
    const packageJson = (0, _path.join)(directory, 'package.json');
    return hasWorkspacesField(packageJson) ? packageJson : undefined;
}
function findNextRootCandidate(cwd) {
    // a workspace marker takes precedence over lockfiles, which can be included in
    // the application directory by accident.
    const marker = _findup.default.sync(findWorkspaceMarker, {
        cwd
    });
    if (marker) {
        return {
            path: marker,
            isWorkspaceMarker: true
        };
    }
    const lockFile = _findup.default.sync(LOCK_FILES, {
        cwd
    });
    return lockFile ? {
        path: lockFile,
        isWorkspaceMarker: false
    } : undefined;
}
function findRootDirAndLockFiles(cwd) {
    const initialCandidate = findNextRootCandidate(cwd);
    if (!initialCandidate) return {
        lockFiles: [],
        rootDir: cwd
    };
    const candidates = [
        initialCandidate.path
    ];
    let foundWorkspaceMarker = initialCandidate.isWorkspaceMarker;
    while(true){
        const lastCandidate = candidates[candidates.length - 1];
        const currentDir = (0, _path.dirname)(lastCandidate);
        const parentDir = (0, _path.dirname)(currentDir);
        // dirname('/')==='/' so if we happen to reach the FS root (as might happen in a container we need to quit to avoid looping forever
        if (parentDir === currentDir) break;
        const nextCandidate = findNextRootCandidate(parentDir);
        if (!nextCandidate) break;
        // findNextRootCandidate searches for markers all the way up, so a non-marker
        // here means there is no higher marker: nothing above can extend the root.
        if (foundWorkspaceMarker && !nextCandidate.isWorkspaceMarker) break;
        candidates.push(nextCandidate.path);
        foundWorkspaceMarker ||= nextCandidate.isWorkspaceMarker;
    }
    // filter out candidates that would push the root past a
    // git boundary or into the home directory.
    const homeDir = findHomeDir();
    const gitBoundary = findGitBoundary(cwd);
    const acceptedCandidates = [];
    let boundary;
    for (const candidate of candidates){
        const dir = (0, _path.dirname)(candidate);
        // the app's own directory is always a valid root. even if it
        // is the home directory.
        if (dir !== cwd) {
            const resolvedDir = toRealPath(dir);
            // `dir` sits above the repo or worktree that contains the app.
            if (gitBoundary && isStrictAncestor(resolvedDir, gitBoundary.dir)) {
                // add a warning for going beyond a repository
                if (gitBoundary.type === 'repository') {
                    boundary = {
                        boundary: gitBoundary.dir,
                        marker: candidate,
                        root: dir,
                        type: 'repository'
                    };
                }
                break;
            }
            // never treat the home directory (or above) as the root.
            if (homeDir && isAncestorOrSelf(resolvedDir, homeDir)) {
                boundary = {
                    boundary: homeDir,
                    marker: candidate,
                    root: dir,
                    type: 'home'
                };
                break;
            }
        }
        acceptedCandidates.push(candidate);
    }
    return {
        lockFiles: acceptedCandidates.filter((candidate)=>LOCK_FILES.includes((0, _path.basename)(candidate))),
        rootDir: acceptedCandidates.length ? (0, _path.dirname)(acceptedCandidates[acceptedCandidates.length - 1]) : cwd,
        boundary
    };
}
function warnDuplicatedLockFiles(lockFiles) {
    if (lockFiles.length <= 1) return;
    const config = process.env.TURBOPACK ? 'turbopack.root' : 'outputFileTracingRoot';
    const docs = process.env.TURBOPACK ? 'https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory' : 'https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats';
    const rootLockFile = lockFiles[lockFiles.length - 1];
    const additionalLockFiles = lockFiles.slice(0, -1).map((str)=>`\n   * ${str}`).join('');
    _log.warnOnce(`Warning: Next.js inferred your workspace root, but it may not be correct.\n` + ` We detected multiple lockfiles and selected the directory of ${rootLockFile} as the root directory.\n` + ` To silence this warning, set \`${config}\` in your Next.js config, or consider ` + `removing one of the lockfiles if it's not needed.\n` + `   See ${docs} for more information.\n` + ` Detected additional lockfiles: ${additionalLockFiles}\n`);
}
function warnRootBoundary({ boundary, marker, root, type }) {
    const config = process.env.TURBOPACK ? 'turbopack.root' : 'outputFileTracingRoot';
    const reason = type === 'repository' ? `it is outside the current Git repository (${boundary})` : `it would include your home directory (${boundary})`;
    _log.warnOnce(`Warning: Next.js ignored ${(0, _path.basename)(marker)} in ${root} because ${reason}.\n` + ` To use this directory, set \`${config}\` in your Next.js config.\n`);
}

//# sourceMappingURL=find-root.js.map