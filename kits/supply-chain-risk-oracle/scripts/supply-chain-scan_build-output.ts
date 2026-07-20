const raw = input.score_result;

let parsed = null;
let isError = false;

try {
  parsed = typeof raw === "object" ? raw : JSON.parse(
    String(raw).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
  );
} catch (e) {
  isError = true;
}

if (isError || !parsed) {
  output = {
    risk_matrix: [],
    high_risk_suppliers: [],
    scan_timestamp: new Date().toISOString(),
    summary: "Failed to parse risk matrix. Please retry."
  };
} else {
  const riskMatrix = Array.isArray(parsed.risk_matrix) ? parsed.risk_matrix : [];
  output = {
    risk_matrix: riskMatrix,
    high_risk_suppliers: riskMatrix.filter((s) => s?.risk_score >= 60),
    scan_timestamp: new Date().toISOString(),
    summary: typeof parsed.summary === "string" ? parsed.summary : ""
  };
}
