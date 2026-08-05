/**
 * Removes common credentials and secrets from workflow exports before
 * comparison or transmission to Lamatic.
 */

export interface RedactionResult {
  content: string;
  redactionCount: number;
  labels: string[];
}

const REDACTED = "[REDACTED]";

const PLACEHOLDER_PATTERNS = [
  /^your[_-]/i,
  /^example/i,
  /^sample/i,
  /^placeholder/i,
  /^changeme$/i,
  /^replace[_-]?me$/i,
  /^<[^>]+>$/,
  /^\$\{[^}]+\}$/,
  /^\{\{[^}]+\}\}$/,
];

function isPlaceholder(value: string): boolean {
  const normalized = value
    .trim()
    .replace(/^["']|["']$/g, "");

  return (
    normalized.length === 0 ||
    PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

export function redactSecrets(input: string): RedactionResult {
  let content = input;
  let redactionCount = 0;
  const labels = new Set<string>();

  function record(label: string): void {
    redactionCount += 1;
    labels.add(label);
  }

  // PEM-formatted private keys.
  content = content.replace(
    /-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----[\s\S]*?-----END(?: [A-Z0-9]+)? PRIVATE KEY-----/g,
    () => {
      record("private-key");
      return "[REDACTED PRIVATE KEY]";
    },
  );

  // Authorization headers.
  content = content.replace(
    /(\b(?:authorization|proxy-authorization)\s*[:=]\s*["']?Bearer\s+)([A-Za-z0-9._~+/=-]{12,})/gi,
    (match, prefix: string, value: string) => {
      if (isPlaceholder(value)) {
        return match;
      }

      record("bearer-token");
      return `${prefix}${REDACTED}`;
    },
  );

  // JSON, YAML and JavaScript-style quoted secret properties.
  content = content.replace(
    /((?:["']?)(?:api[_-]?key|access[_-]?key|secret(?:[_-]?key)?|token|password|passwd|pwd|client[_-]?secret|private[_-]?key|database[_-]?url|db[_-]?url|connection[_-]?string)(?:["']?)\s*[:=]\s*)(["'])([^"'\r\n]*)(["'])/gi,
    (
      match,
      prefix: string,
      openingQuote: string,
      value: string,
      closingQuote: string,
    ) => {
      if (isPlaceholder(value)) {
        return match;
      }

      record("credential-property");
      return `${prefix}${openingQuote}${REDACTED}${closingQuote}`;
    },
  );

  // Environment-variable assignments.
  content = content.replace(
    /^(\s*(?:export\s+)?[A-Z0-9_]*(?:API_KEY|ACCESS_KEY|SECRET|TOKEN|PASSWORD|PASSWD|PWD|CLIENT_SECRET|PRIVATE_KEY|DATABASE_URL|DB_URL|CONNECTION_STRING)[A-Z0-9_]*\s*=\s*)([^\r\n#]+)(.*)$/gim,
    (match, prefix: string, value: string, suffix: string) => {
      if (isPlaceholder(value)) {
        return match;
      }

      record("environment-secret");
      return `${prefix}${REDACTED}${suffix}`;
    },
  );

  // URLs containing embedded usernames/passwords.
  content = content.replace(
    /(https?:\/\/)([^/\s:@]+):([^@\s/]+)@/gi,
    (_match, protocol: string) => {
      record("url-credentials");
      return `${protocol}${REDACTED}:${REDACTED}@`;
    },
  );

  // Common provider token formats.
  const tokenRules: Array<{
    label: string;
    pattern: RegExp;
  }> = [
    {
      label: "aws-access-key",
      pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    },
    {
      label: "jwt",
      pattern:
        /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    },
    {
      label: "github-token",
      pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
    },
    {
      label: "slack-token",
      pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    },
    {
      label: "openai-style-key",
      pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    },
    {
      label: "google-api-key",
      pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    },
  ];

  for (const rule of tokenRules) {
    content = content.replace(rule.pattern, (match) => {
      if (isPlaceholder(match)) {
        return match;
      }

      record(rule.label);
      return REDACTED;
    });
  }

  return {
    content,
    redactionCount,
    labels: [...labels].sort(),
  };
}