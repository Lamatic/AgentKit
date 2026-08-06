import { handleMcp } from "../../../lib/runtime/mcp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Handle MCP JSON-RPC calls.
 */
export async function POST(request: Request) {
  return handleMcp(request, process.env.ISOLATE_RUNTIME_SECRET);
}

/**
 * Handle MCP SSE stream requests.
 */
export async function GET(request: Request) {
  return handleMcp(request, process.env.ISOLATE_RUNTIME_SECRET);
}

/**
 * Handle MCP session termination.
 */
export async function DELETE(request: Request) {
  return handleMcp(request, process.env.ISOLATE_RUNTIME_SECRET);
}
