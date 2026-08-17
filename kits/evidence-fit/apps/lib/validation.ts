import type { AcceptanceCaseInput } from "./evidence/core.ts";

/**
 * Hard bounds on an experiment payload. These exist to keep a single request
 * from becoming an expensive loop or an unbounded embedding bill, and they are
 * enforced server-side before any Lamatic call is made.
 */
export const LIMITS = {
  maxDocumentChars: 200_000,
  maxCases: 25,
  maxQuotesPerCase: 8,
  maxQuoteChars: 2_000,
  maxQuestionChars: 500,
  maxTopK: 20,
  maxIdChars: 128,
} as const;

export type ExperimentInput = {
  experimentId: string;
  documentId: string;
  documentText: string;
  cases: AcceptanceCaseInput[];
  topK?: number;
};

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Structural and size validation only. Evidence correctness — whether a quote
 * actually occurs in the document, and exactly once — is the engine's job and
 * is reported separately as a ValidationIssue.
 */
export function validateExperimentInput(input: ExperimentInput): ValidationResult {
  const errors: string[] = [];

  const checkId = (v: unknown, name: string) => {
    if (typeof v !== "string" || v.length === 0) {
      errors.push(`${name} is required.`);
    } else if (v.length > LIMITS.maxIdChars) {
      errors.push(`${name} exceeds ${LIMITS.maxIdChars} characters.`);
    }
  };

  checkId(input.experimentId, "experimentId");
  checkId(input.documentId, "documentId");

  if (typeof input.documentText !== "string" || input.documentText.length === 0) {
    errors.push("documentText is required.");
  } else if (input.documentText.length > LIMITS.maxDocumentChars) {
    errors.push(
      `documentText is ${input.documentText.length} characters; the limit is ${LIMITS.maxDocumentChars}.`
    );
  }

  if (!Array.isArray(input.cases) || input.cases.length === 0) {
    errors.push("At least one acceptance case is required.");
  } else if (input.cases.length > LIMITS.maxCases) {
    errors.push(`${input.cases.length} cases supplied; the limit is ${LIMITS.maxCases}.`);
  } else {
    for (const c of input.cases) {
      const label = c && c.id ? `Case "${c.id}"` : "A case";

      if (!c || typeof c.id !== "string" || c.id.length === 0) {
        errors.push("Every case needs a non-empty id.");
      } else if (c.id.length > LIMITS.maxIdChars) {
        errors.push(`${label} id exceeds ${LIMITS.maxIdChars} characters.`);
      }

      if (!c || typeof c.question !== "string" || c.question.length === 0) {
        errors.push(`${label} needs a question.`);
      } else if (c.question.length > LIMITS.maxQuestionChars) {
        errors.push(`${label} question exceeds ${LIMITS.maxQuestionChars} characters.`);
      }

      if (!c || !Array.isArray(c.evidence) || c.evidence.length === 0) {
        errors.push(`${label} needs at least one evidence quote.`);
      } else if (c.evidence.length > LIMITS.maxQuotesPerCase) {
        errors.push(
          `${label} has ${c.evidence.length} quotes; the limit is ${LIMITS.maxQuotesPerCase}.`
        );
      } else {
        for (const ev of c.evidence) {
          if (!ev || typeof ev.quote !== "string" || ev.quote.length === 0) {
            errors.push(`${label} has an empty evidence quote.`);
          } else if (ev.quote.length > LIMITS.maxQuoteChars) {
            errors.push(`${label} has a quote over ${LIMITS.maxQuoteChars} characters.`);
          }
        }
      }
    }
  }

  if (input.topK !== undefined) {
    if (!Number.isInteger(input.topK) || input.topK < 1) {
      errors.push("topK must be a positive integer.");
    } else if (input.topK > LIMITS.maxTopK) {
      errors.push(`topK is ${input.topK}; the limit is ${LIMITS.maxTopK}.`);
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
