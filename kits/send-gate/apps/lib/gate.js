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

const num = (s) => { const c = String(s).replace(/[₹$€£]|rs\.?|inr/gi, "").replace(/[,\s]/g, ""); return /^-?\d+(\.\d+)?$/.test(c) ? String(Number(c)) : null; };
const low = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const idk = (s) => String(s).toUpperCase().replace(/[\s\-_#:]/g, "");
const ph = (s) => { const d = String(s).replace(/\D/g, ""); return d.length > 10 ? d.slice(-10) : d; };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pj = (v, f) => { if (v == null) return f; if (typeof v === "string") { const t = v.trim(); if (!t) return f; try { return JSON.parse(t); } catch (e) { return f; } } return v; };
const path = (o, p) => p ? String(p).split(".").reduce((a, k) => (a == null ? undefined : a[k]), o) : undefined;
// Caller-supplied rules are untrusted: only literal `terms` are accepted (escaped, whole-word). Regex patterns stay server-defined.
const term = (t) => (/^\w/.test(t) ? "\\b" : "") + esc(t) + (/\w$/.test(t) ? "\\b" : "");
const ruleRe = (r, custom) => custom ? (Array.isArray(r.terms) && r.terms.length ? new RegExp("(?:" + r.terms.map(term).join("|") + ")", "i") : null) : r.re;
const pol = (p) => Object.assign({ formalAddress: true, allowUngroundedSmallCounts: true }, pj(p, {}) || {});

const M3 = "janfebmaraprmayjunjulaugsepoctnovdec";
const MON = M3.match(/.{3}/g).join("|");
/** One shape for every date form, so "2026-09-10", "10/09/2026" and "10 September 2026" all match. */
const dnorm = (s) => {
  const t = low(s), n = t.match(/\d+/g) || [], m = /[a-z]{3}/.exec(t), mo = m ? (M3.indexOf(m[0]) + 3) / 3 | 0 : 0;
  if (mo) return (n.find((x) => x.length === 4) || "") + "-" + mo + "-" + +(n.find((x) => x.length < 3) || 0);
  if (n.length !== 3) return t;
  const iso = n[0].length === 4;
  return (iso ? n[0] : n[2].length < 3 ? "20" + n[2] : n[2]) + "-" + +n[1] + "-" + +(iso ? n[2] : n[0]);
};
const FIG = [
  ["link", /https?:\/\/[^\s)>\]]+/gi, (t) => low(t.replace(/[.,;:!?]+$/, ""))],
  ["phone", /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, ph],
  ["date", new RegExp("\\b(\\d{1,4}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4}|\\d{1,2}\\s+(?:" + MON + ")[a-z]*(?:\\s+\\d{4})?|(?:" + MON + ")[a-z]*\\s+\\d{1,2}(?:,?\\s+\\d{4})?)\\b", "gi"), dnorm],
  ["identifier", /\b(?:[A-Z]{1,6}[-_ ]?\d{3,}|\d{3,}[-_]?[A-Z]{1,6}|[A-Z0-9]*\d[A-Z0-9]*-[A-Z0-9-]{3,})\b/g, idk],
  ["number", /(?:[₹$€£]\s?|\b(?:rs\.?|inr)\s?)?-?\d[\d,]*(?:\.\d+)?\s?(?:%|percent|lakh|lakhs|crore|k\b)?/gi, null],
];

/**
 * Statement rules: sentence-level assertions about the world, each with the fact
 * path that settles it. `expect` = accepted values (any non-empty value if omitted);
 * `never` = forbidden outright.
 */
