export type Verdict =
  | "safe-to-merge"
  | "review-required"
  | "needs-major-version"
  | "no-api-change";

export type Severity =
  | "breaking"
  | "potentially-breaking"
  | "additive"
  | "unclassified";

export type ReviewedChange = {
  id: string;
  kind: string;
  location: string;
  before: unknown;
  after: unknown;
  severity: Severity;
  reason: string | null;
  consumerImpact: string | null;
  confidence: number | null;
};

export type ReviewResult = {
  verdict: Verdict;
  summary: string;
  oldVersion: string | null;
  newVersion: string | null;
  totalChanges: number;
  counts: { breaking: number; potentiallyBreaking: number; additive: number; unclassified: number };
  changes: ReviewedChange[];
  migrationNotes: string | null;
  changelog: string | null;
};

export type ReviewResponse =
  | { ok: true; data: ReviewResult }
  | { ok: false; error: string };
