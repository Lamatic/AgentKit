# ChangeGraph Web Application

This directory contains the runnable Next.js application for the ChangeGraph AgentKit contribution.

The application compares baseline and candidate Lamatic workflow exports, calculates deterministic release risk, invokes the ChangeGraph Lamatic flows, and displays a release-readiness report.

## Requirements

- Node.js 18 or later
- npm 9 or later
- Lamatic API credentials
- Deployed `analyze-change-impact` flow
- Deployed `generate-release-plan` flow

## Installation

```bash
npm install
```

## Environment configuration

Create a local environment file:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure the following values:

```env
LAMATIC_API_KEY=your_real_api_key
LAMATIC_PROJECT_ID=your_real_project_id
LAMATIC_API_URL=your_real_api_url

ANALYZE_CHANGE_IMPACT_FLOW_ID=your_real_flow_id
GENERATE_RELEASE_PLAN_FLOW_ID=your_real_flow_id
```

Never commit `.env.local`.

## Development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Validation

```bash
npm exec tsc -- --noEmit
npm run lint
npm run build
npm audit --omit=dev
```

## Production start

```bash
npm run build
npm start
```

## Application pipeline

```text
ZIP upload
→ browser-side archive reading
→ secret redaction
→ workflow parsing
→ structural comparison
→ blast-radius analysis
→ deterministic risk scoring
→ sanitized API request
→ Lamatic semantic analysis
→ Lamatic release planning
→ validated response or deterministic fallback
```

## Authoritative decision

The deterministic risk score and promotion decision are authoritative.

The Lamatic flows provide semantic explanations, targeted tests, and release-planning guidance. When either flow returns invalid structured output, the application uses a conservative deterministic fallback instead of failing the request.

## Routes

```text
/             ChangeGraph dashboard
/api/analyze  Server-side orchestration route
```

## Deployment root

Deploy this exact directory as the project root:

```text
kits/changegraph-release-intelligence/apps
```

Add all five environment variables to the deployment platform before running a production analysis.