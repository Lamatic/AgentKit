import { describe, expect, test } from "bun:test";

import { GitHubIssueReader } from "../lib/runtime/github";

describe("GitHubIssueReader", () => {
  test("normalizes a public GitHub issue into deterministic investigation input", async () => {
    const reader = new GitHubIssueReader(async (input, init) => {
      expect(String(input)).toBe(
        "https://api.github.com/repos/acme/buggy-cli/issues/42",
      );
      expect(init?.headers).toMatchObject({ Accept: "application/vnd.github+json" });
      return Response.json({
        html_url: "https://github.com/acme/buggy-cli/issues/42",
        title: "CLI lowercases part of the username",
        body: "Names look wrong when I use the CLI.",
        state: "open",
        user: { login: "maintainer" },
        labels: [{ name: "bug" }, { name: "needs-repro" }],
        pull_request: undefined,
      });
    });

    await expect(
      reader.read("https://github.com/acme/buggy-cli/issues/42"),
    ).resolves.toEqual({
      url: "https://github.com/acme/buggy-cli/issues/42",
      repositoryUrl: "https://github.com/acme/buggy-cli",
      owner: "acme",
      repository: "buggy-cli",
      number: 42,
      title: "CLI lowercases part of the username",
      body: "Names look wrong when I use the CLI.",
      state: "open",
      author: "maintainer",
      labels: ["bug", "needs-repro"],
    });
  });

  test("rejects pull requests and non-GitHub issue URLs", async () => {
    const reader = new GitHubIssueReader(async () =>
      Response.json({ pull_request: { url: "https://api.github.com/pulls/1" } }),
    );

    await expect(
      reader.read("https://example.com/acme/buggy-cli/issues/42"),
    ).rejects.toThrow("Only public GitHub issue URLs are supported.");
    await expect(
      reader.read("https://github.com/acme/buggy-cli/issues/42"),
    ).rejects.toThrow("Pull requests are not supported.");
  });
});
