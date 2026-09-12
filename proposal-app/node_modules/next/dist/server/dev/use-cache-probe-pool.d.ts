import type { NextConfigComplete } from '../config-shared';
interface InstallOptions {
    distDir: string;
    buildId: string;
    deploymentId: string;
    nextConfig: NextConfigComplete;
}
/**
 * Wire up the dev-server's `'use cache'` hang-detection probe: register the HMR
 * teardown listener and install the probe hook that `use-cache-wrapper` calls
 * when a fill stalls. Workers are spawned lazily — no process is forked until
 * the first probe actually fires.
 */
export declare function installUseCacheProbe(options: InstallOptions): void;
export {};
