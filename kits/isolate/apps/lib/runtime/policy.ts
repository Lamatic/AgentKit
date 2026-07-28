const forbiddenCommandPatterns = [
  /(^|[;&|]\s*)sudo\b/i,
  /\brm\s+-[^\n]*r[^\n]*f\b/i,
  /\bgit\s+(?:push|fetch|pull|clone|remote\s+(?:add|set-url))\b/i,
  /\b(?:npm|bun|pnpm|yarn)\s+(?:publish|login|logout|adduser|whoami)\b/i,
  /\bcurl\b[^\n|]*\|\s*(?:ba)?sh\b/i,
  /\bwget\b[^\n|]*\|\s*(?:ba)?sh\b/i,
  /\b(?:env|printenv|set)\b/i,
  /(?:^|\s)(?:\.env|\.npmrc|\.git-credentials)(?:\s|$)/i,
  /(?:^|\s)(?:\/etc|\/proc|\/sys|\/root|\/home)(?:\/|\s|$)/i,
  /\b(?:ssh|scp|sftp|nc|netcat|socat)\b/i,
  /\$\(|`/,
];

const externalUrlPattern = /https?:\/\/(?!localhost(?::\d+)?(?:[\s/'"`]|$)|127\.0\.0\.1(?::\d+)?(?:[\s/'"`]|$)|\[::1\](?::\d+)?(?:[\s/'"`]|$))[^\s'"`]+/i;

export class UnsafeCommandError extends Error {
  constructor() {
    super("The probe violated Isolate's command policy.");
    this.name = "UnsafeCommandError";
  }
}

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

function shellTokens(segment: string) {
  return segment.match(/'(?:[^']*)'|"(?:\\.|[^"\\])*"|[^\s]+/g) ?? [];
}

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
