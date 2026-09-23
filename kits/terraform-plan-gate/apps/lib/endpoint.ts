/**
 * The Lamatic endpoint receives the API key and the plan facts on every
 * request, so it must be HTTPS. Anything else is a configuration error, not a
 * warning: a plain-HTTP endpoint would send the key in clear text.
 */
export function assertHttpsEndpoint(url: string, name = "LAMATIC_API_URL"): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${name} is not a valid URL: ${JSON.stringify(url)}.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use https:// (got ${parsed.protocol}//). The API key is sent with every request.`);
  }
  // The canonical form, so the redirect guard below matches what the SDK sends.
  return parsed.href;
}

type FetchFn = typeof globalThis.fetch;
const pinned = new Set<string>();
let nativeFetch: FetchFn | null = null;

/**
 * lamatic@0.3.2 calls the global fetch with the runtime's default redirect
 * policy, so an HTTPS endpoint that answers with a redirect could forward the
 * API key to wherever it points. This pins `redirect: "error"` for requests
 * to the Lamatic endpoint only; every other URL keeps the default behaviour.
 * Safe to call more than once.
 */
export function pinRedirectPolicy(endpoint: string): void {
  const target = new URL(endpoint).href;
  if (pinned.has(target)) return;
  pinned.add(target);
  if (!nativeFetch) {
    nativeFetch = globalThis.fetch;
    const base = nativeFetch;
    globalThis.fetch = ((input: Parameters<FetchFn>[0], init?: Parameters<FetchFn>[1]) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const guarded = pinned.has(url) ? { ...init, redirect: "error" as const } : init;
      return base(input, guarded);
    }) as FetchFn;
  }
}
