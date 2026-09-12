#!/usr/bin/env node
export type NextPostBuildOptions = {};
declare const nextPostBuild: (_options: NextPostBuildOptions, directory?: string) => Promise<void>;
export { nextPostBuild };
