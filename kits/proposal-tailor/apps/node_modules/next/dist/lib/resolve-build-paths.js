"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    parseBuildPathsInput: null,
    resolveBuildPaths: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    parseBuildPathsInput: function() {
        return parseBuildPathsInput;
    },
    resolveBuildPaths: function() {
        return resolveBuildPaths;
    }
});
const _util = require("util");
const _glob = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/glob"));
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../build/output/log"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _iserror = /*#__PURE__*/ _interop_require_default(require("./is-error"));
const _findpagefile = require("../server/lib/find-page-file");
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
const glob = (0, _util.promisify)(_glob.default);
/**
 * Escapes Next.js dynamic route bracket expressions so glob treats them as
 * literal directory names rather than character classes.
 *
 * e.g., "app/blog/[slug]/** /page.tsx" → "app/blog/\[slug\]/** /page.tsx"
 */ function escapeBrackets(pattern) {
    // Match Next.js dynamic route patterns: [name], [...name], [[...name]]
    return pattern.replace(/\[\[?\.\.\.[^\]]+\]?\]|\[[^\]]+\]/g, (match)=>match.replace(/\[/g, '\\[').replace(/\]/g, '\\]'));
}
async function resolveBuildPaths(patterns, projectDir, pageExtensions) {
    const appPaths = new Set();
    const pagePaths = new Set();
    const validFileMatcher = (0, _findpagefile.createValidFileMatcher)(pageExtensions, undefined);
    // Detect whether the project keeps its routes under `src/` so we can accept
    // patterns written with or without that prefix (e.g. both `app/foo/page.tsx`
    // and `src/app/foo/page.tsx`).
    const useSrcApp = _fs.default.existsSync(_path.default.join(projectDir, 'src', 'app'));
    const useSrcPages = _fs.default.existsSync(_path.default.join(projectDir, 'src', 'pages'));
    const includePatterns = [];
    const excludePatterns = [];
    for (const pattern of patterns){
        const trimmed = pattern.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('!')) {
            excludePatterns.push(escapeBrackets(addSrcPrefixIfNeeded(trimmed.slice(1), useSrcApp, useSrcPages)));
        } else {
            includePatterns.push(escapeBrackets(addSrcPrefixIfNeeded(trimmed, useSrcApp, useSrcPages)));
        }
    }
    // Default to matching all files when only negation patterns are provided.
    if (includePatterns.length === 0 && excludePatterns.length > 0) {
        includePatterns.push('**');
    }
    // Combine patterns using brace expansion: {pattern1,pattern2}
    const combinedPattern = includePatterns.length === 1 ? includePatterns[0] : `{${includePatterns.join(',')}}`;
    try {
        const matches = await glob(combinedPattern, {
            cwd: projectDir,
            ignore: excludePatterns
        });
        if (matches.length === 0) {
            _log.warn(`Pattern "${patterns.join(',')}" did not match any files`);
        }
        for (const file of matches){
            if (!_fs.default.statSync(_path.default.join(projectDir, file)).isDirectory()) {
                categorizeAndAddPath(file, appPaths, pagePaths, validFileMatcher);
            }
        }
    } catch (error) {
        throw Object.defineProperty(new Error(`Failed to resolve pattern "${patterns.join(',')}": ${(0, _iserror.default)(error) ? error.message : String(error)}`), "__NEXT_ERROR_CODE", {
            value: "E972",
            enumerable: false,
            configurable: true
        });
    }
    return {
        appPaths: Array.from(appPaths).sort(),
        pagePaths: Array.from(pagePaths).sort()
    };
}
/**
 * When the project keeps its `app/` or `pages/` directory under `src/`, prepend
 * `src/` to bare patterns so the glob actually matches files on disk. Patterns
 * that already include the `src/` prefix are returned unchanged.
 */ function addSrcPrefixIfNeeded(pattern, useSrcApp, useSrcPages) {
    const normalized = pattern.replace(/\\/g, '/');
    if (useSrcApp && /^app\//.test(normalized)) {
        return 'src/' + normalized;
    }
    if (useSrcPages && /^pages\//.test(normalized)) {
        return 'src/' + normalized;
    }
    return pattern;
}
/**
 * Categorizes a file path to either app or pages router based on its prefix.
 * For app router, only route-defining files are included.
 *
 * Accepts both top-level (`app/...`, `pages/...`) and src-prefixed
 * (`src/app/...`, `src/pages/...`) project structures.
 *
 * Examples:
 * - "app/page.tsx" → appPaths.add("/page.tsx")
 * - "src/app/page.tsx" → appPaths.add("/page.tsx")
 * - "app/layout.tsx" → skipped (not a route file)
 * - "pages/index.tsx" → pagePaths.add("/index.tsx")
 */ function categorizeAndAddPath(filePath, appPaths, pagePaths, validFileMatcher) {
    let normalized = filePath.replace(/\\/g, '/');
    if (normalized.startsWith('src/')) {
        normalized = normalized.slice(4);
    }
    if (normalized.startsWith('app/')) {
        const appRelativePath = '/' + normalized.slice(4);
        if (validFileMatcher.isAppRouterPage(appRelativePath)) {
            appPaths.add(appRelativePath);
        }
    } else if (normalized.startsWith('pages/')) {
        pagePaths.add('/' + normalized.slice(6));
    }
}
function parseBuildPathsInput(input) {
    // Comma-separated values
    return input.split(',').map((p)=>p.trim()).filter((p)=>p.length > 0);
}

//# sourceMappingURL=resolve-build-paths.js.map