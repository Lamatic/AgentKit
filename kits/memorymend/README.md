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

### Findings

1. Contradictory memories
2. Stale memories
3. Near-duplicate memories
4. Suspicious instruction-like memories / potential memory poisoning
5. Low-provenance memories

### Setup

Prerequisites: Node.js 20+, npm, and a Lamatic project only if the optional hosted flow is being executed.

```bash
cd kits/memorymend/apps
npm install
npm run type-check
npm test
npm run dev
```

Open the local Next.js app at the URL printed by `next dev`. The deterministic local analyzer works without Lamatic credentials. To execute the optional Lamatic flow, copy `apps/.env.example` to `apps/.env.local` and fill in the server-only Lamatic values from Lamatic Studio. Never expose these values through `NEXT_PUBLIC_*` variables.

The `/api/analyze` endpoint accepts `memories`, `new_evidence`, and an optional `policy`. Both memories and evidence are limited to 500 records per request. The server redacts common credential patterns before returning audit evidence.

### Lamatic integration boundary

The Lamatic client lives at `apps/lib/lamatic-client.ts` and is imported only by the server-side analyze route. The deterministic integrity engine remains the final local report generator; a configured Lamatic execution is treated as an upstream analysis step and its raw result is not trusted as a report until validated by the application boundary.

### Status

**Implemented kit contribution:** flow definitions, deterministic integrity engine, repair planning, Next.js demonstration UI, API boundary, environment template, tests, fixtures, and documentation are included. A real Lamatic Studio export should replace the repository-side flow scaffold before production deployment so node IDs, model configuration, and credentials are sourced from an actual Studio workspace.
