export const githubIssueUrlPattern =
  String.raw`https://github\.com/[^/]+/[^/]+/issues/[1-9][0-9]*/?`;

export function investigationRequest(issueUrl: string, ref: string) {
  const issuePattern = new RegExp(`^(?:${githubIssueUrlPattern})$`);
  if (!issuePattern.test(issueUrl)) return null;
  const normalizedRef = ref.trim();
  return {
    issueUrl,
    ...(normalizedRef ? { ref: normalizedRef } : {}),
  };
}
