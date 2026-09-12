type AnonymousMeta = {
    systemPlatform: NodeJS.Platform;
    systemRelease: string;
    systemArchitecture: string;
    cpuCount: number;
    cpuModel: string | null;
    cpuSpeed: number | null;
    memoryInMb: number;
    isDocker: boolean;
    isNowDev: boolean;
    isWsl: boolean;
    isCI: boolean;
    ciName: string | null;
    nextVersion: string;
    agentName: string | null;
};
export declare function getAnonymousMeta(): Promise<AnonymousMeta>;
export {};
