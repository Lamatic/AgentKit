"use client";

import type { TrackResult } from "../lib/types";

export default function ComparisonTable({ results }: { results: TrackResult[] }) {
  if (results.length === 0) return null;

  return (
    <div className="results">
      <div className="grid-scroll">
        <table>
          <thead>
            <tr>
              <th className="metric">Metric</th>
              {results.map((r, i) => (
                <th key={i}>
                  <span className="comp-name">{r.input.competitorName || "—"}</span>
                  <span className="comp-url">{r.input.url}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Plans row */}
            <tr>
              <td className="metric-label">Plans &amp; pricing</td>
              {results.map((r, i) => (
                <td key={i}>
                  {!r.ok ? (
                    <span className="cell-error">✕ {r.error}</span>
                  ) : r.competitor && r.competitor.plans.length > 0 ? (
                    r.competitor.plans.map((p, j) => (
                      <div className="plan-block" key={j}>
                        <div className="plan-head">
                          <span className="plan-name">{p.name}</span>
                          <span className="plan-price">{p.price || "—"}</span>
                        </div>
                        {p.billingPeriod && (
                          <span className="plan-period">{p.billingPeriod}</span>
                        )}
                        {p.features && p.features.length > 0 && (
                          <ul className="feature-list">
                            {p.features.map((f, k) => (
                              <li key={k}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="empty">No plans found on this page.</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Notable features row */}
            <tr>
              <td className="metric-label">Notable features</td>
              {results.map((r, i) => (
                <td key={i}>
                  {r.ok && r.competitor && r.competitor.notableFeatures.length > 0 ? (
                    r.competitor.notableFeatures.map((f, j) => (
                      <span className="chip" key={j}>
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="empty">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Free trial row */}
            <tr>
              <td className="metric-label">Free trial</td>
              {results.map((r, i) => (
                <td key={i}>
                  {r.ok && r.competitor?.freeTrial ? (
                    r.competitor.freeTrial
                  ) : (
                    <span className="empty">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="footnote">
        // Data extracted live from each competitor&apos;s pricing page. Figures
        reflect the page at scrape time and may lag the vendor&apos;s latest
        changes.
      </p>
    </div>
  );
}
