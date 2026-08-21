import { NextResponse } from "next/server";
import { analyzeMemoryIntegrity, type EvidenceRecord, type IntegrityPolicy, type MemoryRecord } from "../../../core/integrity";

interface AnalyzeRequest {
  memories?: MemoryRecord[];
  new_evidence?: EvidenceRecord[];
  policy?: Partial<IntegrityPolicy>;
}

const defaultPolicy: IntegrityPolicy = {
  stale_after_days: 180,
  require_human_review_for_quarantine: true,
  minimum_confidence_for_auto_merge: 0.85,
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const memories = Array.isArray(body.memories) ? body.memories : [];
    const newEvidence = Array.isArray(body.new_evidence) ? body.new_evidence : [];
    const policy: IntegrityPolicy = { ...defaultPolicy, ...body.policy };

    if (memories.length > 500) {
      return NextResponse.json({ error: "Maximum 500 memories per analysis." }, { status: 413 });
    }

    const report = analyzeMemoryIntegrity(memories, newEvidence, policy);
    return NextResponse.json({ status: "complete", report });
  } catch {
    return NextResponse.json({ error: "Invalid MemoryMend analysis request." }, { status: 400 });
  }
}
