"use client";

import React from "react";
import type { AgentView, BidView, BountyView } from "@/lib/engine-client";
import { cn, formatAmount, shortId, timeAgo } from "@/lib/utils";
import { StatusPill } from "./Pills";

const TERMINAL = new Set(["settled", "refunded"]);

interface BountyListProps {
  bounties: BountyView[];
  bids: BidView[];
  agents: AgentView[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function BountyList({ bounties, bids, agents, activeId, onSelect }: BountyListProps) {
  const nameOf = (agentId: string) =>
    agents.find((agent) => agent.id === agentId)?.name ?? shortId(agentId);
  const bidCount = (bountyId: string) => bids.filter((bid) => bid.bounty_id === bountyId).length;
  const activeCount = bounties.filter((bounty) => !TERMINAL.has(bounty.status)).length;

  return (
    <section className="rounded-[10px] border border-hairline bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold leading-tight text-neutral-900">Bounty board</h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Recent task dispatches across active agent subnets.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[12px] text-neutral-400">
          {activeCount} active bounties
        </span>
      </div>

      {bounties.length === 0 ? (
        <p className="rounded-[8px] border border-hairline bg-subtle/60 px-3 py-6 text-center text-[12px] text-neutral-400">
          No bounties yet.
        </p>
      ) : (
        <div className="space-y-1">
          {bounties.map((bounty) => {
            const selected = bounty.id === activeId;
            const count = bidCount(bounty.id);
            return (
              <button
                key={bounty.id}
                type="button"
                onClick={() => onSelect(bounty.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-[6px] p-3 text-left transition-colors",
                  selected
                    ? "border-l-2 border-t border-r border-b border-l-primary border-indigo-100/70 bg-indigo-50/40"
                    : "border-b border-hairline hover:bg-neutral-50/70",
                )}
              >
                <div className="max-w-lg space-y-0.5">
                  <p className="truncate text-[13px] font-medium text-neutral-900">{bounty.goal}</p>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500">
                    <span className="text-neutral-700">{nameOf(bounty.posted_by)}</span>
                    <span>·</span>
                    <span suppressHydrationWarning>{timeAgo(bounty.created_at)}</span>
                    <span>·</span>
                    <span>
                      {count} bid{count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-mono text-[13px] font-semibold text-neutral-900">
                    {formatAmount(bounty.budget)} CRT
                  </span>
                  <StatusPill status={bounty.status} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
