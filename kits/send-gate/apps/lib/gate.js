// send-gate — deterministic core.
//
// Three pure stages, one schema:
//   extractClaims(draft, policy)              -> Claims JSON (fixed shape, every draft)
//   verifyClaims(claims, facts, recipient, p) -> one Verification per claim, with an evidence class
//   decide(input, precheck, judge)            -> final verdict; re-verifies the judge's rewrite
//
// The Lamatic Code nodes in flows/send-gate.ts carry a minified copy of this file
// (apps/scripts/emit-code-node.mjs). Lamatic caps a Code node at ~10 KB of source,
// which is why this file is written tight: every byte here is paid for twice.
// Change it here, re-emit, re-paste. Rule: no model, no network in this file.

/** Evidence classes: what the gate can prove about a claim. */
export const STATUS = { VERIFIED: "verified", CONTRADICTED: "contradicted", UNSUPPORTED: "unsupported", UNVERIFIABLE: "unverifiable" };

const num = (s) => { const c = String(s).replace(/[₹$€£]|rs\.?|inr/gi, "").replace(/[,\s]/g, ""); if (!/^-?\d+(\.\d+)?$/.test(c)) return null; const n = Number(c); return isFinite(n) ? String(n) : null; };
const low = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const idk = (s) => String(s).toUpperCase().replace(/[\s\-_#:]/g, "");
const ph = (s) => { const d = String(s).replace(/\D/g, ""); return d.length > 10 ? d.slice(-10) : d; };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pj = (v, f) => { if (v == null) return f; if (typeof v === "string") { const t = v.trim(); if (!t) return f; try { return JSON.parse(t); } catch (e) { return f; } } return v; };
const path = (o, p) => p ? String(p).split(".").reduce((a, k) => (a == null ? undefined : a[k]), o) : undefined;

const MON = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
const FIG = [
  ["link", /https?:\/\/[^\s)>\]]+/gi, (t) => low(t.replace(/[.,;:!?]+$/, ""))],
  ["phone", /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, ph],
  ["date", new RegExp("\\b(\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4}|\\d{4}-\\d\\d-\\d\\d|\\d{1,2}\\s+(?:" + MON + ")[a-z]*(?:\\s+\\d{4})?|(?:" + MON + ")[a-z]*\\s+\\d{1,2}(?:,?\\s+\\d{4})?)\\b", "gi"), low],
  ["identifier", /\b(?:[A-Z]{1,6}[-_ ]?\d{3,}|\d{3,}[-_]?[A-Z]{1,6}|[A-Z0-9]*\d[A-Z0-9]*-[A-Z0-9-]{3,})\b/g, idk],
  ["number", /(?:[₹$€£]\s?|\b(?:rs\.?|inr)\s?)?-?\d[\d,]*(?:\.\d+)?\s?(?:%|percent|lakh|lakhs|crore|k\b)?/gi, null],
];

/**
 * Statement rules: sentence-level assertions about the world, each with the fact
 * path that settles it. `expect` = accepted values (any non-empty value if omitted);
 * `never` = forbidden outright.
 */
