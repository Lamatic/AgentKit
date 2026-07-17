/** Common TLDs for article / news sites. */
const ALLOWED_TLDS = new Set([
  "com",
  "ai",
  "org",
  "edu",
  "io",
  "net",
  "co",
  "gov",
  "uk",
  "eu",
  "info",
  "news",
  "us",
  "ca",
  "de",
  "fr",
  "au",
  "in",
]);

export type UrlIssue = {
  line: number;
  raw: string;
  message: string;
};

export type ValidateResult =
  | { ok: true; url: string }
  | { ok: true; url: null }
  | { ok: false; error: string };

/** Trim and strip trailing slashes (path segments in the middle are kept). */
export function normalizeArticleUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function hostnameHasAllowedTld(hostname: string): boolean {
  const labels = hostname.toLowerCase().split(".").filter(Boolean);
  if (labels.length < 2) return false;
  // Check last label, and last two for compound TLDs like .co.uk
  const last = labels[labels.length - 1];
  const secondLast = labels[labels.length - 2];
  if (ALLOWED_TLDS.has(last)) return true;
  if (ALLOWED_TLDS.has(`${secondLast}.${last}`)) return true;
  // e.g. example.co.uk → secondLast=co, last=uk both in set
  if (ALLOWED_TLDS.has(secondLast) && ALLOWED_TLDS.has(last) && labels.length >= 3) {
    return true;
  }
  return false;
}

/**
 * Validate a single article URL.
 * Blank → skipped (ok with url null).
 * Must be https://www.… with an allowed TLD; trailing / are stripped.
 */
export function validateArticleUrl(raw: string): ValidateResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, url: null };
  }

  if (/\s/.test(trimmed)) {
    return { ok: false, error: "must not contain spaces" };
  }

  if (!trimmed.toLowerCase().startsWith("https://www.")) {
    if (trimmed.toLowerCase().startsWith("http://")) {
      return { ok: false, error: "must use https:// (not http://)" };
    }
    if (
      trimmed.toLowerCase().startsWith("https://") &&
      !trimmed.toLowerCase().startsWith("https://www.")
    ) {
      return { ok: false, error: "hostname must start with www." };
    }
    return { ok: false, error: "must start with https://www." };
  }

  const normalized = normalizeArticleUrl(trimmed);

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, error: "is not a valid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "must use https://" };
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.startsWith("www.")) {
    return { ok: false, error: "hostname must start with www." };
  }

  if (!hostnameHasAllowedTld(host)) {
    return {
      ok: false,
      error:
        "hostname must end with a known TLD (.com, .ai, .org, .edu, .io, .net, …)",
    };
  }

  return { ok: true, url: normalized };
}

/**
 * Split textarea on newlines/commas, validate each non-empty entry.
 * Indexing should only proceed when `issues` is empty and `valid` is non-empty.
 */
export function parseAndValidateUrls(text: string): {
  valid: string[];
  issues: UrlIssue[];
} {
  const parts = text.split(/\n|,/);
  const valid: string[] = [];
  const issues: UrlIssue[] = [];

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    const line = i + 1;
    const result = validateArticleUrl(raw);

    if (result.ok && result.url === null) {
      continue;
    }
    if (!result.ok) {
      issues.push({ line, raw: raw.trim(), message: result.error });
      continue;
    }
    if (result.url) {
      valid.push(result.url);
    }
  }

  return { valid, issues };
}
