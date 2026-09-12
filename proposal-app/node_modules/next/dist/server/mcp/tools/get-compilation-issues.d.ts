/**
 * MCP tool for getting compilation issues from all routes via Turbopack.
 *
 * Unlike get_errors (which requires a browser session and reflects the runtime
 * error overlay), this tool builds the module graph for every endpoint and
 * collects Turbopack issues directly — no browser needed. Covers
 * module-not-found, syntax errors, and other transform failures across all
 * routes.
 */
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp';
import type { Project } from '../../../build/swc/types';
export declare function registerGetCompilationIssuesTool(server: McpServer, getProject: () => Project | undefined): void;
