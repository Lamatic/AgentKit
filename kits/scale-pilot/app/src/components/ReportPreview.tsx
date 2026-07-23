"use client";

import React, { useState } from "react";
import { StackConfig } from "./AnalyzerModal";

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  config: StackConfig | null;
}

export function ReportPreview({ isOpen, onClose, config }: ReportPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stack = config || {
    backend: "Node.js (Express)",
    database: "PostgreSQL Primary",
    cloud: "AWS ECS Fargate",
    users: "120,000 Active Users",
    challenge: "High latency during peak traffic",
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-[#FFFFFF] border border-[#0D0D0B] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto text-[#0D0D0B]">
        {/* L-corner markers */}
        <div className="corner-marker-tl" />
        <div className="corner-marker-tr" />
        <div className="corner-marker-bl" />
        <div className="corner-marker-br" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#FCDD2D] border border-[#0D0D0B]" />
            <span className="font-mono text-xs text-[#0D0D0B] uppercase tracking-widest font-bold">
              SCALEPILOT ARCHITECTURE EVOLUTION REPORT
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#F8F8F6] border border-[#E2E2DF] text-[#555550] hover:text-[#0D0D0B] font-mono text-[11px] uppercase tracking-wider font-bold cursor-pointer"
            >
              {copied ? "[ COPIED MARKDOWN ]" : "[ COPY MARKDOWN ]"}
            </button>
            <button
              onClick={onClose}
              aria-label="Close report preview"
              className="px-3 py-1.5 bg-[#F8F8F6] border border-[#E2E2DF] text-[#555550] hover:text-[#0D0D0B] font-mono text-[11px] uppercase font-bold cursor-pointer"
            >
              [ CLOSE ]
            </button>
          </div>
        </div>

        {/* Executive Header Card */}
        <div className="bg-[#F8F8F6] border border-[#E2E2DF] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E2DF] pb-4">
            <div>
              <span className="font-mono text-[10px] text-[#888880] uppercase tracking-widest block font-bold">
                AUDITED TARGET SYSTEM
              </span>
              <h2 className="font-display text-2xl font-bold text-[#0D0D0B]">
                {stack.backend} + {stack.database} on {stack.cloud}
              </h2>
              <span className="font-mono text-xs text-[#555550] block mt-0.5">
                Scale Tier: {stack.users} · Pain Point: &quot;{stack.challenge}&quot;
              </span>
            </div>

            {/* Health Badge */}
            <div className="bg-[#FFFFFF] border border-[#0D0D0B] p-4 text-center min-w-[160px]">
              <span className="font-mono text-[10px] text-[#555550] uppercase tracking-widest block font-bold">
                HEALTH SCORE
              </span>
              <div className="font-display text-4xl font-bold text-[#0D0D0B] my-1">
                68<span className="text-xs text-[#555550]">/100</span>
              </div>
              <span className="inline-block px-2 py-0.5 bg-[#FCDD2D] border border-[#0D0D0B] text-[#0D0D0B] font-mono text-[10px] uppercase font-bold">
                MODERATE RISK
              </span>
            </div>
          </div>

          <div className="font-mono text-xs text-[#555550] space-y-2 leading-relaxed">
            <p className="text-[#0D0D0B] font-bold">
              {`// EXECUTIVE ARCHITECT SUMMARY`}
            </p>
            <p>
              The current deployment exhibits classic scale-wall characteristics. At {stack.users}, the synchronous invocation chain between {stack.backend} handlers and {stack.database} creates connection pool exhaustion during traffic surges.
            </p>
          </div>
        </div>

        {/* Section 1: Bottleneck Taxonomy */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs text-[#0D0D0B] uppercase tracking-widest font-bold">
            01 / BOTTLENECK TAXONOMY &amp; RISK PROFILE
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {/* Risk Item 1 */}
            <div className="bg-[#FFFFFF] border border-[#E2E2DF] border-l-4 border-l-[#E55836] p-4 space-y-2">
              <div className="flex justify-between items-center text-[#E55836] font-bold">
                <span>[HIGH RISK] Primary Database Write Saturation</span>
                <span className="text-[10px] bg-[#E55836] text-[#FFFFFF] px-2 py-0.5">CRITICAL</span>
              </div>
              <p className="text-[#555550]">
                {stack.database} locks during concurrent batch writes. Absence of connection poolers (e.g. PgBouncer) creates query latency spikes over 3,100ms.
              </p>
              <div className="text-[11px] text-[#0D0D0B] pt-1 font-bold">
                → Impact: Operational degradation and HTTP 504 Gateway Timeouts under high load.
              </div>
            </div>

            {/* Risk Item 2 */}
            <div className="bg-[#FFFFFF] border border-[#E2E2DF] border-l-4 border-l-[#FCDD2D] p-4 space-y-2">
              <div className="flex justify-between items-center text-[#0D0D0B] font-bold">
                <span>[MEDIUM RISK] Synchronous REST Call Cascade</span>
                <span className="text-[10px] bg-[#FCDD2D] border border-[#0D0D0B] px-2 py-0.5">WARNING</span>
              </div>
              <p className="text-[#555550]">
                {stack.backend} endpoints block waiting on secondary RPC calls without circuit breakers or timeout bounds.
              </p>
              <div className="text-[11px] text-[#0D0D0B] pt-1 font-bold">
                → Impact: Failure in a single non-critical service cascades across the entire system.
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 3-Phase Migration Roadmap */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs text-[#0D0D0B] uppercase tracking-widest font-bold">
            02 / RECOMMENDED EVOLUTION ROADMAP
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-[#F8F8F6] border border-[#E2E2DF] p-4 space-y-2">
              <span className="px-2 py-0.5 bg-[#E55836]/10 text-[#E55836] border border-[#E55836]/30 text-[10px] uppercase font-bold">
                PHASE 1 (WEEKS 1-4)
              </span>
              <h4 className="font-bold text-[#0D0D0B] pt-1">Decouple Ingestion</h4>
              <p className="text-[#555550] text-[11px] leading-relaxed">
                Introduce Redis Queue for write buffering. Deploy PgBouncer connection pooler in front of {stack.database}.
              </p>
            </div>

            <div className="bg-[#F8F8F6] border border-[#E2E2DF] p-4 space-y-2">
              <span className="px-2 py-0.5 bg-[#FCDD2D] text-[#0D0D0B] border border-[#0D0D0B] text-[10px] uppercase font-bold">
                PHASE 2 (MONTHS 2-3)
              </span>
              <h4 className="font-bold text-[#0D0D0B] pt-1">Read Replicas &amp; Cache</h4>
              <p className="text-[#555550] text-[11px] leading-relaxed">
                Provision read-replica database instances. Implement Redis cache layer with strict TTL policies for hot read queries.
              </p>
            </div>

            <div className="bg-[#F8F8F6] border border-[#E2E2DF] p-4 space-y-2">
              <span className="px-2 py-0.5 bg-[#89FA91] text-[#0D0D0B] border border-[#0D0D0B] text-[10px] uppercase font-bold">
                PHASE 3 (MONTHS 4-6)
              </span>
              <h4 className="font-bold text-[#0D0D0B] pt-1">Event Bus Migration</h4>
              <p className="text-[#555550] text-[11px] leading-relaxed">
                Transition cross-service communication to asynchronous NATS JetStream event bus on {stack.cloud}.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Technology Trade-off Decision Matrix */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs text-[#0D0D0B] uppercase tracking-widest font-bold">
            03 / TECHNOLOGY TRADE-OFF DECISION MATRIX
          </h3>

          <div className="bg-[#FFFFFF] border border-[#E2E2DF] overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#E2E2DF] bg-[#F8F8F6] text-[#0D0D0B]">
                  <th className="p-3 font-bold">ARCHITECTURE AREA</th>
                  <th className="p-3 font-bold">PROPOSED ALTERNATIVE</th>
                  <th className="p-3 font-bold">KEY TRADE-OFF</th>
                  <th className="p-3 text-right font-bold">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E2DF] text-[#0D0D0B]">
                <tr>
                  <td className="p-3 text-[#555550]">Database Scaling</td>
                  <td className="p-3 font-bold text-[#0D0D0B]">{stack.database} Read Replicas</td>
                  <td className="p-3 text-[#555550]">Eventual consistency lag (~50ms)</td>
                  <td className="p-3 text-right font-bold text-[#0D0D0B] bg-[#89FA91]/30">RECOMMENDED (Phase 1)</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#555550]">Async Messages</td>
                  <td className="p-3 font-bold text-[#0D0D0B]">NATS JetStream vs Kafka</td>
                  <td className="p-3 text-[#555550]">Kafka requires heavy ZooKeeper/KRaft ops</td>
                  <td className="p-3 text-right font-bold text-[#0D0D0B] bg-[#89FA91]/30">ADOPT NATS (Phase 3)</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#555550]">Compute Platform</td>
                  <td className="p-3 font-bold text-[#0D0D0B]">Keep {stack.cloud} Fargate</td>
                  <td className="p-3 text-[#555550]">Kubernetes migration too high overhead</td>
                  <td className="p-3 text-right font-bold text-[#0D0D0B] bg-[#FCDD2D]/40">RETAIN CURRENT INFRA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="pt-4 border-t border-[#E2E2DF] flex items-center justify-between font-mono text-xs">
          <span className="text-[#888880] uppercase">
            SCALEPILOT ENTERPRISE REPORT ENGINE
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-wider font-bold cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
