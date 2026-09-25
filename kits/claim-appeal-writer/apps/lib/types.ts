export type DenialCategory =
  | "medical-necessity"
  | "prior-authorization"
  | "out-of-network"
  | "not-covered"
  | "experimental-investigational"
  | "coding-error"
  | "timely-filing"
  | "eligibility"
  | "other";

export interface DenialReason {
  code: string | null;
  statedReason: string;
  category: DenialCategory;
}

export interface DenialFacts {
  insurer: string;
  claimNumber: string | null;
  memberOrPolicyNumber: string | null;
  dateOfDenial: string | null;
  dateOfService: string | null;
  serviceDenied: string;
  amountInDispute: string | null;
  denialReasons: DenialReason[];
  appealDeadlineStated: string | null;
  internalAppealAddress: string | null;
  planType: "employer-erisa" | "marketplace-aca" | "medicare" | "medicaid" | "individual" | "unknown";
  confidence: "high" | "medium" | "low";
  missingInfo: string[];
  summary: string;
}

export interface AppealResult {
  letter: string;
  deadline: { date: string | null; source: "letter" | "regulation" | "unknown"; urgencyNote: string };
  checklist: { item: string; why: string; required: boolean }[];
  nextSteps: string[];
  escalation: string;
  citationsUsed: string[];
  policyExcerpts: { label: string; chunkIndex: number | null; content: string; certainty: number | null }[];
  webSources: { title: string; url: string; snippet: string }[];
  disclaimer: string;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
