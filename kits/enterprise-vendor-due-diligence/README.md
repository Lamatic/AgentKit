# Enterprise Vendor Due Diligence

An evidence-backed **vendor due diligence** workflow for enterprise procurement. Paste a proposed vendor engagement and get a structured risk assessment plus a procurement recommendation: **Approve**, **Approve with conditions**, **Pause**, or **Reject**.

> **Why this template?** Most AgentKit contributions are chatbots, summarizers, RAG demos, or hiring screens. Lamatic’s real customers buy the platform to remove **operational friction** — fragmented reviews across security, commercial, and compliance teams before money and data leave the company. This kit targets that bottleneck.

---

## The business problem

Before a mid-market or enterprise team signs a SaaS or services vendor, someone has to answer:

- Who is this company, really?
- What data will they touch, and is the security posture credible?
- What is the commercial and lock-in exposure?
- What is verified vs only claimed on the website?
- Should we proceed, pause, or walk away?

Today that work is usually a slow, manual handoff across procurement, security, and business owners — email threads, spreadsheet checklists, and incomplete evidence. Wrong calls create third-party risk; slow calls block delivery.

**This is not a chatbot.** It is a decision-support workflow: many inputs → specialist analysis → evidence validation → risk → actionable recommendation → executive report.

---

## Why this idea (Lamatic case-study lens)

This contribution was chosen after studying how Lamatic positions itself with customers — not as “an AI chatbot company,” but as an **enterprise workflow orchestration** platform.

Patterns that show up repeatedly in Lamatic’s customer stories:

| Pattern | Example customer themes | How this kit reflects it |
|---|---|---|
| Manual multi-step ops | Loan / risk pipelines, partnership ops | Specialist workers for company, security, commercial |
| Knowledge + judgment under uncertainty | Banking procedures, compliance-heavy work | Explicit evidence classes; unknown ≠ false |
| Trust and auditability | Document intelligence with lineage | Evidence validator + confidence + limitations |
| Human in the loop when needed | Review gates before irreversible action | Decision + required actions; disclaimer for human sign-off |
| Focus on business outcome | Faster throughput, fewer errors | Procurement decision, not a long essay |

We deliberately prioritized a **real enterprise buyer problem** (third-party / vendor risk) over showcasing every possible agent pattern. Lamatic can implement ReAct-style tool loops, supervisor multi-agent orchestration, graph-based agents, MCP-connected tools, and richer integrations — those are available on the platform and can extend this kit later. The MVP goal was: **show we understand who Lamatic serves and what they buy for.**

---

## What it does

Given a purchase-style intake (vendor, website, country, industry, product, contract value/duration, data access, justification), the flow:

1. **Normalizes** the request into an investigation context (facts vs unknowns — no invention).
2. **Investigates** public company footprint (with external web research).
3. **Assesses** security and data exposure (with external web research).
4. **Assesses** commercial and operational risk from the engagement terms.
5. **Validates** evidence quality (verified / user-provided / vendor claim / inferred / contradicted / unknown).
6. **Scores** consolidated risk across security, data, commercial, operational, and evidence dimensions.
7. **Recommends** a procurement decision with blocking issues and required actions.
8. **Returns** an executive vendor assessment suitable for portals, APIs, or human review queues.

---

## Architecture

Dedicated workers (not one mega-prompt) with explicit dependencies for predictable execution and traceability:

```text
API Request
    │
    ▼
Intake Normalizer
    │
    ├──────────────────────────────┐
    │                              │
    ▼                              │
Company Intelligence               │
(+ web research)                   │
    │                              │
    ├────────────┐                 │
    ▼            ▼                 │
Security &     Commercial &  <─────┘
Data Risk      Operational
(+ research)   Risk
    │            │
    └─────┬──────┘
          ▼
  Evidence Validator
          │
          ▼
   Risk Assessment
          │
          ▼
    Recommendation
          │
          ▼
Executive Vendor Assessment
          │
          ▼
    API Response
```