export const DEFAULT_STATEMENT_RULES = [
  { id: "order_placed", kind: "order_status", pattern: "\\b(order|po)\\b[^.!?\\n]{0,40}\\b(placed|confirmed|booked|ho gaya|lag gaya)\\b|\\b(placed|confirmed|booked)\\b[^.!?\\n]{0,20}\\border\\b", factPath: "order.status", expect: ["placed", "confirmed", "booked"], message: "Claims order placed." },
  { id: "delivered", kind: "order_status", pattern: "\\b(delivered|deliver ho gaya|pahu?nch gaya)\\b", factPath: "order.status", expect: ["delivered"], message: "Claims delivered." },
  { id: "refund", kind: "refund", pattern: "\\brefund(ed)?\\b[^.!?\\n]{0,30}\\b(issued|processed|credited|done|sent|initiated|ho gaya|kar diya)\\b", factPath: "refund.status", expect: ["issued", "processed", "credited", "initiated"], message: "Claims refund issued." },
  { id: "offer", kind: "offer", pattern: "\\b(discount|offer|cashback|voucher|coupon|off|free|muft|scheme)\\b", factPath: "offers", message: "Mentions an offer." },
  { id: "eta", kind: "delivery_eta", pattern: "\\b(within|in|by)\\s+\\d+\\s*(min|hour|hr|day|ghant|din)|\\b(aaj|today|tomorrow|kal|tonight|subah|shaam|morning|evening)\\b[^.!?\\n]{0,25}\\b(deliver|pahunch|reach|aa jaa?yega)|\\b(deliver|pahunch|reach)\\w*\\b[^.!?\\n]{0,30}\\b(aaj|today|tomorrow|kal|tonight|by\\s+\\w+)\\b", factPath: "eta", message: "Gives an ETA." },
  { id: "payment", kind: "payment", pattern: "\\b(payment|paisa|amount)\\b[^.!?\\n]{0,30}\\b(received|mil gaya|aa gaya|credited|confirmed)\\b", factPath: "payment.status", expect: ["received", "paid", "confirmed", "credited"], message: "Claims payment received." },
  { id: "guarantee", kind: "guarantee", pattern: "\\b(guarantee|guaranteed|100%\\s*(sure|pakka)|pakka\\s*promise|zaroor milega)\\b", never: true, message: "Guarantees an outcome." },
];
const INFORMAL = /\b(tu|tum|tera|teri|tere|tumhar[aei]|tujhe|tumhe|tumko)\b/i;
const ABUSE = /\b(bhenchod|madarchod|chutiya|bsdk|harami|kamina|saala|fuck|shit|bastard|idiot|stupid)\b/i;

function figures(text) {
  const out = [], taken = [];
  const free = (m) => { const s = m.index, e = s + m[0].length; for (const [a, b] of taken) if (s < b && e > a) return false; taken.push([s, e]); return true; };
  for (const [kind, re, norm] of FIG) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (!free(m)) continue;
      const tok = m[0].trim();
      if (kind !== "number") { out.push({ kind, token: kind === "link" ? tok.replace(/[.,;:!?]+$/, "") : tok, value: norm(tok) }); continue; }
      if (!/\d/.test(tok)) continue;
      const l = tok.toLowerCase();
      const mult = /lakh/.test(l) ? 1e5 : /crore/.test(l) ? 1e7 : /\dk$/.test(l.replace(/\s/g, "")) ? 1e3 : 1;
      const base = num(l.replace(/%|percent|lakhs?|crores?|k$/g, ""));
      if (base == null) continue;
      out.push({ kind: /[₹$€£]|rs\.?|inr/i.test(l) ? "currency" : /%|percent/.test(l) ? "percent" : "count", token: tok, value: String(Number(base) * mult) });
    }
  }
  return out.map((f, i) => Object.assign({ id: "f" + (i + 1) }, f));
}

/** Every draft becomes the same JSON shape: what gets logged, verified and asserted on. */
export function extractClaims(draft, policyIn) {
  const text = String(draft || "");
  const policy = Object.assign({ formalAddress: true, allowUngroundedSmallCounts: true }, pj(policyIn, {}) || {});
  const figs = figures(text);
  const off = new Set(policy.disableRules || []);
  const statements = [];
  for (const r of DEFAULT_STATEMENT_RULES.concat(policy.statementRules || [])) {
    if (off.has(r.id)) continue;
    let m; try { m = text.match(new RegExp(r.pattern, "i")); } catch (e) { continue; }
    if (m) statements.push({ id: "s" + (statements.length + 1), rule: r.id, kind: r.kind || "statement", text: m[0], factPath: r.factPath || null, expect: r.expect || null, never: !!r.never, message: r.message || "" });
  }
  const register = { informalAddress: !!(policy.formalAddress && INFORMAL.test(text)), profanity: ABUSE.test(text) };
  const material = figs.filter((f) => !(policy.allowUngroundedSmallCounts && f.kind === "count" && /^\d$/.test(f.value)));
  const risk = register.profanity || material.length || statements.length ? "high" : register.informalAddress ? "low" : "none";
  return { schemaVersion: "1", figures: figs, statements, register, risk, needsFactCheck: risk !== "none" || !!policy.alwaysCheck };
}

function flat(v, p, out) {
  if (v == null) return out;
  if (Array.isArray(v)) { v.forEach((x, i) => flat(x, p + "[" + i + "]", out)); return out; }
  if (typeof v === "object") { Object.keys(v).forEach((k) => flat(v[k], p ? p + "." + k : k, out)); return out; }
  out.push([p || "$", String(v)]);
  return out;
}

