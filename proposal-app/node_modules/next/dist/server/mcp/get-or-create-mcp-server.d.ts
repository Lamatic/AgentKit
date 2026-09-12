import { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp';
import type { HmrMessageSentToBrowser } from '../dev/hot-reloader-types';
import type { NextConfigComplete } from '../config-shared';
import type { Project } from '../../build/swc/types';
import type { FormattedIssue } from './tools/utils/format-compilation-issues';
export interface McpServerOptions {
    projectPath: string;
    distDir: string;
    nextConfig: NextConfigComplete;
    pagesDir: string | undefined;
    appDir: string | undefined;
    sendHmrMessage: (message: HmrMessageSentToBrowser) => void;
    getActiveConnectionCount: () => number;
    getDevServerUrl: () => string | undefined;
    getTurbopackProject?: () => Project | undefined;
    compileRoute?: (opts: {
        routeSpecifier?: string;
        path?: string;
    }) => Promise<{
        routeSpecifier: string;
        issues: FormattedIssue[];
    }>;
}
export declare const getOrCreateMcpServer: (options: McpServerOptions) => McpServer;
