import { describe, expect, test } from "bun:test";

import { assertSafeCommand, parseReproductionPlan } from "../lib/runtime/plan";

const validPlan = {
  hypothesis: "The CLI lowercases the local part of the username.",
  setupCommand: "bun install --frozen-lockfile",
  candidateCommand: "bun run src/index.ts AdaLovelace",
  candidateAssertions: [{ kind: "stdout_contains" as const, value: "adalovelace" }],
  controlCommand: "bun run src/index.ts AdaLovelace --preserve-case",
  controlAssertions: [{ kind: "stdout_contains" as const, value: "adalovelace" }],
};

describe("reproduction plan boundary", () => {
  test("parses Lamatic JSON with or without a markdown fence", () => {
    expect(parseReproductionPlan(validPlan)).toEqual(validPlan);
    expect(parseReproductionPlan(`\`\`\`json\n${JSON.stringify(validPlan)}\n\`\`\``)).toEqual(
      validPlan,
    );
  });

  test("rejects commands that expose credentials or mutate remote state", () => {
    expect(() => assertSafeCommand("env")).toThrow("command policy");
    expect(() => assertSafeCommand("git push origin main")).toThrow("command policy");
    expect(() => assertSafeCommand("npm publish")).toThrow("command policy");
    expect(assertSafeCommand("bun install --frozen-lockfile && bun test")).toBe(
      "bun install --frozen-lockfile && bun test",
    );
  });
});
