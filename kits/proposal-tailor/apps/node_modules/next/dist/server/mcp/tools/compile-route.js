/**
 * MCP tool for compiling a specific route via the on-demand entry handler.
 *
 * Triggers on-demand compilation so the route's assets are built without making an
 * HTTP request to the route. This is the same call path the dev server uses
 * when a route is first navigated to, making it useful for warming the module
 * graph, measuring compile time, or pre-compiling routes for memory
 * benchmarking without requiring live backends.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerCompileRouteTool", {
    enumerable: true,
    get: function() {
        return registerCompileRouteTool;
    }
});
const _mcptelemetrytracker = require("../mcp-telemetry-tracker");
const _zod = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/zod"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function registerCompileRouteTool(server, compileRoute) {
    server.registerTool('compile_route', {
        description: 'Compile a specific route (page or API route) without making an HTTP request. ' + 'Triggers the same on-demand compilation the dev server uses when a route is first visited. ' + 'Useful for warming up the module graph, measuring compile time, or pre-compiling routes for memory benchmarking. ' + 'Returns { routeSpecifier, issues } on success where routeSpecifier is the resolved route and issues contains any compilation warnings or errors. ' + 'Returns an error if no matching route exists.',
        inputSchema: {
            routeSpecifier: _zod.default.string().describe('A route specifier as returned by the get_routes tool (e.g. "/", "/blog/[slug]", "/api/users/[id]"). ' + 'Mutually exclusive with `path`; provide exactly one.').optional(),
            path: _zod.default.string().describe('A URL path on this site (e.g. "/blog/hello-world", "/docs/a/b/c"). ' + 'Query strings are allowed and ignored. Do not include scheme/host/port. ' + "The path is resolved to its matching route specifier using the dev router's live route table. " + 'Mutually exclusive with `routeSpecifier`; provide exactly one.').optional()
        }
    }, async ({ routeSpecifier, path })=>{
        _mcptelemetrytracker.mcpTelemetryTracker.recordToolCall('mcp/compile_route');
        if (routeSpecifier == null === (path == null)) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Provide exactly one of `routeSpecifier` or `path`.'
                        })
                    }
                ]
            };
        }
        try {
            const { routeSpecifier: resolvedRouteSpecifier, issues } = await compileRoute({
                routeSpecifier,
                path
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            routeSpecifier: resolvedRouteSpecifier,
                            issues
                        })
                    }
                ]
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const notFound = error instanceof Error && error.code === 'ENOENT';
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(notFound ? {
                            notFound: true,
                            input: path ?? routeSpecifier
                        } : {
                            input: path ?? routeSpecifier,
                            error: message
                        })
                    }
                ]
            };
        }
    });
}

//# sourceMappingURL=compile-route.js.map