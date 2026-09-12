import type { NextConfigComplete } from '../config-shared';
import type { UseCacheProbeRequestSnapshot } from '../use-cache/use-cache-probe-globals';
import '../require-hook';
import '../node-environment';
export type EncodedArgumentsForProbe = {
    kind: 'string';
    data: string;
} | {
    kind: 'formdata';
    entries: Array<[string, string] | [string, {
        kind: 'blob';
        bytes: string;
        type: string;
    }]>;
};
export type ProbeMessage = {
    distDir: string;
    page: string;
    route: string;
    id: string;
    kind: string;
    encodedArguments: EncodedArgumentsForProbe;
    buildId: string;
    deploymentId: string;
    request: UseCacheProbeRequestSnapshot;
    nextConfigSerializable: {
        httpAgentOptions: NextConfigComplete['httpAgentOptions'];
        cacheLifeProfiles: NextConfigComplete['cacheLife'];
        useCacheTimeout: number;
        staticPageGenerationTimeout: number;
    };
    timeoutMs: number;
};
export declare function probeUseCache(msg: ProbeMessage): Promise<boolean>;
