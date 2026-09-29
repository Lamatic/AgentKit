import { supabase } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Live data page: render at request time so builds don't need credentials.
export const dynamic = "force-dynamic";

const MOCK_OPEN = [
  { id: "bounty-001", goal: "Summarize a 10-page research paper into 3 bullet points", budget: 1000, status: "open", posted_by: "796ff789-0000-4000-8000-000000000000", source: "seed" },
  { id: "bounty-005", goal: "Create a security assessment report for a REST API", budget: 1200, status: "open", posted_by: "796ff788-0000-4000-8000-000000000000", source: "seed" },
];

const MOCK_LEDGER = [
  { receipt_id: "receipt-001", from_agent: "796ff789-0000-4000-8000-000000000000", to_agent: "1ad7d1aa-0000-4000-8000-000000000000", gross_amount: 1500, fee_amount: 150, net_amount: 1350, adapter: "ledger", tx_hash: null, settled_at: "2026-09-14T02:30:00Z" },
  { receipt_id: "receipt-002", from_agent: "796ff788-0000-4000-8000-000000000000", to_agent: "1ff47abd-0000-4000-8000-000000000000", gross_amount: 800, fee_amount: 80, net_amount: 720, adapter: "x402", tx_hash: "0xabc123def4567890001", settled_at: "2026-09-14T01:15:00Z" },
  { receipt_id: "receipt-003", from_agent: "796ff789-0000-4000-8000-000000000000", to_agent: "4c31fbcd-0000-4000-8000-000000000000", gross_amount: 1600, fee_amount: 160, net_amount: 1440, adapter: "ledger", tx_hash: null, settled_at: "2026-09-13T22:00:00Z" },
];

/** Render the order book page. */
export default async function OrderBookPage() {
  let openBounties = MOCK_OPEN;
  let receipts = MOCK_LEDGER;
  let bountiesFailed = false;
  let receiptsFailed = false;

  try {
    const { data: db1, error: err1 } = await supabase.from("bounties").select("*").eq("status->>status", "open").order("budget", { ascending: false });
    const { data: db2, error: err2 } = await supabase.from("settlement_receipts").select("*").order("created_at", { ascending: false }).limit(10);
    if (!err1 && db1) openBounties = db1.map((b) => ({ ...b, status: "open" }));
    else {
      bountiesFailed = true;
      if (err1) console.error("[order-book] bounties read failed, using fixtures:", err1.message);
    }
    if (!err2 && db2) receipts = db2.map((r) => ({ ...r, receipt_id: r.id, from_agent: r.from_agent, to_agent: r.to_agent, settled_at: r.created_at }));
    else {
      receiptsFailed = true;
      if (err2) console.error("[order-book] receipts read failed, using fixtures:", err2.message);
    }
  } catch (err) {
    bountiesFailed = true;
    receiptsFailed = true;
    console.error("[order-book] Supabase read failed, falling back to mock data:", err);
  }

  const demoSections = [
    bountiesFailed ? "bounties" : null,
    receiptsFailed ? "receipts" : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6">
      <h1 className="mb-6 text-xl font-semibold text-[var(--text-primary)]">Order Book & Ledger</h1>
      {demoSections.length > 0 && (
        <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Demo data — live database unavailable for: {demoSections.join(", ")}.
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Open Bounties (BUY)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openBounties.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3">
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)]">{b.goal}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">{b.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium text-[var(--secondary)]">{b.budget} CRT</p>
                    <Badge variant="success">open</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Settlement Ledger Stream</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {receipts.map((r) => (
                <div key={r.receipt_id} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3">
                  <div>
                    <p className="text-xs text-[var(--text-primary)]">{r.from_agent} → {r.to_agent}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">{r.tx_hash ? `${r.tx_hash.slice(0, 12)}...` : "Ledger transfer"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium text-[var(--secondary)]">{r.net_amount} CRT</p>
                    <Badge variant={r.adapter === "x402" ? "default" : "outline"}>{r.adapter}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
