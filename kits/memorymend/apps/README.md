# MemoryMend App

The MemoryMend demo app presents the agent-memory integrity workflow and exposes a local analysis endpoint.

## Run

```bash
cd kits/memorymend/apps
npm install
npm run dev
```

The dashboard is available at `http://localhost:3000`.

## API

`POST /api/analyze` accepts:

```json
{
  "memories": [],
  "new_evidence": [],
  "policy": {
    "stale_after_days": 180,
    "require_human_review_for_quarantine": true,
    "minimum_confidence_for_auto_merge": 0.85
  }
}
```

The endpoint is intentionally bounded to 500 memories per request and returns a structured integrity report. It does not mutate or delete memory.

`GET /api/health` returns a lightweight service health response.

## Lamatic integration

The local endpoint is the deterministic application boundary for MemoryMend. A real Lamatic Studio export should be wired behind this boundary once the Studio flow is exported; no workspace IDs, credentials, or fabricated deployment identifiers are committed to the repository.