function index(facts, recipient, policy) {
  const e = flat(facts, "", []); flat(recipient, "recipient", e); flat(policy.allowedValues || [], "policy.allowedValues", e);
  const N = new Map(), I = new Map(), P = new Map(), T = new Map(), L = new Map();
  const put = (m, k, p) => { if (k != null && !m.has(k)) m.set(k, p); };
  for (const [p, raw] of e) {
    put(T, low(raw), p);
    put(N, num(raw), p);
    for (const x of raw.match(/-?\d[\d,]*(?:\.\d+)?/g) || []) put(N, num(x), p);
    if (/[A-Za-z]/.test(raw) && /\d/.test(raw) && raw.length <= 40) put(I, idk(raw), p);
    for (const x of raw.match(/\b[A-Z]{1,6}[-_ ]?\d{3,}\b/g) || []) put(I, idk(x), p);
    for (const x of raw.match(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g) || []) put(P, ph(x), p);
    for (const x of raw.match(/https?:\/\/[^\s)>\]]+/gi) || []) put(L, low(x.replace(/[.,;:!?]+$/, "")), p);
  }
  return { N, I, P, T, L, size: e.length };
}

const ok = (actual, expect) => actual == null ? false : Array.isArray(actual) ? actual.length > 0 && (!expect || actual.some((a) => expect.map(low).includes(low(a)))) : typeof actual === "object" ? Object.keys(actual).length > 0 : expect ? expect.map(low).includes(low(actual)) : String(actual).trim().length > 0;

/** One verification per claim, each carrying an evidence class and the fact path that decided it. */
export function verifyClaims(claims, factsIn, recipientIn, policyIn, provenance) {
  const facts = pj(factsIn, {}) || {}, recipient = pj(recipientIn, {}) || {};
  const policy = Object.assign({ formalAddress: true, allowUngroundedSmallCounts: true }, pj(policyIn, {}) || {});
  const source = provenance || "facts", ix = index(facts, recipient, policy), v = [];
  const add = (claimId, kind, token, status, evidence, severity, message) => v.push({ claimId, kind, token, status, source, evidence: evidence || "", severity, message: message || "" });
  const V = STATUS.VERIFIED, C = STATUS.CONTRADICTED, U = STATUS.UNSUPPORTED;
  for (const f of claims.figures || []) {
    const k = f.kind;
    if (k === "count" && policy.allowUngroundedSmallCounts && /^\d$/.test(f.value)) add(f.id, k, f.token, V, "small count", "info");
    else if (k === "currency" || k === "percent" || k === "count") ix.N.has(f.value) ? add(f.id, k, f.token, V, ix.N.get(f.value), "info") : add(f.id, k, f.token, U, "", "block", "\"" + f.token + "\" not in facts.");
    else if (k === "identifier") { const d = num(f.token.replace(/\D/g, "")); ix.I.has(f.value) ? add(f.id, k, f.token, V, ix.I.get(f.value), "info") : d && ix.N.has(d) ? add(f.id, k, f.token, V, ix.N.get(d), "info") : add(f.id, k, f.token, U, "", "block", "\"" + f.token + "\" not in facts."); }
    else if (k === "date") (ix.T.has(f.value) || [...ix.T.keys()].some((t) => t.includes(f.value))) ? add(f.id, k, f.token, V, "facts text", "info") : add(f.id, k, f.token, U, "", "block", "\"" + f.token + "\" not in facts.");
    else if (k === "link") ix.L.has(f.value) ? add(f.id, k, f.token, V, ix.L.get(f.value), "info") : add(f.id, k, f.token, U, "", "block", "Link not in facts.");
    else if (k === "phone") ix.P.has(f.value) ? add(f.id, k, f.token, V, ix.P.get(f.value), "info") : add(f.id, k, f.token, C, "recipient.phone=" + JSON.stringify(recipient.phone || null), "block", "Phone not the recipient's.");
  }
  for (const s of claims.statements || []) {
    if (s.never) { add(s.id, s.kind, s.text, C, "policy: forbidden", "block", s.message); continue; }
    if (!s.factPath) { add(s.id, s.kind, s.text, STATUS.UNVERIFIABLE, "", "rewrite", s.message); continue; }
    const a = path(facts, s.factPath), ev = s.factPath + " = " + JSON.stringify(a === undefined ? null : a);
    ok(a, s.expect) ? add(s.id, s.kind, s.text, V, ev, "info") : a == null || (Array.isArray(a) && !a.length) ? add(s.id, s.kind, s.text, U, ev, "block", s.message + " Nothing at " + s.factPath) : add(s.id, s.kind, s.text, C, ev, "block", s.message + " Facts: " + ev);
  }
  if (claims.register && claims.register.informalAddress) add("register", "register", "informal address", C, "policy.formalAddress", "rewrite", "Informal address; use \"aap\".");
  if (claims.register && claims.register.profanity) add("register", "register", "profanity", C, "policy", "block", "Abusive language.");
  const counts = { verified: 0, contradicted: 0, unsupported: 0, unverifiable: 0, block: 0, rewrite: 0 };
  for (const x of v) { counts[x.status]++; if (x.severity !== "info") counts[x.severity]++; }
  return { verifications: v, preVerdict: counts.block ? "block" : counts.rewrite ? "rewrite" : "allow", counts, factIndexSize: ix.size };
}

