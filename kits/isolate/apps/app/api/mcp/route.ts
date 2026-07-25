import { handleMcp } from "../../../lib/runtime/mcp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  return handleMcp(request, process.env.ISOLATE_RUNTIME_SECRET);
}

export async function GET(request: Request) {
  return handleMcp(request, process.env.ISOLATE_RUNTIME_SECRET);
}

export async function DELETE(request: Request) {
  return handleMcp(request, process.env.ISOLATE_RUNTIME_SECRET);
}
