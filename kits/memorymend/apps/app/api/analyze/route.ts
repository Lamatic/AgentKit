import { NextResponse } from "next/server";
import { analyzeMemoryIntegrity, type EvidenceRecord, type IntegrityPolicy, type MemoryRecord } from "../../../../core/integrity";
import { executeStep, toUserMessage } from "../../lib/lamatic-client";

interface AnalyzeRequest {
  memories?: MemoryRecord[];
  new_evidence?: EvidenceRecord[];
  policy?: Partial<IntegrityPolicy>;
}

const MAX_RECORDS = 500;

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

    if (memories.length > MAX_RECORDS || newEvidence.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECORDS} memories and ${MAX_RECORDS} evidence records per analysis.` },
        { status: 413 },
      );
    }

    // The local engine remains the deterministic fallback. When a Lamatic flow
    // is configured, the server boundary can execute it without exposing
    // credentials to client components; the raw flow result is not trusted as
    // an integrity report until it has been validated by this boundary.
    if (process.env.LAMATIC_API_URL && process.env.LAMATIC_PROJECT_ID && process.env.LAMATIC_API_KEY && process.env.MEMORYMEND_FLOW_ID) {
      try {
        await executeStep("memorymend", { memories, new_evidence: newEvidence, policy });
      } catch (error) {
        return NextResponse.json({ error: toUserMessage(error) }, { status: 502 });
      }
    }

    const report = analyzeMemoryIntegrity(memories, newEvidence, policy);
    return NextResponse.json({ status: "complete", report });
  } catch {
    return NextResponse.json({ error: "Invalid MemoryMend analysis request." }, { status: 400 });
  }
}
