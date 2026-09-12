import type { NextConfigComplete } from '../config-shared';
import type { NodeJsPartialHmrUpdate } from '../../build/swc/types';
interface InstallOptions {
    distDir: string;
    buildId: string;
    deploymentId: string;
    nextConfig: NextConfigComplete;
}
/**
 * One change the dev server made to its own module state — the modules it has
 * loaded, and the manifest caches that describe them.
 *
 * The worker holds the same state, seeded from the same build output, and
 * replays every change the dev server reports, so its state is the dev server's
 * state by construction.
 */
type DevModuleStateChange = {
    type: 'apply';
    update: NodeJsPartialHmrUpdate;
} | {
    type: 'invalidate';
    filePaths: string[];
    evictModules: boolean;
};
export declare function mirrorModuleStateToDevValidationWorker(change: DevModuleStateChange): void;
export declare function dropDevValidationWorker(): void;
/**
 * Wire up the dev-server's validation worker: register the HMR teardown
 * listener and install the hook that `runDevValidationInBackground` calls once
 * a render has settled. The worker thread is spawned lazily, so nothing is
 * created until the first navigation actually validates.
 */
export declare function installDevValidationWorker(options: InstallOptions): void;
export {};
