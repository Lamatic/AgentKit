import type { MigrationPipelineResult } from "@/types/migrationPipeline";

export async function runMigrationPipeline(
  sql: string,
): Promise<MigrationPipelineResult> {
  const response = await fetch("/api/analyze-migration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  const rawText = await response.text();
  const trimmedText = rawText.trim();

  let parsed: unknown = null;

  if (trimmedText) {
    try {
      parsed = JSON.parse(trimmedText) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      parsed && typeof parsed === "object" && "error" in parsed &&
      typeof (parsed as { error?: unknown }).error === "string"
        ? (parsed as { error: string }).error
        : `Migration analysis failed (${response.status}).`;

    throw new Error(message);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Migration analysis returned an invalid response.");
  }

  return parsed as MigrationPipelineResult;
}