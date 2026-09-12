"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "writeRouteBundleStats", {
    enumerable: true,
    get: function() {
        return writeRouteBundleStats;
    }
});
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _fs = require("fs");
const _constants = require("../shared/lib/constants");
const _utils = require("./utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ROUTE_BUNDLE_STATS_FILE = 'route-bundle-stats.json';
function sumFileSizes(distDir, files, cache) {
    let total = 0;
    for (const relPath of files){
        const cached = cache.get(relPath);
        if (cached !== undefined) {
            total += cached;
            continue;
        }
        try {
            const size = (0, _fs.statSync)(_path.default.join(distDir, relPath)).size;
            cache.set(relPath, size);
            total += size;
        } catch  {
        // ignore missing files
        }
    }
    return total;
}
function toProjectRelativePaths(dir, distDir, relPaths) {
    return relPaths.map((f)=>_path.default.relative(dir, _path.default.join(distDir, f)));
}
function buildRouteToAppPathsMap(appPathsManifest) {
    const { normalizeAppPath } = require('../shared/lib/router/utils/app-paths');
    // Keys in appPathsManifest are app paths like /blog/[slug]/page;
    // values are server bundle file paths. Normalize the key to get the route.
    const routeToAppPaths = new Map();
    for (const appPath of Object.keys(appPathsManifest)){
        const route = normalizeAppPath(appPath);
        const existing = routeToAppPaths.get(route);
        if (existing) {
            existing.push(appPath);
        } else {
            routeToAppPaths.set(route, [
                appPath
            ]);
        }
    }
    return routeToAppPaths;
}
// Reads the manfiest file and gets the entry JS files. The manifest file is
// a JavaScript file that sets a global variable (__RSC_MANIFEST). We require()
// it with a save/restore of the global
function readEntryJSFiles(distDir, pagePath, appRoute) {
    const manifestFile = _path.default.join(distDir, _constants.SERVER_DIRECTORY, 'app', `${pagePath}_${_constants.CLIENT_REFERENCE_MANIFEST}.js`);
    try {
        const g = global;
        const prev = g.__RSC_MANIFEST;
        g.__RSC_MANIFEST = undefined;
        require(manifestFile);
        const rscManifest = g.__RSC_MANIFEST;
        g.__RSC_MANIFEST = prev;
        // The key in __RSC_MANIFEST is the app path (e.g. /blog/[slug]/page)
        const manifestEntry = (rscManifest == null ? void 0 : rscManifest[pagePath]) ?? (rscManifest == null ? void 0 : rscManifest[appRoute]);
        return manifestEntry == null ? void 0 : manifestEntry.entryJSFiles;
    } catch  {
        return undefined;
    }
}
function collectPagesRouterStats(pages, buildManifest, distDir, dir, cache) {
    const rows = [];
    const sharedFiles = buildManifest.pages['/_app'] ?? [];
    for (const page of (0, _utils.filterAndSortList)(pages, 'pages', false)){
        if (page === '/_app' || page === '/_document' || page === '/_error') continue;
        const allFiles = (buildManifest.pages[page] ?? []).filter((f)=>f.endsWith('.js'));
        const sharedJs = sharedFiles.filter((f)=>f.endsWith('.js'));
        const chunks = [
            ...new Set([
                ...allFiles,
                ...sharedJs
            ])
        ];
        const firstLoadUncompressedJsBytes = sumFileSizes(distDir, chunks, cache);
        rows.push({
            route: page,
            firstLoadUncompressedJsBytes,
            firstLoadChunkPaths: toProjectRelativePaths(dir, distDir, chunks)
        });
    }
    return rows;
}
async function collectAppRouterStats(appRoutes, buildManifest, distDir, dir, cache) {
    let appPathsManifest = {};
    try {
        const manifestPath = _path.default.join(distDir, _constants.SERVER_DIRECTORY, _constants.APP_PATHS_MANIFEST);
        appPathsManifest = JSON.parse(await _fs.promises.readFile(manifestPath, 'utf8'));
    } catch  {
        // App paths manifest not available; skip app router sizes
        return [];
    }
    const routeToAppPaths = buildRouteToAppPathsMap(appPathsManifest);
    const sharedFiles = buildManifest.rootMainFiles ?? [];
    const rows = [];
    for (const appRoute of (0, _utils.filterAndSortList)(appRoutes, 'app', false)){
        const appPaths = routeToAppPaths.get(appRoute) ?? [];
        // Find the /page entry (most specific, has the most chunks)
        const pagePath = appPaths.find((p)=>p.endsWith('/page'));
        if (!pagePath) continue;
        const entryJSFiles = readEntryJSFiles(distDir, pagePath, appRoute);
        if (!entryJSFiles) continue;
        // Union JS files across all segments (page, layout, etc.) so that
        // layout code's contribution is included in the First Load JS total.
        const allFiles = [
            ...new Set(Object.values(entryJSFiles).flat().filter((f)=>f.endsWith('.js')))
        ];
        const sharedJs = sharedFiles.filter((f)=>f.endsWith('.js'));
        const chunks = [
            ...new Set([
                ...allFiles,
                ...sharedJs
            ])
        ];
        const firstLoadUncompressedJsBytes = sumFileSizes(distDir, chunks, cache);
        rows.push({
            route: appRoute,
            firstLoadUncompressedJsBytes,
            firstLoadChunkPaths: toProjectRelativePaths(dir, distDir, chunks)
        });
    }
    return rows;
}
async function writeRouteBundleStats(lists, buildManifest, distDir, dir) {
    const cache = new Map();
    const rows = [
        ...lists.pages.length > 0 ? collectPagesRouterStats(lists.pages, buildManifest, distDir, dir, cache) : [],
        ...lists.app && lists.app.length > 0 ? await collectAppRouterStats(lists.app, buildManifest, distDir, dir, cache) : []
    ];
    rows.sort((a, b)=>b.firstLoadUncompressedJsBytes - a.firstLoadUncompressedJsBytes);
    const diagnosticsDir = _path.default.join(distDir, 'diagnostics');
    await _fs.promises.mkdir(diagnosticsDir, {
        recursive: true
    });
    await _fs.promises.writeFile(_path.default.join(diagnosticsDir, ROUTE_BUNDLE_STATS_FILE), JSON.stringify(rows, null, 2));
}

//# sourceMappingURL=route-bundle-stats.js.map