/** Fetched (source-of-truth) values override the drafter's facts; a drafter cannot launder an invented number by inventing facts too. */
export function mergeFacts(provided, fetched) {
  const a = pj(provided, {}) || {}, b = pj(fetched, null);
  if (!b || typeof b !== "object" || Array.isArray(b) || !Object.keys(b).length) return { facts: a, provenance: "facts" };
  const out = JSON.parse(JSON.stringify(a));
  const deep = (t, s) => { for (const k of Object.keys(s)) t[k] = s[k] && typeof s[k] === "object" && !Array.isArray(s[k]) && t[k] && typeof t[k] === "object" && !Array.isArray(t[k]) ? (deep(t[k], s[k]), t[k]) : s[k]; };
  deep(out, b);
  return { facts: out, provenance: "tool" };
}

/** Claims + verification in one call (app and tests). */
export function checkDraft(input) {
  const draft = String((input && input.draft) || "");
  const claims = extractClaims(draft, input && input.policy);
  claims.draft = draft;
  const r = verifyClaims(claims, input && input.facts, input && input.recipient, input && input.policy, input && input.provenance);
  return Object.assign({ claims, findings: r.verifications.filter((x) => x.severity !== "info") }, r);
}

/** Final decision. The gate never trusts its own rewrite: the rewrite is re-verified and blocked if it fails. */
export function decide(input, pre, judgeIn) {
  const j = pj(judgeIn, {}) || {};
  const claims = Array.isArray(j.unsupported_claims) ? j.unsupported_claims : [];
  const hard = claims.filter((c) => c && String(c.severity || "").toLowerCase() === "block");
  let verdict = pre.preVerdict;
  if (hard.length) verdict = "block"; else if (verdict === "allow" && claims.length) verdict = "rewrite";
  const findings = (pre.findings || []).concat(claims.map((c, i) => ({ claimId: "judge" + (i + 1), kind: "semantic", token: c.claim, status: STATUS.UNSUPPORTED, source: "judge", evidence: c.why || "", severity: hard.includes(c) ? "block" : "rewrite", message: c.why || "Unsupported claim." })));
  let finalMessage = null, rewriteCheck = null;
  if (verdict === "allow") finalMessage = String(input.draft);
  else {
    const rw = typeof j.rewrite === "string" ? j.rewrite.trim() : "";
    if (rw) { rewriteCheck = checkDraft(Object.assign({}, input, { draft: rw })); if (rewriteCheck.preVerdict === "allow") { finalMessage = rw; verdict = "rewrite"; } else verdict = "block"; }
    else verdict = "block";
  }
  return { verdict, finalMessage, findings, counts: { block: findings.filter((f) => f.severity === "block").length, rewrite: findings.filter((f) => f.severity === "rewrite").length }, rewriteCheck: rewriteCheck ? { preVerdict: rewriteCheck.preVerdict, findings: rewriteCheck.findings } : null, judgeNotes: typeof j.notes === "string" ? j.notes : "" };
}

export const _internals = { figures, index, num, idk, ph };
