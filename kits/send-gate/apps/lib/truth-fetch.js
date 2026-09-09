// Fetches the caller's source of truth for the deterministic verifier. One implementation for the
// local runner and codeNode_211 (scripts/emit-code-node.mjs inlines this file), so the two cannot drift.
import { truthUrlProblem } from "./gate.js";

/** Bytes of truth_url body the gate will read. Longer bodies are rejected without being buffered. */
export const TRUTH_MAX_BYTES = 200000;

/** Reads at most `max` bytes of the body, chunk by chunk; cancels the stream and throws past the cap. */
export async function readCapped(res, max) {
  const rd = res.body.getReader(), parts = [];
  let n = 0;
  for (;;) {
    const { done, value } = await rd.read();
    if (done) return new Blob(parts).text();
    if ((n += value.length) > max) { rd.cancel(); throw new Error("body too large"); }
    parts.push(value);
  }
}

/**
 * Validates `url` (https, no credentials, allow-listed public host), then GETs it with the draft's
 * identifiers as `?ids=`: no redirects, 8 s timeout, bounded body. Returns { fetched, error };
 * a non-empty `error` means nothing usable came back and the gate must fail closed.
 */
export async function fetchTruth(url, ids, hosts, token) {
  const no = (error) => ({ fetched: null, error });
  const bad = truthUrlProblem(url, hosts);
  if (bad) return no(bad);
  const headers = { accept: "application/json" };
  // In the Code node the token is a Studio secret reference; if it is not defined the "{{...}}" text
  // stays unexpanded, and that must never be sent as a credential.
  if (token && token[0] !== "{") headers.authorization = "Bearer " + token;
  try {
    const res = await fetch(url + (url.includes("?") ? "&" : "?") + "ids=" + encodeURIComponent(ids.join(",")), { headers, redirect: "manual", signal: AbortSignal.timeout(8000) });
    if (!res.ok) { res.body && res.body.cancel(); return no("truth_url: HTTP " + res.status); }
    return { fetched: JSON.parse(await readCapped(res, TRUTH_MAX_BYTES)), error: "" };
  } catch (e) {
    return no("truth_url: " + (e && e.message || e));
  }
}
