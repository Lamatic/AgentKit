import { describe, expect, test } from "bun:test";
import { z } from "zod";

import {
  InvalidInvestigationRequestError,
  publicInvestigationError,
} from "../lib/http-errors";
import { MissingIssueEvidenceContractError } from "../lib/runtime/claim";
import { InvalidCertificationPlanError } from "../lib/runtime/certification";

describe("public investigation errors", () => {
  test("returns a useful 4xx error for invalid user input", () => {
    expect(
      publicInvestigationError(new InvalidInvestigationRequestError()),
    ).toEqual({
      status: 400,
      message: "Enter a valid public GitHub issue URL and repository ref.",
    });
  });

  test("does not misclassify malformed downstream data as user input", () => {
    for (const error of [
      z.object({ plan: z.string() }).safeParse({ plan: 42 }).error,
      new SyntaxError("Malformed Lamatic JSON"),
    ]) {
      expect(publicInvestigationError(error)).toEqual({
        status: 500,
        message: "The investigation could not be completed. Try again shortly.",
      });
    }
  });

  test("returns a blocked explanation for missing issue evidence", () => {
    expect(
      publicInvestigationError(new MissingIssueEvidenceContractError()),
    ).toMatchObject({ status: 422, message: expect.stringContaining("Observed stdout") });
  });

  test("returns a safe 422 when planner repair remains non-specific", () => {
    expect(
      publicInvestigationError(new InvalidCertificationPlanError()),
    ).toEqual({
      status: 422,
      message: "Candidate and control commands must exercise different cases.",
    });
  });

  test("does not expose provider errors", () => {
    const response = publicInvestigationError(
      new Error("DAYTONA_API_KEY rejected by provider account 123"),
    );
    expect(response).toEqual({
      status: 500,
      message: "The investigation could not be completed. Try again shortly.",
    });
    expect(response.message).not.toContain("DAYTONA_API_KEY");
  });
});
