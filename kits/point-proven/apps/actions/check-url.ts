"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent, fetch as undiciFetch, interceptors } from "undici";

export type UrlReachabilityResult = {
  ok: boolean;
  finalUrl?: string;
  status: number | null;
  message?: string;
};

type SafeUrl = {
  url: URL;
  /** Validated public address to pin at connect time (null = literal public IP URL). */
  pinnedAddress: string;
  family: 4 | 6;
};

const CHECK_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;
/** Statuses where HEAD is commonly unsupported/blocked — fall back to GET. */
const HEAD_FALLBACK_STATUSES = new Set([403, 405, 501]);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80:")) return true; // link-local
  // IPv4-mapped :ffff:x.x.x.x
  const mapped = normalized.match(/^:ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return true;
  }
  const bare = host.replace(/^\[|\]$/g, "");
  const version = isIP(bare);
  if (version === 4) return isPrivateIpv4(bare);
  if (version === 6) return isPrivateIpv6(bare);
  return false;
}

function isPrivateAddress(address: string, family: number): boolean {
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

/**
 * Validate scheme/host and resolve DNS once. Returns a public IP to pin so a
 * later rebinding cannot steer the socket to a private address.
 */
async function assertSafeUrl(raw: string): Promise<SafeUrl> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("Local or private network addresses are not allowed");
  }

  const bareHost = parsed.hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(bareHost);
  if (literalFamily === 4 || literalFamily === 6) {
    if (isPrivateAddress(bareHost, literalFamily)) {
      throw new Error("Local or private network addresses are not allowed");
    }
    return {
      url: parsed,
      pinnedAddress: bareHost,
      family: literalFamily,
    };
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(parsed.hostname, { all: true });
  } catch {
    throw new Error("Could not resolve hostname");
  }
  if (!addresses.length) {
    throw new Error("Could not resolve hostname");
  }

  const publicAddresses = addresses.filter(
    ({ address, family }) => !isPrivateAddress(address, family)
  );
  if (!publicAddresses.length) {
    throw new Error("Local or private network addresses are not allowed");
  }

  // Prefer IPv4 for broader host compatibility, then IPv6.
  const chosen =
    publicAddresses.find((a) => a.family === 4) ?? publicAddresses[0];

  return {
    url: parsed,
    pinnedAddress: chosen.address,
    family: chosen.family === 6 ? 6 : 4,
  };
}

function pinnedDispatcher(safe: SafeUrl) {
  const pinned = safe.pinnedAddress;
  const family = safe.family;
  return new Agent().compose(
    interceptors.dns({
      dualStack: false,
      affinity: family,
      maxTTL: 0,
      lookup(_origin, _options, callback) {
        callback(null, [{ address: pinned, family, ttl: 0 }]);
      },
    })
  );
}

async function fetchPinned(
  safe: SafeUrl,
  method: "HEAD" | "GET",
  signal: AbortSignal
): Promise<Response> {
  const dispatcher = pinnedDispatcher(safe);
  try {
    // undici Response is API-compatible here; cast across the DOM Response mismatch.
    return (await undiciFetch(safe.url.toString(), {
      method,
      redirect: "manual",
      signal,
      headers: { "User-Agent": "Point-Proven-UrlCheck/1.0" },
      dispatcher,
    })) as unknown as Response;
  } finally {
    await dispatcher.close().catch(() => undefined);
  }
}

async function fetchWithRedirectGuard(
  startUrl: string,
  method: "HEAD" | "GET",
  signal: AbortSignal
): Promise<Response> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = await assertSafeUrl(current);
    const res = await fetchPinned(safe, method, signal);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel().catch(() => undefined);
      if (!location) {
        return res;
      }
      current = new URL(location, current).toString();
      continue;
    }

    return res;
  }

  throw new Error("Too many redirects");
}

/**
 * Live reachability check. Follows redirects with per-hop SSRF validation and
 * DNS pinning; success only if final status is 200. Tries HEAD first, then GET
 * only when HEAD is unsupported/blocked (403/405/501).
 */
export async function checkUrlReachability(
  url: string
): Promise<UrlReachabilityResult> {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return { ok: false, status: null, message: "Empty URL" };
  }

  try {
    await assertSafeUrl(trimmed);
  } catch (e) {
    return {
      ok: false,
      status: null,
      message: e instanceof Error ? e.message : "Invalid URL",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    let res = await fetchWithRedirectGuard(trimmed, "HEAD", controller.signal);

    // Some hosts reject or mishandle HEAD — fall back to GET for those cases only.
    if (HEAD_FALLBACK_STATUSES.has(res.status)) {
      await res.body?.cancel().catch(() => undefined);
      res = await fetchWithRedirectGuard(trimmed, "GET", controller.signal);
    }

    const status = res.status;
    const finalUrl = res.url || trimmed;

    // Do not buffer article HTML — we only need the status line.
    await res.body?.cancel().catch(() => undefined);

    if (status === 200) {
      return { ok: true, finalUrl, status };
    }

    return {
      ok: false,
      finalUrl,
      status,
      message: `HTTP ${status} (expected 200)`,
    };
  } catch (e) {
    if (controller.signal.aborted) {
      return {
        ok: false,
        status: null,
        message: "Timed out checking this URL",
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: null,
      message: msg || "Could not reach URL",
    };
  } finally {
    clearTimeout(timer);
  }
}
