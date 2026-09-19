"use client";

import React from "react";
import type { AgentView, LedgerView } from "@/lib/engine-client";
import { cn, formatAmount, formatClock, formatInt } from "@/lib/utils";
import { ReasonBadge } from "./Pills";

interface LedgerPanelProps {
  ledger: LedgerView[];
  agents: AgentView[];
}

export function LedgerPanel({ ledger, agents }: LedgerPanelProps) {
  const nameOf = (agentId: string) =>
    agents.find((agent) => agent.id === agentId)?.name ?? agentId.slice(0, 8);
  const rows = ledger.slice(0, 12);

  return (
    <section className="rounded-[10px] border border-hairline bg-card p-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold leading-tight text-neutral-900">Credit ledger</h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Real-time escrow, settlement, and fee stream.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-neutral-400">
          {ledger.length} tx recorded
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[8px] border border-hairline bg-subtle/60 px-3 py-6 text-center text-[12px] text-neutral-400">
          No transactions yet.
        </p>
      ) : (
        <div className="space-y-2 text-[12px]">
          {rows.map((entry, index) => {
            const positive = entry.amount >= 0;
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center justify-between py-1",
                  index < rows.length - 1 && "border-b border-hairline",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-neutral-800">
                      {nameOf(entry.agent_id)}
                    </span>
                    <ReasonBadge reason={entry.reason} />
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {formatClock(entry.created_at)}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "font-mono text-[12px] font-medium",
                      positive ? "text-status-green" : "text-status-red",
                    )}
                  >
                    {positive ? "+" : "-"}
                    {formatAmount(Math.abs(entry.amount))} CRT
                  </span>
                  <span className="block font-mono text-[10px] text-neutral-400">
                    bal {formatInt(entry.balance_after)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
