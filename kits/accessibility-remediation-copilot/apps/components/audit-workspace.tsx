"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Braces,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Code2,
  Download,
  ExternalLink,
  FileCode2,
  Filter,
  Globe2,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  auditRequestSchema,
  type AuditRequest,
  type AuditRequestInput,
  type AuditResult,
  type Severity,
} from "@/lib/audit-schema";

type Mode = "url" | "html";
type FilterValue = "all" | Severity;

const exampleHtml = `<html>
  <head><title>Account sign in</title></head>
  <body>
    <img src="brand-mark.png">
    <main>
      <h1>Welcome back</h1>
      <input type="email" placeholder="Email address">
      <button><svg aria-hidden="true"></svg></button>
      <a href="/help">Click here</a>
    </main>
  </body>
</html>`;

const severityOrder: Severity[] = ["critical", "serious", "moderate", "minor"];

const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor",
};

function resultToMarkdown(result: AuditResult) {
  const lines = [
    `# AccessFix audit — ${result.auditSummary.pageTitle}`,
    "",
    `- URL: ${result.auditSummary.url}`,
    `- Target: WCAG 2.2 ${result.auditSummary.targetLevel}`,
    `- Overall risk: ${result.auditSummary.overallRisk}`,
    `- Findings: ${result.auditSummary.totalFindings}`,
    "",
    result.auditSummary.executiveSummary,
    "",
    "## Findings",
  ];

  for (const finding of result.findings) {
    lines.push(
      "",
      `### ${finding.id} — ${finding.title}`,
      "",
      `**Severity:** ${finding.severity} · **Confidence:** ${finding.confidence}`,
      `**WCAG:** ${finding.wcagCriterion} (${finding.wcagLevel}) · ${finding.wcagPrinciple}`,
      "",
      `**Evidence:** ${finding.evidence}`,
      "",
      `**User impact:** ${finding.userImpact}`,
      "",
      `**Recommendation:** ${finding.recommendation}`,
      "",
      `**Manual verification:** ${finding.manualVerification}`,
    );
    if (finding.codeAfter) lines.push("", "```", finding.codeAfter, "```");
  }

  lines.push("", "## Manual checks");
  for (const check of result.manualChecks) {
    lines.push("", `### ${check.title}`, "", check.reason, "", ...check.steps.map((step) => `- ${step}`));
  }
  lines.push("", "## Limitations", "", ...result.limitations.map((item) => `- ${item}`), "", `> ${result.disclaimer}`);
  return lines.join("\n");
}

