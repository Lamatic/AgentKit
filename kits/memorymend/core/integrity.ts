export type MemorySource =
  | "user"
  | "trusted_app"
  | "retrieved_document"
  | "external_webpage"
  | "unknown";

export type FindingType =
  | "contradiction"
  | "stale"
  | "duplicate"
  | "memory-poisoning"
  | "low-provenance";

export type RepairAction =
  | "keep"
  | "merge-with-provenance"
  | "supersede-older-memory"
  | "mark-untrusted"
  | "request-reverification"
  | "quarantine"
  | "human-review";

export interface MemoryRecord {
  id: string;
  content: string;
  source: MemorySource;
  created_at: string;
  last_verified?: string | null;
  confidence: number;
}

export interface EvidenceRecord {
  content: string;
  source: MemorySource;
  timestamp: string;
}

export interface IntegrityPolicy {
  stale_after_days: number;
  require_human_review_for_quarantine: boolean;
  minimum_confidence_for_auto_merge: number;
}

export interface Finding {
  id: string;
  type: FindingType;
  memory_ids: string[];
  evidence: string[];
  provenance: string[];
  confidence: number;
  risk: "low" | "medium" | "high" | "critical";
  recommended_action: RepairAction;
  human_review_required: boolean;
  reason: string;
}

export interface IntegrityReport {
  summary: {
    scanned: number;
    duplicates: number;
    stale: number;
    conflicts: number;
    suspicious: number;
  };
  findings: Finding[];
}

const INSTRUCTION_PATTERNS: RegExp[] = [
  /\b(?:system|admin|developer)\s*:/i,
  /\bignore\s+(?:all\s+)?previous\s+instructions\b/i,
  /\btreat\s+(?:this|future\s+instructions?)\s+as\s+trusted\b/i,
  /\breveal\s+(?:your\s+)?system\s+prompt\b/i,
];

const SOURCE_AUTHORITY: Record<MemorySource, number> = {
  user: 1.0,
  trusted_app: 0.95,
  retrieved_document: 0.65,
  external_webpage: 0.25,
  unknown: 0.1,
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((token) => token.length > 2));
}

function similarity(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection++;
  return intersection / (left.size + right.size - intersection);
}

function daysSince(date: string, now: Date): number {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - timestamp) / 86_400_000);
}

function containsInstructionLikeContent(content: string): boolean {
  return INSTRUCTION_PATTERNS.some((pattern) => pattern.test(content));
}

function redactSensitiveEvidence(content: string): string {
  return content
    .replace(/\b(?:sk|rk)-[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_SECRET]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_KEY]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|passwd|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED_SECRET]");
}

function riskFor(type: FindingType, confidence: number): Finding["risk"] {
  if (type === "memory-poisoning") return "critical";
  if (type === "contradiction") return confidence >= 0.85 ? "high" : "medium";
  if (type === "low-provenance") return confidence < 0.5 ? "high" : "medium";
  if (type === "stale") return "medium";
  return "low";
}

function findingId(type: FindingType, ids: string[]): string {
  return `${type}-${ids.slice().sort().join("-")}`;
}

function isAutoMutationEligible(memory: MemoryRecord, policy: IntegrityPolicy): boolean {
  return (
    memory.confidence >= policy.minimum_confidence_for_auto_merge &&
    SOURCE_AUTHORITY[memory.source] >= policy.minimum_confidence_for_auto_merge
  );
}

function hasContradictionSignal(left: string, right: string): boolean {
  const leftNormalized = normalize(left);
  const rightNormalized = normalize(right);
  const locationTerms = (value: string) => value.includes(" lives in ") || value.includes(" moved to ");
  return locationTerms(leftNormalized) && locationTerms(rightNormalized);
}

