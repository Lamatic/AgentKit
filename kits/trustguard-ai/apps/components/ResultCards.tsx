// components/ResultCards.tsx
"use client";

import { motion } from "framer-motion";
import EvidenceCard from "@/components/EvidenceCard";
import ThreatCard from "@/components/ThreatCard";
import DecisionCard from "@/components/DecisionCard";
import type { InvestigationResponse } from "@/types/response";

interface ResultCardsProps {
  data: InvestigationResponse;
}

const CardWrapper = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: "easeOut" }}
    className="h-full"
  >
    {children}
  </motion.div>
);

// Generic info card (Investigation, Normalized)
function InfoCard({
  title,
  icon,
  iconBg,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm text-slate-200 leading-relaxed">{value ?? "—"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive =
    status?.toLowerCase() === "active" || status?.toLowerCase() === "open";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
        isActive
          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
          : "bg-slate-500/20 text-slate-300 border-slate-500/40"
      }`}
    >
      {status ?? "—"}
    </span>
  );
}

export default function ResultCards({ data }: ResultCardsProps) {
  const { investigation, normalized, evidence, analysis, decision } = data;

  return (
    <section aria-label="Investigation Results" className="mt-10">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">
          Investigation Results
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </motion.div>

      {/* Card Grid — 2 col desktop/tablet, 1 col phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card 1 — Investigation */}
        <CardWrapper delay={0.05}>
          <InfoCard
            title="Investigation"
            delay={0.05}
            iconBg="bg-cyan-500/20 text-cyan-400"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          >
            <Field label="Investigation ID" value={investigation.id} />
            <Field label="Title" value={investigation.title} />
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Status
              </p>
              <StatusBadge status={investigation.status} />
            </div>
            <Field label="Workflow" value={investigation.workflow} />
            <Field label="Language" value={investigation.language} />
          </InfoCard>
        </CardWrapper>

        {/* Card 2 — Normalized Content */}
        <CardWrapper delay={0.1}>
          <InfoCard
            title="Normalized Content"
            delay={0.1}
            iconBg="bg-blue-500/20 text-blue-400"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            }
          >
            <Field label="Detected Type" value={normalized.detected_input_type} />
            <Field label="Summary" value={normalized.summary} />
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Clean Text
              </p>
              <div className="max-h-32 overflow-y-auto rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {normalized.clean_text ?? "—"}
                </p>
              </div>
            </div>
          </InfoCard>
        </CardWrapper>

        {/* Card 3 — Evidence */}
        <CardWrapper delay={0.15}>
          <EvidenceCard evidence={evidence} delay={0.15} />
        </CardWrapper>

        {/* Card 4 — Threat Analysis */}
        <CardWrapper delay={0.2}>
          <ThreatCard analysis={analysis} delay={0.2} />
        </CardWrapper>

        {/* Card 5 — Decision (full width) */}
        <div className="md:col-span-2">
          <CardWrapper delay={0.25}>
            <DecisionCard decision={decision} delay={0.25} />
          </CardWrapper>
        </div>
      </div>
    </section>
  );
}
