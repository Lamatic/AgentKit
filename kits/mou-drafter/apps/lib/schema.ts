import { z } from "zod";

// ── Party sub-schema ─────────────────────────────────────────────────────
const partySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().default("org"),
  address: z.string().min(1, "Address is required"),
  signatory: z.string().min(1, "Signatory name is required"),
  signatoryRole: z.string().min(1, "Signatory role is required"),
  email: z.string().email("Valid email required"),
});

// ── Deliverable sub-schema ───────────────────────────────────────────────
const deliverableSchema = z.object({
  label: z.string().min(1, "Deliverable label is required"),
  dueDate: z.string().min(1, "Due date is required"),
  acceptanceCriteria: z.string().min(1, "Acceptance criteria is required"),
});

// ── Engagement type enum ─────────────────────────────────────────────────
// Values MUST match validate-input.ts enforceEnum() exactly.
export const ENGAGEMENT_TYPES = [
  "services",
  "venue",
  "catering",
  "av-equipment",
  "photography",
  "design",
  "sponsorship",
  "other",
] as const;

export const PAYMENT_SCHEDULES = ["milestone-based", "lump-sum"] as const;

export const PAYMENT_PRESETS = [
  "30-net-15",
  "50-net-30",
  "25-net-7",
  "custom",
] as const;

export const IP_OWNERSHIP_OPTIONS = [
  "engager",
  "vendor",
  "joint",
  "not-applicable",
] as const;

export const TERMINATION_PRESETS = [
  "standard-30-7",
  "short-14-3",
  "extended-60-14",
] as const;

export const DISPUTE_RESOLUTION_OPTIONS = [
  "mediation-then-arbitration",
  "arbitration-only",
  "courts",
] as const;

export const PAYMENT_TIMING_OPTIONS = [
  "advance-full",          // full payment before event
  "advance-partial",       // deposit before, balance after
  "after-event",           // full payment after completion
  "milestone-tied",        // tied to milestone acceptance (milestone-based default)
  "custom",
] as const;

export const CANCELLATION_POLICY_OPTIONS = [
  "none",
  "sliding-scale",         // % of fee forfeit on tiered windows (>30d, 15-30d, <15d, <7d)
  "flat-fee",              // fixed cancellation fee
  "custom",
] as const;

// ── Main form schema ─────────────────────────────────────────────────────
// This is the UI-facing shape. The server action flattens it to the flat
// trigger field names validate-input.ts expects.
export const mouFormSchema = z.object({
  // Agreement basics
  agreementTitle: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be at most 120 characters"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  engagementType: z.enum(ENGAGEMENT_TYPES),

  // Parties
  partyA: partySchema,
  partyB: partySchema,

  // Scope & deliverables
  scopeOfWork: z
    .string()
    .min(20, "Scope must be at least 20 characters")
    .max(4000, "Scope must be at most 4000 characters"),
  deliverables: z
    .array(deliverableSchema)
    .min(1, "At least one deliverable is required"),

  // Commercials
  totalFeeAmount: z.coerce.number().positive("Fee must be greater than 0"),
  totalFeeCurrency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Use 3-letter ISO code")
    .default("INR"),
  paymentSchedule: z.enum(PAYMENT_SCHEDULES).default("milestone-based"),
  paymentPreset: z.enum(PAYMENT_PRESETS).default("30-net-15"),
  customDepositPct: z.coerce.number().min(1).max(100).optional(),
  customPaymentDays: z.coerce.number().min(1).max(180).optional(),

  // Event dates / venue (conditional on engagement type)
  eventStart: z.string().optional().default(""),
  eventEnd: z.string().optional().default(""),
  eventStartTime: z.string().optional().default(""),
  eventEndTime: z.string().optional().default(""),
  eventVenue: z.string().optional().default(""),

  // Payment timing & taxes
  paymentTiming: z.enum(PAYMENT_TIMING_OPTIONS).default("milestone-tied"),
  paymentTimingCustom: z.string().optional().default(""),
  taxesIncluded: z.boolean().default(false),
  taxRatePct: z.coerce.number().min(0).max(100).default(0),
  lateFeePctPerMonth: z.coerce.number().min(0).max(100).default(0),

  // Cancellation
  cancellationPolicy: z
    .enum(CANCELLATION_POLICY_OPTIONS)
    .default("none"),
  cancellationTerms: z.string().optional().default(""),

  // Catering-specific (only used when engagementType === "catering")
  guestCountFinalDate: z.string().optional().default(""),
  extraGuestRate: z.coerce.number().min(0).optional().default(0),
  foodSafetyRequired: z.boolean().default(false),
  allergyHandlingRequired: z.boolean().default(false),

  // Risk & protection toggles
  confidentialityRequired: z.boolean().default(true),
  confidentialitySurvivalYears: z.coerce.number().min(1).max(10).default(3),
  ipOwnership: z.enum(IP_OWNERSHIP_OPTIONS).default("engager"),
  ipPortfolioRights: z.boolean().default(true),
  terminationPreset: z.enum(TERMINATION_PRESETS).default("standard-30-7"),
  insuranceRequired: z.boolean().default(false),
  insuranceGenLiab: z.coerce.number().min(0).default(0),
  insuranceProfIndem: z.coerce.number().min(0).default(0),
  dataProtectionRequired: z.boolean().default(false),
  subcontractingAllowed: z.boolean().default(false),
  noPublicityRequired: z.boolean().default(true),
  liabilityCapMultiplier: z.coerce.number().min(1).max(3).default(1),

  // Jurisdiction
  governingLaw: z.string().min(1, "Governing law is required"),
  disputeResolution: z
    .enum(DISPUTE_RESOLUTION_OPTIONS)
    .default("mediation-then-arbitration"),
  disputeVenue: z.string().min(1, "Dispute venue is required"),

  // Additional context
  additionalContext: z.string().max(2000).optional().default(""),
});

export type MoUFormData = z.infer<typeof mouFormSchema>;

// ── Flow response types ──────────────────────────────────────────────────
export interface PatternReport {
  expected: string[];
  found: string[];
  missing: string[];
  unexpected: string[];
}

export interface MoUFlowResult {
  latex: string;
  clauseJson: Record<string, unknown>;
  warnings: string[];
  patternReport: PatternReport;
}
