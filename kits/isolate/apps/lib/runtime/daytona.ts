import { Daytona } from "@daytona/sdk";
import { z } from "zod";

import { evaluateProbe, probeSpecSchema } from "./probe";
import { assertSafeCommand } from "./policy";
import { InvestigationDeadline } from "../deadline";

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
  updateNetworkSettings(settings: {
    networkBlockAll?: boolean;
    domainAllowList?: string;
  }): Promise<unknown>;
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
  delete(sandbox: SandboxLike, timeout?: number, wait?: boolean): Promise<unknown>;
}

const workspace = "workspace/repo" as const;
const maximumOutputLength = 65_536;
const dependencyInstallCommand = [
  "if [ -f bun.lock ] || [ -f bun.lockb ]; then bun install --frozen-lockfile --ignore-scripts",
  "elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --ignore-scripts",
  "elif [ -f package-lock.json ]; then npm ci --ignore-scripts --no-audit --no-fund",
  "elif [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-scripts --non-interactive",
  "fi",
].join("; ");
const packageRegistryAllowList =
  "registry.npmjs.org,registry.npmjs.com,registry.yarnpkg.com,npm.pkg.github.com";

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

function isTierNetworkRestriction(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes(
      "Network access is restricted and cannot be overridden at the sandbox level",
    )
  );
}

async function updateNetworkPolicy(
  sandbox: SandboxLike,
  settings: { networkBlockAll?: boolean; domainAllowList?: string },
  deadline: InvestigationDeadline,
) {
  await deadline
    .run(() => sandbox.updateNetworkSettings(settings), {
      maximumMilliseconds: 10_000,
    })
    .catch((error: unknown) => {
      if (!isTierNetworkRestriction(error)) throw error;
    });
}

export class DaytonaSandboxRuntime {
  private readonly sandboxes = new Map<string, SandboxLike>();

  constructor(
    private readonly client: DaytonaLike,
    private readonly now: () => number = Date.now,
  ) {}

  private sandbox(sandboxId: string) {
    const parsedId = z.string().min(1).parse(sandboxId);
    const sandbox = this.sandboxes.get(parsedId);
    if (!sandbox) throw new Error("The sandbox is not active in this investigation.");
    return sandbox;
  }

  private async execute(
    sandbox: SandboxLike,
    command: string,
    timeoutSeconds: number,
    deadline: InvestigationDeadline,
  ) {
    return deadline.run(
      (_signal, timeoutMilliseconds) =>
        sandbox.process.executeCommand(
          command,
          workspace,
          undefined,
          Math.max(1, Math.ceil(timeoutMilliseconds / 1_000)),
        ),
      { maximumMilliseconds: timeoutSeconds * 1_000 },
    );
  }

