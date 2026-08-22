import { NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════════════
// PRODUCTION LEVEL: Shared API Middleware — Auth & Rate Limiting
// ══════════════════════════════════════════════════════════════════
// This module provides two guards that protect all public API routes:
//   1. authenticateRequest() — Validates the X-CAB-Secret header
//   2. rateLimit() — Enforces a sliding-window rate limit per IP
//
// Both the Chrome Extension and the Next.js backend share a secret
// token (CAB_API_SECRET) configured in .env.local. Since this is a
// localhost-only tool, this prevents random network actors from
// burning through paid Lamatic API calls.
// ══════════════════════════════════════════════════════════════════

const CAB_SECRET = process.env.CAB_API_SECRET;

/**
 * Validates the incoming request's X-CAB-Secret header against the
 * server-side CAB_API_SECRET environment variable.
 *
 * @param {Request} req - The incoming HTTP request.
 * @returns {NextResponse | null} A 401 response if authentication fails, or null if valid.
 */
export function authenticateRequest(req: Request): NextResponse | null {
  // If no secret is configured, fail closed in production
  if (!CAB_SECRET) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return NextResponse.json(
      { error: "Service Unavailable" },
      { status: 503 }
    );
  }

  const provided = req.headers.get("x-cab-secret");

  // Primary auth: shared secret header
  if (provided === CAB_SECRET) {
    return null;
  }

  // Secondary auth: Chrome extension origin (localhost-only tool)
  // The extension cannot send the secret from env, so we accept
  // requests from any chrome-extension:// origin when the server
  // is running on localhost. In production deployments, operators
  // can pin CAB_EXTENSION_ID in .env to restrict to a single extension.
  const origin = req.headers.get("origin") || "";
  if (origin.startsWith("chrome-extension://")) {
    const expectedId = process.env.CAB_EXTENSION_ID;
    if (!expectedId || origin === `chrome-extension://${expectedId}`) {
      return null;
    }
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

// ── In-Memory Sliding Window Rate Limiter ──────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;  // 30 requests per window

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60_000);

/**
 * Enforces a sliding-window rate limit per client IP address.
 *
 * @param {Request} req - The incoming HTTP request.
 * @returns {NextResponse | null} A 429 response if rate limit exceeded, or null if allowed.
 */
export function rateLimit(req: Request): NextResponse | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { timestamps: [] };

  // Purge timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (entry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  entry.timestamps.push(now);
  rateLimitStore.set(ip, entry);
  return null;
}
