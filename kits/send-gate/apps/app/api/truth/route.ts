import { NextResponse } from "next/server";

/**
 * Stand-in for a real source of truth (order management system, CRM, ticketing).
 * send-gate calls `truth_url?ids=<identifiers in the draft>` (nothing else in the query) and deep-merges
 * whatever comes back over the drafter's facts, so a drafter cannot launder an invented number
 * by inventing matching facts. If the call fails the draft is blocked. Replace this with your own endpoint; keep the shape.
 */
const ORDERS: Record<string, Record<string, unknown>> = {
  PO1430779: {
    order: { po: "PO1430779", status: "pending", total: 8864, items: 10, seller: "Hoppin Distributors" },
    offers: [],
    eta: null,
    buyer: { name: "Aditya Kirana Store", phone: "919045576383" }
  },
  "ORD-88213": {
    order: { id: "ORD-88213", status: "returned", total: 2499 },
    refund: { status: "initiated", amount: 2499, window: "5-7 business days" },
    customer: { name: "Priya", email: "priya@example.com" }
  },
  PO1430780: {
    order: { po: "PO1430780", status: "confirmed", total: 12450, items: 14 },
    eta: "2026-09-10",
    offers: [{ code: "MONSOON5", percent: 5 }]
  }
};

export const dynamic = "force-dynamic";

/**
 * One normaliser for both sides of the lookup: upper-case, and drop spaces, underscores, `#`, `:`
 * and hyphens, so "ORD-88213", "ord 88213" and "ORD_88213" all name the same order. This mirrors
 * `idk()` in lib/gate.js, which is how the gate itself keys identifiers.
 */
const normalizeId = (s: string) => s.trim().toUpperCase().replace(/[\s_#:-]/g, "");

export function GET(request: Request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "").split(",").map(normalizeId).filter(Boolean);
  const hit = Object.keys(ORDERS).find((k) => ids.includes(normalizeId(k)));
  // Unknown identifiers return an empty object: the gate then keeps the drafter's facts and
  // marks provenance "facts", and the unknown identifier itself is flagged as unsupported.
  return NextResponse.json(hit ? ORDERS[hit] : {}, { headers: { "cache-control": "no-store" } });
}
