"use client";

import React from "react";
import type { AgentView } from "@/lib/engine-client";
import { cn, formatInt } from "@/lib/utils";

interface AgentRosterProps {
  agents: AgentView[];
  activeAgentIds: Set<string>;
}

/** Render the agent roster panel. */
export function AgentRoster({ agents, activeAgentIds }: AgentRosterProps) {
  return (
    <section className="rounded-[10px] border border-hairline bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold leading-tight text-neutral-900">Agents</h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">Active market participants and ratings.</p>
        </div>
        <span className="shrink-0 font-mono text-[12px] text-neutral-400">
          {agents.length} agents
        </span>
      </div>

      {agents.length === 0 ? (
        <p className="rounded-[8px] border border-hairline bg-subtle/60 px-3 py-6 text-center text-[12px] text-neutral-400">
          No agents yet. Run the seed or post a task.
        </p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent, index) => {
            const active = activeAgentIds.has(agent.id);
            const isClient = agent.role === "client";
            const avatarClass = isClient
              ? "bg-neutral-100 border-neutral-200 text-neutral-700"
              : active
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-neutral-100 border-neutral-200 text-neutral-700";
            const repClass =
              agent.reputation >= 0.9
                ? "bg-status-green"
                : agent.reputation >= 0.8
                  ? "bg-primary"
                  : "bg-neutral-600";

            return (
              <div
                key={agent.id}
                className={cn("space-y-1.5", index > 0 && "border-t border-hairline pt-3")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
                        avatarClass,
                      )}
                    >
                      {initials(agent.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-status-green dot-pulse" />}
                        <span className="truncate text-[13px] font-semibold text-neutral-900">
                          {agent.name}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            isClient
                              ? "border border-indigo-100 bg-indigo-50 text-indigo-700"
                              : "bg-neutral-100 text-neutral-600",
                          )}
                        >
                          {agent.role}
                        </span>
                      </div>
                      <span className="block truncate text-[11px] text-neutral-500">
                        {agent.specialty ? <>{agent.specialty} · </> : null}
                        <span className="font-mono">
                          {agent.wins}W/{agent.losses}L
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block font-mono text-[12px] font-semibold text-neutral-900">
                      {formatInt(agent.balance)} CRT
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        agent.reputation >= 0.9 ? "text-status-green" : "text-neutral-700",
                      )}
                    >
                      rep {agent.reputation.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={cn("animate-bar h-full rounded-full", repClass)}
                    style={{ width: `${Math.round(agent.reputation * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** initials helper. */
function initials(name: string): string {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
