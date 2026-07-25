import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { publicInvestigationError } from "../lib/http-errors";
import { MissingIssueEvidenceContractError } from "../lib/runtime/claim";

describe("public investigation errors", () => {
  test("returns a useful 4xx error for invalid user input", () => {
    const inputError = z.string().url().safeParse("not-a-url").error;
    expect(publicInvestigationError(inputError)).toEqual({
      status: 400,
      message: "Enter a valid public GitHub issue URL and repository ref.",
    });
  });

  test("returns a blocked explanation for missing issue evidence", () => {
    expect(
      publicInvestigationError(new MissingIssueEvidenceContractError()),
    ).toMatchObject({ status: 422, message: expect.stringContaining("Observed stdout") });
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
