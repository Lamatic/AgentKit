import { describe, expect, test } from "bun:test";

import { parseInvestigationReport } from "../lib/runtime/investigation-report";

describe("parseInvestigationReport", () => {
  test("accepts a bounded evidence-based report", () => {
    const report = parseInvestigationReport(JSON.stringify({
      outcome: "likely_reproduced",
      summary: "Narrow output splits a word.",
      expectedBehavior: "Keep words intact when wrapping.",
      actualBehavior: "Markdown is split in the middle of a word.",
      reproductionSteps: ["Run the preview at 20 columns."],
      evidence: ["Candidate output repeated the same split twice."],
      limitations: ["AI-interpreted from runtime output."],
      markdown: "# Isolate investigation report\n\n## Outcome\nLikely reproduced",
    }));

    expect(report.outcome).toBe("likely_reproduced");
    expect(report.markdown).toContain("Outcome");
  });

  test.each([
    ["malformed JSON", "{"],
    ["unsupported outcome", JSON.stringify({ outcome: "reproduced" })],
    ["missing markdown", JSON.stringify({
      outcome: "inconclusive",
      summary: "Summary",
      expectedBehavior: "Expected",
      actualBehavior: "Actual",
      reproductionSteps: ["Run it"],
      evidence: ["Observed"],
      limitations: [],
    })],
  ])("rejects %s", (_name, value) => {
    expect(() => parseInvestigationReport(value)).toThrow();
  });
});
