export function userFacingAssessmentError(error: unknown): string {
  if (error instanceof Error && error.message.startsWith("Missing required environment variable")) {
    return error.message;
  }

  if (
    error instanceof Error &&
    (
      error.message.includes("assessmentJson") ||
      error.message.startsWith("Lamatic returned an invalid ")
    )
  ) {
    return "The deployed flow returned an assessment in an unexpected format.";
  }

  return "The maintenance assessment could not be run. Verify the local Lamatic configuration and deployed flow.";
}
