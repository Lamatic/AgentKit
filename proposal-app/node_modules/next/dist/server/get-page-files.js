"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getPageFiles: null,
    getTurbopackChunkGroupBootstrap: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getPageFiles: function() {
        return getPageFiles;
    },
    getTurbopackChunkGroupBootstrap: function() {
        return getTurbopackChunkGroupBootstrap;
    }
});
const _denormalizepagepath = require("../shared/lib/page-path/denormalize-page-path");
const _normalizepagepath = require("../shared/lib/page-path/normalize-page-path");
function getTurbopackChunkGroupBootstrap(paramsByPage, chunkLoadingGlobal, pages) {
    const g = JSON.stringify(chunkLoadingGlobal);
    const statements = pages.map((page)=>paramsByPage[page]).filter(Boolean).map((params)=>`(globalThis[${g}] || (globalThis[${g}] = [])).push(${JSON.stringify(params)});`);
    return statements.length > 0 ? statements.join('\n') : undefined;
}
function getPageFiles(buildManifest, page) {
    const normalizedPage = (0, _denormalizepagepath.denormalizePagePath)((0, _normalizepagepath.normalizePagePath)(page));
    let files = buildManifest.pages[normalizedPage];
    if (!files) {
        console.warn(`Could not find files for ${normalizedPage} in .next/build-manifest.json`);
        return [];
    }
    return files;
}

//# sourceMappingURL=get-page-files.js.map