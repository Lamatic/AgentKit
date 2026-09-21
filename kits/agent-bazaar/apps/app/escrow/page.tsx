import { supabase } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Live data page: render at request time so builds don't need credentials.
export const dynamic = "force-dynamic";

const MOCK_ESCROWS = [
  { escrow_id: "escrow-001", bounty_id: "bounty-002", agent_id: "4c31fbcd-0000-4000-8000-000000000000", amount: 1600, status: "locked", created_at: "2026-09-14T01:00:00Z" },
  { escrow_id: "escrow-002", bounty_id: "bounty-003", agent_id: "1ff47abd-0000-4000-8000-000000000000", amount: 800, status: "locked", created_at: "2026-09-14T00:30:00Z" },
  { escrow_id: "escrow-003", bounty_id: "bounty-004", agent_id: "1ad7d1aa-0000-4000-8000-000000000000", amount: 1500, status: "settled", created_at: "2026-09-13T20:00:00Z", settled_at: "2026-09-14T02:30:00Z" },
];

const MOCK_RECEIPTS = [
  { receipt_id: "receipt-001", from_agent: "796ff789-0000-4000-8000-000000000000", to_agent: "1ad7d1aa-0000-4000-8000-000000000000", gross_amount: 1500, fee_amount: 150, net_amount: 1350, adapter: "ledger", tx_hash: null, settled_at: "2026-09-14T02:30:00Z" },
  { receipt_id: "receipt-002", from_agent: "796ff788-0000-4000-8000-000000000000", to_agent: "1ff47abd-0000-4000-8000-000000000000", gross_amount: 800, fee_amount: 80, net_amount: 720, adapter: "x402", tx_hash: "0xabc123def4567890001", settled_at: "2026-09-14T01:15:00Z" },
];

/** Render the escrow explorer page. */
export default async function EscrowPage() {
  let escrows = MOCK_ESCROWS;
  let receipts = MOCK_RECEIPTS;
  let escrowsFailed = false;
  let receiptsFailed = false;

  try {
    const { data: db1, error: err1 } = await supabase.from("escrows").select("*, bids(id, agent_id)").order("created_at", { ascending: false }).limit(10);
    const { data: db2, error: err2 } = await supabase.from("settlement_receipts").select("*").order("created_at", { ascending: false }).limit(10);
    if (!err1 && db1) escrows = db1.map((e) => ({
      escrow_id: e.id,
      bounty_id: e.bounty_id,
      agent_id: e.bids?.agent_id,
      amount: e.amount,
      status: e.status,
      created_at: e.created_at,
      settled_at: e.settled_at,
    }));
    else {
      escrowsFailed = true;
      if (err1) console.error("[escrow] escrows read failed, using fixtures:", err1.message);
    }
    if (!err2 && db2) receipts = db2.map((r) => ({ ...r, receipt_id: r.id, to_agent: r.to_agent, from_agent: r.from_agent, settled_at: r.created_at }));
    else {
      receiptsFailed = true;
      if (err2) console.error("[escrow] receipts read failed, using fixtures:", err2.message);
    }
  } catch (err) {
    escrowsFailed = true;
    receiptsFailed = true;
    console.error("[escrow] Supabase read failed, falling back to mock data:", err);
  }

  // Exact aggregates over the complete dataset (the lists above stay limited
  // to the latest 10). Fall back to the page subset when unavailable.
  let lockedTotal = escrows.filter((e) => e.status === "locked").reduce((sum, e) => sum + (e.amount || 0), 0);
  let lockedCount = escrows.filter((e) => e.status === "locked").length;
  let settledCount = receipts.length;
  let feesCollected = receipts.reduce((s, r) => s + (r.fee_amount || 0), 0);
  try {
    const { data: statsRows } = await supabase.rpc("escrow_locked_stats");
    const stats = Array.isArray(statsRows) ? statsRows[0] : statsRows;
    if (stats) {
      lockedCount = Number(stats.locked_count);
      lockedTotal = Number(stats.locked_total);
    }
    const { count } = await supabase.from("settlement_receipts").select("id", { count: "exact", head: true });
    if (typeof count === "number") settledCount = count;
    // Database-level sum: the JS reduce below is only a fallback, since a
    // plain select is capped at the PostgREST row limit.
    const { data: feeTotal, error: feeError } = await supabase.rpc("settlement_fee_total");
    if (!feeError && feeTotal != null) feesCollected = Number(feeTotal);
    else {
      const { data: feeRows } = await supabase.from("settlement_receipts").select("fee_amount");
      if (feeRows) feesCollected = feeRows.reduce((s, r) => s + (Number(r.fee_amount) || 0), 0);
    }
  } catch (err) {
    console.error("[escrow] aggregates read failed, using page subset:", err);
  }

  const demoSections = [
    escrowsFailed ? "escrows" : null,
    receiptsFailed ? "receipts" : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6">
      <h1 className="mb-6 text-xl font-semibold text-[var(--text-primary)]">Escrow & Settled Explorer</h1>
      {demoSections.length > 0 && (
        <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Demo data — live database unavailable for: {demoSections.join(", ")}.
        </p>
      )}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">TVL</p>
          <p className="font-mono text-2xl font-semibold text-[var(--primary)]">{lockedTotal} CRT</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Active Escrows</p>
          <p className="font-mono text-2xl font-semibold text-[var(--secondary)]">{lockedCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Settled</p>
          <p className="font-mono text-2xl font-semibold text-[var(--secondary)]">{settledCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Fees Collected</p>
          <p className="font-mono text-2xl font-semibold text-[var(--tertiary)]">{feesCollected} CRT</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Escrow Vault</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {escrows.map((e) => (
              <div key={e.escrow_id} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3">
                <div>
                  <p className="font-mono text-xs text-[var(--text-primary)]">{e.escrow_id}</p>
                  <p className="text-xs text-[var(--text-muted)]">bounty: {e.bounty_id} · agent: {e.agent_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-[var(--primary)]">{e.amount} CRT</span>
                  <Badge variant={e.status === "settled" ? "success" : e.status === "locked" ? "warning" : e.status === "refunded" ? "error" : "default"}>{e.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
