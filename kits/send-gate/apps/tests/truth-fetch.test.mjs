import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decide, extractClaims, failClosed, mergeFacts, verifyClaims } from "../lib/gate.js";
import { fetchTruth, readCapped, TRUTH_MAX_BYTES } from "../lib/truth-fetch.js";

const HOSTS = ["cdn.jsdelivr.net"]; // the default allow-list, and what codeNode_211 carries
const TRUTH = "https://cdn.jsdelivr.net/gh/example/truth@main/PO1430779.json";
const facts = { order: { po: "PO1430779", status: "pending", total: 8864, items: 10 }, offers: [], eta: null, links: ["https://app.badho.in/buyer/cart-screen/abc123"] };
const recipient = { name: "Aditya Kirana Store", phone: "919045576383" };
const draft = "Namaste! Aapka order PO1430779 (₹8,864, 10 items) abhi pending hai. Cart: https://app.badho.in/buyer/cart-screen/abc123";

/** Runs `fn` with `globalThis.fetch` replaced, and restores it afterwards. */
async function withFetch(impl, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = real; }
}
/** A body that never ends: proves the reader stops at the cap instead of buffering. */
function endless(chunk = 65536) {
  const state = { cancelled: false, pulls: 0 };
  const stream = new ReadableStream({ pull(c) { state.pulls++; c.enqueue(new Uint8Array(chunk)); }, cancel() { state.cancelled = true; } });
  return { stream, state };
}

// --- readCapped ---------------------------------------------------------------

test("readCapped: a small body is returned whole", async () => {
  assert.equal(await readCapped(new Response('{"a":1}'), TRUTH_MAX_BYTES), '{"a":1}');
});

test("readCapped: stops reading at the cap and cancels the stream instead of buffering the body", async () => {
  const { stream, state } = endless();
  await assert.rejects(readCapped(new Response(stream), TRUTH_MAX_BYTES), /body too large/);
  assert.equal(state.cancelled, true);
  assert.ok(state.pulls <= Math.ceil(TRUTH_MAX_BYTES / 65536) + 1, `read ${state.pulls} chunks`);
});

// --- fetchTruth ---------------------------------------------------------------

test("fetchTruth: a host off the allow-list is refused before any request is made", async () => {
  let called = false;
  const t = await withFetch(() => { called = true; }, () => fetchTruth("https://evil.example/truth.json", ["PO1"], HOSTS, ""));
  assert.match(t.error, /not allowed/);
  assert.equal(t.fetched, null);
  assert.equal(called, false);
});

test("fetchTruth: sends only the draft's identifiers in the query and the token in a header", async () => {
  let seen;
  const t = await withFetch((url, init) => { seen = { url, init }; return new Response('{"order":{"status":"pending"}}'); }, () => fetchTruth(TRUTH, ["PO1430779"], HOSTS, "secret"));
  assert.equal(t.error, "");
  assert.deepEqual(t.fetched, { order: { status: "pending" } });
  assert.equal(seen.url, TRUTH + "?ids=PO1430779");
  assert.equal(seen.init.headers.authorization, "Bearer secret");
  assert.equal(seen.init.redirect, "manual");
  assert.ok(!/recipient|secret/.test(seen.url));
});

test("fetchTruth: a secret that does not exist is never sent as a bearer token", async () => {
  // Studio leaves the reference unexpanded, or substitutes the text "undefined"; a public source
  // such as GitHub raw answers 404 to any bearer token, so neither may go out.
  for (const nonToken of ["{{secrets.project.TRUTH_TOKEN}}", "undefined", "null", "", null, undefined]) {
    let seen;
    await withFetch((url, init) => { seen = init; return new Response("{}"); }, () => fetchTruth(TRUTH, [], HOSTS, nonToken));
    assert.equal(seen.headers.authorization, undefined, `sent a token for ${JSON.stringify(nonToken)}`);
  }
  let seen;
  await withFetch((url, init) => { seen = init; return new Response("{}"); }, () => fetchTruth(TRUTH, [], HOSTS, "s3cret"));
  assert.equal(seen.headers.authorization, "Bearer s3cret");
});

