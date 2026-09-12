"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerGetRequestInsightsTool", {
    enumerable: true,
    get: function() {
        return registerGetRequestInsightsTool;
    }
});
const _zod = /*#__PURE__*/ _interop_require_default(require("next/dist/compiled/zod"));
const _requestinsights = require("../../lib/trace/request-insights");
const _mcptelemetrytracker = require("../mcp-telemetry-tracker");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function registerGetRequestInsightsTool(server) {
    server.registerTool('get_request_insights', {
        description: 'Get recent App Router request insights captured by the local Next.js span recorder. Useful for debugging slow renders, server fetches, cache behavior, and request timelines without an external OTEL collector. Requires experimental.requestInsights.',
        inputSchema: {
            requestId: _zod.default.string().optional(),
            htmlRequestId: _zod.default.string().optional()
        }
    }, async (request)=>{
        _mcptelemetrytracker.mcpTelemetryTracker.recordToolCall('mcp/get_request_insights');
        if (!(0, _requestinsights.isRequestInsightsEnabled)()) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Request Insights is not enabled. Set experimental.requestInsights = true in next.config.js and restart next dev.'
                        })
                    }
                ]
            };
        }
        const snapshot = (0, _requestinsights.getRequestInsightsSnapshot)();
        const requests = snapshot.requests.filter((insight)=>{
            return (request.requestId === undefined || insight.requestId === request.requestId) && (request.htmlRequestId === undefined || insight.htmlRequestId === request.htmlRequestId);
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        requests
                    }, null, 2)
                }
            ]
        };
    });
}

//# sourceMappingURL=get-request-insights.js.map