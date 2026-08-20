// causeEventId must be a real candidate event id or null, never invented.
// Mirrors the coercion in scripts/cost-attribution_assemble.ts.
export function coerceCauseEventId(
  causeEventId: string | null | undefined,
  candidateIds: string[],
): { causeEventId: string | null; flagged: boolean } {
  if (causeEventId === null || causeEventId === undefined || causeEventId === "") {
    return { causeEventId: null, flagged: false };
  }
  if (candidateIds.includes(causeEventId)) {
    return { causeEventId, flagged: false };
  }
  return { causeEventId: null, flagged: true };
}
