import { describe, expect, test } from "bun:test";

import {
  extractIssueEvidenceAssertion,
  MissingIssueEvidenceContractError,
} from "../lib/runtime/claim";

describe("issue evidence contract", () => {
  test("derives an exact stdout assertion from the issue report", () => {
    expect(
      extractIssueEvidenceAssertion(
        "The name changes case.\n\nObserved stdout: `Hello, isolatecli!`",
      ),
    ).toEqual({ kind: "stdout_contains", value: "Hello, isolatecli!" });
  });

  test("does not certify a generic exit code as issue-specific behavior", () => {
    expect(() => extractIssueEvidenceAssertion("Observed exit code: `1`")).toThrow(
      MissingIssueEvidenceContractError,
    );
  });

  test("blocks certification when the report has no single exact signature", () => {
    expect(() => extractIssueEvidenceAssertion("It sometimes looks wrong.")).toThrow(
      MissingIssueEvidenceContractError,
    );
    expect(() =>
      extractIssueEvidenceAssertion(
        "Observed stdout: `one`\nObserved stderr: `two`",
      ),
    ).toThrow(MissingIssueEvidenceContractError);
    expect(() => extractIssueEvidenceAssertion("Observed stdout: `x`")).toThrow(
      MissingIssueEvidenceContractError,
    );
  });
});
