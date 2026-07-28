import { describe, expect, test } from "bun:test";

import { parseReproductionPlan } from "../lib/runtime/plan";
import {
  assertCertificationCommand,
  assertSafeCommand,
  normalizeCertificationCommand,
} from "../lib/runtime/policy";

const validPlan = {
  hypothesis: "The CLI lowercases the local part of the username.",
  candidateCommand: "bun run src/index.ts AdaLovelace",
  controlCommand: "bun run src/index.ts -- AdaLovelace --preserve-case",
};

describe("reproduction plan boundary", () => {
  test("parses Lamatic JSON with or without a markdown fence", () => {
    expect(parseReproductionPlan(validPlan)).toEqual(validPlan);
    expect(parseReproductionPlan(`\`\`\`json\n${JSON.stringify(validPlan)}\n\`\`\``)).toEqual(
      validPlan,
    );
  });

  test("parses a structured TUI unsaved-exit plan without model-authored assertions", () => {
    expect(
      parseReproductionPlan({
        mode: "tui_unsaved_exit",
        hypothesis: "Ctrl+Q exits while the editor is dirty.",
        setupCommand: "bun run build",
        command: "bun run cli",
      }),
    ).toEqual({
      mode: "tui_unsaved_exit",
      hypothesis: "Ctrl+Q exits while the editor is dirty.",
      setupCommand: "bun run build",
      command: "bun run cli",
    });
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
    expect(() =>
      assertCertificationCommand("bun run /tmp/repro.js", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("npm test --prefix /tmp", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("npm test --script-shell=/tmp/evil", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "npm test --node-options=--require=/tmp/evil",
        "Hello",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("npm test --workspace=outside", "Hello"),
    ).toThrow("command policy");
    expect(
      assertCertificationCommand(
        "bun run cli -- input --preserve-case",
        "Hello",
      ),
    ).toBe("bun run cli -- input --preserve-case");
    expect(
      assertCertificationCommand(
        "bun run --cwd packages/cli mdv -- input.md",
        "Hello",
      ),
    ).toBe("bun run --cwd packages/cli mdv -- input.md");
    expect(() =>
      assertCertificationCommand(
        "bun run --cwd ../outside mdv -- input.md",
        "Hello",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "bun run --cwd /tmp mdv -- input.md",
        "Hello",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "bun run cli greet -- IsolateCLI",
        "Hello, isolatecli!",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "bun run --preload=/tmp/repro.js test",
        "Hello",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("NODE_OPTIONS=--require=./repro.js bun test", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test ../outside.test.ts", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "bun test {../outside.test.ts,inside.test.ts}",
        "Hello",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand(
        "bun test {/tmp/repro.test.ts,inside.test.ts}",
        "Hello",
      ),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test tests/*.test.ts", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand('npm test --pre"fix"=/tmp', "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("npm test --pre\\fix=/tmp", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test ..\\/outside.test.ts", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test $HOME/repro.test.ts", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test $TMPDIR/repro.test.ts", "Hello"),
    ).toThrow("command policy");
    expect(() =>
      assertCertificationCommand("bun test ${TMPDIR}/repro.test.ts", "Hello"),
    ).toThrow("command policy");
  });

  test("normalizes sequential separators without bypassing command validation", () => {
    const normalized = normalizeCertificationCommand(
      "bun run service & sleep 0.5; bun run cli -- greet IsolateCLI",
    );
    expect(normalized).toBe(
      "bun run service & sleep 0.5 && bun run cli -- greet IsolateCLI",
    );
    expect(assertCertificationCommand(normalized)).toBe(normalized);
    expect(() =>
      assertCertificationCommand(
        normalizeCertificationCommand("bun run cli; printf forged"),
      ),
    ).toThrow("command policy");
  });
});