export function analyzeMemoryIntegrity(
  memories: MemoryRecord[],
  newEvidence: EvidenceRecord[] = [],
  policy: IntegrityPolicy = {
    stale_after_days: 180,
    require_human_review_for_quarantine: true,
    minimum_confidence_for_auto_merge: 0.85,
  },
  now = new Date(),
): IntegrityReport {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  const addFinding = (finding: Finding) => {
    if (seen.has(finding.id)) return;
    seen.add(finding.id);
    findings.push({ ...finding, evidence: finding.evidence.map(redactSensitiveEvidence) });
  };

  for (const memory of memories) {
    const authority = SOURCE_AUTHORITY[memory.source];
    if (containsInstructionLikeContent(memory.content) && authority < 0.7) {
      addFinding({
        id: findingId("memory-poisoning", [memory.id]),
        type: "memory-poisoning",
        memory_ids: [memory.id],
        evidence: [memory.content],
        provenance: [memory.source],
        confidence: Math.max(0.8, 1 - authority),
        risk: "critical",
        recommended_action: "quarantine",
        human_review_required: policy.require_human_review_for_quarantine,
        reason: "Instruction-like content from a non-authoritative source attempts to influence persistent agent behavior.",
      });
    }

    if (memory.source === "unknown" || authority < 0.4) {
      addFinding({
        id: findingId("low-provenance", [memory.id]),
        type: "low-provenance",
        memory_ids: [memory.id],
        evidence: [memory.content],
        provenance: [memory.source],
        confidence: memory.confidence,
        risk: riskFor("low-provenance", memory.confidence),
        recommended_action: "mark-untrusted",
        human_review_required: true,
        reason: "The memory does not have sufficient source authority for a consequential persistent fact.",
      });
    }

    const lastVerified = memory.last_verified ?? memory.created_at;
    if (daysSince(lastVerified, now) > policy.stale_after_days) {
      addFinding({
        id: findingId("stale", [memory.id]),
        type: "stale",
        memory_ids: [memory.id],
        evidence: [lastVerified],
        provenance: [memory.source],
        confidence: memory.confidence,
        risk: "medium",
        recommended_action: "request-reverification",
        human_review_required: true,
        reason: `Memory has not been verified within the configured ${policy.stale_after_days}-day freshness window.`,
      });
    }
  }

  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const left = memories[i];
      const right = memories[j];
      const score = similarity(left.content, right.content);
      if (score >= 0.8) {
        const canAutoMerge = isAutoMutationEligible(left, policy) && isAutoMutationEligible(right, policy);
        addFinding({
          id: findingId("duplicate", [left.id, right.id]),
          type: "duplicate",
          memory_ids: [left.id, right.id],
          evidence: [left.content, right.content],
          provenance: [left.source, right.source],
          confidence: score,
          risk: "low",
          recommended_action: canAutoMerge ? "merge-with-provenance" : "human-review",
          human_review_required: !canAutoMerge,
          reason: `The memories have high semantic overlap (${Math.round(score * 100)}%). Consolidation should preserve both provenance records.`,
        });
      } else if (score < 0.35 && left.source !== "unknown" && right.source !== "unknown" && hasContradictionSignal(left.content, right.content)) {
        const newer = Date.parse(left.created_at) >= Date.parse(right.created_at) ? left : right;
        const older = newer.id === left.id ? right : left;
        const evidenceStrength = Math.min(left.confidence, right.confidence, SOURCE_AUTHORITY[left.source], SOURCE_AUTHORITY[right.source]);
        const canSupersede = isAutoMutationEligible(left, policy) && isAutoMutationEligible(right, policy);
        addFinding({
          id: findingId("contradiction", [left.id, right.id]),
          type: "contradiction",
          memory_ids: [left.id, right.id],
          evidence: [left.content, right.content],
          provenance: [left.source, right.source],
          confidence: evidenceStrength,
          risk: riskFor("contradiction", evidenceStrength),
          recommended_action: canSupersede ? "supersede-older-memory" : "human-review",
          human_review_required: !canSupersede,
          reason: `The memories assert incompatible current-state facts. Newer memory ${newer.id} should only supersede ${older.id} when both records meet confidence and source-authority thresholds.`,
        });
      }
    }
  }

  for (const evidence of newEvidence) {
    for (const memory of memories) {
      const score = similarity(memory.content, evidence.content);
      const contradictory = hasContradictionSignal(memory.content, evidence.content);
      if (contradictory) {
        const memoryEligible = isAutoMutationEligible(memory, policy);
        const evidenceEligible =
          SOURCE_AUTHORITY[evidence.source] >= policy.minimum_confidence_for_auto_merge &&
          evidence.timestamp.length > 0;
        const evidenceIsNewer = Date.parse(evidence.timestamp) >= Date.parse(memory.created_at);
        const canSupersede = evidenceIsNewer && memoryEligible && evidenceEligible;
        addFinding({
          id: findingId("contradiction", [memory.id, `evidence-${evidence.timestamp}`]),
          type: "contradiction",
          memory_ids: [memory.id],
          evidence: [memory.content, evidence.content],
          provenance: [memory.source, evidence.source],
          confidence: Math.min(memory.confidence, SOURCE_AUTHORITY[evidence.source]),
          risk: riskFor("contradiction", Math.min(memory.confidence, SOURCE_AUTHORITY[evidence.source])),
          recommended_action: canSupersede ? "supersede-older-memory" : "human-review",
          human_review_required: !canSupersede,
          reason: `New evidence conflicts with memory ${memory.id}; automatic supersession requires newer evidence plus sufficient confidence and source authority.`,
        });
      } else if (score >= 0.8) {
        addFinding({
          id: findingId("duplicate", [memory.id, `evidence-${evidence.timestamp}`]),
          type: "duplicate",
          memory_ids: [memory.id],
          evidence: [memory.content, evidence.content],
          provenance: [memory.source, evidence.source],
          confidence: score,
          risk: "low",
          recommended_action: "human-review",
          human_review_required: true,
          reason: "Incoming evidence closely matches an existing memory; preserve provenance before consolidating it.",
        });
      }

      if (containsInstructionLikeContent(evidence.content) && SOURCE_AUTHORITY[evidence.source] < 0.7) {
        addFinding({
          id: findingId("memory-poisoning", ["evidence", evidence.timestamp, normalize(evidence.content)]),
          type: "memory-poisoning",
          memory_ids: [],
          evidence: [evidence.content],
          provenance: [evidence.source],
          confidence: 0.96,
          risk: "critical",
          recommended_action: "quarantine",
          human_review_required: policy.require_human_review_for_quarantine,
          reason: "New untrusted evidence contains instruction-like authority escalation and must not be persisted as trusted memory.",
        });
      }
    }

    if (!memories.length && containsInstructionLikeContent(evidence.content) && SOURCE_AUTHORITY[evidence.source] < 0.7) {
      addFinding({
        id: findingId("memory-poisoning", ["evidence", evidence.timestamp, normalize(evidence.content)]),
        type: "memory-poisoning",
        memory_ids: [],
        evidence: [evidence.content],
        provenance: [evidence.source],
        confidence: 0.96,
        risk: "critical",
        recommended_action: "quarantine",
        human_review_required: policy.require_human_review_for_quarantine,
        reason: "New untrusted evidence contains instruction-like authority escalation and must not be persisted as trusted memory.",
      });
    }
  }

  return {
    summary: {
      scanned: memories.length,
      duplicates: findings.filter((f) => f.type === "duplicate").length,
      stale: findings.filter((f) => f.type === "stale").length,
      conflicts: findings.filter((f) => f.type === "contradiction").length,
      suspicious: findings.filter((f) => f.type === "memory-poisoning" || f.type === "low-provenance").length,
    },
    findings,
  };
}