Edges match the flow graph: Intake feeds Company, Security, and Commercial; Company also feeds Security and Commercial; all three specialists feed Evidence → Risk → Recommendation → Final.

| Worker | Responsibility |
|---|---|
| Intake Normalizer | Canonical investigation context; known facts vs unknowns |
| Company Intelligence | Corporate / product / footprint research |
| Security & Data Risk | Data sensitivity, controls, claims vs evidence |
| Commercial & Operational | Value, duration, criticality, lock-in, continuity gaps |
| Evidence Validator | QC layer — classifications and contradictions |
| Risk Assessment | Unified risk profile + confidence |
| Recommendation | APPROVE / APPROVE_WITH_CONDITIONS / PAUSE / REJECT |
| Executive Assessment | Decision-ready report for stakeholders |

**Design choice:** explicit node dependencies instead of a Supervisor / agent-loop runtime path. That keeps data flow deterministic and easier to debug. Agentic tool use remains inside research workers (`EnterpriseWebResearch`). Patterns such as full ReAct planners, multi-agent supervisors, graph agents, or MCP tool meshes are compatible with Lamatic and can be layered on without changing the business contract of this template.

---

## Example input

```json
{
  "vendor_name": "AcmeCloud Technologies",
  "vendor_website": "https://example.com",
  "country": "United States",
  "industry": "SaaS",
  "product_or_service": "Cloud CRM",
  "contract_value": "75000",
  "contract_currency": "USD",
  "contract_duration_months": "24",
  "data_access": "Customer names, emails, phone numbers, sales data and internal employee information",
  "business_justification": "Replace the existing CRM and improve lead management and sales automation."
}
```

## Example output shape

```json
{
  "vendor_assessment": {
    "Vendor_Name": "AcmeCloud Technologies",
    "Executive_Summary": "...",
    "Overall_Risk_Level": "High",
    "Company_Assessment": "...",
    "Security_Assessment": "...",
    "Commercial_Assessment": "...",
    "Operational_Assessment": "...",
    "Key_Risks": "...",
    "Verified_Evidence": "...",
    "Vendor_Claims": "...",
    "Contradictions": "...",
    "Missing_Evidence": "...",
    "Recommended_Actions": "...",
    "Decision": "PAUSE",
    "Evidence_Confidence": "...",
    "Evidence_Limitations": "..."
  }
}
```

---

## Project structure

```text
kits/enterprise-vendor-due-diligence/
├── lamatic.config.ts
├── agent.md
├── README.md
├── constitutions/default.md
├── flows/enterprise-vendor-due-diligence.ts
├── prompts/          # per-worker system + user prompts (@referenced)
└── model-configs/    # Gemini model settings per worker (@referenced)
```

Type: **template** (single Lamatic flow; no Next.js app in this MVP).

---

## Setup

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai) and create a project.
2. Configure a Gemini credential (this export uses Gemini text generation).
3. Ensure the **EnterpriseWebResearch** (or equivalent web research) tool used by Company and Security workers is available in your project.
4. Import / recreate the flow from `flows/enterprise-vendor-due-diligence.ts` with the `@prompts/` and `@model-configs/` references intact.
5. Deploy the flow and call it via the GraphQL / API trigger with the intake schema above.

---

## MVP scope

**In scope:** intake → specialist reviews → evidence validation → risk → recommendation → executive assessment.

**Out of scope (intentional):** long-term vendor memory, human approval UI, continuous monitoring, PDF generation, parallel fan-out optimization, full legal determination, MCP/tool mesh beyond web research.

---

## Disclaimer

This is an **AI-assisted due diligence aid**. It must not replace procurement, security, compliance, financial, or legal review. Validate consequential findings against authoritative documentation before contracting.

---

## Author

Sreeram A M — `sreeram132003@gmail.com`
