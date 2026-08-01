# Threat Model Architect

Threat Model Architect is a full Lamatic AgentKit that converts a plain-English system description into a defensible security report: an architecture model, STRIDE threat register, research context, DREAD ranking, and a 7/30/60/90-day remediation roadmap.

## Pipeline

1. `intake` captures the system and technology context.
2. `decompose-architecture` identifies components, data assets, actors, entry points, trust boundaries, and data flows.
3. `stride-analyze` produces stack-specific STRIDE threats.
4. `threat-research` adds defensible OWASP/CWE context without inventing CVEs.
5. `dread-prioritize` ranks threats using transparent DREAD scoring.
6. The app derives a deterministic 7/30/60/90-day roadmap from the DREAD-ranked threats.

## Run the app

```bash
cd apps
cp .env.example .env.local
npm ci
npm run dev
```

Set the Lamatic project credentials and all five deployed flow IDs in `apps/.env.local`. The app runs flows server-side in pipeline order, so no Lamatic credentials are exposed to the browser. Intake is conversational: answer requested follow-ups and explicitly confirm the summary before the remaining flows run.

For a non-public deployment, set `THREAT_MODEL_ACCESS_TOKEN` and enter that value in the app. The built-in per-process rate limit and request-size limit are safety backstops; public deployments should also enforce distributed rate limiting at the hosting edge. `LAMATIC_TIMEOUT_MS`, `THREAT_MODEL_RATE_LIMIT`, and `THREAT_MODEL_RATE_WINDOW_MS` can tune the defaults.

Run local quality checks with:

```bash
npm run type-check
npm run build
npm audit
```

## Import and deploy flows

Each `flows/*.ts` file is an importable Lamatic Studio flow export. For every flow:

1. Import its corresponding file in Studio.
2. Select a connected inference-capable model. Use `gpt-4o-mini` or Gemini Flash for `decompose-architecture` and `stride-analyze`; `gpt-4.1-nano` is not reliable enough for the required architecture inference.
3. Test its sample payload, deploy it, and copy the deployed workflow ID into the matching environment variable.

The flow exports reference prompt and constitution assets under `prompts/` and `constitutions/`. The threat-research stage intentionally does not claim live CVE verification unless a verified research tool is explicitly added in Studio.

## Guardrails

- This kit assists security review; it does not certify security or compliance.
- It does not fabricate CVEs, advisory URLs, breach evidence, or verified exploit claims.
- DREAD values are prioritization estimates, not confirmed exploitability findings.
- Review and validate all findings with the system owners before remediation.

## Included files

- `flows/` — five deployed Studio flow exports
- `prompts/` — versioned prompts for every model stage
- `constitutions/default.md` — shared scope and safety rules
- `apps/` — Next.js report UI and server-side Lamatic orchestration
