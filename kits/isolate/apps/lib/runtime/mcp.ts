import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import {
  runCertification,
  validateCertificationCommands,
} from "./certification";
import {
  extractIssueEvidenceAssertion,
  MissingIssueEvidenceContractError,
} from "./claim";
import { createDaytonaRuntime, DaytonaSandboxRuntime } from "./daytona";
import { certificationSchema } from "./evidence";
import { createGitHubIssueReader } from "./github";
import { UnsafeCommandError } from "./policy";
import { InvestigationDeadline } from "../deadline";
import { acquireInvestigationSlot } from "../concurrency";

type RuntimeFactory = () => Pick<
  DaytonaSandboxRuntime,
  "create" | "runProbe" | "resetWorkspace" | "delete"
>;

type IssueReader = Pick<ReturnType<typeof createGitHubIssueReader>, "read">;

function mcpToolError(error: unknown) {
  if (
    error instanceof MissingIssueEvidenceContractError ||
    error instanceof UnsafeCommandError
  ) {
    return {
      isError: true as const,
      content: [{ type: "text" as const, text: error.message }],
    };
  }
  console.error("Isolate MCP tool failed", error);
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: "Isolate could not complete the requested operation.",
      },
    ],
  };
}

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
      try {
        const deadline = new InvestigationDeadline();
        const output = await deadline.run(
          (signal) => issueReader.read(issueUrl, { signal }),
          { maximumMilliseconds: 10_000 },
        );
        return {
          content: [{ type: "text" as const, text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        return mcpToolError(error);
      }
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
    "certify_reproduction",
    {
      title: "Certify reproduction evidence",
      description:
        "Runs candidate and control commands against one exact issue-derived signature, then deterministically decides whether the issue was reproduced.",
      inputSchema: z.object({
        issueUrl: z.string().url(),
        ref: z.string().trim().min(1).max(255).optional(),
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
      ref,
      candidateCommand,
      controlCommand,
    }) => {
      const release = acquireInvestigationSlot();
      if (!release) {
        return {
          isError: true as const,
          content: [{
            type: "text" as const,
            text: "Too many investigations are already running. Try again shortly.",
          }],
        };
      }
      try {
        const deadline = new InvestigationDeadline();
        const runtime = runtimeFactory();
        const issue = await deadline.run(
          (signal) => issueReader.read(issueUrl, { signal }),
          { maximumMilliseconds: 10_000 },
        );
        const assertion = extractIssueEvidenceAssertion(issue.body);
        validateCertificationCommands({
          candidateCommand,
          controlCommand,
          assertion,
        });
        const sandbox = await runtime.create(
          {
            repositoryUrl: issue.repositoryUrl,
            ...(ref?.trim() ? { ref: ref.trim() } : {}),
          },
          deadline,
        );
        try {
          const output = await runCertification({
            runtime,
            ...sandbox,
            deadline,
            candidateCommand,
            controlCommand,
            assertion,
          });

          return {
            content: [{ type: "text" as const, text: JSON.stringify(output) }],
            structuredContent: output,
          };
        } finally {
          await runtime.delete(sandbox.sandboxId, deadline);
        }
      } catch (error) {
        return mcpToolError(error);
      } finally {
        release();
      }
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
