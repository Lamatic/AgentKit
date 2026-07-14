# AccessFix — Accessibility Remediation Copilot

AccessFix turns webpage evidence into a practical accessibility remediation plan. Give it a public URL or relevant HTML and it returns prioritized, WCAG 2.2-mapped findings, affected-user context, framework-aware code examples, quick wins, and the manual checks automation cannot complete.

> AccessFix is an evidence-limited engineering aid. It does not certify WCAG conformance or legal compliance, and it is not a substitute for manual testing with assistive technologies and disabled users.

## What it solves

Automated scanners can identify rule failures, but teams still have to interpret raw output, understand user impact, find the root cause, write an appropriate fix, and plan manual verification. AccessFix packages those decisions into a structured workflow suitable for a development backlog.

## Capabilities

- Audits a public HTTP/HTTPS page or pasted HTML.
- Blocks localhost, private network ranges, credential-bearing URLs, unsafe protocols, oversized responses, and non-HTML resources.
- Grounds each finding in supplied evidence and records confidence.
- Maps supported findings to a WCAG 2.2 criterion, level, and principle.
- Generates HTML, React, or Next.js-oriented remediation examples.
- Separates supported findings from keyboard, screen-reader, focus, zoom, reflow, and other manual checks.
- Exports the completed report as JSON or Markdown.
- Never presents an automated pass as proof of accessibility or conformance.

## Architecture

```text
Browser
  → Next.js audit endpoint
      → URL validation + DNS/private-network checks
      → bounded HTML retrieval and evidence preparation
      → Lamatic SDK
          → API Request
          → Generate JSON
          → API Response
      → validated audit dashboard
```

The Lamatic flow receives four inputs:

| Input | Type | Description |
|---|---|---|
| `url` | string | The final public URL or a label for pasted HTML. |
| `pageContent` | string | Sanitized and size-bounded HTML evidence. |
| `framework` | string | `html`, `react`, or `nextjs`. |
| `targetLevel` | string | WCAG target level `A`, `AA`, or `AAA`. |

## Repository structure

```text
accessibility-remediation-copilot/
├── apps/                  # Next.js application
├── constitutions/         # Agent-level behavioral guardrails
├── flows/                 # Canonical Lamatic Studio export
├── model-configs/         # Generate JSON model configuration
├── prompts/               # Externalized system and user prompts
├── agent.md               # Agent identity and operations reference
└── lamatic.config.ts      # AgentKit metadata and flow setup
```

## Prerequisites

- Node.js 20.9 or later
- npm 10 or later
- A Lamatic account and deployed copy of the `accessibility-audit` flow
- A configured structured-generation model credential in Lamatic

## Lamatic setup

1. Import or recreate `flows/accessibility-audit.ts` in Lamatic Studio.
2. Configure the Generate JSON node with a supported model credential.
3. Test the flow with the `meta.testInput` payload.
4. Deploy the flow.
5. Copy the Flow ID, Project ID, project API endpoint, and a Lamatic API key.

Provider credentials such as Gemini or OpenAI keys stay inside Lamatic. They are not application environment variables.

## Application setup

```bash
cd kits/accessibility-remediation-copilot/apps
cp .env.example .env.local
npm install
npm run dev
```

Fill in `apps/.env.local`:

```env
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_lamatic_project_id
LAMATIC_API_URL=https://your-project.lamatic.dev
ACCESSIBILITY_AUDIT_FLOW_ID=your_deployed_flow_id
```

Open `http://localhost:3000`. Real credentials belong only in `.env.local` and deployment secrets; never commit them.

## Validation

From `apps/`:

```bash
npm run typecheck
npm run build
```

Recommended acceptance tests:

1. Paste the safe example and confirm missing labels/names produce supported findings.
2. Audit semantic HTML and confirm the model does not invent findings merely to populate the report.
3. Include an instruction inside an HTML comment and confirm it is ignored as untrusted evidence.
4. Try `http://localhost`, `http://127.0.0.1`, and a private IP; each must be blocked before fetch.
5. Confirm JSON and Markdown reports download without executing audited HTML.

## Security and privacy

- Remote HTML is never rendered in AccessFix.
- Script, style, noscript, and comment blocks are removed before model analysis.
- Redirect destinations are resolved and checked again to reduce SSRF risk.
- Each outbound request is pinned to the public IP address that passed validation to prevent DNS rebinding.
- Downloads, response size, redirect depth, and request time are bounded.
- The audit endpoint applies a best-effort per-IP limit of five requests per ten minutes before fetching a page or calling Lamatic.
- AccessFix does not persist audit content or reports.
- Public sites can still block automated retrieval; use Paste HTML in that case.

The included rate limiter is intentionally dependency-free and scoped to one application instance. Production deployments running multiple serverless instances should replace it with a shared rate-limit store such as Vercel KV or Upstash Redis so the quota is enforced globally.

## Known limitations

- Static HTML cannot establish keyboard order, focus visibility, accessible names created at runtime, screen-reader announcements, zoom/reflow behavior, or all contrast outcomes.
- Client-rendered pages may return incomplete server HTML.
- Authentication-protected pages are intentionally unsupported by URL mode.
- Model-generated WCAG mappings and fixes require developer review.
- A successful automated audit is not a conformance determination.

## Deployment

Deploy `kits/accessibility-remediation-copilot/apps` as the Vercel root directory and configure the four application environment variables. The one-click deploy link is declared in `lamatic.config.ts`.

## Responsible use

Use AccessFix to accelerate discovery and remediation, then verify changes using keyboard-only navigation, relevant screen readers, zoom/reflow testing, automated rule engines, and—where possible—testing with disabled users.
