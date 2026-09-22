import { notFound, unstable_rethrow } from "next/navigation";
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

// Client-agent id mirror (apps must never import engine code): the deterministic
// id of "Client-Alpha" from engine/src/agents/roster.ts, used only to derive role.
const CLIENT_AGENT_ID = "38b026a4-0000-4000-8000-000000000000";

interface AgentView {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
  reputation: number;
  balance: number | null;
  source?: string;
}

// Note: in Next.js 15+ route params are a Promise — awaiting them is required.
/** Render an agent profile page. */
export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const mockDefault = MOCK_AGENTS.find((a) => a.id === id) || MOCK_AGENTS[1];
  let agent: AgentView = { ...mockDefault };
  let receipts = MOCK_RECEIPTS;
  let demoMode = false;
  let balanceFailed = false;

  try {
    const { data: dbAgent, error: agentError } = await supabase.from("agents").select("*").eq("id", id).maybeSingle();
    if (agentError) throw agentError;
    if (!dbAgent) notFound();
    const { data: dbReceipts, error: receiptsError } = await supabase.from("settlement_receipts").select("*").or(`from_agent.eq.${id},to_agent.eq.${id}`).order("created_at", { ascending: false }).limit(10);
    // Live agents must not inherit fixture-only fields: the agents table has
    // no balance/role/source columns, so read the balance from the ledger
    // (latest by append order), derive the role from the client id, and leave
    // source unset. Em dash renders when the balance is unavailable.
    const { data: ledgerRow, error: ledgerError } = await supabase.from("credit_ledger").select("balance_after").eq("agent_id", id).order("seq", { ascending: false }).limit(1).maybeSingle();
    if (ledgerError) {
      // Partial failure: agent + receipts may be live, but the balance is
      // unknown — flag it so the UI renders an error state, never "—".
      balanceFailed = true;
      console.error(`[agents/${id}] balance read failed:`, ledgerError.message);
    }
    agent = {
      id: dbAgent.id,
      name: dbAgent.name,
      role: dbAgent.id === CLIENT_AGENT_ID ? "client" : "worker",
      specialty: dbAgent.specialty ?? undefined,
      reputation: Number(dbAgent.reputation) || 0,
      balance: ledgerRow ? Number(ledgerRow.balance_after) : null,
    };
    if (!receiptsError && dbReceipts) {
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
    } else {
      demoMode = true;
      if (receiptsError) console.error(`[agents/${id}] receipts read failed, using fixtures:`, receiptsError.message);
    }
  } catch (err) {
    unstable_rethrow(err);
    demoMode = true;
    console.error(`[agents/${id}] Supabase read failed, falling back to mock data:`, err);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6">
      <Link href="/" className="mb-4 inline-block text-sm text-[var(--primary)] hover:underline">← Back to Dashboard</Link>
      {demoMode && (
        <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Demo data — live database unavailable.
        </p>
      )}
      {balanceFailed && (
        <p role="status" className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          Balance unavailable — ledger query failed. Other sections may still be live.
        </p>
      )}
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
          <p className="font-mono text-2xl font-semibold text-[var(--primary)]">{balanceFailed ? "error" : (agent.balance ?? "—")}{!balanceFailed && agent.balance != null ? " CRT" : ""}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Recent Settlements</p>
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
            {receipts.map((r) => {
              const row = (
                <div key={r.receipt_id} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3">
                  <div>
                    <p className="font-mono text-xs text-[var(--text-primary)]">{r.receipt_id}</p>
                    <p className="text-xs text-[var(--text-muted)]">{r.from_agent} → {r.to_agent}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-[var(--secondary)]">{r.net_amount} CRT</span>
                    <Badge variant={r.adapter === "x402" ? "default" : "outline"}>{r.adapter}</Badge>
                  </div>
                </div>
              );
              // Mock receipts have no live detail page — render as plain rows
              // so demo mode never links to a 404 route.
              if (demoMode) return row;
              return (
                <Link key={r.receipt_id} href={`/receipts/${r.receipt_id}`} className="block hover:opacity-80 transition-opacity">
                  {row}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
