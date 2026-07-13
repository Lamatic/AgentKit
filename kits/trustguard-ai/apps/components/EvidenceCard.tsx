// components/EvidenceCard.tsx
"use client";

import { motion } from "framer-motion";
import type { EvidenceData } from "@/types/response";

const SECTION_CONFIG: {
  key: keyof EvidenceData;
  label: string;
  color: string;
  icon: string;
}[] = [
  { key: "urls", label: "URLs", color: "bg-blue-500/20 text-blue-300 border border-blue-500/30", icon: "🔗" },
  { key: "domains", label: "Domains", color: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30", icon: "🌐" },
  { key: "money_amounts", label: "Money", color: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30", icon: "💰" },
  { key: "phone_numbers", label: "Phones", color: "bg-green-500/20 text-green-300 border border-green-500/30", icon: "📞" },
  { key: "emails", label: "Emails", color: "bg-pink-500/20 text-pink-300 border border-pink-500/30", icon: "✉️" },
  { key: "languages", label: "Languages", color: "bg-purple-500/20 text-purple-300 border border-purple-500/30", icon: "🌍" },
  { key: "urgency_phrases", label: "Urgency", color: "bg-red-500/20 text-red-300 border border-red-500/30", icon: "⚡" },
  { key: "entities", label: "Entities", color: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30", icon: "🏷️" },
  { key: "attachments", label: "Attachments", color: "bg-orange-500/20 text-orange-300 border border-orange-500/30", icon: "📎" },
  { key: "brands", label: "Brands", color: "bg-teal-500/20 text-teal-300 border border-teal-500/30", icon: "🏢" },
];

interface EvidenceCardProps {
  evidence: EvidenceData;
  delay?: number;
}

export default function EvidenceCard({ evidence, delay = 0 }: EvidenceCardProps) {
  const hasAny = SECTION_CONFIG.some((s) => (evidence[s.key] as string[]).length > 0);

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
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">Evidence</h3>
      </div>

      {/* Scrollable badge list */}
      <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-3 pr-1 scrollbar-thin">
        {!hasAny ? (
          <p className="text-xs text-slate-500 italic">No evidence items extracted.</p>
        ) : (
          SECTION_CONFIG.map(({ key, label, color, icon }) => {
            const items = evidence[key] as string[];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {icon} {label} ({items.length})
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
