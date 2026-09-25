import type { Finding, MemoryRecord, RepairAction } from "./integrity";

export interface RepairProposal {
  finding_id: string;
  action: RepairAction;
  memory_ids: string[];
  requires_approval: boolean;
  rationale: string;
}

export function buildRepairPlan(
  findings: Finding[],
  memories: MemoryRecord[],
): RepairProposal[] {
  const byId = new Map(memories.map((memory) => [memory.id, memory]));

  return findings.map((finding) => {
    const action = finding.recommended_action;
    const affected = finding.memory_ids.map((id) => byId.get(id)).filter(Boolean);

    let rationale = finding.reason;

    if (action === "supersede-older-memory" && affected.length >= 2) {
      rationale += " Preserve the superseded memory as historical evidence; do not erase its provenance.";
    }

    if (action === "merge-with-provenance") {
      rationale += " Create one canonical memory while retaining source and timestamp lineage from every merged record.";
    }

    if (action === "quarantine") {
      rationale += " Keep the content isolated from trusted memory retrieval until a reviewer explicitly approves disposition.";
    }

    return {
      finding_id: finding.id,
      action,
      memory_ids: finding.memory_ids,
      requires_approval: finding.human_review_required,
      rationale,
    };
  });
}
