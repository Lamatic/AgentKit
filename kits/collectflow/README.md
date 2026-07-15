# CollectFlow

> AI-powered collection strategy engine that transforms Accounts Receivable portfolios into explainable, human-guided workflows. Built with [Lamatic AgentKit](https://lamatic.ai).

## The Problem

Accounts Receivable teams spend hours manually reviewing ageing reports, collector notes, and disputes to answer one question: **"Who should I call and why?"**

Traditional AR workflows explain _what is overdue_. They rarely explain _what should happen next_.

Ageing reports are static. Customer circumstances change. Disputes emerge. Payment promises break. Yet every decision still relies on manual analysis, tribal knowledge, and inconsistent prioritization.

## The Solution

CollectFlow uses AI to transform AR portfolio data into an explainable collection workflow that:

- **Analyzes customer risk** across multiple dimensions (ageing, dispute history, payment patterns)
- **Prioritizes your portfolio** with explainable reasoning your team understands
- **Generates strategies** customized to each customer's situation
- **Requires human approval** before execution (AI assists, humans decide)
- **Tracks outcomes** and evolves the collection journey in real-time

The result: collectors spend less time deciding _who_ and more time collecting _how_.

## Quick Start

```bash
git clone https://github.com/Sms1818/AgentKit.git
cd AgentKit/kits/collectflow/apps

npm install
cp .env.example .env.local
npm run dev
```

See [Environment Setup](#environment-variables) for configuration.

## How It Works

### The Architecture

```
Synchronized AR Portfolio
            │
            ▼
    Portfolio Intelligence
    (AI Workflow #1)
            │
            ▼
   Ranked Collector Queue
            │
            ▼
   Customer Strategy Gen
    (AI Workflow #2)
            │
            ▼
    Manager Approval Gate
            │
            ▼
    Outcome Recording
            │
            ▼
   Collection Timeline
```

### Two Core AI Workflows

| Workflow                   | Input                       | Output                                                               |
| -------------------------- | --------------------------- | -------------------------------------------------------------------- |
| **Portfolio Intelligence** | AR portfolio snapshot       | Ranked queue, priority scores, risk levels, treatment lanes          |
| **Customer Strategy**      | Selected customer + history | Next Best Action, reasoning, channel recommendation, draft messaging |

Both workflows run on [Groq LLM](https://groq.com) via Lamatic, delivering fast, explainable recommendations.

## Features

### Portfolio Intelligence

- Multi-factor prioritization (ageing, risk, payment history, dispute status)
- Explainable priority scores with reasoning
- Risk classification and treatment lane assignment
- Portfolio health summary

### Customer Strategy

- AI-generated Next Best Action (contact, escalate, dispute resolution, etc.)
- Recommended communication channel and timing
- Draft customer communication templates
- Follow-up scheduling recommendations
- Captured AI reasoning for audit trails

### Human Approval

- Manager approval gate for high-stakes strategies
- Prevents autonomous execution—AI remains decision support
- Approval workflows preserve operational safety

### Collection Journey

Record outcomes and track progress:

- Contacted Customer
- Promise to Pay
- Dispute Raised
- No Response
- Payment Received

Timeline updates in real-time and persists for the session.

## Tech Stack

| Layer               | Technology                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| **Agent Framework** | [Lamatic AgentKit](https://lamatic.ai)                                       |
| **Frontend**        | [Next.js](https://nextjs.org) + [TypeScript](https://www.typescriptlang.org) |
| **Styling**         | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| **LLM**             | [Groq](https://groq.com) (fast inference)                                    |
| **Deployment**      | [Vercel](https://vercel.com)                                                 |

## Project Structure

```
kits/collectflow/
├── apps/                          # Next.js frontend
├── flows/                         # Lamatic workflow definitions
├── prompts/                       # Workflow prompts
├── model-configs/                 # LLM configurations
├── constitutions/                 # Guardrails & constraints
├── lamatic.config.ts              # Lamatic setup
├── agent.md                       # Agent documentation
└── README.md
```

## Environment Variables

```env
LAMATIC_API_URL=
LAMATIC_PROJECT_ID=
LAMATIC_API_KEY=
LAMATIC_PORTFOLIO_FLOW_ID=
LAMATIC_CUSTOMER_STRATEGY_FLOW_ID=
```

Get API credentials from your [Lamatic workspace](https://lamatic.ai/dashboard).

## What's In Scope (MVP)

This MVP demonstrates one complete collection workflow loop:

```
Portfolio Analysis → Customer Prioritization → Strategy Generation
         ↓
    Manager Approval → Outcome Recording → Timeline Update
```

The MVP proves the core concept: AI-assisted collection workflows that respect human decision-making.

## What's Out of Scope (Intentional)

The following are planned for future releases but outside the MVP:

- ❌ ERP integrations (QuickBooks, SAP, NetSuite)
- ❌ Persistent customer timelines / database
- ❌ Automated email & SMS delivery
- ❌ Collector assignment engine
- ❌ Payment portal integration
- ❌ Authentication & multi-user collaboration
- ❌ Learning-based models (future)

## Why This Approach?

**CollectFlow demonstrates responsible AI in AR operations:**

| Responsibility       | Who Owns It |
| -------------------- | ----------- |
| Analysis & Reasoning | AI          |
| Approval & Execution | Human       |
| Communication        | Human       |
| Outcome Recording    | Human       |
| Learning & Iteration | Human       |

This keeps the entire workflow transparent, explainable, and operationally safe. AI augments; humans decide.

## Demo & Documentation

- **Live Demo**: [Coming Soon]
- **Walkthrough Video**: [Coming Soon]
- **Agent Architecture**: See `agent.md`

## Roadmap

- [ ] Live ERP integrations
- [ ] Persistent collection timelines
- [ ] Automated channel delivery (email, SMS, integrations)
- [ ] Collector assignment optimization
- [ ] Payment portal integration
- [ ] Learning-based prioritization models
- [ ] Multi-user collaboration & audit trails

## Contributing

We welcome contributions from AR professionals, AI engineers, and open source maintainers. Please see [CONTRIBUTING.md] for guidelines.

## License

MIT

---

**Built for the [Lamatic AgentKit Challenge](https://lamatic.ai/challenge).**
