"use client";

import type { Analysis } from "@/lib/types";

export default function FindingsList({ analysis }: { analysis: Analysis }) {
  const c = analysis.coaching;
  const findings = c?.findings || [];
  const hasCoaching = !analysis.mock && (findings.length > 0 || !!c?.topPriority);

  return (
    <div className="panel">
      <h3>Coaching</h3>

      {!hasCoaching ? (
        <p className="sub" style={{ margin: 0 }}>
          {c?.headline || "Connect your Lamatic flows to see AI pattern detection and coaching."}
        </p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div>
              <div className="score">{c.disciplineScore}</div>
              <div className="label">discipline / 100</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.headline}</div>
          </div>
          {c.scoreRationale && (
            <div className="ev" style={{ marginTop: -4, marginBottom: 12 }}>{c.scoreRationale}</div>
          )}

          {findings.map((f, idx) => (
            <div className="finding" key={idx}>
              <div className="top">
                <span className={`badge ${f.severity}`}>{f.severity}</span>
                <span className="title">{f.title}</span>
              </div>
              <div className="ev">{f.evidence}</div>
              <div style={{ fontSize: 13 }}>{f.whatsHappening}</div>
              <div className="rule">Rule: {f.ruleChange}</div>
            </div>
          ))}

          {c.topPriority && (
            <div className="rule" style={{ marginTop: 10 }}>
              <b>This week:</b> {c.topPriority}
            </div>
          )}
          {c.encouragement && <div className="encourage">{c.encouragement}</div>}
        </>
      )}
    </div>
  );
}
