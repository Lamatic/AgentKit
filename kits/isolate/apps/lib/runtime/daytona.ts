import { Daytona } from "@daytona/sdk";
import { after } from "next/server";
import { z } from "zod";

import { evaluateProbe, probeSpecSchema } from "./probe";
import { assertCertificationCommand, assertSafeCommand } from "./policy";
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
type RetainBackgroundTask = (task: Promise<unknown>) => void;
type PtyLike = {
  sendInput(data: string | Uint8Array): Promise<void>;
  wait(): Promise<{ exitCode?: number; error?: string }>;
  kill(): Promise<void>;
  disconnect(): Promise<void>;
};

interface SandboxLike {
  id: string;
  process: {
    executeCommand(
      command: string,
      cwd?: string,
      env?: Record<string, string>,
      timeout?: number,
    ): Promise<ExecuteResult>;
    createPty(options: {
      id: string;
      cwd?: string;
      envs?: Record<string, string>;
      cols?: number;
      rows?: number;
      onData(data: Uint8Array): void | Promise<void>;
    }): Promise<PtyLike>;
  };
}

interface DaytonaLike {
  create(params: unknown, options: unknown): Promise<SandboxLike>;
  get(sandboxIdOrName: string): Promise<SandboxLike>;
  delete(sandbox: SandboxLike, timeout?: number, wait?: boolean): Promise<unknown>;
  updateNetworkSettings(
    sandboxId: string,
    settings: { networkBlockAll?: boolean; domainAllowList?: string },
    signal: AbortSignal,
  ): Promise<unknown>;
}

const workspace = "workspace/repo" as const;
const tuiFixturePath = ".isolate-reproduction.md";
const tuiFixtureInitialContent = "# Isolate reproduction\noriginal\n";
const tuiEditText = "isolate-runtime-edit";
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
      /("(?:api[_-]?key|token|secret|password)"\s*:\s*")((?:\\.|[^"\\])*)(")/gi,
      "$1[REDACTED]$3",
    )
    .replace(
      /("authorization"\s*:\s*"bearer\s+)((?:\\.|[^"\\])*)(")/gi,
      "$1[REDACTED]$3",
    )
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
  client: DaytonaLike,
  sandbox: SandboxLike,
  settings: { networkBlockAll?: boolean; domainAllowList?: string },
  deadline: InvestigationDeadline,
  cleanup = false,
) {
  await deadline
    .run((signal) => client.updateNetworkSettings(sandbox.id, settings, signal), {
      maximumMilliseconds: 10_000,
      cleanupReserveMilliseconds: cleanup ? 0 : undefined,
    })
    .catch((error: unknown) => {
      if (!isTierNetworkRestriction(error)) throw error;
    });
}

export class DaytonaSandboxRuntime {
  private readonly sandboxes = new Map<string, SandboxLike>();
  private readonly tuiBaselines = new Map<string, string>();

