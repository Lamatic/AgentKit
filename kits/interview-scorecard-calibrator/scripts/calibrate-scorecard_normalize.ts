// Normalize interviewer notes + rubric into a compact context blob for downstream nodes.
// Flow: calibrate-scorecard
//
// Interviewer notes MUST include at least two interviewer entries, separated by:
// - a line containing only `---`
// - and/or headings like `Interviewer 1:` / `Interviewer 1 (Alice, Staff Eng):`

const jobTitleRaw = `{{triggerNode_1.output.job_title}}`;
const levelRaw = `{{triggerNode_1.output.level}}`;
const rubricRaw = `{{triggerNode_1.output.rubric}}`;
const notesRaw = `{{triggerNode_1.output.interviewer_notes}}`;

const jobTitle = String(jobTitleRaw || "").trim() || "Untitled role";
const level = String(levelRaw || "").trim() || "Unspecified";
const rubric = String(rubricRaw || "").trim();
const notes = String(notesRaw || "").trim();

if (!rubric) {
  throw new Error("rubric is required");
}
if (!notes) {
  throw new Error("interviewer_notes is required");
}

const interviewerBlocks = notes
  .split(/\n\s*-{3,}\s*\n|(?=^\s*Interviewer\s+\d+(?:\s*\([^)]*\))?\s*:)/im)
  .map((block) => block.trim())
  .filter(Boolean);

if (interviewerBlocks.length < 2) {
  throw new Error(
    "interviewer_notes must include at least two interviewer entries separated by '---' or 'Interviewer N:' headings",
  );
}

output = {
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
