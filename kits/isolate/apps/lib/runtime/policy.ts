const forbiddenCommandPatterns = [
  /(^|[;&|]\s*)sudo\b/i,
  /\brm\s+-[^\n]*r[^\n]*f\b/i,
  /\bgit\s+(?:push|fetch|pull|clone|remote\s+(?:add|set-url))\b/i,
  /\b(?:npm|bun|pnpm|yarn)\s+(?:publish|login|logout|adduser|whoami)\b/i,
  /\bcurl\b[^\n|]*\|\s*(?:ba)?sh\b/i,
  /\bwget\b[^\n|]*\|\s*(?:ba)?sh\b/i,
  /(^|[;&|]\s*)(?:env|printenv|set)(?:\s|$)/i,
  /(?:^|\s)(?:\.env|\.npmrc|\.git-credentials)(?:\s|$)/i,
  /(?:^|\s)(?:\/etc|\/proc|\/sys|\/root|\/home)(?:\/|\s|$)/i,
  /\b(?:ssh|scp|sftp|nc|netcat|socat)\b/i,
  /\$\(|`/,
];

const externalUrlPattern = /https?:\/\/(?!localhost(?::\d+)?(?:[\s/'"`]|$)|127\.0\.0\.1(?::\d+)?(?:[\s/'"`]|$)|\[::1\](?::\d+)?(?:[\s/'"`]|$))[^\s'"`]+/i;

/**
 * Raised when a proposed command violates the runtime command policy.
 */
export class UnsafeCommandError extends Error {
  constructor() {
    super("The probe violated Isolate's command policy.");
    this.name = "UnsafeCommandError";
  }
}

/**
 * Reject commands that escalate privileges, touch credentials or host paths, reach
 * the network, or use command substitution.
 *
 * @throws {UnsafeCommandError} when any forbidden pattern matches.
 */
export function assertSafeCommand(command: string) {
  if (
    forbiddenCommandPatterns.some((pattern) => pattern.test(command)) ||
    externalUrlPattern.test(command)
  ) {
    throw new UnsafeCommandError();
  }
  return command;
}

const boundedDelaySegment = /^sleep\s+\d+(?:\.\d+)?$/;
const runnerNames = new Set(["bun", "npm", "pnpm", "yarn"]);
const forbiddenRunnerOptions = new Set([
  "--config",
  "--cwd",
  "--dir",
  "--eval",
  "--globalconfig",
  "--import",
  "--loader",
  "--package",
  "--prefix",
  "--preload",
  "--require",
  "--userconfig",
  "-c",
  "-e",
  "-r",
]);
const forbiddenEnvironmentNames = /^(?:BUN_INSTALL|BUN_OPTIONS|HOME|INIT_CWD|LD_.*|DYLD_.*|NODE_OPTIONS|NODE_PATH|NPM_CONFIG_.*|PATH|PNPM_.*|PWD|YARN_.*)$/i;

/**
 * Split a command segment into shell tokens, keeping quoted spans intact.
 */
function shellTokens(segment: string) {
  return segment.match(/'(?:[^']*)'|"(?:\\.|[^"\\])*"|[^\s]+/g) ?? [];
}

/**
 * Strip one layer of matching single or double quotes from a token.
 */
function unquote(token: string) {
  if (
    token.length >= 2 &&
    ((token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith('"') && token.endsWith('"')))
  ) {
    return token.slice(1, -1);
  }
  return token;
}

/**
 * Whether a token points outside the cloned repository — an absolute path, a home
 * path, a parent traversal, a `file:` URL, or an assignment whose value does.
 */
function referencesOutsideRepository(token: string): boolean {
  const value = unquote(token);
  const assignedValue = value.includes("=") ? value.slice(value.indexOf("=") + 1) : "";
  return (
    value.startsWith("/") ||
    value.startsWith("~") ||
    /(^|\/)\.\.(?:\/|$)/.test(value) ||
    /^file:/i.test(value) ||
    (assignedValue !== "" && referencesOutsideRepository(assignedValue))
  );
}

/**
 * Whether a segment is a repository-owned package script invocation.
 *
 * Only `<runner> run|test <script>` is accepted, with the single exception of the
 * structured `bun run --cwd <relative-directory>` workspace form. Runner-level
 * options, loader and preload flags, and environment assignments that would change
 * module resolution are all rejected, because each is a way to execute code the
 * repository does not own.
 */
function isRepositoryRunnerSegment(segment: string) {
  const tokens = shellTokens(segment);
  let index = 0;
  while (index < tokens.length) {
    const assignment = tokens[index]?.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.+)$/);
    if (!assignment) break;
    if (
      forbiddenEnvironmentNames.test(assignment[1] ?? "") ||
      referencesOutsideRepository(assignment[2] ?? "")
    ) {
      return false;
    }
    index += 1;
  }

  const runner = tokens[index]?.toLowerCase();
  const verb = tokens[index + 1]?.toLowerCase();
  if (!runner || !runnerNames.has(runner) || !verb || !["run", "test"].includes(verb)) {
    return false;
  }
  let scriptIndex = index + 2;
  if (runner === "bun" && verb === "run" && unquote(tokens[scriptIndex] ?? "") === "--cwd") {
    const cwd = tokens[scriptIndex + 1];
    if (!cwd || unquote(cwd).startsWith("-") || referencesOutsideRepository(cwd)) {
      return false;
    }
    scriptIndex += 2;
  }

  const script = tokens[scriptIndex];
  if (
    verb === "run" &&
    (!script || unquote(script).startsWith("-") || referencesOutsideRepository(script))
  ) {
    return false;
  }

  const runnerArguments = tokens.slice(verb === "run" ? scriptIndex + 1 : index + 2);
  const separatorIndex = runnerArguments.findIndex(
    (token) => unquote(token) === "--",
  );
  if (verb === "run" && separatorIndex > 0) return false;
  const optionBoundary = separatorIndex === -1 ? runnerArguments.length : separatorIndex;
  if (
    runnerArguments
      .slice(0, optionBoundary)
      .some((token) => unquote(token).startsWith("-")) ||
    runnerArguments
      .slice(optionBoundary + 1)
      .some((token) => unquote(token) === "--")
  ) {
    return false;
  }

  return runnerArguments.every((token) => {
    const value = unquote(token);
    const option = value.split("=", 1)[0]?.toLowerCase() ?? "";
    return (
      !referencesOutsideRepository(token) &&
      !forbiddenRunnerOptions.has(option) &&
      !/^--(?:cwd|dir|prefix|preload|require|loader|import|config)=/i.test(value)
    );
  });
}

/**
 * Validate a certification command: safe, free of shell metacharacters, composed
 * only of repository-owned runner segments and bounded `sleep` delays, and — when a
 * signature is supplied — not containing the expected output itself.
 *
 * @throws {UnsafeCommandError} when any of those conditions fails.
 */
export function assertCertificationCommand(command: string, signature = "") {
  assertSafeCommand(command);
  const segments = command.split(/\s*(?:&&|&)\s*/).filter(Boolean);
  if (
    /[\r\n]/.test(command) ||
    /[$'"\\]/.test(command) ||
    /[{}*?\[\]]/.test(command) ||
    /[|;<>]/.test(command) ||
    /&\s*$/.test(command) ||
    !segments.some((segment) => isRepositoryRunnerSegment(segment)) ||
    segments.some(
      (segment) =>
        !isRepositoryRunnerSegment(segment) && !boundedDelaySegment.test(segment),
    ) ||
    (signature !== "" && command.toLowerCase().includes(signature.toLowerCase()))
  ) {
    throw new UnsafeCommandError();
  }
  return command;
}

const splitUtf8StreamProbePattern = /^\(printf '\\342'; sleep 0\.1; printf '\\202\\254\\n'\) \| (.+)$/;
const intactUtf8StreamProbePattern = /^printf '\\342\\202\\254\\n' \| (.+)$/;

/**
 * Validate an exploratory command, additionally allowing the two fixed `printf`
 * stdin-streaming shapes whose runner half must still pass certification policy.
 *
 * @throws {UnsafeCommandError} when neither form applies.
 */
export function assertExploratoryCommand(command: string) {
  try {
    return assertCertificationCommand(command);
  } catch (error) {
    if (!(error instanceof UnsafeCommandError)) throw error;
  }
  assertSafeCommand(command);
  const runner =
    command.match(splitUtf8StreamProbePattern)?.[1] ??
    command.match(intactUtf8StreamProbePattern)?.[1];
  if (!runner) throw new UnsafeCommandError();
  assertCertificationCommand(runner);
  return command;
}

/**
 * Rewrite `;` separators as `&&` so a failing setup step cannot be masked by a
 * later one that succeeds.
 */
export function normalizeCertificationCommand(command: string) {
  return command.replace(/\s*;\s*/g, " && ");
}