  private async deleteSandbox(
    sandbox: SandboxLike,
    deadline: InvestigationDeadline,
  ) {
    let deletionError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await deadline.run(
          (_signal, timeoutMilliseconds) =>
            this.client.delete(
              sandbox,
              Math.max(1, Math.ceil(timeoutMilliseconds / 1_000)),
              true,
            ),
          {
            maximumMilliseconds: 15_000,
            cleanupReserveMilliseconds: 0,
          },
        );
        this.sandboxes.delete(sandbox.id);
        return;
      } catch (error) {
        deletionError = error;
        console.error("Isolate sandbox deletion failed", error);
      }
    }
    throw deletionError;
  }

  async create(
    input: z.input<typeof createSandboxInputSchema>,
    deadline = new InvestigationDeadline(),
  ) {
    const { repositoryUrl, ref } = createSandboxInputSchema.parse(input);
    const sandbox = await deadline.run(
      (_signal, timeoutMilliseconds) =>
        this.client.create(
          {
            language: "typescript",
            ephemeral: true,
            public: false,
            ttlMinutes: 30,
            labels: { product: "isolate", purpose: "issue-reproduction" },
          },
          { timeout: Math.max(1, Math.ceil(timeoutMilliseconds / 1_000)) },
        ),
      { maximumMilliseconds: 60_000 },
    );
    this.sandboxes.set(sandbox.id, sandbox);

    const commitId = ref && /^[a-f0-9]{40}$/i.test(ref) ? ref : undefined;
    const branch = commitId ? undefined : ref;

    try {
      await deadline.run(
        () =>
          sandbox.git.clone(
            repositoryUrl,
            workspace,
            branch,
            commitId,
            undefined,
            undefined,
            false,
            1,
          ),
        { maximumMilliseconds: 30_000 },
      );
      await updateNetworkPolicy(sandbox, { networkBlockAll: true }, deadline);
    } catch (error) {
      await this.deleteSandbox(sandbox, deadline);
      throw error;
    }

    return { sandboxId: sandbox.id, workspace };
  }

  async runProbe(
    input: z.input<typeof runProbeInputSchema>,
    deadline = new InvestigationDeadline(),
  ) {
    const { sandboxId, probe, timeoutSeconds } = runProbeInputSchema.parse(input);
    assertSafeCommand(probe.command);
    const sandbox = this.sandbox(sandboxId);
    const runId = crypto.randomUUID();
    const scriptPath = `/tmp/isolate-${runId}.sh`;
    const stdoutPath = `/tmp/isolate-${runId}.stdout`;
    const stderrPath = `/tmp/isolate-${runId}.stderr`;
    const exitPath = `/tmp/isolate-${runId}.exit`;
    const encodedCommand = Buffer.from(probe.command).toString("base64");

    try {
      await this.execute(
        sandbox,
        `printf '%s' '${encodedCommand}' | base64 -d > '${scriptPath}'`,
        5,
        deadline,
      );

      const startedAt = this.now();
      const runner = [
        "const fs=require('fs')",
        "const {spawn}=require('child_process')",
        `const child=spawn('setsid',['bash',${JSON.stringify(scriptPath)}],{stdio:['ignore','pipe','pipe']})`,
        `const cap=${maximumOutputLength}`,
        "const chunks={stdout:[],stderr:[]},sizes={stdout:0,stderr:0}",
        "for(const name of ['stdout','stderr']) child[name].on('data',chunk=>{if(sizes[name]<cap){const slice=chunk.subarray(0,cap-sizes[name]);chunks[name].push(slice);sizes[name]+=slice.length}})",
        "let timedOut=false,finished=false",
        "const kill=signal=>{try{process.kill(-child.pid,signal)}catch{}}",
        `const timer=setTimeout(()=>{timedOut=true;kill('SIGTERM');setTimeout(()=>kill('SIGKILL'),200)},${timeoutSeconds * 1_000})`,
        "child.once('exit',(code)=>{if(finished)return;finished=true;clearTimeout(timer);kill('SIGTERM');setTimeout(()=>{kill('SIGKILL');fs.writeFileSync(" + JSON.stringify(stdoutPath) + ",Buffer.concat(chunks.stdout));fs.writeFileSync(" + JSON.stringify(stderrPath) + ",Buffer.concat(chunks.stderr));fs.writeFileSync(" + JSON.stringify(exitPath) + ",String(timedOut?124:(code??1)));process.exit(0)},250)})",
        "child.once('error',()=>{if(finished)return;finished=true;clearTimeout(timer);fs.writeFileSync(" + JSON.stringify(stdoutPath) + ",'');fs.writeFileSync(" + JSON.stringify(stderrPath) + ",'');fs.writeFileSync(" + JSON.stringify(exitPath) + ",'1');process.exit(0)})",
      ].join(";");
      const encodedRunner = Buffer.from(runner).toString("base64");
      await this.execute(
        sandbox,
        `node -e "eval(Buffer.from('${encodedRunner}','base64').toString())"`,
        timeoutSeconds + 5,
        deadline,
      );
      const durationMs = this.now() - startedAt;

      const collector = [
        "const fs=require('fs')",
        `const output={exitCode:Number(fs.readFileSync('${exitPath}','utf8')),stdout:fs.readFileSync('${stdoutPath}','utf8'),stderr:fs.readFileSync('${stderrPath}','utf8')}`,
        "process.stdout.write(JSON.stringify(output))",
      ].join(";");
      const collected = await this.execute(
        sandbox,
        `node -e "${collector.replaceAll('"', '\\"')}"`,
        5,
        deadline,
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
      let cleanupError: unknown;
      let cleaned = false;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const cleanup = await this.execute(
            sandbox,
            `rm -f '${scriptPath}' '${stdoutPath}' '${stderrPath}' '${exitPath}'`,
            3,
            deadline,
          );
          if (cleanup.exitCode === 0) {
            cleaned = true;
            break;
          }
          cleanupError = new Error("Probe artifact cleanup failed.");
        } catch (error) {
          cleanupError = error;
        }
        console.error("Isolate probe artifact cleanup failed", cleanupError);
      }
      if (!cleaned) throw cleanupError;
    }
  }

  async resetWorkspace(input: {
    sandboxId: string;
    workspace: typeof workspace;
    timeoutSeconds: number;
  }, deadline = new InvestigationDeadline()) {
    const sandbox = this.sandbox(input.sandboxId);
    const reset = await this.execute(
      sandbox,
      "git reset --hard HEAD && git clean -fdx",
      Math.min(10, input.timeoutSeconds),
      deadline,
    );
    if (reset.exitCode !== 0) {
      throw new Error("The sandbox workspace could not be restored cleanly.");
    }
    await updateNetworkPolicy(sandbox, {
      networkBlockAll: false,
      domainAllowList: packageRegistryAllowList,
    }, deadline);
    try {
      const install = await this.execute(
        sandbox,
        dependencyInstallCommand,
        input.timeoutSeconds,
        deadline,
      );
      if (install.exitCode !== 0) {
        throw new Error("Deterministic dependency installation failed.");
      }
    } finally {
      await updateNetworkPolicy(sandbox, { networkBlockAll: true }, deadline);
    }
  }

  async delete(
    sandboxId: string,
    deadline = new InvestigationDeadline(),
  ) {
    const sandbox = this.sandboxes.get(z.string().min(1).parse(sandboxId));
    if (!sandbox) {
      throw new Error("The sandbox is not active in this investigation.");
    }
    await this.deleteSandbox(sandbox, deadline);
    return { deleted: true as const, sandboxId };
  }
}

export function createDaytonaRuntime() {
  return new DaytonaSandboxRuntime(new Daytona() as unknown as DaytonaLike);
}
