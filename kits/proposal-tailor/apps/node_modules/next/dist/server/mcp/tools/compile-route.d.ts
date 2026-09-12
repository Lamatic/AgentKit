/**
 * MCP tool for compiling a specific route via the on-demand entry handler.
 *
 * Triggers on-demand compilation so the route's assets are built without making an
 * HTTP request to the route. This is the same call path the dev server uses
 * when a route is first navigated to, making it useful for warming the module
 * graph, measuring compile time, or pre-compiling routes for memory
 * benchmarking without requiring live backends.
 */
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp';
import type { FormattedIssue } from './utils/format-compilation-issues';
export declare function registerCompileRouteTool(server: McpServer, compileRoute: (opts: {
    routeSpecifier?: string;
    path?: string;
}) => Promise<{
    routeSpecifier: string;
    issues: FormattedIssue[];
}>): void;
