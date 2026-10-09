# MemoryMend Flow Contract

## Purpose

Turn a batch of agent memories plus new evidence into an evidence-backed integrity report and a reviewable repair plan.

## Input

```json
{
  "memories": [
    {
      "id": "string",
      "content": "string",
      "source": "user|trusted_app|retrieved_document|external_webpage|unknown",
      "created_at": "ISO-8601",
      "last_verified": "ISO-8601|null",
      "confidence": 0.0
    }
  ],
  "new_evidence": [
    {
      "content": "string",
      "source": "user|trusted_app|retrieved_document|external_webpage|unknown",
      "timestamp": "ISO-8601"
    }
  ],
  "policy": {
    "stale_after_days": 180,
    "require_human_review_for_quarantine": true,
    "minimum_confidence_for_auto_merge": 0.85
  }
}
```

## Processing stages

### 1. Normalize
Canonicalize whitespace, timestamps, source labels, and memory IDs. Do not change semantic content.

### 2. Provenance analysis
Determine whether each memory has an attributable source and classify source authority. External content never gains system-level authority merely by containing instruction-like language.

### 3. Relationship analysis
Find likely duplicates, contradictions, and evidence that supersedes or weakens an existing memory.

### 4. Freshness analysis
Use `last_verified` when present, otherwise `created_at`, against the configured stale threshold. A stale finding is a review signal, not proof that the memory is false.

### 5. Risk analysis
Score findings using evidence strength, source authority, recency, contradiction count, and instruction-like content. The score must be explainable in the output.

### 6. Repair planning
Propose one of: `keep`, `merge-with-provenance`, `supersede-older-memory`, `mark-untrusted`, `request-reverification`, `quarantine`, or `human-review`.

### 7. Safety gate
Never silently delete or rewrite memory. Quarantine and uncertain conflict resolution require human review when policy requires it.

## Output

```json
{
  "summary": {
    "scanned": 0,
    "duplicates": 0,
    "stale": 0,
    "conflicts": 0,
    "suspicious": 0
  },
  "findings": [
    {
      "id": "finding-001",
      "type": "contradiction|stale|duplicate|memory-poisoning|low-provenance",
      "memory_ids": ["m-1"],
      "evidence": ["..."],
      "provenance": ["..."],
      "confidence": 0.0,
      "risk": "low|medium|high|critical",
      "recommended_action": "keep|merge-with-provenance|supersede-older-memory|mark-untrusted|request-reverification|quarantine|human-review",
      "human_review_required": true,
      "reason": "string"
    }
  ],
  "repair_plan": []
}
```

## Non-negotiable behavior

A successful run must leave an auditable trail from every proposed repair to the memory IDs and evidence that caused it. The system must fail closed when provenance is insufficient for a high-impact mutation.
