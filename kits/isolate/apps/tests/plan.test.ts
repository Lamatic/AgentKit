import { describe, expect, test } from "bun:test";

import { parseReproductionPlan } from "../lib/runtime/plan";
import {
  assertCertificationCommand,
  assertSafeCommand,
} from "../lib/runtime/policy";

const validPlan = {
  hypothesis: "The CLI lowercases the local part of the username.",
  candidateCommand: "bun run src/index.ts AdaLovelace",
  controlCommand: "bun run src/index.ts AdaLovelace --preserve-case",
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
    expect(
      assertSafeCommand("printf '%s' '--- relevant source and tests ---'"),
    ).toBe("printf '%s' '--- relevant source and tests ---'");
  });

  test("allows only repository runners to produce certification evidence", () => {
    expect(
      assertCertificationCommand("bun run cli IsolateCLI", "Hello, isolatecli!"),
    ).toBe("bun run cli IsolateCLI");
    expect(() =>
      assertCertificationCommand("printf 'Hello, isolatecli!'", "Hello, isolatecli!"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("node -e \"console.log('Hello')\"", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("base64 -d payload; bun test", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test\nprintf 'Hello'", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "bun run nonexistent\nprintf \"Hello, \\x69solatecli!\"",
        "Hello, isolatecli!",
      ),
    ).toThrow("command policy");
  });
});
