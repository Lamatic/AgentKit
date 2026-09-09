import test from "node:test";
import assert from "node:assert/strict";
import { checkDraft, decide, extractClaims, mergeFacts, STATUS, truthUrlProblem, _internals } from "../lib/gate.js";

const facts = {
  order: { po: "PO1430779", status: "pending", total: 8864, items: 10, seller: "Hoppin Distributors" },
  offers: [],
  eta: null,
  buyer: { name: "Aditya Kirana Store", phone: "919045576383" },
  links: ["https://app.badho.in/buyer/cart-screen/abc123"],
};
const recipient = { name: "Aditya Kirana Store", phone: "919045576383" };
const ids = (r) => r.findings.map((f) => f.claimId + ":" + f.status);
const has = (r, kind, status) => r.verifications.some((v) => v.kind === kind && v.status === status);

// --- Stage 1: Claims JSON -----------------------------------------------------

test("claims JSON has a fixed shape for every draft", () => {
  const c = extractClaims("Namaste ji!");
  assert.deepEqual(Object.keys(c).sort(), ["figures", "needsFactCheck", "register", "risk", "schemaVersion", "statements"]);
  assert.equal(c.risk, "none");
  assert.equal(c.needsFactCheck, false);
});

test("greeting with no claims does not need a fact check (fast path)", () => {
  const c = extractClaims("Namaste! Kuch madad chahiye toh batayein.");
  assert.equal(c.risk, "none");
  assert.equal(c.figures.length, 0);
  assert.equal(c.statements.length, 0);
});

test("policy.alwaysCheck forces the gate even for chit-chat", () => {
  assert.equal(extractClaims("Thanks!", { alwaysCheck: true }).needsFactCheck, true);
});

test("figures are typed: currency, percent, count, identifier, phone, date, link", () => {
  const c = extractClaims("Pay ₹1,200 (10% off) for PO1430779 by 8 Sep, 3 items, call 9045576383, see https://x.y/z");
  const kinds = c.figures.map((f) => f.kind + "=" + f.token);
  assert.deepEqual(kinds, ["link=https://x.y/z", "phone=9045576383", "date=8 Sep", "identifier=PO1430779", "currency=₹1,200", "percent=10%", "count=3"]);
  assert.equal(c.figures.find((f) => f.kind === "currency").value, "1200");
  assert.equal(c.risk, "high");
});

test("statements are detected with the fact path that settles them", () => {
  const c = extractClaims("Aapka order place ho gaya hai aur kal deliver ho jayega, 100% guaranteed.");
  const rules = c.statements.map((s) => s.rule);
  assert.ok(rules.includes("order_placed"), rules.join());
  assert.ok(rules.includes("eta"), rules.join());
  assert.ok(rules.includes("guarantee"), rules.join());
});

test("informal address alone is low risk but still needs a check", () => {
  const c = extractClaims("Tera kaam ho jayega bhai.");
  assert.equal(c.register.informalAddress, true);
  assert.equal(c.risk, "low");
  assert.equal(c.needsFactCheck, true);
});

// --- Stage 2: verification with evidence classes ------------------------------

test("grounded draft: everything verified, verdict allow", () => {
  const r = checkDraft({ draft: "Namaste! Aapka order PO1430779 (₹8,864, 10 items) abhi pending hai. Cart: https://app.badho.in/buyer/cart-screen/abc123", facts, recipient });
  assert.equal(r.preVerdict, "allow", JSON.stringify(r.findings));
  assert.ok(r.verifications.every((v) => v.status === STATUS.VERIFIED));
});

test("invented discount and amount are unsupported -> block", () => {
  const r = checkDraft({ draft: "Aapke liye special 20% discount hai, total sirf ₹7,091!", facts, recipient });
  assert.equal(r.preVerdict, "block");
  assert.ok(has(r, "percent", STATUS.UNSUPPORTED));
  assert.ok(has(r, "currency", STATUS.UNSUPPORTED));
  assert.ok(has(r, "offer", STATUS.UNSUPPORTED));
});

test("order placed against status=pending is CONTRADICTED, not merely unsupported", () => {
  const r = checkDraft({ draft: "Aapka order place ho gaya hai, dhanyavaad!", facts, recipient });
  const v = r.verifications.find((x) => x.kind === "order_status");
  assert.equal(v.status, STATUS.CONTRADICTED);
  assert.match(v.evidence, /order\.status = "pending"/);
  const ok = checkDraft({ draft: "Aapka order place ho gaya hai, dhanyavaad!", facts: { ...facts, order: { ...facts.order, status: "placed" } }, recipient });
  assert.equal(ok.verifications.find((x) => x.kind === "order_status").status, STATUS.VERIFIED);
});

test("guarantee is contradicted by policy; ETA without a fact is unsupported", () => {
  const r = checkDraft({ draft: "100% pakka delivery guaranteed by tomorrow.", facts, recipient });
  assert.ok(has(r, "guarantee", STATUS.CONTRADICTED));
  assert.ok(has(r, "delivery_eta", STATUS.UNSUPPORTED));
});

