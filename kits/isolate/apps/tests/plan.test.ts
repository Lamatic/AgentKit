import { describe, expect, test } from "bun:test";

import { parseReproductionPlan } from "../lib/runtime/plan";
import {
  assertCertificationCommand,
  assertExploratoryCommand,
  assertSafeCommand,
  normalizeCertificationCommand,
} from "../lib/runtime/policy";

const validPlan = {
  hypothesis: "The CLI lowercases the local part of the username.",
  candidateCommand: "bun run src/index.ts AdaLovelace",
  controlCommand: "bun run src/index.ts -- AdaLovelace --preserve-case",
};

describe("reproduction plan boundary", () => {
  test("allows only the runtime-defined split UTF-8 stream probe pipeline", () => {
    expect(
      assertExploratoryCommand(
        "(printf '\\342'; sleep 0.1; printf '\\202\\254\\n') | bun run dev -- --stream",
      ),
    ).toContain("bun run dev -- --stream");
    expect(() =>
      assertExploratoryCommand("printf hacked | bun run dev -- --stream"),
    ).toThrow("command policy");
  });
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
  });

  test.each([
    ["printf 'Hello, isolatecli!'", "Hello, isolatecli!"],
    ["node -e \"console.log('Hello')\"", "Hello"],
    ["base64 -d payload; bun test", "Hello"],
    ["bun test\nprintf 'Hello'", "Hello"],
    ["bun run nonexistent\nprintf \"Hello, \\x69solatecli!\"", "Hello, isolatecli!"],
    ["bun run /tmp/repro.js", "Hello"],
    ["npm test --prefix /tmp", "Hello"],
    ["npm test --script-shell=/tmp/evil", "Hello"],
    ["npm test --node-options=--require=/tmp/evil", "Hello"],
    ["npm test --workspace=outside", "Hello"],
    ["bun run --cwd ../outside mdv -- input.md", "Hello"],
    ["bun run --cwd /tmp mdv -- input.md", "Hello"],
    ["bun run cli greet -- IsolateCLI", "Hello, isolatecli!"],
    ["bun run --preload=/tmp/repro.js test", "Hello"],
    ["NODE_OPTIONS=--require=./repro.js bun test", "Hello"],
    ["bun test ../outside.test.ts", "Hello"],
    ["bun test {../outside.test.ts,inside.test.ts}", "Hello"],
    ["bun test {/tmp/repro.test.ts,inside.test.ts}", "Hello"],
    ["bun test tests/*.test.ts", "Hello"],
    ['npm test --pre"fix"=/tmp', "Hello"],
    ["npm test --pre\\fix=/tmp", "Hello"],
    ["bun test ..\\/outside.test.ts", "Hello"],
    ["bun test $HOME/repro.test.ts", "Hello"],
    ["bun test $TMPDIR/repro.test.ts", "Hello"],
    ["bun test ${TMPDIR}/repro.test.ts", "Hello"],
  ])("rejects unsafe certification command: %s", (command, evidence) => {
    expect(() => assertCertificationCommand(command, evidence)).toThrow(
      "command policy",
    );
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
