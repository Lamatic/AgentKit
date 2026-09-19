import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface ReceiptRow {
  receipt_id: string;
  escrow_id: string;
  from_agent: string;
  to_agent: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  adapter: string;
  tx_hash: string | null;
  settled_at: string;
}

// Note: in Next.js 15+ route params are a Promise — awaiting them is required.
/** Render a settlement receipt page. */
export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabase.from("settlement_receipts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load receipt ${id}: ${error.message}`);
  if (!data) notFound();
  const receipt: ReceiptRow = {
    receipt_id: data.id,
    escrow_id: data.escrow_id,
    from_agent: data.from_agent,
    to_agent: data.to_agent,
    gross_amount: data.gross_amount,
    fee_amount: data.fee_amount,
    net_amount: data.net_amount,
    adapter: data.adapter,
    tx_hash: data.tx_hash,
    settled_at: data.created_at,
  } as ReceiptRow;

  const txLink = receipt.adapter === "x402" && receipt.tx_hash
    ? `https://sepolia.basescan.org/tx/${receipt.tx_hash}`
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6">
      <Link href="/" className="mb-4 inline-block text-sm text-[var(--primary)] hover:underline">← Back to Dashboard</Link>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Receipt Detail</h1>
        <Badge variant={receipt.adapter === "x402" ? "default" : "outline"}>
          {receipt.adapter === "x402" ? "SETTLED ON-CHAIN" : "LEDGER TRANSFER"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Settlement Info</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">Receipt ID</span><span className="font-mono text-sm text-[var(--text-primary)]">{receipt.receipt_id}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">Escrow ID</span><span className="font-mono text-sm text-[var(--text-primary)]">{receipt.escrow_id}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">Adapter</span><Badge variant={receipt.adapter === "x402" ? "default" : "outline"}>{receipt.adapter}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">Settled At</span><span className="font-mono text-sm text-[var(--text-primary)]">{new Date(receipt.settled_at).toISOString()}</span></div>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Financial Breakdown</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">Gross Amount</span><span className="font-mono text-sm text-[var(--text-primary)]">{receipt.gross_amount} CRT</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">Platform Fee (10%)</span><span className="font-mono text-sm text-[var(--tertiary)]">{receipt.fee_amount} CRT</span></div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3"><span className="text-xs font-semibold text-[var(--text-primary)]">Net Amount</span><span className="font-mono text-sm font-semibold text-[var(--secondary)]">{receipt.net_amount} CRT</span></div>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Transaction</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">From</span><span className="font-mono text-sm text-[var(--text-primary)]">{receipt.from_agent}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--text-muted)]">To</span><span className="font-mono text-sm text-[var(--text-primary)]">{receipt.to_agent}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Tx Hash</span>
              {txLink ? (
                <a href={txLink} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--primary)] hover:underline">{receipt.tx_hash!.slice(0, 16)}...</a>
              ) : (
                <span className="font-mono text-sm text-[var(--text-muted)]">Ledger transfer</span>
              )}
            </div>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Audit Timeline</CardTitle></CardHeader><CardContent>
          <div className="space-y-3 border-l-2 border-[var(--border)] pl-4">
            {["Escrow locked", "Task delivered", "QA evaluated", "Settlement initiated", "Payment confirmed", "Reputation updated"].map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] h-2 w-2 rounded-full bg-[var(--secondary)]" />
                <p className="text-xs text-[var(--text-primary)]">{step}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
