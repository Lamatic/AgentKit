# Feature Flag Lifecycle Manager

> Discover, evaluate, and clean up feature flags across your codebase with AI.

A Lamatic.ai bundle that systematically manages feature flag technical debt. It scans source code for all feature flag patterns across major providers (LaunchDarkly, ConfigCat, Split, Unleash, Growthbook, and custom/env-var implementations), evaluates each flag's lifecycle status, and generates a prioritized cleanup plan with risk assessment and deprecation timelines.

[![Deploy on Lamatic](https://img.shields.io/badge/Deploy-Lamatic-5B21B6?style=flat-square)](https://lamatic.ai)
[![agentkit-challenge](https://img.shields.io/badge/challenge-agentkit--challenge-0f766e?style=flat-square)](https://github.com/Lamatic/AgentKit/pulls?q=is:open+is:pr+label:agentkit-challenge)

---

## The Problem

Feature flags are essential for safe releases — but they accumulate as technical debt. Once a flag's purpose is fulfilled (feature shipped, experiment concluded, migration complete), the flag code and configuration often remain. Over time this leads to:

- **Codebase bloat** — dead flag code increases complexity and cognitive load
- **Onboarding friction** — new developers struggle to understand which flags matter
- **Hidden failure modes** — stale flags can trigger unexpected behavior
- **Maintenance burden** — every flag is a moving part that must be understood and tested

Teams lack a systematic tool to discover, evaluate, and retire feature flags.

## The Approach

This bundle contains **two Lamatic flows** working in sequence:

### Flow 1 — `flag-scan`
Takes a repository URL and its source code content as input. An LLM scans the code for all feature flag patterns across 8+ providers and returns a structured JSON inventory. Each flag entry includes its name, type, file location, code context, and whether it's a declaration or usage.

### Flow 2 — `flag-cleanup-plan`
Takes the flag inventory from Flow 1 (and an optional status mapping) and evaluates each flag's lifecycle. For each removable flag, it outputs a prioritized plan with:
- **Removal risk** (low / medium / high)
- **Estimated effort** (files and lines to change)
- **Deprecation timeline** (immediate / short-term / medium-term / long-term)
- **Recommended actions** (specific steps to safely remove the flag)

## The Result

- **Saves time** — automates what would be hours of manual code searching and analysis
- **Reduces technical debt** — systematically identifies and prioritizes flag cleanup
- **Improves clarity** — clear risk assessment and step-by-step removal plans
- **Makes cleanup repeatable** — run the scan + plan flow anytime, integrate into CI or sprints

## Tradeoffs & Assumptions

**Tradeoffs:**
- The scan accepts `codeContent` as input rather than directly fetching from GitHub. This keeps the flow provider-agnostic but requires a calling application to fetch file contents first.
- The LLM is instructed to return strict JSON, but non-conforming output is caught by a code node that returns a structured error instead of crashing.
- Status inference without a `flagStatusMapping` input relies on LLM judgment of code patterns — providing explicit statuses improves accuracy.

**Assumptions:**
- Source code is available in a text-searchable format (the calling app fetches GitHub files via API).
- The codebase uses one of the supported flag providers or a recognizable custom pattern.
- The user has a Lamatic.ai account and can deploy flows to obtain Flow IDs.

---

## 🔑 Setup

### Prerequisites
- Node.js 18+ (for running locally)
- A [Lamatic.ai](https://lamatic.ai) account
- Source code access (GitHub repo or local files)

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
LAMATIC_API_URL="Your Lamatic API URL"
LAMATIC_PROJECT_ID="Your Lamatic project ID"
LAMATIC_API_KEY="Your Lamatic API key"
LAMATIC_FLAG_SCAN_FLOW_ID="Deployed flow ID for flag-scan"
LAMATIC_FLAG_CLEANUP_FLOW_ID="Deployed flow ID for flag-cleanup-plan"
```

### Setup Steps
1. Sign in to [Lamatic Studio](https://studio.lamatic.ai)
2. Create a new project
3. Import the two flows from this bundle:
   - `flag-scan`
   - `flag-cleanup-plan`
4. Configure your LLM provider in Lamatic Studio
5. Deploy both flows
6. Copy the Flow IDs into `.env.local`

## Usage

### Using the Lamatic API

```bash
# Step 1: Scan your codebase
curl -X POST "$LAMATIC_API_URL/v1/workflow/$LAMATIC_FLAG_SCAN_FLOW_ID" \
  -H "Authorization: Bearer $LAMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "repoUrl": "https://github.com/your-org/your-repo",
      "codeContent": "<concatenated source code from your repo>"
    }
  }'

# Step 2: Generate cleanup plan (pass scan output as input)
curl -X POST "$LAMATIC_API_URL/v1/workflow/$LAMATIC_FLAG_CLEANUP_FLOW_ID" \
  -H "Authorization: Bearer $LAMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "repoUrl": "https://github.com/your-org/your-repo",
      "flags": [
        { "flagName": "new-checkout-flow", "type": "launchdarkly", "file": "src/App.js", "lineNumber": 42, "context": "client.variation('new-checkout-flow', user, false)", "isDeclaration": false, "description": "Controls new checkout flow" }
      ],
      "flagStatusMapping": {
        "new-checkout-flow": "always-on",
        "old-pricing-page": "experiment-completed"
      }
    }
  }'
```

### Using the Lamatic SDK

See the companion kit's `apps/` directory for a Next.js application that fetches GitHub file contents and orchestrates both flows end-to-end.

## 📂 Repo Structure

```
feature-flag-lifecycle/
├── lamatic.config.ts           # Bundle metadata (2 mandatory steps)
├── agent.md                    # Agent identity + capability doc
├── README.md                   # This file
├── .gitignore
├── .env.example                # Environment variables template
├── constitutions/
│   └── default.md              # Guardrails & identity rules
├── flows/
│   ├── flag-scan.ts            # Flow 1: codebase → flag inventory
│   └── flag-cleanup-plan.ts    # Flow 2: inventory → cleanup plan
├── prompts/
│   ├── flag-scan_system.md     # System prompt for scanner
│   ├── flag-scan_user.md       # User prompt for scanner
│   ├── flag-cleanup-plan_system.md
│   └── flag-cleanup-plan_user.md
├── model-configs/
│   ├── flag-scan.ts            # Model config for scanner
│   └── flag-cleanup-plan.ts    # Model config for planner
└── scripts/
    ├── flag-scan_organize.ts   # JSON normalization for scan output
    └── flag-cleanup-plan_organize.ts
```

## Troubleshooting

| Problem | Solution |
|---|---|
| Scan returns 0 flags | Verify `codeContent` contains actual source files with flag patterns |
| Cleanup plan empty | Check that `flags` input matches the scan output format exactly |
| "Flow not found" error | Verify Flow IDs in `.env.local` match deployed flows in Lamatic Studio |
| Invalid JSON in response | The organize code node catches non-JSON LLM output; try a more capable model |
| API key invalid | Regenerate from Lamatic Studio → Settings → API Keys |

## Contributing

This kit was built for the [AgentKit Challenge](https://github.com/Lamatic/AgentKit/blob/main/CHALLENGE.md).

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit
git checkout -b feat/feature-flag-lifecycle
git add kits/feature-flag-lifecycle/
git commit -m "feat: Add Feature Flag Lifecycle Manager bundle"
git push origin feat/feature-flag-lifecycle
```

Open a PR at [github.com/Lamatic/AgentKit/compare](https://github.com/Lamatic/AgentKit/compare) and add the `agentkit-challenge` label.

## License

MIT License – see [LICENSE](../../LICENSE).
