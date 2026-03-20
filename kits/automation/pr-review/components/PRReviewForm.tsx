"use client";

import { useMemo, useState } from "react";
import { reviewPR, PRReviewResult, ReviewItem } from "@/actions/orchestrate";

const VERDICT_CONFIG = {
  approve: { label: "Approve", color: "#86efac", bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)", accent: "#22c55e" },
  needs_changes: { label: "Needs Changes", color: "#fca5a5", bg: "rgba(239, 68, 68, 0.14)", border: "rgba(239, 68, 68, 0.28)", accent: "#ef4444" },
  discuss: { label: "Discuss", color: "#fcd34d", bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.28)", accent: "#f59e0b" },
};

const ISSUE_BADGE_STYLES: Record<string, { background: string; color: string; accent: string }> = {
  CRITICAL: { background: "#3b0000", color: "#ff6b6b", accent: "#ef4444" },
  WARNING: { background: "#2d1f00", color: "#ffaa40", accent: "#f59e0b" },
  INFO: { background: "#0d1f2d", color: "#60a5fa", accent: "#3b82f6" },
};

const SUGGESTION_BADGE_STYLES: Record<string, { background: string; color: string; accent: string }> = {
  PERF: { background: "#0d2d1f", color: "#34d399", accent: "#34d399" },
  STYLE: { background: "#1f0d2d", color: "#a78bfa", accent: "#8b5cf6" },
  TEST: { background: "#2d1f00", color: "#ffaa40", accent: "#f59e0b" },
  DOCS: { background: "#0d1a2d", color: "#60a5fa", accent: "#3b82f6" },
};

const shortPath = (file: string, line: number) => `${file.split("/").pop()}:${line}`;

function SectionTitle({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: "#555555",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
      {extra}
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 20,
        height: 18,
        padding: "0 6px",
        border: "1px solid #27272a",
        borderRadius: 999,
        fontSize: 11,
        color: "#888888",
      }}
    >
      {count}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 9V7C15 5.9 14.1 5 13 5H7C5.9 5 5 5.9 5 7V13C5 14.1 5.9 15 7 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 7, height: 7, borderRadius: 999, background: color, display: "inline-block", flexShrink: 0 }} />;
}

