export type ValidateResult =
  | { ok: true; url: string }
  | { ok: false; error: string }
  | { ok: true; skipped: true };

export type UrlCandidate =
  | { raw: string; ok: true; url: string }
  | { raw: string; ok: false; error: string };

/** Trim and strip trailing slashes (path segments in the middle are kept). */
export function normalizeArticleUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * Split pasted/typed text into URL-sized tokens.
 * Accepts newlines, commas, and whitespace between URLs.
 */
export function splitUrlTokens(text: string): string[] {
  return text
    .replace(/,/g, "\n")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Validate a single article URL.
 * Blank → skipped.
 * Must be https:// with a dotted hostname (apex or www); trailing / are stripped.
 * Live reachability (+ SSRF checks) is enforced separately by checkUrlReachability.
 */
export function validateArticleUrl(raw: string): ValidateResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, skipped: true };
  }

  if (/\s/.test(trimmed)) {
    return { ok: false, error: "must not contain spaces" };
  }

  if (trimmed.toLowerCase().startsWith("http://")) {
    return { ok: false, error: "must use https:// (not http://)" };
  }
  if (!trimmed.toLowerCase().startsWith("https://")) {
    return { ok: false, error: "must start with https://" };
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
  if (!host.includes(".")) {
    return {
      ok: false,
      error: "hostname must include a domain (e.g. example.com)",
    };
  }

  return { ok: true, url: normalized };
}

/** Parse raw paste into per-token candidates (format only, no HTTP check). */
export function parseUrlCandidates(text: string): UrlCandidate[] {
  const tokens = splitUrlTokens(text);
  const out: UrlCandidate[] = [];

  for (const raw of tokens) {
    const result = validateArticleUrl(raw);
    if ("error" in result) {
      out.push({ raw, ok: false, error: result.error });
      continue;
    }
    if ("url" in result) {
      out.push({ raw, ok: true, url: result.url });
    }
  }

  return out;
}