test("foreign phone is contradicted, unknown link unsupported; recipient phone and known link pass", () => {
  const bad = checkDraft({ draft: "Call 9876543210 or open https://evil.example.com/pay", facts, recipient });
  assert.ok(has(bad, "phone", STATUS.CONTRADICTED));
  assert.ok(has(bad, "link", STATUS.UNSUPPORTED));
  const good = checkDraft({ draft: "Aap 9045576383 par confirm karein: https://app.badho.in/buyer/cart-screen/abc123", facts, recipient });
  assert.equal(good.preVerdict, "allow", JSON.stringify(good.findings));
});

test("the same date in another form is still the same date", () => {
  // The draft and the facts rarely agree on formatting; only a genuinely different date may block.
  const day = { eta: "2026-09-10" };
  for (const written of ["10 Sep 2026", "10 September 2026", "Sep 10, 2026", "10/09/2026", "2026-09-10", "10 Sep"]) {
    const r = checkDraft({ draft: `Delivery ${written} ko ho jayegi.`, facts: day, recipient });
    assert.equal(r.preVerdict, "allow", `${written}: ` + JSON.stringify(r.findings));
  }
  // and the other way round: facts in words, draft in ISO
  assert.equal(checkDraft({ draft: "Delivery 2026-09-10 ko.", facts: { eta: "10 Sep 2026" }, recipient }).preVerdict, "allow");
  for (const wrong of ["11 Sep 2026", "10 Oct 2026", "10 Sep 2027", "2026-10-09"]) {
    const r = checkDraft({ draft: `Delivery ${wrong} ko ho jayegi.`, facts: day, recipient });
    assert.equal(r.preVerdict, "block", `${wrong} should not pass`);
    assert.ok(has(r, "date", STATUS.UNSUPPORTED));
  }
});

test("dates must be in the facts", () => {
  assert.ok(has(checkDraft({ draft: "Delivery on 12/09/2026.", facts, recipient }), "date", STATUS.UNSUPPORTED));
  assert.ok(has(checkDraft({ draft: "Delivery on 12/09/2026.", facts: { ...facts, eta: "12/09/2026" }, recipient }), "date", STATUS.VERIFIED));
});

test("facts and recipient may arrive as JSON strings (Studio trigger shape)", () => {
  const r = checkDraft({ draft: "Total ₹8864 for PO1430779.", facts: JSON.stringify(facts), recipient: JSON.stringify(recipient) });
  assert.equal(r.preVerdict, "allow", JSON.stringify(r.findings));
});

test("small counts are tolerated, currency is not", () => {
  const r = checkDraft({ draft: "2 cheezein pending hain, ₹5 extra lagega.", facts, recipient });
  assert.deepEqual(r.findings.map((f) => f.token), ["₹5"]);
});

test("policy can add a statement rule and disable a default", () => {
  const policy = { disableRules: ["offer"], statementRules: [{ id: "credit_limit", kind: "credit", terms: ["credit limit"], factPath: "buyer.creditLimit", message: "no credit info" }] };
  const r = checkDraft({ draft: "Aapka credit limit badh gaya hai, saath mein discount bhi.", facts, recipient, policy });
  assert.ok(r.verifications.some((v) => v.kind === "credit" && v.status === STATUS.UNSUPPORTED));
  assert.ok(!r.verifications.some((v) => v.kind === "offer"));
});

// --- Source-of-truth merge ----------------------------------------------------

test("fetched facts override the drafter's facts and mark provenance", () => {
  const provided = { order: { po: "PO1430779", status: "placed", total: 9000 } };
  const fetched = { order: { status: "pending", total: 8864 } };
  const m = mergeFacts(provided, fetched);
  assert.equal(m.provenance, "tool");
  assert.equal(m.facts.order.status, "pending");
  assert.equal(m.facts.order.total, 8864);
  assert.equal(m.facts.order.po, "PO1430779");
  const r = checkDraft({ draft: "Order PO1430779 placed, total ₹9,000.", facts: m.facts, recipient, provenance: m.provenance });
  assert.equal(r.preVerdict, "block");
  assert.ok(r.verifications.every((v) => v.source === "tool"));
});

test("empty or invalid fetch keeps the provided facts", () => {
  assert.equal(mergeFacts({ a: 1 }, "not json").provenance, "facts");
  assert.equal(mergeFacts({ a: 1 }, {}).provenance, "facts");
});

// --- Stage 3: decide ----------------------------------------------------------

test("decide: allow passes the draft through untouched", () => {
  const input = { draft: "Aapka order PO1430779 pending hai.", facts, recipient };
  const d = decide(input, checkDraft(input), { unsupported_claims: [], rewrite: "" });
  assert.equal(d.verdict, "allow");
  assert.equal(d.finalMessage, input.draft);
});

