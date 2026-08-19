export function canApproveTasks(proposals: unknown[]): boolean {
  return proposals.length > 0;
}

export function canScoreAssignment(proposals: unknown[], tasksApproved: boolean): boolean {
  return proposals.length > 0 && tasksApproved;
}

export function clearedDownstreamState() {
  return {
    tasksApproved: false,
    recommendation: null,
    assignmentApproved: false,
    approvalToken: null,
    executionContext: null
  } as const;
}
