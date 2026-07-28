export const githubIssueUrlPattern =
  String.raw`https://github\.com/[^/]+/[^/]+/issues/[1-9][0-9]*/?`;

export function investigationRequest(issueUrl: string, ref: string) {
  const normalizedRef = ref.trim();
  return {
    issueUrl,
    ...(normalizedRef ? { ref: normalizedRef } : {}),
  };
}