test("fetchTruth: network failure, redirect, non-JSON and oversize bodies all report an error and fetch nothing", async () => {
  const cases = [
    [() => { throw new TypeError("fetch failed"); }, /fetch failed/],
    [() => new Response(null, { status: 302, headers: { location: "https://elsewhere.example/" } }), /HTTP 302/],
    [() => new Response("<html>oops</html>"), /Unexpected token|not valid JSON/],
    [() => new Response(endless().stream), /body too large/]
  ];
  for (const [impl, re] of cases) {
    const t = await withFetch(impl, () => fetchTruth(TRUTH, ["PO1430779"], HOSTS, ""));
    assert.equal(t.fetched, null);
    assert.match(t.error, /^truth_url: /);
    assert.match(t.error, re);
  }
});

// --- fail closed --------------------------------------------------------------

test("fail closed: matching caller facts and an unreachable allow-listed truth_url still block, and a clean rewrite is not accepted", async () => {
  const claims = extractClaims(draft);
  const t = await withFetch(() => { throw new TypeError("fetch failed"); }, () => fetchTruth(TRUTH, ["PO1430779"], HOSTS, ""));
  const merged = mergeFacts(facts, t.fetched);
  assert.equal(merged.provenance, "facts");
  const trusting = verifyClaims(claims, merged.facts, recipient);
  assert.equal(trusting.preVerdict, "allow"); // the caller's facts alone would have let it through
  const v = failClosed(trusting, t.error);
  assert.equal(v.preVerdict, "block");
  assert.equal(v.verifications[0].kind, "truth_url");
  assert.equal(v.verifications[0].evidence, t.error);
  const findings = v.verifications.filter((x) => x.severity !== "info");
  const d = decide({ draft, facts: merged.facts, recipient }, { preVerdict: v.preVerdict, findings }, { unsupported_claims: [], rewrite: "Namaste ji, order update jald bhejenge." });
  assert.equal(d.verdict, "block");
  assert.equal(d.finalMessage, null);
  assert.equal(d.counts.block, 1);
});

// --- the generated Code node ------------------------------------------------

const node211 = readFileSync(new URL("../../scripts/send-gate_code-node-211_code.ts", import.meta.url), "utf8");
/** Runs the emitted precheck node the way Studio does: template variable inlined, `output` collected. */
async function runPrecheck(trigger) {
  // The secret reference is left unexpanded on purpose: that is what Studio does when the secret is not defined.
  const code = node211.replace("{{triggerNode_1.output}}", JSON.stringify(trigger));
  assert.ok(code.includes("{{secrets.project.TRUTH_TOKEN}}"), "node 211 must reference the TRUTH_TOKEN project secret");
  return new Function("return (async () => { let output; " + code + "\nreturn output; })()")();
}
const trigger = { draft, facts: JSON.stringify(facts), recipient: JSON.stringify(recipient), policy: "", needs_fact_check: "", truth_url: TRUTH };

test("code node 211: an unreachable truth_url blocks even when the caller's facts match", async () => {
  const out = await withFetch(() => { throw new TypeError("fetch failed"); }, () => runPrecheck(trigger));
  assert.equal(out.needsFactCheck, true);
  assert.match(out.fetchError, /fetch failed/);
  assert.equal(out.provenance, "facts");
  assert.equal(out.preVerdict, "block");
  assert.equal(out.findings[0].kind, "truth_url");
  assert.ok(!/919045576383/.test(out.judgeInput), "judge input must not carry the recipient's phone");
});

test("code node 211: the truth_url body is read in bounded chunks", async () => {
  const { stream, state } = endless();
  const out = await withFetch(() => new Response(stream), () => runPrecheck(trigger));
  assert.match(out.fetchError, /body too large/);
  assert.equal(out.preVerdict, "block");
  assert.equal(state.cancelled, true);
});

test("code node 211: a good truth_url answer overrides the caller's facts (provenance tool); no token sent while the secret is undefined", async () => {
  let seen;
  const out = await withFetch((url, init) => { seen = init; return new Response(JSON.stringify({ order: { status: "placed", total: 9000 } })); }, () => runPrecheck(trigger));
  assert.equal(seen.headers.authorization, undefined);
  assert.equal(out.fetchError, "");
  assert.equal(out.provenance, "tool");
  assert.equal(out.facts.order.total, 9000);
  assert.equal(out.preVerdict, "block"); // ₹8,864 in the draft no longer matches the source of truth
});
