// components/ResultCards.tsx
"use client";

import { motion } from "framer-motion";
import { Search, AlignLeft } from "lucide-react";
import EvidenceCard from "@/components/EvidenceCard";
import ThreatCard from "@/components/ThreatCard";
import DecisionCard from "@/components/DecisionCard";
import type { InvestigationResponse } from "@/types/response";

interface ResultCardsProps {
  readonly data: InvestigationResponse;
}

/**
 * Motion wrapper that applies a staggered fade-and-slide entrance animation
 * to any result card it contains.
 *
 * @param children - The card component to animate.
 * @param delay    - Framer Motion entry delay in seconds (default `0`).
 * @returns An animated `<div>` that wraps its child with full height.
 */
const CardWrapper = ({
  children,
  delay = 0,
}: {
  readonly children: React.ReactNode;
  readonly delay?: number;
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
/**
 * Generic glassmorphic card shell used for the Investigation and Normalized
 * Content panels in the result grid.
 *
 * Renders a rounded card with a heading row (icon + title) followed by a
 * vertically stacked content slot for child field rows.
 *
 * @param title    - Card heading text shown next to the icon.
 * @param icon     - React node (typically a Lucide icon) displayed in the header.
 * @param iconBg   - Tailwind CSS class for the icon container background and text colour.
 * @param children - Field rows or other content rendered inside the card body.
 * @param delay    - Framer Motion entry delay in seconds (default `0`).
 * @returns An animated glassmorphic card element.
 */
function InfoCard({
  title,
  icon,
  iconBg,
  children,
}: {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly iconBg: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * Renders a single labelled field inside an `InfoCard`.
 *
 * Displays a small uppercase label above the field value.  When `value`
 * is `undefined` or empty, renders an em-dash as a placeholder.
 *
 * @param label - Uppercase section label for the field.
 * @param value - String value to display; renders `"—"` if `undefined`.
 * @returns A two-line label + value element.
 */
function Field({ label, value }: { readonly label: string; readonly value: string | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm text-slate-200 leading-relaxed">{value ?? "—"}</p>
    </div>
  );
}

/**
 * Inline badge that colour-codes an investigation status value.
 *
 * Applies a cyan colour scheme for statuses of `"active"` or `"open"`,
 * and a neutral slate colour for all other statuses.
 *
 * @param status - The raw status string from the investigation data.
 * @returns A small pill-shaped `<span>` badge with the status label.
 */
function StatusBadge({ status }: { readonly status: string }) {
  const isActive =
    status?.toLowerCase() === "active" || status?.toLowerCase() === "open";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${isActive
          ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/40"
          : "bg-slate-500/20 text-slate-300 border-slate-500/40"
        }`}
    >
      {status ?? "—"}
    </span>
  );
}

/**
 * Assembles all investigation result cards into a responsive two-column grid.
 *
 * Renders five cards from the validated flow response: Investigation metadata,
 * Normalized Content, Evidence badges, Threat Analysis (with risk meter), and
 * the full-width Decision card.  Each card enters the viewport with a
 * staggered animation delay.
 *
 * @param data - The complete validated investigation response from the
 *   Lamatic flow, containing all sub-objects required by the child cards.
 * @returns A `<section>` containing the full results grid.
 */
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
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-[var(--accent-cyan)]/30 to-transparent" />
        <h2 className="text-sm font-semibold text-[var(--accent-cyan)] uppercase tracking-widest">
          Investigation Results
        </h2>
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-[var(--accent-cyan)]/30 to-transparent" />
      </motion.div>

      {/* Card Grid — 2 col desktop/tablet, 1 col phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card 1 — Investigation */}
        <CardWrapper delay={0.05}>
          <InfoCard
            title="Investigation"
            iconBg="bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]"
            icon={<Search className="h-4 w-4" aria-hidden="true" />}
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
            iconBg="bg-blue-500/20 text-blue-400"
            icon={<AlignLeft className="h-4 w-4" aria-hidden="true" />}
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
          <EvidenceCard evidence={evidence} />
        </CardWrapper>

        {/* Card 4 — Threat Analysis */}
        <CardWrapper delay={0.2}>
          <ThreatCard analysis={analysis} />
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
