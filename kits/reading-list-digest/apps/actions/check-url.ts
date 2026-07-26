"use server";

export type UrlReachabilityResult = {
  ok: boolean;
  finalUrl?: string;
  status: number | null;
  message?: string;
};

const CHECK_TIMEOUT_MS = 12_000;

/**
 * Live reachability check. Follows redirects; success only if final status is 200.
 * Tries HEAD first, then GET if HEAD is rejected/unsupported.
 */
export async function checkUrlReachability(
  url: string
): Promise<UrlReachabilityResult> {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return { ok: false, status: null, message: "Empty URL" };
  }

  try {
    new URL(trimmed);
  } catch {
    return { ok: false, status: null, message: "Invalid URL" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    let res = await fetch(trimmed, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "CaseCraft-UrlCheck/1.0" },
    });

    // Some hosts reject or mishandle HEAD — fall back to GET.
    if (res.status !== 200) {
      res = await fetch(trimmed, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "CaseCraft-UrlCheck/1.0" },
      });
    }

    const status = res.status;
    const finalUrl = res.url || trimmed;

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
    const msg = e instanceof Error ? e.message : String(e);
    if (/abort/i.test(msg)) {
      return {
        ok: false,
        status: null,
        message: "Timed out checking this URL",
      };
    }
    return {
      ok: false,
      status: null,
      message: msg || "Could not reach URL",
    };
  } finally {
    clearTimeout(timer);
  }
}
