/**
 * CLI client for querying a running turbopack trace server via its MCP endpoint.
 * Sends a JSON-RPC `tools/call` request and prints the response to stdout.
 * Use --json for machine-readable JSON output (default: markdown).
 *
 * Usage: next internal query-trace [options]
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "queryTraceCli", {
    enumerable: true,
    get: function() {
        return queryTraceCli;
    }
});
const DEFAULT_MCP_PORT = 5748 // Keep in sync with turbo-trace-server.ts
;
async function queryTraceCli(options) {
    const port = options.port ?? DEFAULT_MCP_PORT;
    // Build arguments — only include values explicitly set by the user.
    const args = {};
    if (options.parent !== undefined) args.parent = options.parent;
    if (options.aggregated !== undefined) args.aggregated = options.aggregated;
    if (options.sort !== undefined) args.sort = options.sort;
    if (options.search !== undefined) args.search = options.search;
    if (options.page !== undefined) args.page = options.page;
    if (options.json) args.outputType = 'json';
    const requestBody = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'query_spans',
            arguments: args
        },
        id: 1
    });
    let res;
    try {
        res = await fetch(`http://127.0.0.1:${port}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream'
            },
            body: requestBody
        });
    } catch  {
        console.error([
            `Error: Could not connect to trace server on port ${port}.`,
            '',
            'Make sure the trace server is running in the background:',
            '',
            `  next internal trace <file> --mcp-port ${port}`,
            '',
            'Then run your query in another terminal. For all available options, see:',
            '',
            '  next internal query-trace --help'
        ].join('\n'));
        process.exit(1);
    }
    if (!res.ok) {
        console.error(`Error: MCP server responded with HTTP ${res.status}`);
        process.exit(1);
    }
    const body = await res.text();
    // Parse SSE stream: each event looks like:
    //   event: message
    //   data: <JSON-RPC response JSON>
    //
    // We scan for "data: " lines, parse the JSON, and extract the text content.
    for (const line of body.split('\n')){
        var _msg_result_content_find, _msg_result_content, _msg_result;
        if (!line.startsWith('data: ')) continue;
        let msg;
        try {
            msg = JSON.parse(line.slice('data: '.length));
        } catch  {
            continue;
        }
        if (msg.error) {
            console.error(`Error: MCP tool error: ${JSON.stringify(msg.error)}`);
            process.exit(1);
        }
        const text = (_msg_result = msg.result) == null ? void 0 : (_msg_result_content = _msg_result.content) == null ? void 0 : (_msg_result_content_find = _msg_result_content.find((c)=>c.type === 'text')) == null ? void 0 : _msg_result_content_find.text;
        if (text !== undefined) {
            process.stdout.write(text);
            return;
        }
    }
    console.error(`Error: No text content in MCP response:\n${body}`);
    process.exit(1);
}

//# sourceMappingURL=query-trace.js.map