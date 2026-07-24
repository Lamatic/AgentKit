import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

function createIsolateServer() {
  const server = new McpServer({ name: "isolate", version: "0.1.0" });

  server.registerTool(
    "echo",
    {
      title: "Isolate connection probe",
      description:
        "Returns a deterministic trace proving the Isolate runtime was called.",
      inputSchema: z.object({
        message: z.string().trim().min(1).max(500),
      }),
      outputSchema: z.object({
        ok: z.literal(true),
        tool: z.literal("echo"),
        message: z.string(),
        traceId: z.string(),
        observedAt: z.string(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ message }) => {
      const output = {
        ok: true as const,
        tool: "echo" as const,
        message,
        traceId: `spike_${crypto.randomUUID()}`,
        observedAt: new Date().toISOString(),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  return server;
}

const mcpHandler = createMcpHandler(createIsolateServer, {
  legacy: "stateless",
  responseMode: "json",
});

export async function handleMcp(request: Request, secret: string | undefined) {
  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return Response.json(
      {
        error: {
          code: "unauthorized",
          message: "Valid MCP authorization is required.",
        },
      },
      {
        status: 401,
        headers: {
          "cache-control": "no-store",
          "www-authenticate": 'Bearer realm="isolate-mcp"',
        },
      },
    );
  }

  return mcpHandler.fetch(request);
}
