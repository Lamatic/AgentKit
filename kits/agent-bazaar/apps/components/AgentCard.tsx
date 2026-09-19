"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface Agent {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  reputation: number;
  balance: number;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{agent.name}</CardTitle>
          <Badge variant={agent.role === "client" ? "default" : "success"}>
            {agent.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Reputation</span>
            <span className="font-mono text-sm text-[var(--secondary)]">
              {agent.reputation.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Balance</span>
            <span className="font-mono text-sm text-[var(--primary)]">
              {agent.balance} CRT
            </span>
          </div>
          {agent.specialty && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Specialty</span>
              <Badge variant="outline">{agent.specialty}</Badge>
            </div>
          )}
          <p className="font-mono text-xs text-[var(--text-muted)]">{agent.id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
