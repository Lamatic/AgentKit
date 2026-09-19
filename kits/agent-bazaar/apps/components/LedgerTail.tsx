"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface LedgerEntry {
  receipt_id: string;
  from_agent: string;
  to_agent: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  adapter: string;
  tx_hash: string | null;
  settled_at: string;
}

interface LedgerTailProps {
  entries: LedgerEntry[];
}

export function LedgerTail({ entries }: LedgerTailProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger Tail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.receipt_id}
              className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-2"
            >
              <div className="flex items-center gap-3">
                <Badge variant={entry.adapter === "x402" ? "default" : "outline"}>
                  {entry.adapter}
                </Badge>
                <div>
                  <p className="text-xs text-[var(--text-primary)]">
                    {entry.from_agent} → {entry.to_agent}
                  </p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    {entry.tx_hash
                      ? `${entry.tx_hash.slice(0, 10)}...`
                      : "Ledger transfer"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium text-[var(--secondary)]">
                  {entry.net_amount} CRT
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  fee: {entry.fee_amount}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
