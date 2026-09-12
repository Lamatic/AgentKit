import type { BuildManifest } from '../server/get-page-files';
export declare function writeRouteBundleStats(lists: {
    pages: ReadonlyArray<string>;
    app: ReadonlyArray<string> | undefined;
}, buildManifest: BuildManifest, distDir: string, dir: string): Promise<void>;
