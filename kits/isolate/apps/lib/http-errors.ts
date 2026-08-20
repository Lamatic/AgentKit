import { InvalidCertificationPlanError } from "./runtime/certification";
import { MissingIssueEvidenceContractError } from "./runtime/claim";
import { InvalidGitHubIssueUrlError } from "./runtime/github";
import { UnsafeCommandError } from "./runtime/policy";

/**
 * Raised when the submitted issue URL or ref fails request validation.
 */
export class InvalidInvestigationRequestError extends Error {
  constructor() {
    super("Enter a valid public GitHub issue URL and repository ref.");
    this.name = "InvalidInvestigationRequestError";
  }
}

/**
 * Map an internal error to the status and message that may be shown to a caller.
 *
 * Anything unrecognised collapses to a generic 500 so provider messages, sandbox
 * identifiers, and stack details never reach the client.
 */
export function publicInvestigationError(error: unknown) {
  if (error instanceof InvalidInvestigationRequestError) {
    return {
      status: 400,
      message: error.message,
    };
  }
  if (error instanceof InvalidGitHubIssueUrlError) {
    return { status: 400, message: error.message };
  }
  if (error instanceof MissingIssueEvidenceContractError) {
    return { status: 422, message: error.message };
  }
  if (error instanceof InvalidCertificationPlanError) {
    return { status: 422, message: error.message };
  }
  if (error instanceof UnsafeCommandError) {
    return {
      status: 422,
      message: "The proposed investigation was blocked by Isolate's safety policy.",
    };
  }
  return {
    status: 500,
    message: "The investigation could not be completed. Try again shortly.",
  };
}
