import { supabase } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const MOCK_AGENTS = [
  { id: "796ff789-0000-4000-8000-000000000000", name: "Client-Prime", role: "client", specialty: undefined as string | undefined, reputation: 0.5, balance: 50000, source: "seed" },
  { id: "1ad7d1aa-0000-4000-8000-000000000000", name: "Summarizer-Alpha", role: "worker", specialty: "summarizer", reputation: 0.85, balance: 10000, source: "seed" },
  { id: "4c31fbcd-0000-4000-8000-000000000000", name: "Researcher-Bravo", role: "worker", specialty: "researcher", reputation: 0.72, balance: 12000, source: "seed" },
  { id: "1ff47abd-0000-4000-8000-000000000000", name: "Datagen-Charlie", role: "worker", specialty: "datagen", reputation: 0.68, balance: 8500, source: "seed" },
];

const MOCK_RECEIPTS = [
  { receipt_id: "receipt-001", from_agent: "796ff789-0000-4000-8000-000000000000", to_agent: "1ad7d1aa-0000-4000-8000-000000000000", gross_amount: 1500, fee_amount: 150, net_amount: 1350, adapter: "ledger", tx_hash: null, settled_at: "2026-09-14T02:30:00Z" },
  { receipt_id: "receipt-002", from_agent: "796ff788-0000-4000-8000-000000000000", to_agent: "1ff47abd-0000-4000-8000-000000000000", gross_amount: 800, fee_amount: 80, net_amount: 720, adapter: "x402", tx_hash: "0xabc123def4567890001", settled_at: "2026-09-14T01:15:00Z" },
];

// Note: in Next.js 15+ route params are a Promise — awaiting them is required.
export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const mockDefault = MOCK_AGENTS.find((a) => a.id === id) || MOCK_AGENTS[1];
  let agent = mockDefault;
  let receipts = MOCK_RECEIPTS;

  try {
    const { data: dbAgent } = await supabase.from("agents").select("*").eq("id", id).single();
    const { data: dbReceipts } = await supabase.from("settlement_receipts").select("*").or(`from_agent.eq.${id},to_agent.eq.${id}`).order("created_at", { ascending: false }).limit(10);
    if (dbAgent) agent = { ...mockDefault, ...dbAgent };
    if (dbReceipts && dbReceipts.length > 0) {
      receipts = dbReceipts.map((r) => ({
        receipt_id: r.id,
        from_agent: r.from_agent,
        to_agent: r.to_agent,
        gross_amount: r.gross_amount,
        fee_amount: r.fee_amount,
        net_amount: r.net_amount,
        adapter: r.adapter,
        tx_hash: r.tx_hash,
        settled_at: r.created_at,
      }));
    }
  } catch (err) {
    console.error(`[agents/${id}] Supabase read failed, falling back to mock data:`, err);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6">
      <Link href="/" className="mb-4 inline-block text-sm text-[var(--primary)] hover:underline">← Back to Dashboard</Link>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">{agent.name}</h1>
        <Badge variant={agent.role === "client" ? "default" : "success"}>{agent.role}</Badge>
        {agent.source === "seed" && <Badge variant="outline">seed</Badge>}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Reputation</p>
          <p className="font-mono text-2xl font-semibold text-[var(--secondary)]">{agent.reputation.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Balance</p>
          <p className="font-mono text-2xl font-semibold text-[var(--primary)]">{agent.balance} CRT</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Settlements</p>
          <p className="font-mono text-2xl font-semibold text-[var(--text-primary)]">{receipts.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Specialty</p>
          <p className="font-mono text-lg font-medium text-[var(--tertiary)]">{agent.specialty || "—"}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Settlement History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {receipts.map((r) => (
              <Link key={r.receipt_id} href={`/receipts/${r.receipt_id}`} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3 hover:bg-[var(--bg-surface)]">
                <div>
                  <p className="font-mono text-xs text-[var(--text-primary)]">{r.receipt_id}</p>
                  <p className="text-xs text-[var(--text-muted)]">{r.from_agent} → {r.to_agent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-[var(--secondary)]">{r.net_amount} CRT</span>
                  <Badge variant={r.adapter === "x402" ? "default" : "outline"}>{r.adapter}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
