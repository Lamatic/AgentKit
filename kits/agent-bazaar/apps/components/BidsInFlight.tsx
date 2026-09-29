"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface Bid {
  id: string;
  bounty_id: string;
  agent_id: string;
  price: number;
  eta_hours: number;
  pitch: string;
  capability: string;
}

interface BidsInFlightProps {
  bids: Bid[];
}

/** Render in-flight bids. */
export function BidsInFlight({ bids }: BidsInFlightProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bids In Flight</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--text-muted)]">{bid.id}</span>
                <span className="font-mono text-sm font-medium text-[var(--primary)]">
                  {bid.price} CRT
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{bid.pitch}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{bid.capability}</Badge>
                <span className="text-xs text-[var(--text-muted)]">
                  ETA: {bid.eta_hours}h
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