function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AuditWorkspace() {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AuditRequestInput, unknown, AuditRequest>({
    resolver: zodResolver(auditRequestSchema),
    defaultValues: {
      mode: "url",
      url: "",
      pageContent: "",
      framework: "nextjs",
      targetLevel: "AA",
    },
  });
  const mode: Mode = watch("mode");

  const filteredFindings = useMemo(
    () => result?.findings.filter((finding) => filter === "all" || finding.severity === filter) ?? [],
    [filter, result],
  );

  useEffect(() => {
    if (!result) return;
    document.querySelector("#audit-results")?.scrollIntoView({ behavior: "smooth" });
  }, [result]);

  async function submitAudit(values: AuditRequest) {
    setError("");
    setResult(null);
    setFilter("all");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { data?: AuditResult; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "The audit could not be completed.");
      setResult(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The audit could not be completed.");
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AccessFix home">
          <span className="brand-mark" aria-hidden="true"><ShieldCheck size={20} /></span>
          <span>AccessFix</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#manual-testing">Manual testing</a>
          <a className="github-link" href="https://github.com/Lamatic/AgentKit" target="_blank" rel="noreferrer">
            AgentKit <ExternalLink size={14} aria-hidden="true" />
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="eyebrow"><Sparkles size={15} aria-hidden="true" /> Lamatic AgentKit challenge</div>
          <h1 id="hero-title">Accessibility findings your team can actually fix.</h1>
          <p>
            Turn webpage evidence into prioritized WCAG 2.2 findings, framework-aware code fixes,
            and the human checks automation cannot replace.
          </p>
          <div className="trust-row" aria-label="AccessFix capabilities">
            <span><Check size={15} aria-hidden="true" /> Evidence grounded</span>
            <span><Check size={15} aria-hidden="true" /> WCAG mapped</span>
            <span><Check size={15} aria-hidden="true" /> No compliance theatre</span>
          </div>
        </section>

        <section className="audit-panel" aria-labelledby="audit-heading">
          <div className="panel-heading">
            <div>
              <span className="step-kicker">Start an audit</span>
              <h2 id="audit-heading">Give AccessFix page evidence</h2>
            </div>
            <span className="secure-note"><ShieldCheck size={16} aria-hidden="true" /> Server-side analysis</span>
          </div>

          <form onSubmit={handleSubmit(submitAudit)} noValidate>
            <div className="mode-tabs" role="tablist" aria-label="Audit input method">
              <Button variant="ghost" type="button" role="tab" aria-selected={mode === "url"} className={mode === "url" ? "active" : ""} onClick={() => setValue("mode", "url", { shouldValidate: true })}>
                <Globe2 size={17} aria-hidden="true" /> Public URL
              </Button>
              <Button variant="ghost" type="button" role="tab" aria-selected={mode === "html"} className={mode === "html" ? "active" : ""} onClick={() => setValue("mode", "html", { shouldValidate: true })}>
                <FileCode2 size={17} aria-hidden="true" /> Paste HTML
              </Button>
            </div>

            {mode === "url" ? (
              <label className="field-label">
                Webpage URL
                <span className="input-with-icon">
                  <Globe2 size={18} aria-hidden="true" />
                  <Input type="url" {...register("url")} placeholder="https://example.com/checkout" autoComplete="url" aria-invalid={Boolean(errors.url)} />
                </span>
                {errors.url && <small role="alert">{errors.url.message}</small>}
                <small>Public HTTP and HTTPS pages only. Private network addresses are blocked.</small>
              </label>
            ) : (
              <label className="field-label">
                Page HTML
                <Textarea {...register("pageContent")} placeholder="Paste the relevant page or component HTML…" rows={9} aria-invalid={Boolean(errors.pageContent)} />
                {errors.pageContent && <small role="alert">{errors.pageContent.message}</small>}
                <span className="field-footer"><small>Scripts and styles are removed before analysis.</small><Button variant="ghost" size="sm" type="button" className="text-button !h-auto !p-0" onClick={() => { setValue("pageContent", exampleHtml, { shouldValidate: true }); setValue("url", "https://example.com/sign-in"); }}>Use safe example</Button></span>
              </label>
            )}

            <div className="form-grid">
              <label className="field-label">
                Implementation
                <span className="select-wrap">
                  <Code2 size={17} aria-hidden="true" />
                  <Select {...register("framework")}>
                    <option value="nextjs">Next.js / React</option>
                    <option value="react">React</option>
                    <option value="html">HTML</option>
                  </Select>
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
              <label className="field-label">
                Target level
                <span className="select-wrap">
                  <ClipboardCheck size={17} aria-hidden="true" />
                  <Select {...register("targetLevel")}>
                    <option value="A">WCAG 2.2 A</option>
                    <option value="AA">WCAG 2.2 AA</option>
                    <option value="AAA">WCAG 2.2 AAA</option>
                  </Select>
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
            </div>

            {error && <div className="error-message" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span></div>}

            <Button className="primary-button" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><LoaderCircle className="spinner" size={19} aria-hidden="true" /> Auditing evidence…</> : <><SearchCheck size={19} aria-hidden="true" /> Run accessibility audit <ArrowRight size={18} aria-hidden="true" /></>}
            </Button>
          </form>
        </section>

        <section className="process-section" id="how-it-works" aria-labelledby="process-title">
          <div className="section-heading"><span className="step-kicker">A practical workflow</span><h2 id="process-title">From evidence to an engineering plan</h2></div>
          <div className="process-grid">
            <article><span>01</span><Braces aria-hidden="true" /><h3>Inspect evidence</h3><p>Analyze semantic HTML and attributes without inventing browser behavior.</p></article>
            <article><span>02</span><CircleAlert aria-hidden="true" /><h3>Prioritize barriers</h3><p>Map supported findings to severity, affected users, and WCAG 2.2.</p></article>
            <article><span>03</span><Wrench aria-hidden="true" /><h3>Plan remediation</h3><p>Generate framework-aware fixes and concrete verification instructions.</p></article>
          </div>
        </section>

        {result && (
          <section className="results-section" id="audit-results" aria-labelledby="results-title" tabIndex={-1}>
            <div className="results-heading">
              <div><span className="step-kicker">Audit complete</span><h2 id="results-title">{result.auditSummary.pageTitle}</h2><p>{result.auditSummary.executiveSummary}</p></div>
              <div className="export-actions">
                <button type="button" onClick={() => downloadFile("accessfix-audit.json", JSON.stringify(result, null, 2), "application/json")}><Download size={16} aria-hidden="true" /> JSON</button>
                <button type="button" onClick={() => downloadFile("accessfix-audit.md", resultToMarkdown(result), "text/markdown")}><Download size={16} aria-hidden="true" /> Markdown</button>
              </div>
            </div>

            <div className="summary-grid">
              <article className="risk-card"><span>Overall risk</span><strong>{result.auditSummary.overallRisk}</strong><small>Target: WCAG 2.2 {result.auditSummary.targetLevel}</small></article>
              {severityOrder.map((severity) => (
                <article className={`metric-card ${severity}`} key={severity}><span>{severityLabels[severity]}</span><strong>{result.auditSummary[`${severity}Count` as keyof typeof result.auditSummary] as number}</strong></article>
              ))}
            </div>

            <div className="findings-toolbar">
              <h3>Supported findings <span>{result.findings.length}</span></h3>
              <div className="filter-group" aria-label="Filter findings by severity"><Filter size={16} aria-hidden="true" /><select aria-label="Severity filter" value={filter} onChange={(event) => setFilter(event.target.value as FilterValue)}><option value="all">All severities</option>{severityOrder.map((severity) => <option value={severity} key={severity}>{severityLabels[severity]}</option>)}</select></div>
            </div>

            <div className="finding-list">
              {filteredFindings.length === 0 ? <div className="empty-state"><ShieldCheck size={28} aria-hidden="true" /><h3>No supported findings in this view</h3><p>This does not establish WCAG conformance. Complete the manual checks below.</p></div> : filteredFindings.map((finding) => (
                <details className={`finding-card ${finding.severity}`} key={finding.id}>
                  <summary>
                    <span className="severity-dot" aria-hidden="true" />
                    <span className="finding-title"><small>{finding.id} · {finding.wcagCriterion} · Level {finding.wcagLevel}</small><strong>{finding.title}</strong></span>
                    <span className={`severity-badge ${finding.severity}`}>{finding.severity}</span>
                    <ChevronDown className="details-chevron" size={20} aria-hidden="true" />
                  </summary>
                  <div className="finding-body">
                    <div className="finding-main">
                      <section><h4>Evidence</h4><p>{finding.evidence}</p>{finding.selector && <code className="selector-code">{finding.selector}</code>}</section>
                      <section><h4>User impact</h4><p>{finding.userImpact}</p><div className="user-tags"><Users size={15} aria-hidden="true" />{finding.affectedUsers.map((user) => <span key={user}>{user}</span>)}</div></section>
                      <section><h4>Recommended fix</h4><p>{finding.recommendation}</p>{finding.codeAfter && <pre><code>{finding.codeAfter}</code></pre>}</section>
                    </div>
                    <aside><span>Confidence</span><strong>{finding.confidence}</strong><span>Principle</span><strong>{finding.wcagPrinciple}</strong><span>Verify manually</span><p>{finding.manualVerification}</p></aside>
                  </div>
                </details>
              ))}
            </div>

            <div className="support-grid" id="manual-testing">
              <section className="manual-panel"><div className="support-heading"><ClipboardCheck aria-hidden="true" /><div><span className="step-kicker">Human verification</span><h3>Manual test plan</h3></div></div>{result.manualChecks.map((check, index) => <article key={`${check.title}-${index}`}><h4>{check.title}</h4><p>{check.reason}</p><ol>{check.steps.map((step) => <li key={step}>{step}</li>)}</ol></article>)}</section>
              <aside className="quick-panel"><div className="support-heading"><Sparkles aria-hidden="true" /><div><span className="step-kicker">Start here</span><h3>Quick wins</h3></div></div><ul>{result.quickWins.map((win) => <li key={win}><Check size={16} aria-hidden="true" />{win}</li>)}</ul><div className="limitations"><h4>Audit limitations</h4><ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div></aside>
            </div>
            <p className="disclaimer"><CircleAlert size={17} aria-hidden="true" />{result.disclaimer}</p>
          </section>
        )}
      </main>

      <footer><div className="brand"><span className="brand-mark" aria-hidden="true"><ShieldCheck size={18} /></span><span>AccessFix</span></div><p>Evidence-led accessibility remediation. Built with Lamatic AgentKit.</p></footer>
    </div>
  );
}
