import { denormalizePagePath } from '../shared/lib/page-path/denormalize-page-path';
import { normalizePagePath } from '../shared/lib/page-path/normalize-page-path';
/**
 * Builds inline `globalThis[<global>].push(<params>)` bootstrap content for the given
 * pages, seeding the runtime queue before the shared runtime chunk drains it. Only call
 * this for Turbopack production builds (the only builds that populate
 * `pagesChunkGroupBootstrapParams` / `chunkLoadingGlobal`). Returns undefined when none
 * of the given pages have inlined params.
 */ export function getTurbopackChunkGroupBootstrap(paramsByPage, chunkLoadingGlobal, pages) {
    const g = JSON.stringify(chunkLoadingGlobal);
    const statements = pages.map((page)=>paramsByPage[page]).filter(Boolean).map((params)=>`(globalThis[${g}] || (globalThis[${g}] = [])).push(${JSON.stringify(params)});`);
    return statements.length > 0 ? statements.join('\n') : undefined;
}
export function getPageFiles(buildManifest, page) {
    const normalizedPage = denormalizePagePath(normalizePagePath(page));
    let files = buildManifest.pages[normalizedPage];
    if (!files) {
        console.warn(`Could not find files for ${normalizedPage} in .next/build-manifest.json`);
        return [];
    }
    return files;
}

//# sourceMappingURL=get-page-files.js.map