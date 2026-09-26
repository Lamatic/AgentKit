import { headers } from "next/headers";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_TRACKED_CLIENTS = 5_000;
const ANONYMOUS_CLIENT = "anonymous";

interface ClientWindow {
  count: number;
  resetAt: number;
}

const windows = new Map<string, ClientWindow>();

function pruneExpired(now: number): void {
  for (const [client, window] of windows) {
    if (window.resetAt <= now) {
      windows.delete(client);
    }
  }
}

async function resolveClientKey(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const clientAddress = forwardedFor?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
  return clientAddress || ANONYMOUS_CLIENT;
}

/**
 * Fixed-window limiter that bounds how often a single client can trigger the
 * upstream Lamatic flow. State is per server instance, which is sufficient for
 * this kit; production deployments should back it with a shared store.
 */
export async function consumeAssessmentRequest(): Promise<boolean> {
  const now = Date.now();
  pruneExpired(now);

  if (windows.size >= MAX_TRACKED_CLIENTS) {
    return false;
  }

  const client = await resolveClientKey();
  const current = windows.get(client);

  if (!current || current.resetAt <= now) {
    windows.set(client, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  current.count += 1;
  return true;
}
