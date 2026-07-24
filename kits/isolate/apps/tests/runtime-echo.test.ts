import { describe, expect, test } from "bun:test";

import { handleEcho } from "../lib/runtime/echo";

const secret = "test-runtime-secret";

function request(body: unknown, authorization?: string) {
  return new Request("https://isolate.example/api/runtime/echo", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/runtime/echo", () => {
  test("rejects requests without the runtime bearer secret", async () => {
    const response = await handleEcho(request({ message: "hello" }), secret);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "unauthorized",
        message: "Valid runtime authorization is required.",
      },
    });
  });

  test("returns a structured trace for an authenticated call", async () => {
    const response = await handleEcho(
      request({ message: "prove the tool path" }, `Bearer ${secret}`),
      secret,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      tool: "echo",
      input: { message: "prove the tool path" },
    });
    expect(body.traceId).toMatch(/^spike_[a-f0-9-]{36}$/);
    expect(new Date(body.observedAt).toISOString()).toBe(body.observedAt);
  });
});
