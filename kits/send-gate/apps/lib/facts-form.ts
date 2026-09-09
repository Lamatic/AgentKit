// Field-based editing for facts, recipient and policy. The flow takes JSON text; the UI shows fields
// and converts both ways, so a reviewer never has to hand-edit JSON unless they want to.

export interface FactsForm {
  orderId: string;
  orderStatus: string;
  orderTotal: string;
  orderItems: string;
  eta: string;
  offers: string; // one per line or comma-separated: "MONSOON5 5%" or "MONSOON5"
  links: string; // one per line or comma-separated
  refundStatus: string;
  refundAmount: string;
  paymentStatus: string;
  extra: string; // JSON object for anything the fields do not cover
}

export interface RecipientForm {
  name: string;
  phone: string;
  email: string;
}

export interface PolicyForm {
  formalAddress: boolean;
  allowSmallCounts: boolean;
  alwaysCheck: boolean;
  disableRules: string[];
}

export const ORDER_STATUSES = ["", "pending", "placed", "confirmed", "booked", "dispatched", "delivered", "returned", "cancelled"];
export const REFUND_STATUSES = ["", "requested", "initiated", "processed", "issued", "credited", "rejected"];
export const PAYMENT_STATUSES = ["", "pending", "received", "paid", "confirmed", "credited", "failed"];
export const RULE_IDS = ["order_placed", "delivered", "refund", "offer", "eta", "payment", "guarantee"];

export const EMPTY_FACTS: FactsForm = { orderId: "", orderStatus: "", orderTotal: "", orderItems: "", eta: "", offers: "", links: "", refundStatus: "", refundAmount: "", paymentStatus: "", extra: "" };
export const EMPTY_RECIPIENT: RecipientForm = { name: "", phone: "", email: "" };
export const DEFAULT_POLICY: PolicyForm = { formalAddress: true, allowSmallCounts: true, alwaysCheck: false, disableRules: [] };

