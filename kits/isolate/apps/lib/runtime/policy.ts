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

const repositoryRunnerSegment =
  /^(?:[A-Za-z_][A-Za-z0-9_]*=[A-Za-z0-9_./:@%+,-]+\s+)*(?:bun|npm|pnpm|yarn)\s+(?:run|test)\b[^;&|<>]*$/i;
const boundedDelaySegment = /^sleep\s+\d+(?:\.\d+)?$/;

export function assertCertificationCommand(command: string, signature: string) {
  assertSafeCommand(command);
  const segments = command.split(/\s*(?:&&|&)\s*/).filter(Boolean);
  if (
    /[\r\n]/.test(command) ||
    /[&|;]\s*$/.test(command) ||
    !segments.some((segment) => repositoryRunnerSegment.test(segment)) ||
    segments.some(
      (segment) =>
        !repositoryRunnerSegment.test(segment) && !boundedDelaySegment.test(segment),
    ) ||
    command.toLowerCase().includes(signature.toLowerCase())
  ) {
    throw new UnsafeCommandError();
  }
  return command;
}
