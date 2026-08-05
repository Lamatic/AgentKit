"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileArchive,
  LoaderCircle,
  Network,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UploadCloud,
  Workflow,
} from "lucide-react";

import { readWorkflowArchive } from "@/lib/archive-reader";
import { calculateBlastRadius } from "@/lib/blast-radius";
import { buildChangePackage } from "@/lib/change-package";
import { parseWorkflowExport } from "@/lib/flow-parser";
import { calculateRiskAssessment } from "@/lib/risk-score";
import { compareWorkflowExports } from "@/lib/structural-diff";

import type {
  ChangeGraphReport,
  PromotionDecision,
} from "@/types/changegraph";

interface AnalysisResponse {
  report?: ChangeGraphReport;
  warnings?: string[];
  error?: string;
  details?: string;
}

interface UploadPanelProps {
  id: string;
  title: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function decisionLabel(
  decision: PromotionDecision,
): string {
  switch (decision) {
    case "safe_to_promote":
      return "Safe to promote";

    case "manual_review_required":
      return "Manual review required";

    case "block_release":
      return "Release blocked";
  }
}

function summarizeValue(value: unknown): string {
  if (value === null) {
    return "Not present";
  }

  if (typeof value === "string") {
    return value.length > 400
      ? `${value.slice(0, 400)}…`
      : value;
  }

  try {
    const serialized = JSON.stringify(
      value,
      null,
      2,
    );

    return serialized.length > 700
      ? `${serialized.slice(0, 700)}…`
      : serialized;
  } catch {
    return String(value);
  }
}

function UploadPanel({
  id,
  title,
  description,
  file,
  onChange,
}: UploadPanelProps) {
  return (
    <label
      htmlFor={id}
      className={`upload-panel ${
        file ? "upload-panel-ready" : ""
      }`}
    >
      <input
        id={id}
        className="file-input"
        type="file"
        accept=".zip,application/zip"
        onChange={(event) => {
          onChange(
            event.target.files?.[0] ?? null,
          );
        }}
      />

      <span className="upload-icon">
        {file ? (
          <FileArchive size={26} />
        ) : (
          <UploadCloud size={26} />
        )}
      </span>

      <span className="upload-copy">
        <strong>
          {file ? file.name : title}
        </strong>

        <span>
          {file
            ? `${formatFileSize(file.size)} · Ready`
            : description}
        </span>
      </span>

      <span className="upload-action">
        {file ? "Replace" : "Browse"}
      </span>
    </label>
  );
}

export function ChangeGraphDashboard() {
  const [baselineFile, setBaselineFile] =
    useState<File | null>(null);

  const [candidateFile, setCandidateFile] =
    useState<File | null>(null);

  const [flowPurpose, setFlowPurpose] =
    useState(
      "Evaluate a Lamatic workflow release before production promotion.",
    );

  const [baselineVersion, setBaselineVersion] =
    useState("v1.0.0");

  const [candidateVersion, setCandidateVersion] =
    useState("v1.1.0");

  const [releaseContext, setReleaseContext] =
    useState(
      "Pre-deployment production release review.",
    );

  const [report, setReport] =
    useState<ChangeGraphReport | null>(null);

  const [warnings, setWarnings] =
    useState<string[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const canAnalyze = useMemo(
    () =>
      Boolean(
        baselineFile &&
          candidateFile &&
          flowPurpose.trim() &&
          baselineVersion.trim() &&
          candidateVersion.trim() &&
          releaseContext.trim(),
      ),
    [
      baselineFile,
      candidateFile,
      flowPurpose,
      baselineVersion,
      candidateVersion,
      releaseContext,
    ],
  );

  async function handleAnalyze(): Promise<void> {
    if (
      !baselineFile ||
      !candidateFile ||
      !canAnalyze
    ) {
      setError(
        "Select both ZIP exports and complete the release information.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setWarnings([]);

    try {
      const [
        baselineArchive,
        candidateArchive,
      ] = await Promise.all([
        readWorkflowArchive(baselineFile),
        readWorkflowArchive(candidateFile),
      ]);

      const baseline =
        parseWorkflowExport(baselineArchive);

      const candidate =
        parseWorkflowExport(candidateArchive);

      const structuralDiff =
        compareWorkflowExports(
          baseline,
          candidate,
        );

      const blastRadius =
        calculateBlastRadius(
          baseline,
          candidate,
          structuralDiff,
        );

      const riskAssessment =
        calculateRiskAssessment(
          structuralDiff,
          blastRadius,
        );

      const changePackage =
        buildChangePackage({
          flowPurpose,
          baselineVersion,
          candidateVersion,
          baseline,
          candidate,
          structuralDiff,
          blastRadius,
          riskAssessment,
        });

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            flowPurpose,
            baselineVersion,
            candidateVersion,
            releaseContext,
            changePackage,
          }),
        },
      );

      const payload =
        (await response.json()) as AnalysisResponse;

      if (!response.ok || !payload.report) {
        const message = [
          payload.error,
          payload.details,
        ]
          .filter(Boolean)
          .join("\n\n");

        throw new Error(
          message ||
            "ChangeGraph could not complete the analysis.",
        );
      }

      const localWarnings: string[] = [
        ...(payload.warnings ?? []),
      ];

      if (
        baselineArchive.totalRedactions > 0
      ) {
        localWarnings.push(
          `${baselineArchive.totalRedactions} potential secret value(s) were redacted from the baseline archive.`,
        );
      }

      if (
        candidateArchive.totalRedactions > 0
      ) {
        localWarnings.push(
          `${candidateArchive.totalRedactions} potential secret value(s) were redacted from the candidate archive.`,
        );
      }

      if (
        baselineArchive.skippedFiles.length > 0
      ) {
        localWarnings.push(
          `${baselineArchive.skippedFiles.length} unsupported or ignored baseline file(s) were skipped.`,
        );
      }

      if (
        candidateArchive.skippedFiles.length > 0
      ) {
        localWarnings.push(
          `${candidateArchive.skippedFiles.length} unsupported or ignored candidate file(s) were skipped.`,
        );
      }

      setWarnings([
        ...new Set(localWarnings),
      ]);

      setReport(payload.report);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "ChangeGraph analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis(): void {
    setBaselineFile(null);
    setCandidateFile(null);
    setReport(null);
    setWarnings([]);
    setError(null);
  }

  const decision =
    report?.riskAssessment.decision;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          aria-label="ChangeGraph home"
        >
          <span className="brand-mark">
            <Workflow size={21} />
          </span>

          <span>
            <strong>ChangeGraph</strong>
            <small>
              Semantic release intelligence
            </small>
          </span>
        </a>

        <div className="topbar-status">
          <span className="status-dot" />
          Deterministic analysis + Lamatic AI
        </div>
      </header>

      <section
        id="top"
        className="hero"
      >
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} />
            Safe workflow promotion
          </div>

