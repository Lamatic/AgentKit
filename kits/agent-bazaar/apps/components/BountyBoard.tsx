"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface Bounty {
  id: string;
  goal: string;
  budget: number;
  status: string;
  posted_by: string;
  source?: string;
}

interface BountyBoardProps {
  bounties: Bounty[];
}

const statusColors: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  draft: "outline",
  open: "success",
  awarded: "default",
  in_escrow: "warning",
  delivered: "default",
  qa_pass: "success",
  qa_fail: "error",
  settled: "success",
  refunded: "error",
};

export function BountyBoard({ bounties }: BountyBoardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bounty Board</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <div
              key={bounty.id}
              className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3"
            >
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">{bounty.goal}</p>
                <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                  {bounty.id} · posted by {bounty.posted_by}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-[var(--primary)]">
                  {bounty.budget} CRT
                </span>
                <Badge variant={statusColors[bounty.status] || "outline"}>
                  {bounty.status}
                </Badge>
                {bounty.source === "seed" && (
                  <Badge variant="outline">seed</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
