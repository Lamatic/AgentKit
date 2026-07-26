import { describe, expect, test } from "bun:test";

import {
  githubIssueUrlPattern,
  investigationRequest,
} from "../lib/investigation-request";

describe("investigation request", () => {
  test("accepts issue URLs and rejects pull-request URLs in browser validation", () => {
    const browserPattern = new RegExp(`^(?:${githubIssueUrlPattern})$`);

    expect(
      browserPattern.test("https://github.com/example/repo/issues/123"),
    ).toBe(true);
    expect(
      browserPattern.test("https://github.com/example/repo/pull/123"),
    ).toBe(false);
  });

  test("uses repository default branch when ref is blank", () => {
    expect(
      investigationRequest("https://github.com/example/repo/issues/1", "  "),
    ).toEqual({ issueUrl: "https://github.com/example/repo/issues/1" });
  });

  test("includes a trimmed explicit branch or commit", () => {
    expect(
      investigationRequest(
        "https://github.com/example/repo/issues/1",
        " feature/repro ",
      ),
    ).toEqual({
      issueUrl: "https://github.com/example/repo/issues/1",
      ref: "feature/repro",
    });
  });
});
