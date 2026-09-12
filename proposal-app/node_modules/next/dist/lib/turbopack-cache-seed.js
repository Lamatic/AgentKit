"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "seedTurbopackCacheIfNeeded", {
    enumerable: true,
    get: function() {
        return seedTurbopackCacheIfNeeded;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../build/output/log"));
const _swc = require("../build/swc");
const _gitworktree = require("./git-worktree");
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
function seedTurbopackCacheIfNeeded({ projectDir, distDir }) {
    // This gets the version assuming that nothing is dirty.
    // If things are dirty, turbopack would write things
    // in a different location. There are other circumstances
    // as well. This only matters for people developing turbopack
    // see handle_db_versioning in turbotask backend for more details.
    const version = (0, _swc.getTurbopackCacheVersion)();
    if (!version) return;
    const worktreeInfo = (0, _gitworktree.getGitWorktreeInfo)(projectDir);
    if (!worktreeInfo) return;
    const cacheDir = _path.default.join(distDir, 'cache', 'turbopack');
    const targetVersionDir = _path.default.join(cacheDir, version);
    if (dirHasEntries(targetVersionDir)) return;
    let sourceVersionDir;
    try {
        sourceVersionDir = findSeedSource(worktreeInfo, projectDir, distDir, version);
    } catch  {
        return;
    }
    if (!sourceVersionDir) return;
    const tmpDir = `${targetVersionDir}.seeding`;
    // Making sure we don't copy partial data if process interrupted
    // There is a potential race condition here
    // if someone wrote to the cache while we were seeding it
    // but with the immutable design and all that, I'm not super worried
    try {
        _fs.default.mkdirSync(cacheDir, {
            recursive: true
        });
        _fs.default.rmSync(tmpDir, {
            recursive: true,
            force: true
        });
        seedCacheDir(sourceVersionDir, tmpDir);
        _fs.default.renameSync(tmpDir, targetVersionDir);
        _log.info(`Seeded Turbopack cache from ${sourceVersionDir}.`);
    } catch  {
        _fs.default.rmSync(tmpDir, {
            recursive: true,
            force: true
        });
        _log.warn(`Failed to seed Turbopack cache from ${sourceVersionDir} to ${targetVersionDir}.`);
    }
}
function findSeedSource(worktreeInfo, projectDir, distDir, version) {
    const projectRelToWorktree = _path.default.relative(worktreeInfo.worktreeRoot, projectDir);
    const distRelToProject = _path.default.relative(projectDir, distDir);
    const currentWorktree = _path.default.resolve(worktreeInfo.worktreeRoot);
    // We are going to find the best candidate worktree
    // based on the most recently written cache directory.
    // We only look at our version
    let best;
    for (const root of [
        worktreeInfo.mainRepoRoot,
        ...(0, _gitworktree.listLinkedWorktreeRoots)(worktreeInfo.mainRepoRoot)
    ]){
        if (_path.default.resolve(root) === currentWorktree) continue;
        const versionDir = _path.default.join(root, projectRelToWorktree, distRelToProject, 'cache', 'turbopack', version);
        const commitTimeMs = currentCommitTimeMs(versionDir);
        if (commitTimeMs === undefined) continue;
        if (!best || commitTimeMs > best.commitTimeMs) {
            best = {
                versionDir,
                commitTimeMs
            };
        }
    }
    return best == null ? void 0 : best.versionDir;
}
// When the cache in `versionDir` was last committed to, in epoch milliseconds, or undefined if
// there is no usable cache there. Read from the `commit_time` the persistence layer records in
// CURRENT.
function currentCommitTimeMs(versionDir) {
    let commitTime;
    try {
        commitTime = JSON.parse(_fs.default.readFileSync(_path.default.join(versionDir, 'CURRENT'), 'utf8')).commit_time;
    } catch  {
        // missing, unreadable, or not valid JSON - treat it as not a seed candidate
        return undefined;
    }
    if (typeof commitTime !== 'string') return undefined;
    const parsed = Date.parse(commitTime);
    return Number.isNaN(parsed) ? undefined : parsed;
}
function dirHasEntries(dir) {
    try {
        return _fs.default.readdirSync(dir).length > 0;
    } catch  {
        return false;
    }
}
const IMMUTABLE_CACHE_FILE = /\.(sst|blob|meta|del)$/;
function seedCacheDir(src, dst) {
    const stat = _fs.default.lstatSync(src);
    if (stat.isDirectory()) {
        _fs.default.mkdirSync(dst, {
            recursive: true
        });
        for (const name of _fs.default.readdirSync(src)){
            seedCacheDir(_path.default.join(src, name), _path.default.join(dst, name));
        }
    } else if (IMMUTABLE_CACHE_FILE.test(src)) {
        _fs.default.linkSync(src, dst);
    } else {
        // Mutable/unknown (CURRENT, LOG, …) - copy so it gets its own inode.
        _fs.default.copyFileSync(src, dst);
    }
}

//# sourceMappingURL=turbopack-cache-seed.js.map