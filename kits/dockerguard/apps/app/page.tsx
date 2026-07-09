"use client";

import { useState } from "react";
import { Loader2, Shield, ShieldCheck, FileCode } from "lucide-react";
import { auditDockerfile } from "@/actions/orchestrate";
import { AuditReportView } from "@/components/audit-report";
import { SAMPLE_DOCKERFILE } from "@/lib/sample";
import type { AuditReport, FileType } from "@/lib/types";

export default function Home() {
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<FileType>("dockerfile");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState("");

  async function handleAudit() {
    if (!content.trim()) {
      setError("Please paste a Dockerfile or compose file first.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);

    const res = await auditDockerfile(content, fileType);
    if (res.success) {
      setReport(res.report);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-sm text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Built on Lamatic.ai
        </div>
        <h1 className="flex items-center justify-center gap-2 text-4xl font-bold text-slate-100">
          <Shield className="h-8 w-8 text-emerald-400" />
          DockerGuard
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Paste a Dockerfile or docker-compose file. Get a scored security and
          best-practice audit, with the exact line, the reason, and the fix for
          every issue.
        </p>
      </header>

      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-700 p-0.5 text-sm">
            {(["dockerfile", "compose"] as FileType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFileType(t)}
                className={`rounded-md px-3 py-1 transition ${
                  fileType === t
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "dockerfile" ? "Dockerfile" : "docker-compose"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setContent(SAMPLE_DOCKERFILE)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            <FileCode className="h-4 w-4" />
            Load example
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="FROM node:20-alpine&#10;WORKDIR /app&#10;COPY package*.json ./&#10;RUN npm ci&#10;..."
          spellCheck={false}
          className="h-72 w-full resize-y rounded-lg border border-slate-700 bg-black/40 p-3 font-mono text-sm text-slate-200 outline-none focus:border-emerald-500/60"
        />

        {error && (
          <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAudit}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Auditing…
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Run audit
            </>
          )}
        </button>
      </section>

      {report && (
        <section className="mt-8">
          <AuditReportView report={report} />
        </section>
      )}

      <footer className="mt-12 text-center text-xs text-slate-600">
        DockerGuard performs static analysis of build files only. It does not
        build, run, or fetch anything.
      </footer>
    </main>
  );
}
