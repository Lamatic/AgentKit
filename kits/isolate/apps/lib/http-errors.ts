import { z } from "zod";

import { InvalidCertificationPlanError } from "./runtime/certification";
import { MissingIssueEvidenceContractError } from "./runtime/claim";
import { UnsafeCommandError } from "./runtime/policy";

export function publicInvestigationError(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return {
      status: 400,
      message: "Enter a valid public GitHub issue URL and repository ref.",
    };
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
