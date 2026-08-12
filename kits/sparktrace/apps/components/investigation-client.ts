import type { InvestigationEvent, RunInvestigationInput } from "../lib/contracts";

export interface StreamInvestigationOptions {
  signal?: AbortSignal;
  /** override the default NDJSON endpoint, e.g. for tests */
  endpoint?: string;
}

/**
 * Default (and currently only wired) transport for the UI: POSTs
 * RunInvestigationInput to a route handler and consumes a streaming NDJSON
 * response body — one InvestigationEvent JSON object per line.
 *
 * WHY a route handler instead of calling the `runInvestigation` server
 * action directly: an async generator returned from a "use server" action
 * does not reliably survive the server/client action-call boundary in
 * Next.js today (it gets awaited/serialized, not streamed). Fetch + a
 * ReadableStream body is the well-trodden way to stream progressive JSON
 * from an app-router server to a client component, so that's what this
 * module assumes. The contract it expects server-side is
 * `POST /api/investigate` (see apps/app/api/investigate/route.ts).
 *
 * This function is the ONLY place that knows the transport shape — swap it
 * for a direct server-action call later without touching any component.
 */
export async function* streamInvestigation(
  input: RunInvestigationInput,
  opts: StreamInvestigationOptions = {}
): AsyncGenerator<InvestigationEvent> {
  const endpoint = opts.endpoint ?? "/api/investigate";

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: opts.signal,
    });
  } catch (err) {
    // A caller-initiated abort is not a failure: cancellation is already
    // represented in the UI state ("cancelled"), so yielding an error here
    // would overwrite it. End the stream silently instead.
    if (opts.signal?.aborted) return;
    yield {
      type: "error",
      message: err instanceof Error ? `Failed to reach ${endpoint}: ${err.message}` : `Failed to reach ${endpoint}`,
    };
    return;
  }

  if (!res.ok || !res.body) {
    let message = `Investigation request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // keep the generic message
    }
    yield { type: "error", message };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        // Same rule as the fetch above: an abort mid-stream ends the
        // generator quietly; anything else is a real transport failure.
        if (opts.signal?.aborted) return;
        throw err;
      }
      const { value, done } = chunk;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) yield parseLine(line);
      }
    }
    const tail = buffer.trim();
    if (tail) yield parseLine(tail);
  } finally {
    reader.releaseLock();
  }
}

function parseLine(line: string): InvestigationEvent {
  try {
    return JSON.parse(line) as InvestigationEvent;
  } catch {
    return { type: "error", message: `Malformed event from server: ${line.slice(0, 200)}` };
  }
}
