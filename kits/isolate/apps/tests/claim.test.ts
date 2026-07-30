import { describe, expect, test } from "bun:test";

import {
  extractIssueEvidenceAssertion,
  MissingIssueEvidenceContractError,
  tryDeriveIssueEvidenceAssertion,
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

  test("derives a runtime-owned TUI unsaved-exit contract from ordinary issue text", () => {
    expect(
      tryDeriveIssueEvidenceAssertion({
        title: "ctrl + Q exits without any save warning",
        body: "When exiting the TUI, it exits instantly without the content saved or giving any warning.",
      }),
    ).toEqual({ kind: "tui_unsaved_exit", quitKey: "ctrl_q" });
  });

  test("does not classify unrelated save or keyboard reports as TUI exit claims", () => {
    expect(
      tryDeriveIssueEvidenceAssertion({
        title: "Ctrl+Q shortcut is hard to discover",
        body: "Please add it to the documentation.",
      }),
    ).toBeNull();
    expect(
      tryDeriveIssueEvidenceAssertion({
        title: "Save command is slow",
        body: "Ctrl+S takes several seconds.",
      }),
    ).toBeNull();
  });
});

test("derives dirty TUI exit evidence from a vague issue plus repository context", () => {
  expect(
    tryDeriveIssueEvidenceAssertion(
      { title: "my changes go away when I quit", body: "" },
      "Terminal-first Markdown visualizer/editor. Press Ctrl+Q to quit and Ctrl+S to save.",
    ),
  ).toEqual({ kind: "tui_unsaved_exit", quitKey: "ctrl_q" });
});
