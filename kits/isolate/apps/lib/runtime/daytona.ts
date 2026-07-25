import { Daytona } from "@daytona/sdk";
import { z } from "zod";

import { evaluateProbe, probeSpecSchema } from "./probe";
import { assertSafeCommand } from "./policy";

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
  timeoutSeconds: z.number().int().min(1).max(40).default(40),
  probe: probeSpecSchema,
});

type ExecuteResult = { exitCode: number; result: string };

interface SandboxLike {
  id: string;
  updateNetworkSettings(settings: { networkBlockAll: boolean }): Promise<unknown>;
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
const maximumOutputLength = 65_536;

function sanitizeOutput(value: string) {
  const redacted = value
    .replace(
      /(\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*)([^\s]+)/gi,
      "$1[REDACTED]",
    )
    .replace(/(\bauthorization\b\s*:\s*bearer\s+)([^\s]+)/gi, "$1[REDACTED]");

  if (redacted.length <= maximumOutputLength) return redacted;
  const marker = "\n[output truncated]";
  return `${redacted.slice(0, maximumOutputLength - marker.length)}${marker}`;
}

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
      { timeout: 60 },
    );

    const commitId = ref && /^[a-f0-9]{40}$/i.test(ref) ? ref : undefined;
    const branch = commitId ? undefined : ref;

    try {
      await sandbox.git.clone(
        repositoryUrl,
        workspace,
        branch,
        commitId,
        undefined,
        undefined,
        false,
        1,
      );
      await sandbox.updateNetworkSettings({ networkBlockAll: true });
    } catch (error) {
      await this.client.delete(sandbox, 60, true).catch(() => undefined);
      throw error;
    }

    return { sandboxId: sandbox.id, workspace };
  }

  async runProbe(input: z.input<typeof runProbeInputSchema>) {
    const { sandboxId, probe, timeoutSeconds } = runProbeInputSchema.parse(input);
    assertSafeCommand(probe.command);
    const sandbox = await this.client.get(sandboxId);
    const runId = crypto.randomUUID();
    const scriptPath = `/tmp/isolate-${runId}.sh`;
    const stdoutPath = `/tmp/isolate-${runId}.stdout`;
    const stderrPath = `/tmp/isolate-${runId}.stderr`;
    const exitPath = `/tmp/isolate-${runId}.exit`;
    const encodedCommand = Buffer.from(probe.command).toString("base64");

    try {
      await sandbox.process.executeCommand(
        `printf '%s' '${encodedCommand}' | base64 -d > '${scriptPath}'`,
        workspace,
        undefined,
        10,
      );

      const startedAt = this.now();
      await sandbox.process.executeCommand(
        `ulimit -f 128; setsid timeout --signal=TERM --kill-after=5s ${timeoutSeconds}s bash '${scriptPath}' > '${stdoutPath}' 2> '${stderrPath}' & probe_pid=$!; wait "$probe_pid"; probe_status=$?; kill -TERM -- "-$probe_pid" 2>/dev/null || true; sleep 0.2; kill -KILL -- "-$probe_pid" 2>/dev/null || true; printf '%s' "$probe_status" > '${exitPath}'`,
        workspace,
        undefined,
        timeoutSeconds + 10,
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

      return evaluateProbe(probe, {
        ...observation,
        stdout: sanitizeOutput(observation.stdout),
        stderr: sanitizeOutput(observation.stderr),
        durationMs,
      });
    } finally {
      await sandbox.process
        .executeCommand(
          `rm -f '${scriptPath}' '${stdoutPath}' '${stderrPath}' '${exitPath}'`,
          workspace,
          undefined,
          10,
        )
        .catch(() => undefined);
    }
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
