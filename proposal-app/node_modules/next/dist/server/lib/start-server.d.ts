import './cpu-profile';
import '../next';
import '../require-hook';
import type { SelfSignedCertificate } from '../../lib/mkcert';
import { initialize } from './router-server';
export interface StartServerOptions {
    dir: string;
    port: number;
    isDev: boolean;
    hostname?: string;
    allowRetry?: boolean;
    customServer?: boolean;
    minimalMode?: boolean;
    keepAliveTimeout?: number;
    selfSignedCertificate?: SelfSignedCertificate;
    serverFastRefresh?: boolean;
}
export declare function getRequestHandlers({ dir, port, isDev, onDevServerCleanup, server, hostname, minimalMode, keepAliveTimeout, experimentalHttpsServer, serverFastRefresh, quiet, }: {
    dir: string;
    port: number;
    isDev: boolean;
    onDevServerCleanup: ((listener: () => Promise<void>) => void) | undefined;
    server?: import('http').Server;
    hostname?: string;
    minimalMode?: boolean;
    keepAliveTimeout?: number;
    experimentalHttpsServer?: boolean;
    serverFastRefresh?: boolean;
    quiet?: boolean;
}): ReturnType<typeof initialize>;
export type StartServerResult = {
    distDir: string;
};
export declare function startServer(serverOptions: StartServerOptions): Promise<StartServerResult>;
