/**
 * CLI client for querying a running turbopack trace server via its MCP endpoint.
 * Sends a JSON-RPC `tools/call` request and prints the response to stdout.
 * Use --json for machine-readable JSON output (default: markdown).
 *
 * Usage: next internal query-trace [options]
 */
interface QueryTraceOptions {
    port: number | undefined;
    parent: string | undefined;
    aggregated: boolean | undefined;
    sort: string | undefined;
    search: string | undefined;
    page: number | undefined;
    json: boolean | undefined;
}
export declare function queryTraceCli(options: QueryTraceOptions): Promise<void>;
export {};