          <h1>
            Understand every workflow change
            before it reaches production.
          </h1>

          <p>
            Compare two Lamatic exports,
            calculate their structural impact,
            trace the downstream blast radius,
            and generate a targeted release
            and rollback plan.
          </p>
        </div>

        <div className="hero-visual">
          <div className="graph-node graph-node-main">
            Candidate flow
          </div>

          <div className="graph-line graph-line-one" />

          <div className="graph-node graph-node-small graph-node-one">
            Diff
          </div>

          <div className="graph-line graph-line-two" />

          <div className="graph-node graph-node-small graph-node-two">
            Risk
          </div>

          <div className="graph-line graph-line-three" />

          <div className="graph-node graph-node-result">
            Promotion decision
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              Release comparison
            </span>

            <h2>
              Upload workflow versions
            </h2>
          </div>

          {(baselineFile ||
            candidateFile ||
            report) && (
            <button
              className="secondary-button"
              type="button"
              onClick={resetAnalysis}
              disabled={loading}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>

        <div className="upload-grid">
          <UploadPanel
            id="baseline-upload"
            title="Baseline export"
            description="Upload the currently trusted ZIP export"
            file={baselineFile}
            onChange={setBaselineFile}
          />

          <div className="comparison-arrow">
            <ArrowRight size={20} />
          </div>

          <UploadPanel
            id="candidate-upload"
            title="Candidate export"
            description="Upload the proposed release ZIP export"
            file={candidateFile}
            onChange={setCandidateFile}
          />
        </div>

        <div className="release-form">
          <label className="field field-wide">
            <span>Flow purpose</span>

            <input
              value={flowPurpose}
              onChange={(event) =>
                setFlowPurpose(
                  event.target.value,
                )
              }
              placeholder="What does this workflow do?"
            />
          </label>

          <label className="field">
            <span>Baseline version</span>

            <input
              value={baselineVersion}
              onChange={(event) =>
                setBaselineVersion(
                  event.target.value,
                )
              }
              placeholder="v1.0.0"
            />
          </label>

          <label className="field">
            <span>Candidate version</span>

            <input
              value={candidateVersion}
              onChange={(event) =>
                setCandidateVersion(
                  event.target.value,
                )
              }
              placeholder="v1.1.0"
            />
          </label>

          <label className="field field-wide">
            <span>Release context</span>

            <textarea
              value={releaseContext}
              onChange={(event) =>
                setReleaseContext(
                  event.target.value,
                )
              }
              placeholder="Describe the release, environment, dependencies, or concerns."
              rows={3}
            />
          </label>
        </div>

        {error && (
          <div
            className="message message-error"
            role="alert"
          >
            <AlertTriangle size={20} />

            <div>
              <strong>
                Analysis could not be completed
              </strong>

              <pre>{error}</pre>
            </div>
          </div>
        )}

        <button
          className="primary-button"
          type="button"
          disabled={!canAnalyze || loading}
          onClick={handleAnalyze}
        >
          {loading ? (
            <>
              <LoaderCircle
                className="spin"
                size={19}
              />
              Running ChangeGraph analysis…
            </>
          ) : (
            <>
              <Activity size={19} />
              Analyze change
            </>
          )}
        </button>

        <p className="privacy-note">
          ZIP contents are parsed and redacted
          locally. Only the sanitized change
          package is sent to the server.
        </p>
      </section>

      {!report && (
        <section className="capabilities">
          <article className="capability-card">
            <span className="capability-icon">
              <Workflow size={22} />
            </span>

            <h3>Structural diff</h3>

            <p>
              Finds changed prompts, models,
              schemas, nodes, edges, retries,
              fallbacks, and environment
              references.
            </p>
          </article>

          <article className="capability-card">
            <span className="capability-icon">
              <Network size={22} />
            </span>

            <h3>Blast radius</h3>

            <p>
              Traverses the candidate graph to
              identify downstream components
              affected by each change.
            </p>
          </article>

          <article className="capability-card">
            <span className="capability-icon">
              <ShieldCheck size={22} />
            </span>

            <h3>Safe promotion</h3>

            <p>
              Preserves deterministic risk
              controls while Lamatic generates
              tests, blockers, and rollback
              instructions.
            </p>
          </article>
        </section>
      )}

      {report && (
        <section
          className="report"
          aria-live="polite"
        >
          <div className="report-header">
            <div>
              <span className="section-kicker">
                Analysis complete
              </span>

              <h2>
                {report.baselineVersion}
                <ArrowRight size={20} />
                {report.candidateVersion}
              </h2>
            </div>

            <div
              className={`decision-pill decision-${decision}`}
            >
              {decision ===
                "safe_to_promote" && (
                <CheckCircle2 size={18} />
              )}

              {decision !==
                "safe_to_promote" && (
                <AlertTriangle size={18} />
              )}

              {decision &&
                decisionLabel(decision)}
            </div>
          </div>

          <div className="metric-grid">
            <article className="metric-card metric-primary">
              <span>Risk score</span>

              <strong>
                {report.riskAssessment.score}
                <small>/100</small>
              </strong>

              <p>
                {
                  report.riskAssessment
                    .level
                }{" "}
                deterministic risk
              </p>
            </article>

            <article className="metric-card">
              <span>Detected changes</span>

              <strong>
                {
                  report.structuralDiff
                    .changes.length
                }
              </strong>

              <p>
                Across flow and resource files
              </p>
            </article>

            <article className="metric-card">
              <span>Directly affected</span>

              <strong>
                {
                  report.blastRadius
                    .directlyAffectedNodeIds
                    .length
                }
              </strong>

              <p>Candidate workflow nodes</p>
            </article>

            <article className="metric-card">
              <span>Downstream impact</span>

              <strong>
                {
                  report.blastRadius
                    .indirectlyAffectedNodeIds
                    .length
                }
              </strong>

              <p>Potentially affected nodes</p>
            </article>
          </div>

          <div className="report-grid">
            <article className="report-card report-card-wide">
              <div className="card-heading">
                <div>
                  <span className="card-icon">
                    <Sparkles size={19} />
                  </span>

                  <div>
                    <h3>
                      Semantic impact
                    </h3>

                    <p>
                      Lamatic analysis grounded
                      in the deterministic diff
                    </p>
                  </div>
                </div>

                <span className="severity-badge">
                  {
                    report.semanticAnalysis
                      .overallImpactLevel
                  }
                </span>
              </div>

              <p className="analysis-summary">
                {
                  report.semanticAnalysis
                    .analysisSummary
                }
              </p>

              <div className="finding-list">
                {report.semanticAnalysis
                  .findings.length === 0 ? (
                  <div className="empty-state">
                    No semantic risks were
                    identified.
                  </div>
                ) : (
                  report.semanticAnalysis.findings.map(
                    (finding) => (
                      <article
                        className="finding"
                        key={`${finding.changeId}-${finding.observedFact}`}
                      >
                        <div className="finding-topline">
                          <span className="category-badge">
                            {finding.category}
                          </span>

                          <span>
                            {Math.round(
                              finding.confidence *
                                100,
                            )}
                            % confidence
                          </span>
                        </div>

                        <h4>
                          {finding.observedFact}
                        </h4>

                        <p>
                          {finding.possibleImpact}
                        </p>
                      </article>
                    ),
                  )
                )}
              </div>
            </article>

            <article className="report-card">
              <div className="card-heading">
                <div>
                  <span className="card-icon">
                    <ShieldCheck size={19} />
                  </span>

                  <div>
                    <h3>
                      Risk breakdown
                    </h3>

                    <p>
                      Transparent scoring rules
                    </p>
                  </div>
                </div>
              </div>

              <div className="risk-list">
                {report.riskAssessment
                  .contributions.length ===
                0 ? (
                  <div className="empty-state">
                    No deterministic risk rules
                    were triggered.
                  </div>
                ) : (
                  report.riskAssessment.contributions.map(
                    (contribution) => (
                      <div
                        className="risk-row"
                        key={
                          contribution.ruleId
                        }
                      >
                        <div>
                          <strong>
                            {contribution.label}
                          </strong>

                          <span>
                            {contribution.relatedChangeIds.join(
                              ", ",
                            )}
                          </span>
                        </div>

                        <b>
                          +{contribution.points}
                        </b>
                      </div>
                    ),
                  )
                )}
              </div>
            </article>

            <article className="report-card">
              <div className="card-heading">
                <div>
                  <span className="card-icon">
                    <Network size={19} />
                  </span>

                  <div>
                    <h3>
                      Blast radius
                    </h3>

                    <p>
                      Direct and downstream
                      components
                    </p>
                  </div>
                </div>
              </div>

              <div className="node-list">
                {report.blastRadius.nodes
                  .length === 0 ? (
                  <div className="empty-state">
                    No affected candidate nodes
                    were detected.
                  </div>
                ) : (
                  report.blastRadius.nodes
                    .slice(0, 12)
                    .map((node) => (
                      <div
                        className="node-row"
                        key={`${node.flowId}-${node.nodeId}`}
                      >
                        <span
                          className={`impact-dot impact-${node.impact}`}
                        />

                        <div>
                          <strong>
                            {node.nodeName}
                          </strong>

                          <span>
                            {node.flowName} ·{" "}
                            {node.impact} · distance{" "}
                            {node.distance}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </article>

            <article className="report-card report-card-wide">
              <div className="card-heading">
                <div>
                  <span className="card-icon">
                    <Activity size={19} />
                  </span>

                  <div>
                    <h3>
                      Structural changes
                    </h3>

                    <p>
                      Exact deterministic
                      before-and-after evidence
                    </p>
                  </div>
                </div>
              </div>

              <div className="change-list">
                {report.structuralDiff.changes
                  .length === 0 ? (
                  <div className="empty-state">
                    The two workflow exports are
                    structurally equivalent.
                  </div>
                ) : (
                  report.structuralDiff.changes.map(
                    (change) => (
                      <details
                        className="change-row"
                        key={change.changeId}
                      >
                        <summary>
                          <span className="change-id">
                            {change.changeId}
                          </span>

                          <span className="category-badge">
                            {change.category}
                          </span>

                          <strong>
                            {change.component}
                          </strong>
                        </summary>

                        <div className="change-comparison">
                          <div>
                            <span>Before</span>

                            <pre>
                              {summarizeValue(
                                change.before,
                              )}
                            </pre>
                          </div>

                          <div>
                            <span>After</span>

                            <pre>
                              {summarizeValue(
                                change.after,
                              )}
                            </pre>
                          </div>
                        </div>
                      </details>
                    ),
                  )
                )}
              </div>
            </article>

            <article className="report-card">
              <div className="card-heading">
                <div>
                  <span className="card-icon">
                    <TestTube2 size={19} />
                  </span>

                  <div>
                    <h3>
                      Targeted tests
                    </h3>

                    <p>
                      Evidence required before
                      promotion
                    </p>
                  </div>
                </div>
              </div>

              <div className="test-list">
                {report.releasePlan
                  .targetedTests.length ===
                0 ? (
                  <div className="empty-state">
                    No targeted tests were
                    generated.
                  </div>
                ) : (
                  report.releasePlan.targetedTests.map(
                    (test) => (
                      <article
                        className="test-item"
                        key={test.testId}
                      >
                        <span>
                          {test.priority}
                        </span>

                        <h4>{test.name}</h4>

                        <p>{test.objective}</p>

                        <small>
                          Evidence:{" "}
                          {test.expectedEvidence}
                        </small>
                      </article>
                    ),
                  )
                )}
              </div>
            </article>

            <article className="report-card">
              <div className="card-heading">
                <div>
                  <span className="card-icon">
                    <RotateCcw size={19} />
                  </span>

                  <div>
                    <h3>
                      Rollback manifest
                    </h3>

                    <p>
                      Recovery plan for the
                      candidate release
                    </p>
                  </div>
                </div>
              </div>

              <div className="rollback-target">
                <span>Rollback target</span>

                <strong>
                  {
                    report.releasePlan
                      .rollbackManifest
                      .rollbackTarget
                  }
                </strong>
              </div>

              <ul className="check-list">
                {report.releasePlan.rollbackManifest.componentsToRestore.map(
                  (component) => (
                    <li key={component}>
                      <CheckCircle2 size={15} />
                      {component}
                    </li>
                  ),
                )}

                {report.releasePlan.rollbackManifest.postRollbackChecks.map(
                  (check) => (
                    <li key={check}>
                      <CheckCircle2 size={15} />
                      {check}
                    </li>
                  ),
                )}
              </ul>
            </article>
          </div>

          {warnings.length > 0 && (
            <article className="message message-warning">
              <AlertTriangle size={20} />

              <div>
                <strong>
                  Analysis warnings
                </strong>

                <ul>
                  {warnings.map((warning) => (
                    <li key={warning}>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )}
        </section>
      )}

      <footer className="footer">
        <span>
          ChangeGraph release intelligence
        </span>

        <span>
          Deterministic controls remain
          authoritative
        </span>
      </footer>
    </main>
  );
}