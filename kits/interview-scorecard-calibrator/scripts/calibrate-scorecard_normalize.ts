// Normalize interviewer notes + rubric into a compact context blob for downstream nodes.
// Flow: calibrate-scorecard
//
// Interviewer notes MUST include at least two interviewer entries, separated by:
// - a line containing only `---`
// - and/or headings like `Interviewer 1:` / `Interviewer 1 (Alice, Staff Eng):`

/** Split notes on `---` separators or numbered Interviewer headings (with optional names). */
function splitInterviewerNotes(notes: string): string[] {
  return notes
    .split(/\n\s*-{3,}\s*\n|(?=^\s*Interviewer\s+\d+(?:\s*\([^)]*\))?\s*:)/im)
    .map((block) => block.trim())
    .filter(Boolean);
}

/**
 * Validates and normalizes calibration inputs before LLM nodes run.
 */
export async function run(inputs: {
  job_title?: string;
  level?: string;
  rubric?: string;
  interviewer_notes?: string;
}) {
  const jobTitle = String(inputs.job_title || "").trim() || "Untitled role";
  const level = String(inputs.level || "").trim() || "Unspecified";
  const rubric = String(inputs.rubric || "").trim();
  const notes = String(inputs.interviewer_notes || "").trim();

  if (!rubric) {
    throw new Error("rubric is required");
  }
  if (!notes) {
    throw new Error("interviewer_notes is required");
  }

  const interviewerBlocks = splitInterviewerNotes(notes);
  if (interviewerBlocks.length < 2) {
    throw new Error(
      "interviewer_notes must include at least two interviewer entries separated by '---' or 'Interviewer N:' headings",
    );
  }

  return {
    job_title: jobTitle,
    level,
    rubric,
    interviewer_notes: notes,
    interviewer_count: interviewerBlocks.length,
    interviewer_blocks: interviewerBlocks,
    normalized_context: [
      `Role: ${jobTitle} (${level})`,
      "",
      "Rubric:",
      rubric,
      "",
      `Interviewer notes (${interviewerBlocks.length} interviewers):`,
      notes,
    ].join("\n"),
  };
}
