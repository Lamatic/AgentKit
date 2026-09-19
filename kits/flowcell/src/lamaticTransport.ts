// Transport adapter: makes raw `lamaticClient.executeFlow` satisfy the
// resilient client's throw-on-failure `CallFlowFn` contract.
//
// Why it exists: the Lamatic SDK resolves flow-level failures as a success
// envelope — `{ status: "error", result: null, message, statusCode }` —
// instead of rejecting. Without this adapter the client would treat a failed
// flow as `path: "primary"` with the error as data, and the breaker would
// never trip. The adapter converts error envelopes into thrown errors
// (carrying `statusCode` as `httpStatus`, which the retry table classifies)
// and unwraps the `result` payload on success.

import type { CallFlowFn } from "./types";

export interface LamaticLikeClient {
  executeFlow(flowId: string, input: unknown): Promise<unknown>;
}

interface ErrorEnvelope {
  status: "error";
  message?: unknown;
  statusCode?: unknown;
}

function isErrorEnvelope(res: unknown): res is ErrorEnvelope {
  return (
    typeof res === "object" &&
    res !== null &&
    (res as Record<string, unknown>)["status"] === "error"
  );
}

export function lamaticTransport(client: LamaticLikeClient): CallFlowFn {
  return async <T>(flowId: string, input: unknown): Promise<T> => {
    const res = await client.executeFlow(flowId, input);
    if (isErrorEnvelope(res)) {
      const message =
        typeof res.message === "string" && res.message.length > 0
          ? res.message
          : "flow returned an error status";
      throw Object.assign(new Error(message), {
        httpStatus:
          typeof res.statusCode === "number" ? res.statusCode : undefined,
      });
    }
    if (typeof res === "object" && res !== null && "result" in res) {
      return (res as { result: T }).result;
    }
    return res as T;
  };
}
