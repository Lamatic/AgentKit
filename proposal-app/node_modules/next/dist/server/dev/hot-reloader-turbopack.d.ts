import type { NextJsHotReloaderInterface } from './hot-reloader-types';
import { type ServerFields, type SetupOpts } from '../lib/router-utils/setup-dev-bundler';
import type { Lockfile } from '../../build/lockfile';
declare global {
    /**
     * Sync with  `turbopack/crates/turbopack-ecmascript-runtime/js/src/nodejs/runtime/nodejs-globals.d.ts`.
     */
    var __turbopack_server_hmr_handlers__: Map<string, unknown> | undefined;
}
export declare function createHotReloaderTurbopack(opts: SetupOpts & {
    isSrcDir: boolean;
}, serverFields: ServerFields, distDir: string, resetFetch: () => void, lockfile: Lockfile | undefined, serverFastRefresh?: boolean): Promise<NextJsHotReloaderInterface>;
