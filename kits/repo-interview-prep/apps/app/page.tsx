"use client";

import { useState } from "react";
import { generatePrepBrief } from "@/actions/orchestrate";
import type { PrepBrief, RepoAnalysis } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const InputSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
  role: z.string().optional(),
  jd: z.string().optional()
});
type InputForm = z.infer<typeof InputSchema>;

type Step = "input" | "loading" | "results";

const LOAD_STEPS = [
  "Parsing repository URL...",
  "Scraping GitHub page...",
  "Analyzing tech stack...",
  "Drafting architecture diagrams...",
  "Generating aggressive interview questions...",
  "Checking production readiness...",
  "Building your final prep brief...",
];

const complexityClass: Record<string, string> = {
  junior: "badge-junior",
  mid: "badge-mid",
  senior: "badge-senior",
};

const depthClass: Record<string, string> = {
  surface: "badge-surface",
  moderate: "badge-moderate",
  deep: "badge-deep",
};

export default function Page() {
  const [step, setStep] = useState<Step>("input");
  const [showJd, setShowJd] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("summary");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<InputForm>({
    resolver: zodResolver(InputSchema),
    defaultValues: { repoUrl: "", role: "", jd: "" }
  });

  const repoUrlVal = watch("repoUrl");
  const repoName = repoUrlVal ? repoUrlVal.replace("https://github.com/", "").replace(/\/$/, "") : "";

  const brief = analysis?.prep_brief;

  async function onSubmit(data: InputForm) {
    // Normalize: accept both "owner/repo" and full "https://github.com/owner/repo"
    const raw = data.repoUrl.trim();
    const normalizedUrl = raw.startsWith("https://github.com/")
      ? raw
      : `https://github.com/${raw.replace(/^\//, "")}`;
    if (!normalizedUrl) return;
    setError(null);
    setStep("loading");
    setLoadStep(0);

    // Fake progress animation
    const interval = setInterval(() => {
      setLoadStep((p) => (p < LOAD_STEPS.length - 1 ? p + 1 : p));
    }, 4500); // Slower because 4 sequential LLMs take ~30-40s

    const result = await generatePrepBrief(normalizedUrl, data.role || "", data.jd || "");
    clearInterval(interval);

    if (result.success && result.data) {
      setAnalysis(result.data);
      setStep("results");
      setActiveSection("summary");
    } else {
      setError(result.error ?? "Unknown error");
      setStep("input");
    }
  }

  function copyPitch() {
    if (brief?.pitch) {
      navigator.clipboard.writeText(brief.pitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }


  const NAV = [
    { id: "summary", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "grill", label: `Grill Me (${analysis?.grill_me?.questions?.length ?? 0})` },
    { id: "questions", label: `Q&A (${brief?.follow_up_questions?.length ?? 0})` },
    { id: "production", label: "Prod Readiness" },
  ];

  // ─── INPUT ─────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 520, width: "100%" }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Repo<span className="gradient-text">Prep</span></span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, color: "var(--text)", marginBottom: 10 }}>
              Turn your projects into<br /><span className="gradient-text">interview gold</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
              Paste a GitHub repo URL. Get a complete, code-specific prep brief in seconds.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* URL input */}
              <div>
                <label htmlFor="github-url" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  GitHub Repository URL *
                </label>
                <div className="glow-border" style={{ borderRadius: 8, display: "flex", alignItems: "center", background: "var(--surface-2)" }}>
                  <span style={{ paddingLeft: 12, color: "var(--text-subtle)", flexShrink: 0, fontSize: 13 }}>github.com/</span>
                  <input
                    id="github-url"
                    type="text"
                    placeholder="owner/repo"
                    {...register("repoUrl")}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "11px 12px 11px 4px", color: "var(--text)", fontSize: 14 }}
                  />
                </div>
                {errors.repoUrl && <p style={{ color: "var(--amber)", fontSize: 12, marginTop: 4 }}>{errors.repoUrl.message}</p>}
              </div>

              {/* Target role */}
              <div>
                <label htmlFor="target-role" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Target Role <span style={{ fontWeight: 400, color: "var(--text-subtle)" }}>(optional)</span>
                </label>
                <div className="glow-border" style={{ borderRadius: 8, background: "var(--surface-2)" }}>
                  <input
                    id="target-role"
                    type="text"
                    placeholder="e.g. SWE Intern, Backend Engineer, ML Engineer"
                    {...register("role")}
                    style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: "11px 12px", color: "var(--text)", fontSize: 14 }}
                  />
                </div>
              </div>

              {/* JD toggle */}
              <button type="button" onClick={() => setShowJd(!showJd)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0, width: "fit-content" }}>
                <span style={{ transform: showJd ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▶</span>
                {showJd ? "Hide" : "Add"} job description for tailored questions
              </button>

              {showJd && (
                <div className="fade-in">
                  <label htmlFor="jd-text" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Job Description
                  </label>
                  <div className="glow-border" style={{ borderRadius: 8, background: "var(--surface-2)" }}>
                    <textarea
                      id="jd-text"
                      placeholder="Paste the job description here..."
                      {...register("jd")}
                      rows={4}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: "11px 12px", color: "var(--text)", fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 14px", color: "#f87171", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button id="analyze-btn" type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: 15 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Analyze Repository
              </button>

              <p style={{ textAlign: "center", color: "var(--text-subtle)", fontSize: 12 }}>
                Works with any public GitHub repository
              </p>
            </div>
          </form>

          <p style={{ textAlign: "center", color: "var(--text-subtle)", fontSize: 12, marginTop: 20 }}>
            Powered by{" "}
            <a href="https://lamatic.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-light)", textDecoration: "none" }}>
              Lamatic.ai
            </a>
            {" · "}
            <a href="https://github.com/Lamatic/AgentKit/tree/main/kits/repo-interview-prep" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-light)", textDecoration: "none" }}>
              View on GitHub
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ─── LOADING ───────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--accent)", borderTopColor: "transparent", margin: "0 auto 20px", animation: "spin 1s linear infinite" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Analyzing your repository</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{repoName}</p>
          </div>

          <div className="card" style={{ padding: 20, textAlign: "left" }}>
            {LOAD_STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < LOAD_STEPS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i < loadStep ? (
                    <span style={{ color: "var(--green)", fontSize: 14 }}>✓</span>
                  ) : i === loadStep ? (
                    <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--border)" }} />
                  )}
                </div>
                <span style={{ fontSize: 13, color: i <= loadStep ? "var(--text)" : "var(--text-subtle)", fontWeight: i === loadStep ? 600 : 400 }}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          <p style={{ color: "var(--text-subtle)", fontSize: 12, marginTop: 20 }}>
            This usually takes 15–30 seconds
          </p>
        </div>
      </div>
    );
  }

  // ─── RESULTS ───────────────────────────────────────────────────
  if (!analysis || !brief) return null;

  const sections: Record<string, React.ReactNode> = {
    summary: (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7 }}>{brief?.project_summary || "No project summary available."}</p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Tech Stack</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(brief?.tech_stack || []).map((t, i) => (
              <span key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "var(--text-muted)" }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your 2-Minute Pitch</h3>
            <button onClick={copyPitch} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
              {copied ? "✓ Copied" : "Copy pitch"}
            </button>
          </div>
          <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{brief?.pitch || "Pitch not available."}</p>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, fontSize: 13, color: "var(--accent-light)" }}>
            💡 Record yourself delivering this pitch. Aim for 90–120 seconds.
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Strengths to Highlight</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(brief?.strengths_to_highlight || []).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderLeft: "3px solid var(--green)", background: "var(--green-bg)", borderRadius: "0 6px 6px 0" }}>
                <span style={{ color: "var(--green)", flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    architecture: (() => {
      const diagram = analysis?.architecture?.mermaid_diagram;
      const hasDiagram = diagram && diagram !== "NOT_AVAILABLE" && diagram.trim().length > 0;
      return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {hasDiagram ? (
            <div className="card" style={{ padding: 24, textAlign: "center" }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Architecture Diagram</h3>
              <img
                src={`https://mermaid.ink/img/${btoa(Array.from(new TextEncoder().encode(diagram!.trim()), byte => String.fromCharCode(byte)).join(''))}`}
                alt="Architecture Diagram"
                style={{ maxWidth: "100%", borderRadius: 8 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, borderLeft: "3px solid var(--border)" }}>
              <span style={{ fontSize: 20 }}>📐</span>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Architecture diagram could not be determined from the repository content. The README may not describe the system architecture in enough detail.</p>
            </div>
          )}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Data Flow Summary</h3>
            <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7 }}>{analysis?.architecture?.flow_summary || "Data flow summary not available."}</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Design Trade-offs</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text)", fontSize: 14, lineHeight: 1.7 }}>
              {(analysis?.architecture?.tradeoffs || []).map((t, i) => (
                <li key={i} style={{ marginBottom: 8 }}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>⚠ Red Flags</h3>
            {!(brief?.red_flags?.length) ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No significant red flags detected 🎉</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {brief.red_flags.map((r, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderLeft: "3px solid var(--amber)", background: "rgba(245,158,11,0.05)", borderRadius: "0 6px 6px 0" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)", marginBottom: 4 }}>{r?.observation}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}><strong>How to address: </strong>{r?.how_to_address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })(),

    pitch: (
      <div className="fade-in">
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Your 2-Minute Pitch</h3>
            <button onClick={copyPitch} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {copied ? "✓ Copied" : "Copy pitch"}
            </button>
          </div>
          <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{brief?.pitch || "Pitch not available."}</p>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, fontSize: 13, color: "var(--accent-light)" }}>
            💡 Record yourself delivering this pitch and listen back. Time yourself — it should land in 90–120 seconds.
          </div>
        </div>
      </div>
    ),

    grill: (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ marginBottom: 10, padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#f87171" }}>
          🔥 <strong>The Grill Me Simulation:</strong> Highly aggressive technical questions targeting real weaknesses in your code.
        </div>
        {(analysis?.grill_me?.questions || []).map((q, i) => (
          <div key={i} className="card" style={{ overflow: "hidden" }}>
            <button
              onClick={() => setExpandedQ(expandedQ === i ? null : i)}
              style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left" }}
            >
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#f87171", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.5 }}>{q?.question}</span>
              <span style={{ color: "var(--text-subtle)", fontSize: 16, marginTop: 2, flexShrink: 0 }}>{expandedQ === i ? "−" : "+"}</span>
            </button>
            {expandedQ === i && (
              <div style={{ padding: "0 20px 20px 54px", display: "flex", flexDirection: "column", gap: 12 }} className="fade-in">
                <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Defensive Strategy</p>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{q?.defensive_strategy}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {(brief?.concepts_to_review?.length ?? 0) > 0 && (
          <>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 12, marginBottom: 4 }}>📚 Concepts to Study</h3>
            {(brief?.concepts_to_review || []).map((c, i) => (
              <div key={i} className="card" style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span className={`badge ${depthClass[c?.depth_needed || "surface"]}`}>{c?.depth_needed}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{c?.concept}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{c?.why_relevant}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    ),

    questions: (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(brief?.follow_up_questions || []).map((q, i) => (
          <div key={i} className="card" style={{ overflow: "hidden" }}>
            <button
              onClick={() => setExpandedQ(expandedQ === i ? null : i)}
              style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left" }}
            >
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--purple-bg)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent-light)", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.5 }}>{q?.question}</span>
              <span style={{ color: "var(--text-subtle)", fontSize: 16, marginTop: 2, flexShrink: 0 }}>{expandedQ === i ? "−" : "+"}</span>
            </button>
            {expandedQ === i && (
              <div style={{ padding: "0 20px 20px 54px", display: "flex", flexDirection: "column", gap: 12 }} className="fade-in">
                <div style={{ padding: "10px 14px", background: "var(--blue-bg)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Why they ask</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{q?.why_they_ask}</p>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--green-bg)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Suggested answer</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{q?.suggested_answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    ),

    production: (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16, borderLeft: analysis?.production?.is_production_ready ? "4px solid var(--green)" : "4px solid var(--amber)" }}>
          <div style={{ fontSize: 24 }}>{analysis?.production?.is_production_ready ? "✅" : "🚧"}</div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {analysis?.production?.is_production_ready ? "Ready for Production" : "Not Production Ready"}
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
              Based on standard engineering requirements (CI/CD, error handling, security).
            </p>
          </div>
        </div>
        
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Critical Missing Features</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#f87171", fontSize: 14, lineHeight: 1.7 }}>
            {(analysis?.production?.critical_missing_features || []).map((f, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Quick Wins</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text)", fontSize: 14, lineHeight: 1.7 }}>
            {(analysis?.production?.quick_wins || []).map((w, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    ),

  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10, 10, 15, 0.4)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => { setStep("input"); setAnalysis(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: "6px 0", flexShrink: 0 }}>
            ← New Analysis
          </button>
          <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{repoName}</span>
            <span className={`badge ${complexityClass[brief.complexity_level]}`}>{brief.complexity_level}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 32 }}>
        {/* Sidebar nav */}
        <nav style={{ position: "sticky", top: 80, height: "fit-content" }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setActiveSection(n.id)} style={{ width: "100%", textAlign: "left", background: activeSection === n.id ? "var(--purple-bg)" : "none", border: activeSection === n.id ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: activeSection === n.id ? 600 : 400, color: activeSection === n.id ? "var(--accent-light)" : "var(--text-muted)", cursor: "pointer", marginBottom: 2, transition: "all 0.15s" }}>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>
            {NAV.find((n) => n.id === activeSection)?.label}
          </h2>
          {sections[activeSection]}
        </main>
      </div>
    </div>
  );
}
