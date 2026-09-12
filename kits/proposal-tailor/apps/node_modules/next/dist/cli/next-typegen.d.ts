#!/usr/bin/env node
export type NextTypegenOptions = {
    dir?: string;
    webpack?: boolean;
};
declare const nextTypegen: (options: NextTypegenOptions, directory?: string) => Promise<void>;
export { nextTypegen };
