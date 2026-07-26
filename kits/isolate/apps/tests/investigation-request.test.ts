import { describe, expect, test } from "bun:test";

import { investigationRequest } from "../lib/investigation-request";

describe("investigation request", () => {
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
