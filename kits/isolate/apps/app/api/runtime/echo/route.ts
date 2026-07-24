import { handleEcho } from "../../../../lib/runtime/echo";

export async function POST(request: Request) {
  return handleEcho(request, process.env.ISOLATE_RUNTIME_SECRET);
}
