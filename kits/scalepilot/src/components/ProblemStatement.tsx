"use client";

import React from "react";

export function ProblemStatement() {
  return (
    <section id="problem" className="py-24 sm:py-28 border-b border-[#E2E2DF] reveal-on-scroll bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Identifier */}
        <div className="space-y-2 mb-12">
          <span className="font-mono text-xs text-[#0D0D0B] font-bold uppercase tracking-[0.15em] block">
            01 / THE BOTTLENECK
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#0D0D0B] tracking-tight">
            Every startup hits the wall.
          </h2>
        </div>

        {/* 3 Columns Grid with Left-Border Accents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Column 1: Mint Accent */}
          <div className="bg-[#F8F8F6] border border-[#E2E2DF] border-l-4 border-l-[#89FA91] p-6 space-y-3">
            <div className="font-mono text-[10px] text-[#0D0D0B] font-bold uppercase tracking-widest">
              01. API PERFORMANCE
            </div>
            <h3 className="font-display text-xl font-bold text-[#0D0D0B]">
              APIs become slow
            </h3>
            <p className="font-sans text-sm text-[#555550] leading-relaxed">
              Monolithic endpoints bottleneck under high concurrency. P99 latency spikes above 2.4s during peak traffic.
            </p>
          </div>

          {/* Column 2: Gold Accent */}
          <div className="bg-[#F8F8F6] border border-[#E2E2DF] border-l-4 border-l-[#FCDD2D] p-6 space-y-3">
            <div className="font-mono text-[10px] text-[#0D0D0B] font-bold uppercase tracking-widest">
              02. DATA STORAGE
            </div>
            <h3 className="font-display text-xl font-bold text-[#0D0D0B]">
              Database bottlenecks
            </h3>
            <p className="font-sans text-sm text-[#555550] leading-relaxed">
              Unindexed query cascades lock primary PostgreSQL instances. Write amplification degrades throughput.
            </p>
          </div>

          {/* Column 3: Coral Accent */}
          <div className="bg-[#F8F8F6] border border-[#E2E2DF] border-l-4 border-l-[#E55836] p-6 space-y-3">
            <div className="font-mono text-[10px] text-[#E55836] font-bold uppercase tracking-widest">
              03. INFRASTRUCTURE
            </div>
            <h3 className="font-display text-xl font-bold text-[#0D0D0B]">
              Deployments break
            </h3>
            <p className="font-sans text-sm text-[#555550] leading-relaxed">
              Coupled microservices fail during zero-downtime migrations. Blast radius expands without fault domain isolation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
