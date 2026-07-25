import { z } from "zod";

export const issueEvidenceAssertionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("stdout_contains"), value: z.string().min(5).max(2_000) }),
  z.object({ kind: z.literal("stderr_contains"), value: z.string().min(5).max(2_000) }),
]);

export type IssueEvidenceAssertion = z.infer<
  typeof issueEvidenceAssertionSchema
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

const fieldPattern =
  /^Observed (stdout|stderr):\s*(?:`([^`\r\n]+)`|([^\r\n]+))\s*$/gim;

export function extractIssueEvidenceAssertion(body: string): IssueEvidenceAssertion {
  const matches = [...body.matchAll(fieldPattern)];
  if (matches.length !== 1) throw new MissingIssueEvidenceContractError();

  const [, field, inlineValue, plainValue] = matches[0];
  const value = (inlineValue ?? plainValue ?? "").trim();

  if (!value) throw new MissingIssueEvidenceContractError();
  const parsed = issueEvidenceAssertionSchema.safeParse({
    kind: field.toLowerCase() === "stdout" ? "stdout_contains" : "stderr_contains",
    value,
  });
  if (!parsed.success) throw new MissingIssueEvidenceContractError();
  return parsed.data;
}
