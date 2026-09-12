#!/usr/bin/env node
import { saveCpuProfile } from '../server/lib/cpu-profile';
export type NextBuildOptions = {
    experimentalAnalyze?: boolean;
    debug?: boolean;
    debugPrerender?: boolean;
    profile?: boolean;
    mangling: boolean;
    turbo?: boolean;
    turbopack?: boolean;
    webpack?: boolean;
    experimentalDebugMemoryUsage: boolean;
    experimentalAppOnly?: boolean;
    experimentalTurbo?: boolean;
    experimentalBuildMode: 'default' | 'compile' | 'generate' | 'generate-env';
    experimentalUploadTrace?: string;
    experimentalNextConfigStripTypes?: boolean;
    debugBuildPaths?: string;
    experimentalCpuProf?: boolean;
    internalTrace?: string | boolean;
};
declare const nextBuild: (options: NextBuildOptions, directory?: string) => Promise<void>;
export { nextBuild, saveCpuProfile };
