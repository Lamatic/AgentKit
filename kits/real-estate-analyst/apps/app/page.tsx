import { runPropertyAnalysis, type PropertyResult, type Verdict } from "@/actions/orchestrate";

// Live per-request Lamatic data — never prerender this page at build time.
export const dynamic = "force-dynamic";

function verdictColor(verdict: Verdict): string {
  if (verdict === "Buy") return "#16a34a";
  if (verdict === "Hold") return "#ca8a04";
  return "#dc2626";
}

export default async function Page() {
  const results: PropertyResult[] = (await runPropertyAnalysis()) ?? [];

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Real Estate Investment Analyst</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Address</th>
            <th>Cap Rate</th>
            <th>Cash-on-Cash</th>
            <th>DSCR</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.address} style={{ borderBottom: "1px solid #eee" }}>
              <td>{r.address}</td>
              <td>{r.capRate.toFixed(2)}%</td>
              <td>{r.cashOnCashReturn.toFixed(2)}%</td>
              <td>{r.dscr.toFixed(2)}</td>
              <td>
                <span
                  style={{
                    color: "white",
                    background: verdictColor(r.verdict),
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {r.verdict}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "2rem" }}>
        {results.map((r) => (
          <details key={r.address} style={{ marginBottom: "1rem" }}>
            <summary>{r.address} — full brief</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{r.brief}</pre>
          </details>
        ))}
      </div>
    </main>
  );
}
