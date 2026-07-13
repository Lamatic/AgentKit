import assert from "node:assert/strict";
import test from "node:test";
import {
  clientTimeoutMs,
  maxInputCharacters,
  requestAudit,
  sourceLabel,
  validateAuditInputs
} from "../lib/ui-state.js";

test("UI input validation matches the server limits", () => {
  assert.equal(maxInputCharacters, 12000);
  assert.equal(validateAuditInputs("", ""), "Flow Brief is required.");
  assert.equal(
    validateAuditInputs("x".repeat(maxInputCharacters + 1), ""),
    `Keep each input under ${maxInputCharacters.toLocaleString("en-US")} characters.`
  );
  assert.equal(validateAuditInputs("A valid Flow brief", ""), "");
});

test("UI timeout leaves margin above the maximum server timeout", () => {
  assert.equal(clientTimeoutMs, 180000);
  assert.equal(clientTimeoutMs > 120000, true);
});

test("source labels do not misidentify unknown response sources as mock", () => {
  assert.equal(sourceLabel("lamatic"), "Lamatic");
  assert.equal(sourceLabel("preflight"), "Preflight");
  assert.equal(sourceLabel("mock"), "Local mock, not Lamatic");
  assert.equal(sourceLabel("future-source"), "Unknown");
});

test("requestAudit sends the expected request and returns a mock audit envelope", async () => {
  const audit = { launchDecision: "ready" };
  const controller = new AbortController();
  const body = await requestAudit("brief", "flow export", {
    signal: controller.signal,
    fetchImpl: async (url, options) => {
      assert.equal(url, "/api/audit");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), {
        flowBrief: "brief",
        optionalFlowExport: "flow export"
      });
      assert.equal(options.signal, controller.signal);
      return new Response(JSON.stringify({ source: "mock", audit }), { status: 200 });
    }
  });

  assert.deepEqual(body, { source: "mock", audit });
});

test("requestAudit exposes server errors and rejects missing audit payloads", async () => {
  await assert.rejects(
    () => requestAudit("brief", "", {
      fetchImpl: async () => new Response(JSON.stringify({ error: "Try later." }), { status: 503 })
    }),
    /Try later\./
  );

  await assert.rejects(
    () => requestAudit("brief", "", {
      fetchImpl: async () => new Response(JSON.stringify({ source: "mock" }), { status: 200 })
    }),
    /Check that the flow brief is plain text/
  );
});

test("requestAudit handles malformed non-JSON responses", async () => {
  await assert.rejects(
    () => requestAudit("brief", "", {
      fetchImpl: async () => new Response("gateway response", { status: 502 })
    }),
    /Check that the flow brief is plain text/
  );
});
