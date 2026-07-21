"use client";

import React, { useState } from "react";

const DIMENSIONS = [
  { id: "DIM-01", name: "Concurrency & Connection Pooling", status: "CRITICAL" },
  { id: "DIM-02", name: "Read/Write Amplification & Indexing", status: "WARNING" },
  { id: "DIM-03", name: "Fault Isolation & Blast Radius", status: "PASSED" },
  { id: "DIM-04", name: "Cache Invalidation & Hit Ratio", status: "WARNING" },
  { id: "DIM-05", name: "State Isolation & Memory Leaks", status: "PASSED" },
  { id: "DIM-06", name: "Zero-Downtime Schema Migrations", status: "CRITICAL" },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<number>(1);

  return (
    <section id="how-it-works" className="py-24 sm:py-28 border-b border-[#E2E2DF] reveal-on-scroll bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs text-[#0D0D0B] font-bold uppercase tracking-[0.15em] block">
              02 / THE METHODOLOGY
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#0D0D0B] tracking-tight">
              Principal Architecture Intelligence.
            </h2>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#555550] max-w-md">
            Three steps from raw codebase architecture inputs to an actionable, phase-by-phase evolution report.
          </p>
        </div>

        {/* 3-Step Horizontal Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Connecting arrow indicator for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-[32%] -translate-y-1/2 text-[#E2E2DF] font-mono text-xl z-20 pointer-events-none">
            →
          </div>
          <div className="hidden lg:block absolute top-1/2 left-[65%] -translate-y-1/2 text-[#E2E2DF] font-mono text-xl z-20 pointer-events-none">
            →
          </div>

          {/* Step 01 */}
          <div
            onClick={() => setActiveTab(1)}
            className={`bg-[#F8F8F6] border ${
              activeTab === 1 ? "border-[#0D0D0B]" : "border-[#E2E2DF]"
            } p-6 sm:p-7 space-y-5 cursor-pointer transition-colors relative group`}
          >
            <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
              <span className="font-mono text-xs font-bold text-[#0D0D0B] tracking-widest px-2 py-0.5 bg-[#FCDD2D] border border-[#0D0D0B]">
                STEP 01
              </span>
              <span className="font-mono text-[10px] text-[#888880] uppercase">
                INPUT PARAMETERS
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
              Describe your stack
            </h3>

            {/* Input Form Preview Mockup */}
            <div className="bg-[#FFFFFF] border border-[#E2E2DF] p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-[#555550]">
                <span>RUNTIME:</span>
                <span className="text-[#0D0D0B] font-bold border border-[#E2E2DF] px-2 py-0.5 bg-[#F8F8F6]">
                  Node.js / Go microservices
                </span>
              </div>
              <div className="flex justify-between items-center text-[#555550]">
                <span>DATABASE:</span>
                <span className="text-[#0D0D0B] border border-[#E2E2DF] px-2 py-0.5 bg-[#F8F8F6]">
                  PostgreSQL (1 Primary, 0 Replicas)
                </span>
              </div>
              <div className="flex justify-between items-center text-[#555550]">
                <span>CLOUD PROVIDER:</span>
                <span className="text-[#0D0D0B] border border-[#E2E2DF] px-2 py-0.5 bg-[#F8F8F6]">
                  AWS ECS Fargate
                </span>
              </div>
              <div className="flex justify-between items-center text-[#555550]">
                <span>USER TIER:</span>
                <span className="text-[#0D0D0B] font-bold bg-[#FCDD2D] border border-[#0D0D0B] px-2 py-0.5">
                  150,000 Active Users
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-[#555550] leading-relaxed">
              Define your tech stack, primary database engines, current request throughput, and known operational pain points.
            </p>
          </div>

          {/* Step 02 */}
          <div
            onClick={() => setActiveTab(2)}
            className={`bg-[#F8F8F6] border ${
              activeTab === 2 ? "border-[#0D0D0B]" : "border-[#E2E2DF]"
            } p-6 sm:p-7 space-y-5 cursor-pointer transition-colors relative group`}
          >
            <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
              <span className="font-mono text-xs font-bold text-[#0D0D0B] tracking-widest px-2 py-0.5 bg-[#FCDD2D] border border-[#0D0D0B]">
                STEP 02
              </span>
              <span className="font-mono text-[10px] text-[#888880] uppercase">
                DEEP ENGINE AUDIT
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
              AI analyzes 20+ dimensions
            </h3>

            {/* Collapsed List of Analysis Dimensions */}
            <div className="bg-[#FFFFFF] border border-[#E2E2DF] p-3 space-y-1.5 font-mono text-[11px]">
              {DIMENSIONS.map((dim) => (
                <div key={dim.id} className="flex items-center justify-between py-1 border-b border-[#E2E2DF]/60 last:border-0">
                  <span className="text-[#555550] truncate">{dim.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-bold ${
                      dim.status === "CRITICAL"
                        ? "text-[#E55836] bg-[#E55836]/10 border border-[#E55836]/30"
                        : dim.status === "WARNING"
                        ? "text-[#0D0D0B] bg-[#FCDD2D] border border-[#0D0D0B]"
                        : "text-[#0D0D0B] bg-[#89FA91] border border-[#0D0D0B]"
                    }`}
                  >
                    {dim.status}
                  </span>
                </div>
              ))}
            </div>

            <p className="font-sans text-xs text-[#555550] leading-relaxed">
              Evaluates system boundaries, single points of failure, connection saturation thresholds, and cloud cost trajectories.
            </p>
          </div>

          {/* Step 03 */}
          <div
            onClick={() => setActiveTab(3)}
            className={`bg-[#F8F8F6] border ${
              activeTab === 3 ? "border-[#0D0D0B]" : "border-[#E2E2DF]"
            } p-6 sm:p-7 space-y-5 cursor-pointer transition-colors relative group`}
          >
            <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-3">
              <span className="font-mono text-xs font-bold text-[#0D0D0B] tracking-widest px-2 py-0.5 bg-[#FCDD2D] border border-[#0D0D0B]">
                STEP 03
              </span>
              <span className="font-mono text-[10px] text-[#888880] uppercase">
                EXECUTIVE DELIVERABLE
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
              Get your evolution report
            </h3>

            {/* Flat Report Preview Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E2DF] p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-[#E2E2DF] pb-2">
                <span className="text-[#0D0D0B] font-bold">REPORT SECTIONS:</span>
                <span className="text-[#0D0D0B] font-bold bg-[#89FA91] px-1.5 py-0.5 border border-[#0D0D0B]">100% READY</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-[#555550]">
                <div className="flex items-center gap-2">
                  <span className="text-[#0D0D0B] font-bold">✓</span>
                  <span>1. Executive Bottleneck Summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#0D0D0B] font-bold">✓</span>
                  <span>2. Phase 1-3 Migration Roadmap</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#0D0D0B] font-bold">✓</span>
                  <span>3. Technology Trade-off Matrix</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#0D0D0B] font-bold">✓</span>
                  <span>4. Cost &amp; Latency Benchmark Projections</span>
                </div>
              </div>
            </div>

            <p className="font-sans text-xs text-[#555550] leading-relaxed">
              Receive a production-ready document formatted like a Principal Architect consult report — ready for engineering management &amp; CTO review.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
