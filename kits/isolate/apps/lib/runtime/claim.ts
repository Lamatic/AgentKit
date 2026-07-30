import { z } from "zod";

export const outputIssueEvidenceAssertionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("stdout_contains"), value: z.string().min(5).max(2_000) }),
  z.object({ kind: z.literal("stderr_contains"), value: z.string().min(5).max(2_000) }),
]);

export const issueEvidenceAssertionSchema = z.discriminatedUnion("kind", [
  ...outputIssueEvidenceAssertionSchema.options,
  z.object({
    kind: z.literal("tui_unsaved_exit"),
    quitKey: z.literal("ctrl_q"),
  }),
]);

export type IssueEvidenceAssertion = z.infer<
  typeof issueEvidenceAssertionSchema
>;
export type OutputIssueEvidenceAssertion = z.infer<
  typeof outputIssueEvidenceAssertionSchema
>;

export class MissingIssueEvidenceContractError extends Error {
  constructor(hypothesis?: string) {
    super(
      hypothesis
        ? `Isolate investigated the repository and formed this hypothesis: ${hypothesis} Certification is blocked until the issue includes one machine-checkable \`Observed stdout\` or \`Observed stderr\` field.`
        : "The issue needs one machine-checkable `Observed stdout` or `Observed stderr` field before Isolate can certify it.",
    );
    this.name = "MissingIssueEvidenceContractError";
  }
}

export function tryExtractIssueEvidenceAssertion(body: string) {
  try {
    return extractIssueEvidenceAssertion(body);
  } catch (error) {
    if (error instanceof MissingIssueEvidenceContractError) return null;
    throw error;
  }
}

export function tryDeriveIssueEvidenceAssertion(input: {
  title: string;
  body: string;
}, repositoryContext = ""): IssueEvidenceAssertion | null {
  const explicit = tryExtractIssueEvidenceAssertion(input.body);
  if (explicit) return explicit;

  const text = `${input.title}\n${input.body}`;
  const contextualText = `${text}\n${repositoryContext}`;
  const namesTerminalSurface = /\b(?:cli|content|document|editor|file|terminal|tui)\b/i.test(
    contextualText,
  );
  const namesQuitShortcut = /\b(?:ctrl|control)\s*\+\s*q\b/i.test(text);
  const namesExit = /\b(?:close[sd]?|exit(?:s|ed|ing)?|quit(?:s|ted|ting)?)\b/i.test(
    text,
  );
  const namesUnsavedState =
    /\b(?:discard(?:s|ed|ing)?|los(?:e|es|t|ing)|unsaved)\b/i.test(text) ||
    /\b(?:change|changes|edit|edits)\b.{0,32}\b(?:go|goes|went|gone|vanish(?:es|ed)?|disappear(?:s|ed)?)\b/i.test(text) ||
    /\b(?:not|never|without)\b.{0,48}\b(?:save|saved|saving|warning|prompt|confirm)/i.test(
      text,
    );

  if (
    namesTerminalSurface &&
    namesQuitShortcut &&
    namesExit &&
    namesUnsavedState
  ) {
    return issueEvidenceAssertionSchema.parse({
      kind: "tui_unsaved_exit",
      quitKey: "ctrl_q",
    });
  }
  return null;
}

const fieldPattern =
  /^Observed (stdout|stderr):\s*(?:`([^`\r\n]+)`|([^\r\n]+))\s*$/gim;

export function extractIssueEvidenceAssertion(
  body: string,
): OutputIssueEvidenceAssertion {
  const matches = [...body.matchAll(fieldPattern)];
  if (matches.length !== 1) throw new MissingIssueEvidenceContractError();

  const match = matches[0];
  if (!match) throw new MissingIssueEvidenceContractError();
  const [, field, inlineValue, plainValue] = match;
  const value = (inlineValue ?? plainValue ?? "").trim();

  if (!value) throw new MissingIssueEvidenceContractError();
  const parsed = outputIssueEvidenceAssertionSchema.safeParse({
    kind: field?.toLowerCase() === "stdout" ? "stdout_contains" : "stderr_contains",
    value,
  });
  if (!parsed.success) throw new MissingIssueEvidenceContractError();
  return parsed.data;
}