function SpinnerDot() {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "#4f46e5",
        display: "inline-block",
        animation: "pr-review-pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function CodePane({
  label,
  symbol,
  text,
  tone,
  borderTop,
  onCopy,
}: {
  label: string;
  symbol: string;
  text: string;
  tone: string;
  borderTop?: boolean;
  onCopy: () => void;
}) {
  return (
    <div style={{ borderTop: borderTop ? "1px solid #27272a" : "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px 6px",
          background: "#1a1a1a",
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "#555555", fontWeight: 600 }}>{label}</div>
        <button
          type="button"
          onClick={onCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid #27272a",
            background: "transparent",
            color: "#71717a",
            borderRadius: 6,
            padding: "4px 6px",
            cursor: "pointer",
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          <CopyIcon />
          Copy
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", background: tone }}>
        <div
          style={{
            borderRight: "1px solid #27272a",
            color: "#555555",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
            fontSize: 12,
            lineHeight: 1.5,
            padding: "10px 8px",
            textAlign: "center",
            userSelect: "none",
          }}
        >
          {symbol}
        </div>
        <pre
          className="pr-review-code"
          style={{
            margin: 0,
            padding: "10px 14px",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 120,
            whiteSpace: "pre",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
            fontSize: 12,
            lineHeight: 1.5,
            color: "#f4f4f5",
            scrollbarWidth: "thin",
          }}
        >
          <code>{text}</code>
        </pre>
      </div>
    </div>
  );
}

function CodeDiff({ code, fix }: { code: string; fix: string }) {
  async function copyFix() {
    try {
      await navigator.clipboard.writeText(fix);
    } catch {
      // no-op
    }
  }

  return (
    <div
      style={{
        border: "1px solid #27272a",
        borderRadius: 6,
        overflow: "hidden",
        background: "#1a1a1a",
      }}
    >
      <CodePane label="BEFORE" symbol="-" text={code} tone="#ff000015" onCopy={copyFix} />
      <CodePane label="AFTER" symbol="+" text={fix} tone="#00ff0015" borderTop onCopy={copyFix} />
    </div>
  );
}

function ReviewItemRow({
  item,
  badgeLabel,
  badgeStyle,
  showSeparator,
}: {
  item: ReviewItem;
  badgeLabel: string;
  badgeStyle: { background: string; color: string; accent: string };
  showSeparator: boolean;
}) {
  return (
    <div
      style={{
        padding: "18px 0 18px 16px",
        borderTop: showSeparator ? "1px solid #1a1a1a" : "none",
        borderLeft: `3px solid ${badgeStyle.accent}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, minWidth: 0 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: 999,
            background: badgeStyle.background,
            color: badgeStyle.color,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {badgeLabel}
        </span>
        <code
          title={`${item.file}:${item.line}`}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
            fontSize: 12,
            color: "#555555",
            minWidth: 0,
            maxWidth: 300,
            direction: "rtl",
            textAlign: "left",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
            flex: "0 1 300px",
          }}
        >
          {shortPath(item.file, item.line)}
        </code>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.6, color: "#ffffff" }}>{item.description}</p>
      <div style={{ marginLeft: 8 }}>
        <CodeDiff code={item.code} fix={item.fix} />
      </div>
    </div>
  );
}

function EmptyLeftPanel() {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#888888", fontSize: 14 }}>
      Paste a PR URL above to start
    </div>
  );
}

function EmptyRightPanel() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
      {[1, 2, 3].map((item) => (
        <div key={item} style={{ border: "1px solid #1a1a1a", height: 72, borderRadius: 8 }} />
      ))}
    </div>
  );
}

function SkeletonBlock({ width, height }: { width: string | number; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "linear-gradient(90deg, #1a1a1a 25%, #222222 50%, #1a1a1a 75%)",
        backgroundSize: "200% 100%",
        animation: "pr-review-shimmer 1.5s linear infinite",
      }}
    />
  );
}

export default function PRReviewForm() {
  const [prUrl, setPrUrl] = useState("");
  const [result, setResult] = useState<PRReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await reviewPR(prUrl.trim()));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null;
  const criticalCount = result ? result.issues.filter((issue) => issue.severity === "CRITICAL").length : 0;
  const warningCount = result ? result.issues.filter((issue) => issue.severity === "WARNING").length : 0;
  const suggestionCount = result ? result.suggestions.length : 0;

  const prMeta = useMemo(() => {
    try {
      const url = new URL(prUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const owner = parts[0];
      const repo = parts[1];
      const prNumber = parts[3];
      if (!owner || !repo || !prNumber) return null;
      return { owner, repo, prNumber };
    } catch {
      return null;
    }
  }, [prUrl]);

  return (
    <>
      <style>{`
        @keyframes pr-review-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes pr-review-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        .pr-review-code::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }

        .pr-review-code::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 999px;
        }

        .pr-review-code::-webkit-scrollbar-track {
          background: transparent;
        }

        .pr-review-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .pr-review-toolbar {
          height: 48px;
          min-height: 48px;
          display: grid;
          grid-template-columns: 1fr minmax(240px, 480px) auto;
          align-items: center;
          gap: 16px;
          padding: 0 16px;
          border-bottom: 1px solid #1f1f1f;
          position: sticky;
          top: 0;
          background: #0a0a0a;
          z-index: 10;
        }

        .pr-review-panels {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 35% 65%;
        }

        .pr-review-left,
        .pr-review-right {
          min-height: 0;
          overflow-y: auto;
        }

        .pr-review-left {
          border-right: 1px solid #1a1a1a;
          padding: 24px;
        }

        .pr-review-right {
          padding: 24px;
        }

        @media (max-width: 768px) {
          .pr-review-toolbar {
            height: auto;
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 12px 16px;
          }

          .pr-review-toolbar-center {
            max-width: none !important;
          }

          .pr-review-toolbar-action {
            width: 100%;
          }

          .pr-review-panels {
            grid-template-columns: 1fr;
          }

          .pr-review-left {
            border-right: none;
            border-bottom: 1px solid #1a1a1a;
          }
        }
      `}</style>
      <div className="pr-review-shell">
        <form className="pr-review-toolbar" onSubmit={handleSubmit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#ffffff", whiteSpace: "nowrap" }}>
            <span>◆ PR Review Agent</span>
            {loading && <SpinnerDot />}
          </div>
          <div className="pr-review-toolbar-center" style={{ width: "100%", maxWidth: 480, justifySelf: "center" }}>
            <div
              style={{
                width: "100%",
                height: 32,
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingLeft: 10,
                border: "1px solid #27272a",
                borderRadius: 8,
                background: "#111111",
              }}
            >
              <span style={{ color: "#555555", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                <SearchIcon />
              </span>
              <input
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="Search by GitHub PR URL..."
                required
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  padding: "0 4px 0 0",
                  fontSize: 13,
                  border: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  background: "transparent",
                  color: "#ffffff",
                }}
                onFocus={(e) => {
                  const wrapper = e.currentTarget.parentElement;
                  if (wrapper) {
                    wrapper.style.borderColor = "#4f46e5";
                    wrapper.style.boxShadow = "0 0 0 1px #4f46e5";
                  }
                }}
                onBlur={(e) => {
                  const wrapper = e.currentTarget.parentElement;
                  if (wrapper) {
                    wrapper.style.borderColor = "#27272a";
                    wrapper.style.boxShadow = "none";
                  }
                }}
              />
            </div>
          </div>
          <button
            className="pr-review-toolbar-action"
            type="submit"
            disabled={loading || !prUrl}
            style={{
              height: 32,
              width: 32,
              padding: 0,
              border: "none",
              borderRadius: 6,
              background: loading || !prUrl ? "#1a1a1a" : "#111111",
              color: "#ffffff",
              cursor: loading || !prUrl ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={loading ? "Reviewing pull request" : "Review pull request"}
            title={loading ? "Reviewing..." : "Review pull request"}
          >
            <SearchIcon />
          </button>
        </form>

        <div className="pr-review-panels">
          <div className="pr-review-left">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  {prMeta ? (
                    <>
                      <div style={{ color: "#555555", fontSize: 12, lineHeight: 1.5 }}>{`${prMeta.owner} / ${prMeta.repo}`}</div>
                      <div style={{ color: "#ffffff", fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}>{`#${prMeta.prNumber}`}</div>
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-block", marginTop: 6, fontSize: 12, color: "#555555", textDecoration: "none" }}
                      >
                        View on GitHub →
                      </a>
                    </>
                  ) : (
                    <>
                      <SkeletonBlock width="120px" height={12} />
                      <div style={{ height: 8 }} />
                      <SkeletonBlock width="52px" height={24} />
                    </>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "#555555", textTransform: "uppercase", marginBottom: 10 }}>Verdict</div>
                  <SkeletonBlock width={140} height={28} />
                </div>

                <div>
                  <SectionTitle>Summary</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <SkeletonBlock width="100%" height={12} />
                    <SkeletonBlock width="72%" height={12} />
                  </div>
                </div>
              </div>
            ) : !result || !verdict ? (
              <EmptyLeftPanel />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  {prMeta ? (
                    <>
                      <div style={{ color: "#555555", fontSize: 12, lineHeight: 1.5 }}>{`${prMeta.owner} / ${prMeta.repo}`}</div>
                      <div style={{ color: "#ffffff", fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}>{`#${prMeta.prNumber}`}</div>
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-block", marginTop: 6, fontSize: 12, color: "#555555", textDecoration: "none" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#888888"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#555555"; }}
                      >
                        View on GitHub →
                      </a>
                    </>
                  ) : (
                    <div style={{ color: "#888888", fontSize: 12 }}>Pull request</div>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "#555555", textTransform: "uppercase" }}>Verdict</div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 22,
                        padding: "0 8px",
                        borderRadius: 4,
                        border: `1px solid ${verdict.border}`,
                        background: verdict.bg,
                        color: verdict.color,
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      {verdict.label.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <SectionTitle>Summary</SectionTitle>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "#ffffff" }}>{result.summary}</div>
                </div>

                <div>
                  <SectionTitle>Stats</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#d4d4d8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Dot color="#ef4444" /><span>{`${criticalCount} critical`}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Dot color="#f59e0b" /><span>{`${warningCount} warnings`}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Dot color="#22c55e" /><span>{`${suggestionCount} suggestions`}</span></div>
                  </div>
                </div>

                {error && <div style={{ fontSize: 13, color: "#fca5a5" }}>{error}</div>}
              </div>
            )}
          </div>

          <div className="pr-review-right">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100%", gap: 24 }}>
                {[1, 2, 3].map((item) => (
                  <div key={item} style={{ paddingLeft: 16, borderLeft: "3px solid #1a1a1a" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <SkeletonBlock width="60%" height={12} />
                      <SkeletonBlock width="40%" height={12} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#555555", textAlign: "center" }}>Fetching diff and reviewing...</div>
              </div>
            ) : !result || !verdict ? (
              <EmptyRightPanel />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div>
                  <SectionTitle extra={<CountBadge count={result.issues.length} />}>Issues</SectionTitle>
                  <div>
                    {result.issues.length === 0 ? (
                      <div style={{ color: "#888888", fontSize: 14 }}>No issues found.</div>
                    ) : (
                      result.issues.map((issue, index) => (
                        <ReviewItemRow
                          key={`${issue.file}-${issue.line}-${index}`}
                          item={issue}
                          badgeLabel={issue.severity ?? "INFO"}
                          badgeStyle={ISSUE_BADGE_STYLES[issue.severity ?? "INFO"] ?? ISSUE_BADGE_STYLES.INFO}
                          showSeparator={index > 0}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <SectionTitle extra={<CountBadge count={result.suggestions.length} />}>Suggestions</SectionTitle>
                  <div>
                    {result.suggestions.length === 0 ? (
                      <div style={{ color: "#888888", fontSize: 14 }}>No suggestions found.</div>
                    ) : (
                      result.suggestions.map((suggestion, index) => (
                        <ReviewItemRow
                          key={`${suggestion.file}-${suggestion.line}-${index}`}
                          item={suggestion}
                          badgeLabel={suggestion.type ?? "DOCS"}
                          badgeStyle={SUGGESTION_BADGE_STYLES[suggestion.type ?? "DOCS"] ?? SUGGESTION_BADGE_STYLES.DOCS}
                          showSeparator={index > 0}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
