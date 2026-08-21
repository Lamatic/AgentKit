# MemoryMend

## Agent Memory Integrity & Repair Engine

MemoryMend is an AgentKit kit for auditing long-lived agent memory before it silently degrades. It detects contradictory, stale, duplicated, low-provenance, and instruction-like memories; builds an evidence trail for each finding; and produces a reviewable repair plan instead of silently rewriting memory.

### Problem

Long-lived agents can accumulate memories that are no longer trustworthy. A memory may become stale, conflict with newer evidence, be duplicated across sessions, or contain attacker-controlled instructions. Retrieval alone does not answer whether a memory deserves trust.

### Core workflow

```text
Memory events
    ↓
Normalize + classify
    ↓
Evidence / provenance analysis
    ↓
Conflict + duplicate + freshness analysis
    ↓
Trust / risk scoring
    ↓
Repair plan
    ↓
Human approval
    ↓
Canonical memory state
```

### Design principles

- **Evidence before mutation:** every repair must be traceable to evidence.
- **Source-aware trust:** user statements, trusted application state, retrieved documents, and untrusted external content are not equivalent.
- **No silent deletion:** uncertain memories are quarantined or marked for review.
- **Instruction/data separation:** instruction-like content from untrusted sources must not automatically become persistent agent memory.
- **Regression visibility:** repairs produce a before/after record.

### MVP findings

1. Contradictory memories
2. Stale memories
3. Near-duplicate memories
4. Suspicious instruction-like memories / potential memory poisoning
5. Low-provenance memories

### Example

**Existing memory:** `User lives in Bangalore.`

**New evidence:** `I moved to Hyderabad last month.`

MemoryMend should not simply keep both statements. It records the conflict, compares source and recency, proposes a canonical state, and preserves the previous memory as historical evidence.

### Status

Early implementation scaffold. Flow definitions and the Next.js demonstration UI will be added after the Lamatic Studio flow is built and exported, following the AgentKit contribution workflow.