test("decide: judge block + grounded rewrite becomes rewrite", () => {
  const input = { draft: "Aapka order kal subah pahunch jayega.", facts, recipient };
  const d = decide(input, checkDraft(input), { unsupported_claims: [{ claim: "delivery tomorrow morning", why: "no ETA in facts", severity: "block" }], rewrite: "Aapka order PO1430779 abhi pending hai; delivery ka time confirm hote hi batayenge." });
  assert.equal(d.verdict, "rewrite");
  assert.ok(d.finalMessage.includes("PO1430779"));
});

test("decide: a clean pre-check + judge block claim + grounded rewrite downgrades block to rewrite", () => {
  // The pre-check allows this draft (nothing the rules can see), so the block comes from the judge alone.
  const input = { draft: "Aapka order PO1430779 pending hai; hum ise priority par bhej denge.", facts, recipient };
  const pre = checkDraft(input);
  assert.equal(pre.preVerdict, "allow");
  const d = decide(input, pre, { unsupported_claims: [{ claim: "hum ise priority par bhej denge", why: "no priority commitment in facts", severity: "block" }], rewrite: "Aapka order PO1430779 abhi pending hai." });
  assert.equal(d.verdict, "rewrite");
  assert.equal(d.finalMessage, "Aapka order PO1430779 abhi pending hai.");
  assert.equal(d.rewriteCheck.preVerdict, "allow");
  assert.equal(d.counts.block, 1);
});

test("decide: judge block claim with a rewrite that fails re-verification stays blocked", () => {
  const input = { draft: "Aapka order PO1430779 pending hai; hum ise priority par bhej denge.", facts, recipient };
  const d = decide(input, checkDraft(input), { unsupported_claims: [{ claim: "priority", why: "not in facts", severity: "block" }], rewrite: "Aapka order kal subah ₹9,000 mein pahunch jayega." });
  assert.equal(d.verdict, "block");
  assert.equal(d.finalMessage, null);
});

test("decide: a rewrite that still invents a number is blocked", () => {
  const input = { draft: "Aapka order kal pahunch jayega.", facts, recipient };
  const d = decide(input, checkDraft(input), { unsupported_claims: [], rewrite: "Aapka order 2 ghante mein ₹9,000 ke saath pahunch jayega." });
  assert.equal(d.verdict, "block");
  assert.equal(d.finalMessage, null);
  assert.equal(d.rewriteCheck.preVerdict, "block");
});

test("decide: judge output as a string is parsed", () => {
  const input = { draft: "Aapka order PO1430779 pending hai.", facts, recipient };
  const d = decide(input, checkDraft(input), JSON.stringify({ unsupported_claims: [], rewrite: "" }));
  assert.equal(d.verdict, "allow");
});

test("internals: number normalisation", () => {
  assert.equal(_internals.num("₹1,200.00"), "1200");
  assert.equal(_internals.num("Rs. 05"), "5");
  assert.equal(_internals.num("abc"), null);
});

// --- Untrusted inputs: truth_url and caller-supplied rules ----------------------

test("truthUrlProblem: https, public host, allow-list, no credentials", () => {
  assert.equal(truthUrlProblem("https://raw.githubusercontent.com/x/y/z.json", ["raw.githubusercontent.com"]), null);
  assert.equal(truthUrlProblem("https://api.raw.githubusercontent.com/z", ["raw.githubusercontent.com"]), null);
  assert.match(truthUrlProblem("http://raw.githubusercontent.com/z", []), /https/);
  assert.match(truthUrlProblem("https://user:pw@raw.githubusercontent.com/z", []), /credentials/);
  assert.match(truthUrlProblem("https://localhost:3000/api/truth", []), /public host/);
  assert.match(truthUrlProblem("https://169.254.169.254/latest/meta-data", []), /public host/);
  assert.match(truthUrlProblem("https://[::1]/x", []), /public host/);
  assert.match(truthUrlProblem("https://orders.internal/x", []), /public host/);
  assert.match(truthUrlProblem("https://evil.example.com/z", ["raw.githubusercontent.com"]), /allow-list/);
  assert.match(truthUrlProblem("not a url", []), /valid URL/);
});

test("custom statement rules: only literal terms are honoured, escaped; caller regex patterns are ignored", () => {
  const policy = { statementRules: [
    { id: "bonus", kind: "offer", terms: ["free gift", "muft (tohfa)"], factPath: "offers", message: "Mentions a gift." },
    { id: "evil", kind: "x", pattern: "(a+)+$", factPath: "x", message: "ReDoS" },
    { id: "plain", kind: "custom", pattern: "\\bexpress delivery\\b", factPath: "eta", message: "Regex from a caller is ignored." }
  ] };
  const c = extractClaims("Aapko muft (tohfa) milega, express delivery ke saath! aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!", policy);
  const rules = c.statements.map((s) => s.rule);
  assert.ok(rules.includes("bonus"));
  assert.ok(!rules.includes("plain"), "caller regex patterns are not honoured");
  assert.ok(!rules.includes("evil"));
});
