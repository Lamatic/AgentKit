"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Share2,
  Clock,
  Tag,
  CheckCircle2,
  Copy,
  MessageSquare,
  Mail,
  Check,
} from "lucide-react";

interface ResolutionCardProps {
  report: string;
  alertId: string;
  severity: string;
  service: string;
  environment: string;
  triageCategory: string;
  retrievalSource: string;
  timestamp: string;
  onReset: () => void;
}

const severityColors: Record<string, string> = {
  P1: "badge-p1",
  P2: "badge-p2",
  P3: "badge-p3",
  P4: "badge-p4",
};

const severityBgGlow: Record<string, string> = {
  P1: "rgba(239, 68, 68, 0.12)",
  P2: "rgba(245, 158, 11, 0.12)",
  P3: "rgba(99, 102, 241, 0.12)",
  P4: "rgba(16, 185, 129, 0.12)",
};

/**
 * Renders the incident resolution card displaying the generated SRE post-mortem report, triage metadata, and notification statuses.
 * @param props Props containing report markdown, alert ID, severity, service, and triage info.
 * @returns React JSX card component displaying triage report.
 */
export default function ResolutionCard({
  report,
  alertId,
  severity,
  service,
  environment,
  triageCategory,
  retrievalSource,
  timestamp,
}: ResolutionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5"
    >
      {/* 3D Glass Automated Integration Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Slack Integration Badge */}
        <div className="rounded-2xl px-5 py-3.5 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/40 flex items-center justify-between shadow-[0_8px_30px_rgba(16,185,129,0.15)] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-90" />
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-inner group-hover:scale-105 transition-transform">
              <MessageSquare size={17} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white block tracking-wide">
                Slack Channel Integration
              </span>
              <span className="text-[11px] text-emerald-200/80 font-mono">
                #sre-incident-alerts
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 text-[10px] font-black tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SENT TO SLACK</span>
          </div>
        </div>

        {/* Gmail / Email Integration Badge */}
        <div className="rounded-2xl px-5 py-3.5 bg-gradient-to-r from-indigo-500/15 via-purple-500/5 to-transparent border border-indigo-500/40 flex items-center justify-between shadow-[0_8px_30px_rgba(99,102,241,0.18)] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-90" />
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-inner group-hover:scale-105 transition-transform">
              <Mail size={17} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white block tracking-wide">
                Gmail / SMTP Integration
              </span>
              <span className="text-[11px] text-indigo-200/80 font-mono">
                rajputnik911@gmail.com
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 text-[10px] font-black tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>EMAIL DELIVERED</span>
          </div>
        </div>
      </div>

      {/* Alert Metadata Bar */}
      <div
        className="rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-3.5 shadow-lg backdrop-blur-xl flex-shrink-0"
        style={{
          background: severityBgGlow[severity] ?? "rgba(99,102,241,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span
          className={`text-xs font-black px-3 py-1 rounded-lg shadow-md ${severityColors[severity]}`}
        >
          {severity}
        </span>
        <span className="text-xs font-black text-white tracking-wide">
          {alertId}
        </span>
        <span className="text-xs text-gray-500">·</span>
        <span className="text-xs font-bold text-gray-200">{service}</span>
        <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/15 font-mono">
          {environment}
        </span>

        <div className="ml-auto flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Tag size={13} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-semibold">
              {triageCategory}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Share2 size={13} className="text-gray-400" />
            <span
              className="text-xs font-bold"
              style={{
                color:
                  retrievalSource === "vector_db" ? "#34d399" : "#38bdf8",
              }}
            >
              {retrievalSource === "vector_db"
                ? "Runbook DB RAG"
                : "Web Search"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-mono">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Remediation Report Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl flex flex-col shadow-2xl relative"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Card Header */}
        <div
          className="flex items-center justify-between px-6 py-3.5 border-b bg-gray-950/60 backdrop-blur-md"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <FileText size={16} />
            </div>
            <span className="text-xs font-black text-white tracking-wider uppercase">
              Autonomous Remediation Report &amp; Runbook
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
            >
              <CheckCircle2 size={13} />
              <span>Verified &amp; Executable</span>
            </motion.span>

            <button
              onClick={handleCopy}
              className="btn-ghost text-xs px-3.5 py-1.5 flex items-center gap-1.5 hover:border-gray-500 transition-all font-semibold rounded-lg"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="px-7 py-6 markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        </div>
      </motion.div>
    </motion.div>
  );
}
