// components/EvidenceCard.tsx
"use client";

import { motion } from "framer-motion";
import { ClipboardList, Link2, Globe, DollarSign, Phone, Mail, Languages, Zap, Tag, Paperclip, Building2 } from "lucide-react";
import type { EvidenceData } from "@/types/response";
import type { ElementType } from "react";

const SECTION_CONFIG: ReadonlyArray<{
  readonly key: keyof EvidenceData;
  readonly label: string;
  readonly color: string;
  readonly icon: ElementType;
}> = [
    { key: "urls", label: "URLs", color: "bg-blue-500/20 text-blue-300 border border-blue-500/30", icon: Link2 },
    { key: "domains", label: "Domains", color: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30", icon: Globe },
    { key: "money_amounts", label: "Money", color: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30", icon: DollarSign },
    { key: "phone_numbers", label: "Phones", color: "bg-green-500/20 text-green-300 border border-green-500/30", icon: Phone },
    { key: "emails", label: "Emails", color: "bg-pink-500/20 text-pink-300 border border-pink-500/30", icon: Mail },
    { key: "languages", label: "Languages", color: "bg-purple-500/20 text-purple-300 border border-purple-500/30", icon: Languages },
    { key: "urgency_phrases", label: "Urgency", color: "bg-red-500/20 text-red-300 border border-red-500/30", icon: Zap },
    { key: "entities", label: "Entities", color: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30", icon: Tag },
    { key: "attachments", label: "Attachments", color: "bg-orange-500/20 text-orange-300 border border-orange-500/30", icon: Paperclip },
    { key: "brands", label: "Brands", color: "bg-teal-500/20 text-teal-300 border border-teal-500/30", icon: Building2 },
  ];

interface EvidenceCardProps {
  readonly evidence: EvidenceData;
  readonly delay?: number;
}

/**
 * Result card that renders all extracted evidence items from the investigation
 * as colour-coded pill badges grouped by evidence category.
 *
 * Iterates over the static `SECTION_CONFIG` to determine which evidence
 * categories (URLs, domains, emails, etc.) have items and renders them
 * in a scrollable badge grid.  Shows a placeholder message when the flow
 * returned no evidence at all.
 *
 * @param evidence - Validated evidence data returned by the Lamatic flow.
 * @param delay    - Framer Motion entry delay in seconds (default `0`).
 * @returns An animated card element containing the evidence badge grid.
 */
export default function EvidenceCard({ evidence, delay = 0 }: EvidenceCardProps) {
  const hasAny = SECTION_CONFIG.some((s) => {
    const items = evidence[s.key];
    return Array.isArray(items) && items.length > 0;
  });

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-white">Evidence</h3>
      </div>

      {/* Scrollable badge list */}
      <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-3 pr-1 scrollbar-thin">
        {!hasAny ? (
          <p className="text-xs text-slate-500 italic">No evidence items extracted.</p>
        ) : (
          SECTION_CONFIG.map(({ key, label, color, icon: Icon }) => {
            const items = evidence[key];
            if (!Array.isArray(items) || items.length === 0) return null;
            return (
              <div key={key}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Icon className="w-3 h-3" aria-hidden="true" /> {label} ({items.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium max-w-[200px] truncate ${color}`}
                      title={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
