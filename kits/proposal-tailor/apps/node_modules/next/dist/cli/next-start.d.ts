#!/usr/bin/env node
import '../server/lib/cpu-profile';
import { type DebugAddress } from '../server/lib/utils';
export type NextStartOptions = {
    port: number;
    hostname?: string;
    inspect?: DebugAddress | true;
    keepAliveTimeout?: number;
    experimentalNextConfigStripTypes?: boolean;
    experimentalCpuProf?: boolean;
};
/**
 * Start the Next.js server
 *
 * @param options The options for the start command
 * @param directory The directory to start the server in
 */
declare const nextStart: (options: NextStartOptions, directory?: string) => Promise<undefined>;
export { nextStart };
