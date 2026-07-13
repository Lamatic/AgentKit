export const maxInputCharacters = 12000;
export const clientTimeoutMs = 180000;

export function validateAuditInputs(flowBrief, optionalFlowExport) {
  if (!String(flowBrief || "").trim()) {
    return "Flow Brief is required.";
  }
  if (
    String(flowBrief || "").length > maxInputCharacters ||
    String(optionalFlowExport || "").length > maxInputCharacters
  ) {
    return "Keep each input under 12,000 characters.";
  }
  return "";
}

export function sourceLabel(source) {
  return {
    lamatic: "Lamatic",
    preflight: "Preflight",
    mock: "Local mock, not Lamatic"
  }[source] || "Unknown";
}

export async function requestAudit(flowBrief, optionalFlowExport, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl("/api/audit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ flowBrief, optionalFlowExport }),
    signal
  });
  const body = await parseJsonResponse(response);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("The audit could not complete. Try again.");
  }
  if (!response.ok) {
    throw new Error(body.error || "The audit could not complete.");
  }
  if (!body.audit) {
    throw new Error("The audit could not complete. Check that the flow brief is plain text and try again.");
  }
  return body;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return { error: "The audit could not complete. Check that the flow brief is plain text and try again." };
  }
}
