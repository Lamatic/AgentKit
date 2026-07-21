"use client";

import React from "react";

export function BentoGrid() {
  return (
    <section id="bento-features" className="py-24 sm:py-28 border-b border-[#E2E2DF] reveal-on-scroll bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="space-y-2">
          <span className="font-mono text-xs text-[#0D0D0B] font-bold uppercase tracking-[0.15em] block">
            03 / SYSTEM INSIGHTS
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#0D0D0B] tracking-tight">
            Deep analysis. Zero generic advice.
          </h2>
        </div>

        {/* 2x2 Bento Grid with 1px Hairline Gaps */}
        <div className="bg-[#E2E2DF] p-[1px] grid grid-cols-1 md:grid-cols-2 gap-[1px]">
          {/* Card A: Mint Accent - Architecture Health Score */}
          <div className="bg-[#F8F8F6] p-7 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
                <span className="font-mono text-xs font-bold text-[#0D0D0B] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#89FA91] border border-[#0D0D0B]" />
                  CARD A · SYSTEM HEALTH AUDIT
                </span>
                <span className="font-mono text-[10px] text-[#555550] uppercase font-bold">
                  SCORE 68/100
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
                Architecture Health Score
              </h3>

              <p className="font-sans text-sm text-[#555550]">
                Instant quantitative rating of your system&apos;s architectural resilience, concurrency limits, and operational risk factors.
              </p>

              {/* Progress Bar & Sub-scores */}
              <div className="bg-[#FFFFFF] border border-[#E2E2DF] p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#555550]">OVERALL HEALTH INDEX</span>
                    <span className="text-[#0D0D0B] font-bold bg-[#89FA91] px-1.5 border border-[#0D0D0B]">68 / 100</span>
                  </div>
                  {/* Flat horizontal progress bar */}
                  <div className="w-full h-2 bg-[#F8F8F6] border border-[#E2E2DF]">
                    <div className="h-full bg-[#0D0D0B] w-[68%]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[10px] pt-2 border-t border-[#E2E2DF]">
                  <div>
                    <span className="text-[#555550] block">RELIABILITY</span>
                    <span className="text-[#0D0D0B] font-bold text-xs">82%</span>
                  </div>
                  <div>
                    <span className="text-[#555550] block">CONCURRENCY</span>
                    <span className="text-[#0D0D0B] font-bold text-xs bg-[#FCDD2D] px-1 border border-[#0D0D0B]">54%</span>
                  </div>
                  <div>
                    <span className="text-[#555550] block">FAILOVER</span>
                    <span className="text-[#E55836] font-bold text-xs">40%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="font-mono text-[10px] text-[#888880] uppercase tracking-wider">
              [ AUTOMATED RESILIENCE AUDIT ]
            </div>
          </div>

          {/* Card B: Gold Accent - Evolution Roadmap */}
          <div className="bg-[#F8F8F6] p-7 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
                <span className="font-mono text-xs font-bold text-[#0D0D0B] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FCDD2D] border border-[#0D0D0B]" />
                  CARD B · STRATEGIC TIMELINE
                </span>
                <span className="font-mono text-[10px] text-[#555550] uppercase font-bold">
                  3 PHASES
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
                Evolution Roadmap
              </h3>

              <p className="font-sans text-sm text-[#555550]">
                Prioritized 3-phase execution roadmap engineered to eliminate technical debt without disrupting feature delivery.
              </p>

              {/* Timeline Items */}
              <div className="bg-[#FFFFFF] border border-[#E2E2DF] p-4 space-y-3 font-mono text-xs">
                <div className="flex items-start gap-3 border-b border-[#E2E2DF] pb-2.5">
                  <span className="px-1.5 py-0.5 bg-[#E55836]/10 text-[#E55836] border border-[#E55836]/30 text-[10px] uppercase font-bold shrink-0">
                    PHASE 1
                  </span>
                  <div>
                    <span className="text-[#0D0D0B] font-bold block">Immediate (Week 1-4)</span>
                    <span className="text-[#555550] text-[11px]">
                      Extract Auth &amp; Event Ingestion to Redis Queue. Add DB Read Replicas.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-b border-[#E2E2DF] pb-2.5">
                  <span className="px-1.5 py-0.5 bg-[#FCDD2D] text-[#0D0D0B] border border-[#0D0D0B] text-[10px] uppercase font-bold shrink-0">
                    PHASE 2
                  </span>
                  <div>
                    <span className="text-[#0D0D0B] font-bold block">Mid-Term (Month 2-3)</span>
                    <span className="text-[#555550] text-[11px]">
                      Decompose DB into Read-Replicas &amp; Sharded Tenant Tables.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="px-1.5 py-0.5 bg-[#89FA91] text-[#0D0D0B] border border-[#0D0D0B] text-[10px] uppercase font-bold shrink-0">
                    PHASE 3
                  </span>
                  <div>
                    <span className="text-[#0D0D0B] font-bold block">Scale Target (Month 4-6)</span>
                    <span className="text-[#555550] text-[11px]">
                      Migrate to Event-driven Architecture with NATS JetStream.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="font-mono text-[10px] text-[#888880] uppercase tracking-wider">
              [ ZERO DOWNTIME MILESTONES ]
            </div>
          </div>

          {/* Card C: Coral Accent - Critical Bottlenecks Detected */}
          <div className="bg-[#F8F8F6] p-7 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
                <span className="font-mono text-xs font-bold text-[#E55836] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E55836]" />
                  CARD C · RISK TAXONOMY
                </span>
                <span className="font-mono text-[10px] text-[#E55836] uppercase font-bold">
                  3 DETECTED
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
                Critical Bottlenecks Detected
              </h3>

              <p className="font-sans text-sm text-[#555550]">
                Highlights single points of failure, unindexed query patterns, and architectural risks before they cause outages.
              </p>

              {/* Bullet Alerts */}
              <div className="bg-[#FFFFFF] border border-[#E2E2DF] p-4 space-y-3 font-mono text-xs">
                <div className="p-2.5 bg-[#E55836]/5 border border-[#E55836]/20 space-y-1">
                  <div className="flex justify-between items-center text-[#E55836] font-bold text-[11px]">
                    <span>1. SINGLE DB INSTANCE WRITE LOCK</span>
                    <span className="px-1 bg-[#E55836] text-[#FFFFFF] text-[9px]">CRITICAL</span>
                  </div>
                  <p className="text-[#555550] text-[11px]">
                    Primary PostgreSQL instance reaches 94% CPU saturation during peak bulk writes.
                  </p>
                </div>

                <div className="p-2.5 bg-[#FCDD2D]/10 border border-[#0D0D0B]/20 space-y-1">
                  <div className="flex justify-between items-center text-[#0D0D0B] font-bold text-[11px]">
                    <span>2. SYNCHRONOUS HTTP CASCADES</span>
                    <span className="px-1 bg-[#FCDD2D] text-[#0D0D0B] text-[9px] border border-[#0D0D0B]">HIGH</span>
                  </div>
                  <p className="text-[#555550] text-[11px]">
                    Service A waits synchronously on Service B &amp; C (p99 latency 2.8s).
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F8F6] border border-[#E2E2DF] space-y-1">
                  <div className="flex justify-between items-center text-[#555550] font-bold text-[11px]">
                    <span>3. UNCACHED IN-MEMORY SESSIONS</span>
                    <span className="px-1 bg-[#E2E2DF] text-[#0D0D0B] text-[9px]">MEDIUM</span>
                  </div>
                  <p className="text-[#555550] text-[11px]">
                    Node.js process memory grows monotonically due to un-evicted session maps.
                  </p>
                </div>
              </div>
            </div>

            <div className="font-mono text-[10px] text-[#888880] uppercase tracking-wider">
              [ REAL-TIME RISK CLASSIFICATION ]
            </div>
          </div>

          {/* Card D: Technology Decision Matrix */}
          <div className="bg-[#F8F8F6] p-7 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
                <span className="font-mono text-xs font-bold text-[#0D0D0B] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#89FA91] border border-[#0D0D0B]" />
                  CARD D · TRADE-OFF ANALYSIS
                </span>
                <span className="font-mono text-[10px] text-[#555550] uppercase font-bold">
                  DECISION MATRIX
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
                Technology Decision Matrix
              </h3>

              <p className="font-sans text-sm text-[#555550]">
                Transparent trade-off breakdown evaluating candidate technologies against migration overhead and engineering effort.
              </p>

              {/* Table Snippet */}
              <div className="bg-[#FFFFFF] border border-[#E2E2DF] overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-[#E2E2DF] bg-[#F8F8F6] text-[#0D0D0B]">
                      <th className="p-2.5 font-bold">TECHNOLOGY</th>
                      <th className="p-2.5 font-bold">TRADE-OFF</th>
                      <th className="p-2.5 font-bold text-right">RECOMMENDATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E2DF] text-[#0D0D0B]">
                    <tr>
                      <td className="p-2.5 font-bold text-[#0D0D0B]">PostgreSQL → Cockroach</td>
                      <td className="p-2.5 text-[#555550]">High migration cost</td>
                      <td className="p-2.5 text-right font-bold bg-[#FCDD2D]/30 text-[#0D0D0B]">Defer to Phase 3</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-[#0D0D0B]">REST → gRPC</td>
                      <td className="p-2.5 text-[#555550]">Client SDK re-work</td>
                      <td className="p-2.5 text-right font-bold text-[#0D0D0B] bg-[#89FA91]/30">Adopt for RPC</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-[#0D0D0B]">Redis → NATS JetStream</td>
                      <td className="p-2.5 text-[#555550]">Ops learning curve</td>
                      <td className="p-2.5 text-right font-bold text-[#0D0D0B] bg-[#89FA91]/30">Adopt in Phase 2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="font-mono text-[10px] text-[#888880] uppercase tracking-wider">
              [ PRINCIPAL ARCHITECT APPROVED ]
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