const list = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
const numOrText = (s: string): number | string => (/^-?\d+(\.\d+)?$/.test(s.trim()) ? Number(s.trim()) : s.trim());
const str = (v: unknown) => (v == null ? "" : String(v));
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export function parseJsonObject(text: string): Record<string, unknown> | null {
  const t = text.trim();
  if (!t) return {};
  try {
    const v = JSON.parse(t);
    return isObj(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Fields → facts object. Empty fields are omitted; `offers` is always present because "no offers" is itself a fact.
 * Returns null when the extra JSON is malformed: callers must not run the gate with those facts silently dropped.
 */
export function formToFacts(f: FactsForm): Record<string, unknown> | null {
  const extra = parseJsonObject(f.extra);
  if (extra === null) return null;
  const out: Record<string, unknown> = { ...extra };
  const order: Record<string, unknown> = {};
  if (f.orderId.trim()) order[/^po/i.test(f.orderId.trim()) ? "po" : "id"] = f.orderId.trim();
  if (f.orderStatus) order.status = f.orderStatus;
  if (f.orderTotal.trim()) order.total = numOrText(f.orderTotal);
  if (f.orderItems.trim()) order.items = numOrText(f.orderItems);
  if (Object.keys(order).length) out.order = { ...(isObj(out.order) ? out.order : {}), ...order };
  const offers = list(f.offers).map((o) => {
    const m = o.match(/^(\S+)\s+(\d+(?:\.\d+)?)\s*%?$/);
    return m ? { code: m[1], percent: Number(m[2]) } : { code: o };
  });
  // An empty Offers field keeps whatever the extra JSON supplied; `offers` is still always present.
  if (offers.length) out.offers = offers;
  else if (!Array.isArray(out.offers)) out.offers = [];
  if (f.eta.trim()) out.eta = f.eta.trim();
  else if (!("eta" in out)) out.eta = null;
  const links = list(f.links);
  if (links.length) out.links = links;
  const refund: Record<string, unknown> = {};
  if (f.refundStatus) refund.status = f.refundStatus;
  if (f.refundAmount.trim()) refund.amount = numOrText(f.refundAmount);
  if (Object.keys(refund).length) out.refund = { ...(isObj(out.refund) ? out.refund : {}), ...refund };
  if (f.paymentStatus) out.payment = { ...(isObj(out.payment) ? out.payment : {}), status: f.paymentStatus };
  return out;
}

/** Non-empty extra JSON that is not an object is an error the UI must show, never silently drop. */
export const extraJsonProblem = (f: FactsForm): string | null => (formToFacts(f) === null ? "The extra facts must be a JSON object." : null);

/** Facts object → fields. Anything the fields cannot hold goes to `extra` as JSON. */
export function factsToForm(input: unknown): FactsForm {
  const facts = isObj(input) ? { ...input } : {};
  const f: FactsForm = { ...EMPTY_FACTS };
  const order = isObj(facts.order) ? { ...facts.order } : null;
  if (order) {
    f.orderId = str(order.po ?? order.id);
    f.orderStatus = str(order.status);
    f.orderTotal = str(order.total);
    f.orderItems = str(order.items);
    delete order.po; delete order.id; delete order.status; delete order.total; delete order.items;
    if (Object.keys(order).length) facts.order = order; else delete facts.order;
  }
  if (Array.isArray(facts.offers)) {
    f.offers = facts.offers.map((o) => (isObj(o) ? `${str(o.code ?? o.name ?? o.id)}${o.percent != null ? ` ${o.percent}%` : ""}`.trim() : str(o))).join("\n");
    delete facts.offers;
  }
  if (typeof facts.eta === "string" || typeof facts.eta === "number") f.eta = str(facts.eta);
  if ("eta" in facts) delete facts.eta;
  if (Array.isArray(facts.links)) { f.links = facts.links.map(str).join("\n"); delete facts.links; }
  const refund = isObj(facts.refund) ? { ...facts.refund } : null;
  if (refund) {
    f.refundStatus = str(refund.status); f.refundAmount = str(refund.amount);
    delete refund.status; delete refund.amount;
    if (Object.keys(refund).length) facts.refund = refund; else delete facts.refund;
  }
  const payment = isObj(facts.payment) ? { ...facts.payment } : null;
  if (payment) {
    f.paymentStatus = str(payment.status); delete payment.status;
    if (Object.keys(payment).length) facts.payment = payment; else delete facts.payment;
  }
  f.extra = Object.keys(facts).length ? JSON.stringify(facts, null, 2) : "";
  return f;
}

export function formToRecipient(r: RecipientForm): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (r.name.trim()) out.name = r.name.trim();
  if (r.phone.trim()) out.phone = r.phone.trim();
  if (r.email.trim()) out.email = r.email.trim();
  return out;
}

export function recipientToForm(input: unknown): RecipientForm {
  const r = isObj(input) ? input : {};
  return { name: str(r.name), phone: str(r.phone), email: str(r.email) };
}

export function formToPolicy(p: PolicyForm): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!p.formalAddress) out.formalAddress = false;
  if (!p.allowSmallCounts) out.allowUngroundedSmallCounts = false;
  if (p.alwaysCheck) out.alwaysCheck = true;
  if (p.disableRules.length) out.disableRules = p.disableRules;
  return out;
}

export function policyToForm(input: unknown): PolicyForm {
  const p = isObj(input) ? input : {};
  return {
    formalAddress: p.formalAddress !== false,
    allowSmallCounts: p.allowUngroundedSmallCounts !== false,
    alwaysCheck: p.alwaysCheck === true,
    disableRules: Array.isArray(p.disableRules) ? p.disableRules.map(str) : []
  };
}

/** Text the flow receives: "" for an empty object, pretty JSON otherwise. */
export const toJsonText = (o: Record<string, unknown>) => (Object.keys(o).length ? JSON.stringify(o) : "");
