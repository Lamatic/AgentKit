"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, FileCode2, ArrowLeft } from "lucide-react";
import { auditDockerfile } from "@/actions/orchestrate";
import { AuditReportView } from "@/components/audit-report";
import { ExportMenu } from "@/components/export-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { SAMPLE_DOCKERFILE } from "@/lib/sample";
import type { AuditReport, FileType } from "@/lib/types";

export default function Home() {
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<FileType>("dockerfile");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [auditedSource, setAuditedSource] = useState("");
  const [error, setError] = useState("");

  async function runAudit() {
    if (!content.trim()) {
      setError("Paste a Dockerfile or compose file first.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await auditDockerfile(content, fileType);
    if (res.success) {
      setReport(res.report);
      setAuditedSource(content);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }

  const lineCount = auditedSource ? auditedSource.replace(/\s+$/, "").split(/\r?\n/).length : 0;

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-bg">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="font-semibold tracking-tight text-fg">DockerGuard</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-10">
        {!report ? (
          /* ---- Input state: calm, centered ---- */
          <div className="mx-auto max-w-[640px]">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">
              Audit a Dockerfile before you build it
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-secondary">
              Paste a Dockerfile or docker-compose file. Get a scored security and best-practice
              review — every issue shows the line, why it matters, and the fix.
            </p>

            <div className="mt-6 rounded-card border border-hairline bg-surface p-4 shadow-subtle">
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex rounded-md border border-hairline p-0.5 text-sm">
                  {(["dockerfile", "compose"] as FileType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFileType(t)}
                      aria-pressed={fileType === t}
                      className={
                        fileType === t
                          ? "rounded px-3 py-1 font-medium text-accent-fg"
                          : "rounded px-3 py-1 text-fg-muted hover:text-fg"
                      }
                      style={fileType === t ? { background: "var(--accent)" } : undefined}
                    >
                      {t === "dockerfile" ? "Dockerfile" : "docker-compose"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setContent(SAMPLE_DOCKERFILE)}
                  className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
                >
                  <FileCode2 className="h-4 w-4" />
                  Load example
                </button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                aria-label="Dockerfile or docker-compose source"
                spellCheck={false}
                placeholder={"FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\n..."}
                className="h-64 w-full resize-y rounded-md border border-hairline bg-bg-alt p-3 font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-fg-muted focus:border-accent"
              />

              {error && (
                <p
                  data-sev="critical"
                  className="mt-3 rounded-md px-3 py-2 text-sm"
                  style={{ background: "var(--sev-bg)", color: "var(--sev-text)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={runAudit}
                disabled={loading || !content.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium text-accent-fg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Auditing…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Run audit
                  </>
                )}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-fg-muted">
              Static analysis only. DockerGuard never builds, runs, or fetches anything.
            </p>
          </div>
        ) : (
          /* ---- Results state: dense, left-aligned ---- */
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-fg-secondary">
                <FileCode2 className="h-4 w-4 text-fg-muted" />
                <span className="font-mono text-fg">
                  {fileType === "dockerfile" ? "Dockerfile" : "docker-compose.yml"}
                </span>
                <span className="text-fg-muted">· {lineCount} lines</span>
              </div>
              <div className="flex items-center gap-2">
                <ExportMenu report={report} />
                <button
                  type="button"
                  onClick={() => setReport(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Audit another
                </button>
              </div>
            </div>

            <AuditReportView report={report} source={auditedSource} />
          </div>
        )}
      </main>
    </div>
  );
}
