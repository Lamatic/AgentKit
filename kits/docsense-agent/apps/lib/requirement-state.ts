/**
 * DocSense — Requirement State Model
 * ----------------------------------
 * This is the core of DocSense. It is NOT a static checklist.
 *
 * The central object is a ClientProfile whose `requirements` list is LIVING:
 * it starts from a base set and GROWS as incoming documents reveal new needs.
 *
 * Two behaviours this model must support:
 *   1. NEW CLIENT   → requirements expand from evidence as documents arrive.
 *   2. RETURNING     → stay silent on routine items; surface only what is
 *                      DIFFERENT versus the client's historical baseline.
 *
 * The LLM does the *reading and reasoning* (what does this document imply?).
 * This module holds the *state and the deterministic diffing* — so the audit
 * trail of "why is this required?" is always explainable, never hallucinated.
 */

export type RequirementStatus =
  | "missing" // needed, not yet received
  | "received" // satisfied by a submitted document
  | "triggered"; // newly required because a document revealed a need

export interface Requirement {
  id: string; // stable slug, e.g. "form-15ca-foreign-remittance"
  label: string; // human-readable, e.g. "Form 15CA/CB for foreign remittance"
  status: RequirementStatus;
  /** Why this requirement exists. For triggered items, cite the evidence. */
  source:
    | { kind: "base" } // on the day-one list
    | { kind: "triggered"; byDocId: string; reason: string } // added from evidence
    | { kind: "historical-anomaly"; reason: string }; // new vs last year
  createdAt: string;
}

export interface ReceivedDoc {
  docId: string;
  docType: string; // e.g. "bank-statement", "invoice", "sale-deed"
  extractedFacts: Record<string, unknown>; // structured output from the LLM node
  receivedAt: string;
}

export interface HistoricalBaseline {
  /** Requirement ids that were normal/expected for this client in prior years. */
  routineRequirementIds: string[];
  /** Document types this client normally submits every year. */
  routineDocTypes: string[];
  /** Free-form notes the agent has accumulated about this client. */
  notes?: string[];
}

export interface ClientProfile {
  clientId: string;
  clientType: "new" | "returning";
  requirements: Requirement[];
  receivedDocs: ReceivedDoc[];
  baseline?: HistoricalBaseline; // present only for returning clients
  updatedAt: string;
}

/** The base day-one requirement set every client starts with. */
export const BASE_REQUIREMENTS: Omit<Requirement, "createdAt">[] = [
  { id: "pan", label: "PAN card", status: "missing", source: { kind: "base" } },
  {
    id: "bank-statements",
    label: "Bank statements (full year)",
    status: "missing",
    source: { kind: "base" },
  },
  {
    id: "aadhaar",
    label: "Aadhaar",
    status: "missing",
    source: { kind: "base" },
  },
  {
    id: "form-26as",
    label: "Form 26AS (tax credit statement)",
    status: "missing",
    source: { kind: "base" },
  },
];

/** Create a fresh profile for a new client. */
export function createNewClientProfile(clientId: string): ClientProfile {
  const now = new Date().toISOString();
  return {
    clientId,
    clientType: "new",
    requirements: BASE_REQUIREMENTS.map((r) => ({ ...r, createdAt: now })),
    receivedDocs: [],
    updatedAt: now,
  };
}

/**
 * A trigger inferred by the LLM from a document's contents.
 * The LLM proposes these; this module records them deterministically with
 * an evidence trail so the CA can see WHY each new requirement appeared.
 */
export interface InferredTrigger {
  requirementId: string;
  label: string;
  reason: string; // e.g. "Foreign payment of ₹4,20,000 detected on 12 Mar"
}

/**
 * Apply a document + the LLM's inferred triggers to the profile.
 * - Marks satisfied base requirements as received.
 * - Adds any NEW triggered requirements (deduped) with their evidence.
 * Returns the updated profile AND the list of newly surfaced requirements
 * (which is exactly what the UI should announce to the CA).
 */
export function applyDocument(
  profile: ClientProfile,
  doc: ReceivedDoc,
  satisfiesRequirementIds: string[],
  triggers: InferredTrigger[]
): { profile: ClientProfile; newlySurfaced: Requirement[] } {
  const now = new Date().toISOString();
  const reqById = new Map(profile.requirements.map((r) => [r.id, r]));

  // 1. Mark satisfied requirements as received.
  for (const id of satisfiesRequirementIds) {
    const r = reqById.get(id);
    if (r && r.status !== "received") r.status = "received";
  }

  // 2. Add newly triggered requirements (skip if already present).
  const newlySurfaced: Requirement[] = [];
  for (const t of triggers) {
    if (reqById.has(t.requirementId)) continue; // dedupe
    const req: Requirement = {
      id: t.requirementId,
      label: t.label,
      status: "triggered",
      source: { kind: "triggered", byDocId: doc.docId, reason: t.reason },
      createdAt: now,
    };
    reqById.set(req.id, req);
    newlySurfaced.push(req);
  }

  const updated: ClientProfile = {
    ...profile,
    requirements: Array.from(reqById.values()),
    receivedDocs: [...profile.receivedDocs, doc],
    updatedAt: now,
  };

  return { profile: updated, newlySurfaced };
}

/**
 * RETURNING-CLIENT DIFF — the "stay quiet unless different" behaviour.
 *
 * Given a returning client's baseline and the triggers inferred from a new
 * document, return ONLY the anomalies: things that are NOT part of this
 * client's routine. Routine matches produce silence (empty array).
 */
export function detectAnomalies(
  baseline: HistoricalBaseline,
  triggers: InferredTrigger[]
): InferredTrigger[] {
  const routine = new Set(baseline.routineRequirementIds);
  return triggers.filter((t) => !routine.has(t.requirementId));
}

/** Convenience: everything still outstanding (what the client still owes you). */
export function outstanding(profile: ClientProfile): Requirement[] {
  return profile.requirements.filter((r) => r.status !== "received");
}