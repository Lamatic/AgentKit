import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { runCertification } from "./certification";
import { extractIssueEvidenceAssertion } from "./claim";
import { createDaytonaRuntime, DaytonaSandboxRuntime } from "./daytona";
import { certificationSchema } from "./evidence";
import { createGitHubIssueReader } from "./github";
import { probeEvaluationSchema, probeSpecSchema } from "./probe";

type RuntimeFactory = () => Pick<
  DaytonaSandboxRuntime,
  "create" | "runProbe" | "delete"
>;

type IssueReader = Pick<ReturnType<typeof createGitHubIssueReader>, "read">;

function createIsolateServer(
  runtimeFactory: RuntimeFactory,
  issueReader: IssueReader,
) {
  const server = new McpServer({ name: "isolate", version: "0.1.0" });

  server.registerTool(
    "get_github_issue",
    {
      title: "Read public GitHub issue",
      description:
        "Fetches and normalizes one public GitHub issue into trusted reproduction input.",
      inputSchema: z.object({ issueUrl: z.string().url() }),
      outputSchema: z.object({
        url: z.string().url(),
        repositoryUrl: z.string().url(),
        owner: z.string(),
        repository: z.string(),
        number: z.number().int().positive(),
        title: z.string(),
        body: z.string(),
        state: z.enum(["open", "closed"]),
        author: z.string(),
        labels: z.array(z.string()),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ issueUrl }) => {
      const output = await issueReader.read(issueUrl);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

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

  server.registerTool(
    "create_sandbox",
    {
      title: "Create reproduction sandbox",
      description:
        "Creates an expiring private sandbox and clones a public GitHub repository into it.",
      inputSchema: z.object({
        repositoryUrl: z.string().url(),
        ref: z.string().trim().min(1).max(255).optional(),
      }),
      outputSchema: z.object({
        sandboxId: z.string(),
        workspace: z.literal("workspace/repo"),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const output = await runtimeFactory().create(input);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    "run_probe",
    {
      title: "Run deterministic reproduction probe",
      description:
        "Executes one bounded command inside an Isolate sandbox and evaluates explicit assertions against captured evidence.",
      inputSchema: z.object({
        sandboxId: z.string().min(1),
        workspace: z.literal("workspace/repo"),
        timeoutSeconds: z.number().int().min(1).max(40).default(40),
        probe: probeSpecSchema,
      }),
      outputSchema: probeEvaluationSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const output = await runtimeFactory().runProbe(input);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    "delete_sandbox",
    {
      title: "Delete reproduction sandbox",
      description:
        "Permanently deletes an Isolate sandbox after its evidence has been collected.",
      inputSchema: z.object({ sandboxId: z.string().min(1) }),
      outputSchema: z.object({
        deleted: z.literal(true),
        sandboxId: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ sandboxId }) => {
      const output = await runtimeFactory().delete(sandboxId);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    "certify_reproduction",
    {
      title: "Certify reproduction evidence",
      description:
        "Runs candidate and control commands against one exact issue-derived signature, then deterministically decides whether the issue was reproduced.",
      inputSchema: z.object({
        issueUrl: z.string().url(),
        sandboxId: z.string().min(1),
        workspace: z.literal("workspace/repo"),
        timeoutSeconds: z.number().int().min(1).max(40).default(40),
        candidateCommand: z.string().trim().min(1).max(4_000),
        controlCommand: z.string().trim().min(1).max(4_000),
      }),
      outputSchema: certificationSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({
      issueUrl,
      sandboxId,
      workspace,
      timeoutSeconds,
      candidateCommand,
      controlCommand,
    }) => {
      const runtime = runtimeFactory();
      const issue = await issueReader.read(issueUrl);
      const assertion = extractIssueEvidenceAssertion(issue.body);
      const output = await runCertification({
        runtime,
        sandboxId,
        workspace,
        timeoutSeconds,
        candidateCommand,
        controlCommand,
        assertion,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  return server;
}

export async function handleMcp(
  request: Request,
  secret: string | undefined,
  runtimeFactory: RuntimeFactory = createDaytonaRuntime,
  issueReader: IssueReader = createGitHubIssueReader(),
) {
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

  const mcpHandler = createMcpHandler(
    () => createIsolateServer(runtimeFactory, issueReader),
    {
      legacy: "stateless",
      responseMode: "json",
    },
  );
  return mcpHandler.fetch(request);
}
