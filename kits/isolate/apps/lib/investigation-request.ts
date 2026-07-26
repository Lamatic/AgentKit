export function investigationRequest(issueUrl: string, ref: string) {
  const normalizedRef = ref.trim();
  return {
    issueUrl,
    ...(normalizedRef ? { ref: normalizedRef } : {}),
  };
}
