import { Daytona } from "@daytona/sdk";
import { z } from "zod";

import { evaluateProbe, probeSpecSchema } from "./probe";

const publicGitHubRepositorySchema = z
  .string()
  .url()
  .regex(
    /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/,
    "Only public HTTPS GitHub repositories are supported.",
  );

const createSandboxInputSchema = z.object({
  repositoryUrl: publicGitHubRepositorySchema,
  ref: z.string().trim().min(1).max(255).optional(),
});

const runProbeInputSchema = z.object({
  sandboxId: z.string().min(1),
  workspace: z.literal("workspace/repo"),
  timeoutSeconds: z.number().int().min(1).max(120).default(60),
  probe: probeSpecSchema,
});

type ExecuteResult = { exitCode: number; result: string };

interface SandboxLike {
  id: string;
  git: {
    clone(
      url: string,
      path: string,
      branch?: string,
      commitId?: string,
      username?: string,
      password?: string,
      insecureSkipTls?: boolean,
      depth?: number,
    ): Promise<unknown>;
  };
  process: {
    executeCommand(
      command: string,
      cwd?: string,
      env?: Record<string, string>,
      timeout?: number,
    ): Promise<ExecuteResult>;
  };
}

interface DaytonaLike {
  create(params: unknown, options: unknown): Promise<SandboxLike>;
  get(sandboxId: string): Promise<SandboxLike>;
  delete(sandbox: SandboxLike, timeout?: number, wait?: boolean): Promise<unknown>;
}

const workspace = "workspace/repo" as const;

export class DaytonaSandboxRuntime {
  constructor(
    private readonly client: DaytonaLike,
    private readonly now: () => number = Date.now,
  ) {}

  async create(input: z.input<typeof createSandboxInputSchema>) {
    const { repositoryUrl, ref } = createSandboxInputSchema.parse(input);
    const sandbox = await this.client.create(
      {
        language: "typescript",
        ephemeral: true,
        public: false,
        ttlMinutes: 30,
        labels: { product: "isolate", purpose: "issue-reproduction" },
      },
      { timeout: 90 },
    );

    await sandbox.git.clone(
      repositoryUrl,
      workspace,
      ref,
      undefined,
      undefined,
      undefined,
      false,
      1,
    );

    return { sandboxId: sandbox.id, workspace };
  }

  async runProbe(input: z.input<typeof runProbeInputSchema>) {
    const { sandboxId, probe, timeoutSeconds } = runProbeInputSchema.parse(input);
    const sandbox = await this.client.get(sandboxId);
    const runId = crypto.randomUUID();
    const scriptPath = `/tmp/isolate-${runId}.sh`;
    const stdoutPath = `/tmp/isolate-${runId}.stdout`;
    const stderrPath = `/tmp/isolate-${runId}.stderr`;
    const exitPath = `/tmp/isolate-${runId}.exit`;
    const encodedCommand = Buffer.from(probe.command).toString("base64");

    await sandbox.process.executeCommand(
      `printf '%s' '${encodedCommand}' | base64 -d > '${scriptPath}'`,
      workspace,
      undefined,
      10,
    );

    const startedAt = this.now();
    await sandbox.process.executeCommand(
      `bash '${scriptPath}' > '${stdoutPath}' 2> '${stderrPath}'; printf '%s' "$?" > '${exitPath}'`,
      workspace,
      undefined,
      timeoutSeconds,
    );
    const durationMs = this.now() - startedAt;

    const collector = [
      "const fs=require('fs')",
      `const output={exitCode:Number(fs.readFileSync('${exitPath}','utf8')),stdout:fs.readFileSync('${stdoutPath}','utf8'),stderr:fs.readFileSync('${stderrPath}','utf8')}`,
      "process.stdout.write(JSON.stringify(output))",
    ].join(";");
    const collected = await sandbox.process.executeCommand(
      `node -e "${collector.replaceAll('"', '\\"')}"`,
      workspace,
      undefined,
      10,
    );
    const observation = z
      .object({ exitCode: z.number().int(), stdout: z.string(), stderr: z.string() })
      .parse(JSON.parse(collected.result));

    return evaluateProbe(probe, { ...observation, durationMs });
  }

  async delete(sandboxId: string) {
    const sandbox = await this.client.get(z.string().min(1).parse(sandboxId));
    await this.client.delete(sandbox, 60, true);
    return { deleted: true as const, sandboxId };
  }
}

export function createDaytonaRuntime() {
  return new DaytonaSandboxRuntime(new Daytona() as unknown as DaytonaLike);
}
