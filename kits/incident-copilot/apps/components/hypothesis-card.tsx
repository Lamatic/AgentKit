import { confidenceBadge } from "@/lib/format";
import type { Hypothesis } from "@/lib/types";

export function HypothesisCard({ h, isTop }: { h: Hypothesis; isTop: boolean }) {
  const badge = confidenceBadge(h.confidence);
  return (
    <div className={isTop ? "hyp top" : "hyp"}>
      <div className="hyp-head">
        <h3 className="hyp-title">
          <span className="rank">#{h.rank}</span> {h.title}
        </h3>
        <span className={badge.className}>{badge.label}</span>
      </div>

      <p className="reasoning">{h.reasoning}</p>

      <div className="evidence">
        <div className="support">
          <h4>Supporting</h4>
          <ul>
            {h.supportingEvidence.length > 0 ? (
              h.supportingEvidence.map((e, i) => <li key={i}>{e}</li>)
            ) : (
              <li className="muted">None cited.</li>
            )}
          </ul>
        </div>
        <div className="against">
          <h4>Contradicting</h4>
          <ul>
            {h.contradictingEvidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      </div>

      {h.nextStep && (
        <p className="nextstep">
          <b>Next step:</b> {h.nextStep}
        </p>
      )}
    </div>
  );
}
