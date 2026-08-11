/**
 * Source pattern for a public GitHub issue URL, shared by the form and the API so
 * the client and server accept exactly the same inputs.
 */
export const githubIssueUrlPattern =
  String.raw`https://github\.com/[^/]+/[^/]+/issues/[1-9][0-9]*/?`;

/**
 * Validate and normalise an investigation request.
 *
 * @returns the normalised request, or `null` when the issue URL is not a public
 * GitHub issue URL.
 */
export function investigationRequest(issueUrl: string, ref: string) {
  const issuePattern = new RegExp(`^(?:${githubIssueUrlPattern})$`);
  if (!issuePattern.test(issueUrl)) return null;
  const normalizedRef = ref.trim();
  return {
    issueUrl,
    ...(normalizedRef ? { ref: normalizedRef } : {}),
  };
}