export const DEFAULT_STATEMENT_RULES = [
  { id: "order_placed", kind: "order_status", re: /\b(order|po)\b[^.!?\n]{0,40}\b(placed|confirmed|booked|ho gaya|lag gaya)\b|\b(placed|confirmed|booked)\b[^.!?\n]{0,20}\border\b/i, factPath: "order.status", expect: ["placed", "confirmed", "booked"], message: "Order placed." },
  { id: "delivered", kind: "order_status", re: /\b(delivered|deliver ho gaya|pahu?nch gaya)\b/i, factPath: "order.status", expect: ["delivered"], message: "Delivered." },
  { id: "refund", kind: "refund", re: /\brefund(ed)?\b[^.!?\n]{0,30}\b(issued|processed|credited|done|sent|initiated|ho gaya|kar diya)\b/i, factPath: "refund.status", expect: ["issued", "processed", "credited", "initiated"], message: "Refund done." },
  { id: "offer", kind: "offer", re: /\b(discount|offer|cashback|voucher|coupon|off|free|muft|scheme)\b/i, factPath: "offers", message: "Offer." },
  { id: "eta", kind: "delivery_eta", re: /\b(within|in|by)\s+\d+\s*(min|hour|hr|day|ghant|din)|\b(aaj|today|tomorrow|kal|tonight|subah|shaam|morning|evening)\b[^.!?\n]{0,25}\b(deliver|pahunch|reach|aa jaa?yega)|\b(deliver|pahunch|reach)\w*\b[^.!?\n]{0,30}\b(aaj|today|tomorrow|kal|tonight|by\s+\w+)\b/i, factPath: "eta", message: "ETA promised." },
  { id: "payment", kind: "payment", re: /\b(payment|paisa|amount)\b[^.!?\n]{0,30}\b(received|mil gaya|aa gaya|credited|confirmed)\b/i, factPath: "payment.status", expect: ["received", "paid", "confirmed", "credited"], message: "Payment received." },
  { id: "guarantee", kind: "guarantee", re: /\b(guarantee|guaranteed|100%\s*(sure|pakka)|pakka\s*promise|zaroor milega)\b/i, never: true, message: "Guarantee." },
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
  const policy = pol(policyIn);
  const figs = figures(text);
  const off = new Set(policy.disableRules || []);
  const statements = [];
  const custom = Array.isArray(policy.statementRules) ? policy.statementRules : [];
  for (const r of DEFAULT_STATEMENT_RULES.concat(custom)) {
    if (!r || off.has(r.id)) continue;
    const re = ruleRe(r, custom.indexOf(r) >= 0), m = re ? text.match(re) : null;
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
  const N = new Map(), I = new Map(), P = new Map(), D = new Map(), L = new Map();
  const put = (m, k, p) => { if (k != null && !m.has(k)) m.set(k, p); };
  for (const [p, raw] of e) {
    put(N, num(raw), p);
    for (const x of raw.match(/-?\d[\d,]*(?:\.\d+)?/g) || []) put(N, num(x), p);
    if (/[A-Za-z]/.test(raw) && /\d/.test(raw) && raw.length <= 40) put(I, idk(raw), p);
    for (const x of raw.match(FIG[3][1]) || []) put(I, idk(x), p);
    for (const x of raw.match(FIG[2][1]) || []) put(D, dnorm(x), p);
    for (const x of raw.match(FIG[1][1]) || []) put(P, ph(x), p);
    for (const x of raw.match(FIG[0][1]) || []) put(L, FIG[0][2](x), p);
  }
  return { N, I, P, D, L };
}

const FMAP = { currency: "N", percent: "N", count: "N", identifier: "I", date: "D", link: "L", phone: "P" };
const ok = (actual, expect) => actual == null ? false : Array.isArray(actual) ? actual.length > 0 && (!expect || actual.some((a) => expect.map(low).includes(low(a)))) : typeof actual === "object" ? Object.keys(actual).length > 0 : expect ? expect.map(low).includes(low(actual)) : String(actual).trim().length > 0;

/** One verification per claim, each carrying an evidence class and the fact path that decided it. */
export function verifyClaims(claims, factsIn, recipientIn, policyIn, provenance) {
  const facts = pj(factsIn, {}) || {}, recipient = pj(recipientIn, {}) || {};
  const policy = pol(policyIn);
  const source = provenance || "facts", ix = index(facts, recipient, policy), v = [];
  const add = (claimId, kind, token, status, evidence, severity, message) => v.push({ claimId, kind, token, status, source, evidence: evidence || "", severity, message: message || "" });
  const F = (f, status, evidence, severity, message) => add(f.id, f.kind, f.token, status, evidence, severity, message);
  const S = (s, status, evidence, severity, message) => add(s.id, s.kind, s.text, status, evidence, severity, message);
  const V = "verified", C = "contradicted", U = "unsupported", nf = (t) => "\"" + t + "\" not in facts.";
  for (const f of claims.figures || []) {
    const k = f.kind, small = k === "count" && policy.allowUngroundedSmallCounts && /^\d$/.test(f.value);
    const mp = ix[FMAP[k]] || ix.N;
    // Evidence = the fact path the value was found at. Identifiers also answer to their digits alone
    // ("PO1430779" against 1430779); a date with no year matches any year ("10 Sep" against 2026-09-10).
    let ev = small ? "small" : mp.get(f.value);
    if (ev == null && k === "identifier") ev = ix.N.get(num(f.token.replace(/\D/g, "")));
    if (ev == null && k === "date" && f.value[0] === "-") for (const [t, p] of mp) if (t.endsWith(f.value)) { ev = p; break; }
    ev != null ? F(f, V, ev, "info")
      : k === "phone" ? F(f, C, "recipient.phone=" + (recipient.phone || null), "block", "Phone not the recipient's.")
      : F(f, U, "", "block", nf(f.token));
  }
  for (const s of claims.statements || []) {
    if (s.never) { S(s, C, "policy", "block", s.message); continue; }
    if (!s.factPath) { S(s, "unverifiable", "", "rewrite", s.message); continue; }
    const a = path(facts, s.factPath), ev = s.factPath + " = " + JSON.stringify(a === undefined ? null : a);
    ok(a, s.expect) ? S(s, V, ev, "info") : a == null || (Array.isArray(a) && !a.length) ? S(s, U, ev, "block", s.message + " Nothing at " + s.factPath) : S(s, C, ev, "block", s.message + " Facts: " + ev);
  }
  if (claims.register && claims.register.informalAddress) add("register", "register", "informal address", C, "policy.formalAddress", "rewrite", "Informal address; use \"aap\".");
  if (claims.register && claims.register.profanity) add("register", "register", "profanity", C, "policy", "block", "Abusive language.");
  const any = (sev) => v.some((x) => x.severity === sev);
  return { verifications: v, preVerdict: any("block") ? "block" : any("rewrite") ? "rewrite" : "allow" };
}

/** Fetched (source-of-truth) values override the drafter's facts; a drafter cannot launder an invented number by inventing facts too. */
export function mergeFacts(provided, fetched) {
  const obj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
  const a = pj(provided, {}) || {}, b = pj(fetched, null);
  if (!obj(b) || !Object.keys(b).length) return { facts: a, provenance: "facts" };
  const out = JSON.parse(JSON.stringify(a));
  // Keys that would reach Object.prototype are skipped: fetched JSON is untrusted.
  const deep = (t, s) => { for (const k of Object.keys(s)) if (!/^(__proto__|constructor|prototype)$/.test(k)) t[k] = obj(s[k]) && obj(t[k]) ? (deep(t[k], s[k]), t[k]) : s[k]; };
  deep(out, b);
  return { facts: out, provenance: "tool" };
}

/** Where the gate may fetch facts from: https only, no credentials, public host names only, and an allow-list when one is given. Pure. */
/** truth_url was asked for but could not be used: nothing counts as verified, so the draft blocks and no rewrite is accepted. */
export function failClosed(verification, error) {
  return { verifications: [{ claimId: "truth", kind: "truth_url", token: "", status: "unverifiable", source: "tool", evidence: error, severity: "block", message: "Source of truth unusable." }].concat(verification.verifications), preVerdict: "block" };
}

export function truthUrlProblem(url, hosts) {
  let u; try { u = new URL(String(url || "")); } catch (e) { return "truth_url: invalid URL"; }
  const h = u.hostname.toLowerCase(), a = (hosts || []).map(low).filter(Boolean);
  const why = u.protocol !== "https:" ? "https only" : u.username || u.password ? "no credentials" : /^\[|^\d+(\.\d+){3}$|^[^.]+$|\.(local|internal|localhost)$/.test(h) ? "public host only" : a.length && !a.some((x) => h === x || h.slice(-x.length - 1) === "." + x) ? "host not on allow-list" : "";
  return why ? "truth_url: " + why : null;
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
  const findings = (pre.findings || []).concat(claims.map((c, i) => ({ claimId: "judge" + (i + 1), kind: "semantic", token: c.claim, status: "unsupported", source: "judge", evidence: c.why || "", severity: hard.includes(c) ? "block" : "rewrite", message: c.why || "Unsupported claim." })));
  let finalMessage = null, rewriteCheck = null;
  if (verdict === "allow") finalMessage = String(input.draft);
  else {
    // No source of truth means nothing can be re-verified either: a rewrite is not accepted.
    const rw = (pre.findings || []).some((f) => f.kind === "truth_url") ? "" : typeof j.rewrite === "string" ? j.rewrite.trim() : "";
    if (rw) { rewriteCheck = checkDraft(Object.assign({}, input, { draft: rw })); if (rewriteCheck.preVerdict === "allow") { finalMessage = rw; verdict = "rewrite"; } else verdict = "block"; }
    else verdict = "block";
  }
  return { verdict, finalMessage, findings, counts: { block: findings.filter((f) => f.severity === "block").length, rewrite: findings.filter((f) => f.severity === "rewrite").length }, rewriteCheck: rewriteCheck ? { preVerdict: rewriteCheck.preVerdict, findings: rewriteCheck.findings } : null, judgeNotes: typeof j.notes === "string" ? j.notes : "" };
}

export const _internals = { figures, index, num, idk, ph };
