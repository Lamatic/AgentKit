# AI Onboarding Buddy

> A Lamatic AgentKit template that generates a **personalized 30/60/90-day onboarding plan** and a manager welcome message for new employees - tailored to their specific background and skill gaps relative to the role.

[![AgentKit Challenge](https://img.shields.io/badge/agentkit-challenge-blue)](https://github.com/Lamatic/AgentKit/pulls?q=is:open+is:pr+label:agentkit-challenge)
[![Kit Type](https://img.shields.io/badge/type-template-green)](https://github.com/Lamatic/AgentKit/tree/main/kits/ai-onboarding-buddy)
[![Flow Count](https://img.shields.io/badge/flows-1-orange)](https://github.com/Lamatic/AgentKit/tree/main/kits/ai-onboarding-buddy/flows)

---

## What This Kit Does

Traditional onboarding plans are generic. This kit is not. Given a new hire's profile, their job description, and optional company context, it:

1. **Analyzes skill gaps** - identifies strengths relative to the role and areas needing development.
2. **Generates a personalized 30/60/90-day plan** - tailored milestones, specific learning resources, and a scoped first project suggestion.
3. **Drafts a manager welcome message** - a warm, specific, personalized Slack/email message ready to send on day one.

**All in a single API call. No database. No setup beyond importing the flow.**

---

## Quickstart

### Step 1: Import the Flow
1. Log in to your [Lamatic workspace](https://studio.lamatic.ai).
2. Navigate to **Flows → Import Flow**.
3. Upload `flows/ai-onboarding-buddy.ts`.
4. Configure your LLM API key under **Settings → Secrets**.

### Step 2: Retrieve the API Endpoint
After deploying your flow, open your Trigger Node (API Request) to copy your GraphQL trigger endpoint URL and Bearer token.

### Environment Variables

When invoking this kit outside Lamatic Studio, configure:

- `LAMATIC_GRAPHQL_ENDPOINT` - your deployed Trigger Node GraphQL URL.
- `LAMATIC_BEARER_TOKEN` - Bearer token from the Trigger Node.
- `LLM_API_KEY` - provider key configured in Lamatic **Settings → Secrets**.

### Step 3: Call the API
```bash
curl -X POST "$LAMATIC_GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LAMATIC_BEARER_TOKEN" \
  -d '{
    "candidateProfile": "Jane Doe. Senior Frontend Engineer with 6 years experience in React and TypeScript. No Next.js or server-side rendering exposure.",
    "jobDescription": "Build high-performance, SEO-friendly SSR/ISR pages in Next.js 14.",
    "companyContext": "B2B SaaS product built entirely on Next.js 14 and hosted on Vercel."
  }'
```

---

## Folder Structure

```
kits/ai-onboarding-buddy/
├── flows/
│   └── ai-onboarding-buddy.ts        # The Lamatic flow code
├── prompts/                          # Node system prompts
│   ├── gap-analyzer_system.md
│   ├── plan-generator_system.md
│   └── welcome-drafter_system.md
├── model-configs/                    # Node model configuration files
│   ├── gap-analyzer.ts
│   ├── plan-generator.ts
│   └── welcome-drafter.ts
├── constitutions/
│   └── default.md                    # Flow boundary rules
├── agent.md                          # Agent identity and context
├── lamatic.config.ts                 # Kit metadata
├── README.md                         # This guide
└── CHANGELOG.md                      # Change history
```

---

## Testing

To test the deployed flow, run a POST request using `curl` with your payload:

```bash
curl -X POST "$LAMATIC_GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LAMATIC_BEARER_TOKEN" \
  -d '{
    "candidateProfile": "Jane Doe. Senior Frontend Engineer with 6 years experience in React and TypeScript.",
    "jobDescription": "Build high-performance, SEO-friendly SSR/ISR pages in Next.js 14.",
    "companyContext": "B2B SaaS product built entirely on Next.js 14 and hosted on Vercel."
  }'
```