  constructor(
    private readonly client: DaytonaLike,
    private readonly now: () => number = Date.now,
    private readonly retainBackgroundTask: RetainBackgroundTask = (task) => {
      void task;
    },
    private readonly pause: (milliseconds: number) => Promise<void> = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    private readonly snapshot = process.env.DAYTONA_SNAPSHOT?.trim() || undefined,
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
    cleanup = false,
    cwd: string = workspace,
  ) {
    return deadline.run(
      (_signal, timeoutMilliseconds) =>
        sandbox.process.executeCommand(
          command,
          cwd,
          undefined,
          Math.max(1, Math.ceil(timeoutMilliseconds / 1_000)),
        ),
      {
        maximumMilliseconds: timeoutSeconds * 1_000,
        cleanupReserveMilliseconds: cleanup ? 0 : undefined,
      },
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

  private retainLateSandboxCleanup(operations: Array<Promise<SandboxLike>>) {
    const claimedIds = new Set<string>();
    const cleanupTasks = operations.map((operation) =>
      operation.then(
        async (sandbox) => {
          if (claimedIds.has(sandbox.id)) return;
          claimedIds.add(sandbox.id);
          this.sandboxes.set(sandbox.id, sandbox);
          try {
            await this.deleteSandbox(
              sandbox,
              new InvestigationDeadline(35_000),
            );
          } catch (error) {
            console.error("Isolate late sandbox cleanup failed", error);
          }
        },
        () => undefined,
      ),
    );
    this.retainBackgroundTask(Promise.all(cleanupTasks));
  }

  async create(
    input: z.input<typeof createSandboxInputSchema>,
    deadline = new InvestigationDeadline(),
  ) {
    const { repositoryUrl, ref } = createSandboxInputSchema.parse(input);
    const sandboxName = `isolate-${crypto.randomUUID()}`;
    const availableMilliseconds = deadline.remainingMilliseconds();
    const createRecoveryReserveMilliseconds = Math.min(
      60_000,
      Math.max(35_000, Math.floor(availableMilliseconds * 0.4)),
    );
    const createTimeoutMilliseconds = Math.min(
      60_000,
      Math.max(1, availableMilliseconds - createRecoveryReserveMilliseconds),
    );
    const creationOperation = this.client.create(
      {
        name: sandboxName,
        ...(this.snapshot
          ? { snapshot: this.snapshot }
          : { language: "typescript" }),
        ephemeral: true,
        public: false,
        ttlMinutes: 30,
        labels: { product: "isolate", purpose: "issue-reproduction" },
      },
      { timeout: Math.max(1, Math.ceil(createTimeoutMilliseconds / 1_000)) },
    );
    const creation = deadline.run(
      () => creationOperation,
      { maximumMilliseconds: createTimeoutMilliseconds },
    );
    let sandbox: SandboxLike;
    try {
      sandbox = await creation;
    } catch (creationError) {
      let recovered: SandboxLike | undefined;
      try {
        const recoveryDeletionReserveMilliseconds = 35_000;
        recovered = await deadline.run(() => creationOperation, {
          maximumMilliseconds: deadline.remainingMilliseconds(
            recoveryDeletionReserveMilliseconds,
          ),
          cleanupReserveMilliseconds: recoveryDeletionReserveMilliseconds,
        });
      } catch {
        let lookupOperation: Promise<SandboxLike> | undefined;
        try {
          lookupOperation = this.client.get(sandboxName);
          recovered = await deadline.run(() => lookupOperation!, {
            maximumMilliseconds: 5_000,
            cleanupReserveMilliseconds: 30_000,
          });
        } catch {
          this.retainLateSandboxCleanup([
            creationOperation,
            ...(lookupOperation ? [lookupOperation] : []),
          ]);
          throw creationError;
        }
      }
      this.sandboxes.set(recovered.id, recovered);
      await this.deleteSandbox(recovered, deadline);
      throw creationError;
    }
    this.sandboxes.set(sandbox.id, sandbox);

    const commitId = ref && /^[a-f0-9]{40}$/i.test(ref) ? ref : undefined;
    const branch = commitId ? undefined : ref;

    try {
      const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
      const cloneCommand = commitId
        ? `git clone --depth 1 -- ${quote(repositoryUrl)} ${quote(workspace)} && git -C ${quote(workspace)} fetch --depth 1 origin ${quote(commitId)} && git -C ${quote(workspace)} checkout --detach ${quote(commitId)}`
        : `git clone --depth 1${branch ? ` --branch ${quote(branch)}` : ""} -- ${quote(repositoryUrl)} ${quote(workspace)}`;
      const clone = await this.execute(
        sandbox,
        cloneCommand,
        30,
        deadline,
        false,
        ".",
      );
      if (clone.exitCode !== 0) throw new Error("Repository cloning failed.");
      await updateNetworkPolicy(
        this.client,
        sandbox,
        { networkBlockAll: true },
        deadline,
      );
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
        "let timedOut=false,finished=false,forceKillTimer",
        "const kill=signal=>{try{process.kill(-child.pid,signal)}catch{}}",
        "const forceKill=()=>{if(!forceKillTimer)forceKillTimer=setTimeout(()=>kill('SIGKILL'),200)}",
        `const timer=setTimeout(()=>{timedOut=true;kill('SIGTERM');forceKill()},${timeoutSeconds * 1_000})`,
        "child.once('exit',()=>{kill('SIGTERM');forceKill()})",
        "child.once('close',(code)=>{if(finished)return;finished=true;clearTimeout(timer);if(forceKillTimer)clearTimeout(forceKillTimer);fs.writeFileSync(" + JSON.stringify(stdoutPath) + ",Buffer.concat(chunks.stdout));fs.writeFileSync(" + JSON.stringify(stderrPath) + ",Buffer.concat(chunks.stderr));fs.writeFileSync(" + JSON.stringify(exitPath) + ",String(timedOut?124:(code??1)));process.exit(0)})",
        "child.once('error',()=>{if(finished)return;finished=true;clearTimeout(timer);if(forceKillTimer)clearTimeout(forceKillTimer);fs.writeFileSync(" + JSON.stringify(stdoutPath) + ",'');fs.writeFileSync(" + JSON.stringify(stderrPath) + ",'');fs.writeFileSync(" + JSON.stringify(exitPath) + ",'1');process.exit(0)})",
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
            true,
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

  async prepareTuiWorkspace(
    input: {
      sandboxId: string;
      workspace: typeof workspace;
      timeoutSeconds: number;
      setupCommand: string;
    },
    deadline = new InvestigationDeadline(),
  ) {
    assertCertificationCommand(input.setupCommand);
    await this.resetWorkspace(
      {
        sandboxId: input.sandboxId,
        workspace: input.workspace,
        timeoutSeconds: input.timeoutSeconds,
      },
      deadline,
    );
    const sandbox = this.sandbox(input.sandboxId);
    const setup = await this.execute(
      sandbox,
      input.setupCommand,
      input.timeoutSeconds,
      deadline,
    );
    if (setup.exitCode !== 0) {
      throw new Error("The repository-owned TUI setup command failed.");
    }

    const archivePath = `/tmp/isolate-tui-baseline-${crypto.randomUUID()}.tar`;
    const archived = await this.execute(
      sandbox,
      `tar --exclude='./.git' -cf '${archivePath}' .`,
      input.timeoutSeconds,
      deadline,
    );
    if (archived.exitCode !== 0) {
      throw new Error("The prepared TUI workspace could not be snapshotted.");
    }
    this.tuiBaselines.set(input.sandboxId, archivePath);
  }

  async resetTuiWorkspace(
    input: {
      sandboxId: string;
      workspace: typeof workspace;
      timeoutSeconds: number;
    },
    deadline = new InvestigationDeadline(),
  ) {
    const sandbox = this.sandbox(input.sandboxId);
    const archivePath = this.tuiBaselines.get(input.sandboxId);
    if (!archivePath) throw new Error("The TUI workspace baseline is unavailable.");
    const reset = await this.execute(
      sandbox,
      `git reset --hard HEAD && git clean -fdx && tar -xf '${archivePath}'`,
      input.timeoutSeconds,
      deadline,
    );
    if (reset.exitCode !== 0) {
      throw new Error("The prepared TUI workspace could not be restored.");
    }
  }

  async runTuiUnsavedExitProbe(
    input: {
      sandboxId: string;
      workspace: typeof workspace;
      timeoutSeconds: number;
      command: string;
      quitKey: "ctrl_q";
      saveBeforeQuit: boolean;
    },
    deadline = new InvestigationDeadline(),
  ) {
    const parsed = z
      .object({
        sandboxId: z.string().min(1),
        workspace: z.literal(workspace),
        timeoutSeconds: z.number().int().min(1).max(40),
        command: z.string().trim().min(1).max(4_000),
        quitKey: z.literal("ctrl_q"),
        saveBeforeQuit: z.boolean(),
      })
      .parse(input);
    assertCertificationCommand(parsed.command);
    const sandbox = this.sandbox(parsed.sandboxId);
    const encodedFixture = Buffer.from(tuiFixtureInitialContent).toString("base64");
    const fixture = await this.execute(
      sandbox,
      `printf '%s' '${encodedFixture}' | base64 -d > '${tuiFixturePath}'`,
      5,
      deadline,
    );
    if (fixture.exitCode !== 0) throw new Error("The TUI fixture could not be created.");

    const outputChunks: Uint8Array[] = [];
    let outputLength = 0;
    const ptyOperation = sandbox.process.createPty({
      id: `isolate-${crypto.randomUUID()}`,
      cwd: workspace,
      envs: { TERM: "xterm-256color" },
      cols: 120,
      rows: 30,
      onData: (data) => {
        if (outputLength >= maximumOutputLength) return;
        const kept = data.slice(0, maximumOutputLength - outputLength);
        outputChunks.push(kept);
        outputLength += kept.length;
      },
    });
    let pty: PtyLike | undefined;
    const startedAt = this.now();
    try {
      try {
        pty = await deadline.run(() => ptyOperation, {
          maximumMilliseconds: 10_000,
        });
      } catch (error) {
        this.retainBackgroundTask(
          ptyOperation.then(async (latePty) => {
            await latePty.kill().catch(() => undefined);
            await latePty.disconnect().catch(() => undefined);
          }),
        );
        throw error;
      }
      const send = (data: string | Uint8Array) =>
        deadline.run(() => pty!.sendInput(data), { maximumMilliseconds: 3_000 });
      await send(`${parsed.command} -- ${tuiFixturePath}; exit\n`);
      await this.pause(1_200);
      await send(new Uint8Array([27]));
      await this.pause(100);
      await send(tuiEditText);
      await this.pause(100);
      if (parsed.saveBeforeQuit) {
        await send(new Uint8Array([19]));
        await this.pause(200);
      }
      await send(new Uint8Array([17]));

      let result: { exitCode?: number; error?: string };
      try {
        result = await deadline.run(() => pty!.wait(), {
          maximumMilliseconds: Math.min(5_000, parsed.timeoutSeconds * 1_000),
        });
      } catch {
        await pty.kill().catch(() => undefined);
        result = {
          exitCode: 124,
          error: "The TUI did not exit after the quit input.",
        };
      }

      const collector = [
        "const fs=require('fs')",
        `process.stdout.write(fs.readFileSync('${tuiFixturePath}').toString('base64'))`,
      ].join(";");
      const collected = await this.execute(
        sandbox,
        `node -e \"${collector}\"`,
        5,
        deadline,
      );
      if (collected.exitCode !== 0) {
        throw new Error("The TUI fixture result could not be collected.");
      }
      const fileContent = Buffer.from(collected.result.trim(), "base64").toString();
      const fileUnchanged = fileContent === tuiFixtureInitialContent;
      const processExited = result.exitCode === 0;
      const passed = processExited && fileUnchanged;
      const terminalOutput = Buffer.concat(outputChunks.map((chunk) => Buffer.from(chunk))).toString();
      return {
        passed,
        assertions: [
          {
            kind: "file_unchanged_after_tui_exit" as const,
            passed,
            expected: "process exited and unsaved fixture stayed unchanged",
            actual: processExited
              ? fileUnchanged
                ? "process exited and fixture stayed unchanged"
                : "process exited and fixture changed"
              : "process did not exit cleanly",
          },
        ],
        observation: {
          command: `${parsed.command} -- ${tuiFixturePath}`,
          exitCode: result.exitCode ?? 1,
          stdout: sanitizeOutput(terminalOutput),
          stderr: sanitizeOutput(result.error ?? ""),
          durationMs: this.now() - startedAt,
        },
      };
    } finally {
      if (pty) await pty.disconnect().catch((error) => {
        console.error("Isolate TUI PTY disconnect failed", error);
      });
      await this.execute(
        sandbox,
        `rm -f '${tuiFixturePath}'`,
        3,
        deadline,
        true,
      );
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
    try {
      await updateNetworkPolicy(
        this.client,
        sandbox,
        {
          networkBlockAll: false,
          domainAllowList: packageRegistryAllowList,
        },
        deadline,
      );
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
      await updateNetworkPolicy(
        this.client,
        sandbox,
        { networkBlockAll: true },
        deadline,
        true,
      );
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
    this.tuiBaselines.delete(sandboxId);
    return { deleted: true as const, sandboxId };
  }
}

export function resolveDaytonaApiUrl(
  environment: Record<string, string | undefined>,
) {
  return (
    environment.DAYTONA_API_URL?.trim() ||
    environment.DAYTONA_SERVER_URL?.trim() ||
    "https://app.daytona.io/api"
  ).replace(/\/$/, "");
}

export function resolveDaytonaCredential(
  environment: Record<string, string | undefined>,
) {
  return (
    environment.DAYTONA_API_KEY?.trim() ||
    environment.DAYTONA_JWT_TOKEN?.trim() ||
    undefined
  );
}

export function resolveDaytonaConfiguration(
  environment: Record<string, string | undefined>,
) {
  const apiKey = environment.DAYTONA_API_KEY?.trim() || undefined;
  const jwtToken = environment.DAYTONA_JWT_TOKEN?.trim() || undefined;
  return {
    apiUrl: resolveDaytonaApiUrl(environment),
    ...(apiKey ? { apiKey } : jwtToken ? { jwtToken } : {}),
    ...(jwtToken && !apiKey
      ? { organizationId: environment.DAYTONA_ORGANIZATION_ID?.trim() || undefined }
      : {}),
    ...(environment.DAYTONA_TARGET?.trim()
      ? { target: environment.DAYTONA_TARGET.trim() }
      : {}),
  };
}

export function createNormalizedDaytonaClient() {
  const environment = process.env;
  const configuration = resolveDaytonaConfiguration(environment);
  const blankFallbacks = new Map(
    ["DAYTONA_ORGANIZATION_ID", "DAYTONA_TARGET"]
      .filter(
        (name) => environment[name] !== undefined && !environment[name]?.trim(),
      )
      .map((name) => [name, environment[name] as string]),
  );

  for (const name of blankFallbacks.keys()) delete environment[name];
  try {
    return { configuration, daytona: new Daytona(configuration) };
  } finally {
    for (const [name, value] of blankFallbacks) environment[name] = value;
  }
}

export function createDaytonaRuntime() {
  const { configuration, daytona } = createNormalizedDaytonaClient();
  const { apiUrl } = configuration;
  const credential =
    "apiKey" in configuration
      ? configuration.apiKey
      : "jwtToken" in configuration
        ? configuration.jwtToken
        : undefined;
  const organizationId =
    "organizationId" in configuration
      ? configuration.organizationId
      : undefined;
  const client: DaytonaLike = {
    create: daytona.create.bind(daytona) as DaytonaLike["create"],
    get: daytona.get.bind(daytona) as DaytonaLike["get"],
    delete: daytona.delete.bind(daytona) as DaytonaLike["delete"],
    async updateNetworkSettings(sandboxId, settings, signal) {
      if (!credential) throw new Error("Missing Daytona authentication configuration.");
      const response = await fetch(
        `${apiUrl}/sandbox/${encodeURIComponent(sandboxId)}/network-settings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credential}`,
            "Content-Type": "application/json",
            ...(organizationId
              ? { "X-Daytona-Organization-ID": organizationId }
              : {}),
          },
          body: JSON.stringify(settings),
          signal,
        },
      );
      if (!response.ok) throw new Error(await response.text());
    },
  };
  return new DaytonaSandboxRuntime(client, Date.now, (task) => after(task));
}
