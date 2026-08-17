import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// This suite guards the vendoring contract described in
// kits/evidence-fit/scripts/*.ts: Lamatic code nodes cannot resolve `import`
// statements, so each script embeds a byte-identical copy of core.ts between
// fixed BEGIN/END marker lines, followed by Lamatic-specific glue. A stale
// copy must fail here, loudly, rather than silently ship a wrong number.

const BEGIN_MARKER =
  "// ---- BEGIN VENDORED from apps/lib/evidence/core.ts — do not edit here ----";
const END_MARKER = "// ---- END VENDORED ----";

const CORE_PATH = join(import.meta.dirname, "..", "lib", "evidence", "core.ts");
const SCRIPTS_DIR = join(import.meta.dirname, "..", "..", "scripts");

const VENDORED_SCRIPTS = [
  "evidence-fit-index_prepare-chunks.ts",
  "evidence-fit-evaluate_metrics.ts",
];

const coreSource = readFileSync(CORE_PATH, "utf8");
const coreTrimmed = coreSource.trim();

function extractVendoredBlock(scriptSource: string, fileName: string): string {
  const beginIndex = scriptSource.indexOf(BEGIN_MARKER);
  const endIndex = scriptSource.indexOf(END_MARKER);

  assert.notEqual(
    beginIndex,
    -1,
    `${fileName} is missing the BEGIN VENDORED marker. Re-run the sync command ` +
      `documented at the top of the script to regenerate the vendored block — ` +
      `never hand-edit the copy of core.ts inside these scripts.`
  );
  assert.notEqual(
    endIndex,
    -1,
    `${fileName} is missing the END VENDORED marker. Re-run the sync command ` +
      `documented at the top of the script to regenerate the vendored block — ` +
      `never hand-edit the copy of core.ts inside these scripts.`
  );
  assert.ok(
    endIndex > beginIndex,
    `${fileName} has the END VENDORED marker before the BEGIN marker. Re-run the ` +
      `sync command to regenerate the vendored block — never hand-edit the copy ` +
      `of core.ts inside these scripts.`
  );

  return scriptSource.slice(beginIndex + BEGIN_MARKER.length, endIndex);
}

test("core.ts has zero import statements, so it stays safe to vendor into a Lamatic code node", () => {
  const importLike = coreSource
    .split(/\r?\n/)
    .filter((line) => /^\s*import\s/.test(line) || /^\s*export\s+\*\s+from/.test(line));

  assert.deepEqual(
    importLike,
    [],
    "apps/lib/evidence/core.ts must have zero lines matching /^\\s*import\\s/ or " +
      "/^\\s*export\\s+\\*\\s+from/ — an import would break the deployed Lamatic code " +
      "node, which cannot resolve module specifiers. Found: " +
      JSON.stringify(importLike)
  );
});

for (const fileName of VENDORED_SCRIPTS) {
  test(`${fileName} vendors a byte-identical copy of core.ts`, () => {
    const scriptPath = join(SCRIPTS_DIR, fileName);
    const scriptSource = readFileSync(scriptPath, "utf8");
    const vendoredBlock = extractVendoredBlock(scriptSource, fileName).trim();

    assert.equal(
      vendoredBlock,
      coreTrimmed,
      `scripts/${fileName} has drifted from apps/lib/evidence/core.ts. Re-run the ` +
        `sync command documented at the top of the script (or in the task that ` +
        `created it) to regenerate the vendored block between the BEGIN/END ` +
        `markers — never hand-edit the copy of core.ts inside this file.`
    );
  });
}
