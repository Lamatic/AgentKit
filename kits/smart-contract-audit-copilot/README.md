# Smart Contract Audit Copilot

Smart Contract Audit Copilot is a Lamatic-powered kit for first-pass Solidity contract review. Paste Solidity code, choose an audit mode, and get a structured report covering security vulnerabilities, gas optimizations, best-practice issues, and prioritized remediation steps.

This kit adapts the idea behind `ContractSLM`/SolidityGuard into the AgentKit format: instead of shipping a standalone Python RL environment, it provides a deployable Lamatic flow plus a focused Next.js app for developer triage.

## System Architecture

```mermaid
graph LR
    subgraph Client["Next.js App (apps/)"]
        UI["UI (page.tsx)"] --> Action["Server Action (orchestrate.ts)"]
    end

    subgraph Lamatic["Lamatic SDK"]
        Client_["lamatic-client.ts"] --> GraphQL["GraphQL executeWorkflow"]
    end

    subgraph Flow["Lamatic Flow"]
        Trigger["API Request"] --> LLM["Generate Audit Report"]
        LLM --> Response["API Response"]
    end

    subgraph AI["AI Provider"]
        Model["LLM (chat-capable text model)"]
    end

    Client --> Lamatic
    Lamatic --> Flow
    Flow --> AI
```

## Problem

Smart contract teams often need a quick, repeatable pre-audit pass before investing in deeper manual review. Generic chat prompts produce inconsistent output, while standalone audit tools can be hard to demo or integrate.

This kit gives developers a narrow workflow:

1. Paste Solidity source code.
2. Select `security`, `gas`, `best-practices`, or `comprehensive` mode.
3. Receive categorized findings with severity, evidence, impact, confidence, and fixes.

## Request Flow

```mermaid
sequenceDiagram
    actor Developer
    participant UI as Next.js UI
    participant Action as Server Action
    participant SDK as Lamatic Client
    participant Flow as Lamatic Flow
    participant LLM as AI Model

    Developer->>UI: Paste Solidity code + select mode
    UI->>UI: Validate input (>40 chars)
    UI->>Action: runSmartContractAudit({contractCode, auditMode, ...})
    Action->>SDK: executeSmartContractAudit(input)
    SDK->>SDK: Read env vars (API key, project ID, flow ID)
    SDK->>Flow: GraphQL mutation: executeWorkflow(workflowId, payload)
    Flow->>LLM: Submit prompts + contract code
    LLM-->>Flow: Generated JSON audit report
    Flow-->>SDK: { status, result }
    SDK-->>Action: LamaticWorkflowResponse
    Action->>Action: parseReport() — clean JSON, normalize fields, fill defaults
    Action-->>UI: ActionResult<AuditReport>
    UI->>UI: Render finding cards by category
    Developer->>UI: Review findings with severity, evidence, and remediation
```

## What It Does

- Reviews Solidity source for common vulnerability classes such as reentrancy, access control gaps, unchecked calls, oracle assumptions, and denial-of-service risks.
- Surfaces gas optimization opportunities such as storage access reduction, custom errors, packing, calldata usage, and avoidable work.
- Flags maintainability and best-practice issues such as compiler settings, events, NatSpec, error handling, and testability gaps.
- Returns structured JSON so the app can render triage-ready cards.
- Keeps an audit disclaimer visible because this is AI-assisted review, not a replacement for a full professional audit.

## Kit Type

This is an AgentKit `kit` because it includes:

- one Lamatic flow in `flows/smart-contract-audit.ts`
- a runnable Next.js app in `apps/`
- externalized prompts, model config, constitution, docs, and env examples

## Flow

```mermaid
flowchart LR
    subgraph LamaticFlow["Lamatic Flow — smart-contract-audit"]
        direction LR
        A["API Request
            graphqlNode
            contractCode, auditMode,
            contractName, focusAreas"]
        B["Generate Audit Report
            LLMNode
            System prompt + User prompt
            → JSON audit report"]
        C["API Response
            graphqlResponseNode
            { auditReport }"]

        A -->|"defaultEdge"| B
        B -->|"defaultEdge"| C
        A -.->|"responseEdge"| C
    end

    Input["{ contractCode, auditMode, ... }"] --> A
    C --> Output["{ auditReport: string }"]
```

### Input

```json
{
  "contractCode": "pragma solidity ^0.8.20; contract Vault { ... }",
  "contractName": "Vault",
  "auditMode": "comprehensive",
  "focusAreas": "reentrancy, access control, gas"
}
```

### Output

```json
{
  "auditReport": "{\"summary\":\"...\",\"overallRisk\":\"high\",\"securityFindings\":[...]}"
}
```

The app parses `auditReport` and normalizes missing arrays to safe defaults.

## Data Model

```mermaid
classDiagram
    class AuditRequest {
        +String contractCode
        +AuditMode auditMode
        +String contractName
        +String focusAreas
    }

    class AuditReport {
        +String summary
        +Severity overallRisk
        +Confidence confidence
        +AuditFinding[] securityFindings
        +AuditFinding[] gasFindings
        +AuditFinding[] bestPracticeFindings
        +String[] remediations
        +String disclaimer
    }

    class AuditFinding {
        +String title
        +Severity severity
        +Number[] lineNumbers
        +String evidence
        +String impact
        +String recommendation
        +Confidence confidence
    }

    class ActionResult~T~ {
        +Boolean success
        +T data
        +String error
    }

    AuditRequest --> AuditMode
    AuditRequest --> "1" AuditReport : produces
    AuditReport --> "many" AuditFinding : contains
    AuditReport --> Severity : overallRisk
    AuditReport --> Confidence
    AuditFinding --> Severity
    AuditFinding --> Confidence
    ActionResult --> AuditReport : T
```

### Types

```typescript
type AuditMode = "security" | "gas" | "best-practices" | "comprehensive";
type Severity = "critical" | "high" | "medium" | "low" | "info";
type Confidence = "high" | "medium" | "low";
```

## Audit Mode Taxonomy

```mermaid
flowchart TD
    subgraph Comprehensive["Comprehensive"]
        direction TB
        S["🔒 Security
            Reentrancy
            Access Control
            Unchecked Calls
            Oracle Assumptions
            DoS Vectors"]
        G["⚡ Gas
            Storage Optimization
            Custom Errors
            Variable Packing
            Calldata vs Memory
            Loop Efficiency"]
        B["📋 Best Practices
            Compiler Settings
            Event Emissions
            NatSpec Docs
            Error Handling
            Testability"]
    end

    subgraph Security["Security Mode"]
        S1["🔒 Reentrancy guards
            Checks-Effects-Interactions
            Access control patterns
            Oracle manipulation
            Flash loan attacks"]:::security
    end

    subgraph Gas["Gas Mode"]
        G1["⚡ Storage vs memory
            Custom errors
            Packing structs
            Immutable & constant
            Unchecked arithmetic"]:::gas
    end

    subgraph BestPractices["Best Practices Mode"]
        B1["📋 Solidity version
            Events for state changes
            NatSpec documentation
            Input validation
            Test coverage hints"]:::bestpractices
    end

    Comprehensive -->|"focus: all"| FullReport["Structured JSON report"]
    Security -->|"focus: security"| FullReport
    Gas -->|"focus: gas"| FullReport
    BestPractices -->|"focus: best-practices"| FullReport

    classDef security fill:#fef2f2,stroke:#dc2626
    classDef gas fill:#fefce8,stroke:#ca8a04
    classDef bestpractices fill:#eff6ff,stroke:#2563eb
```

## Audit Episode Flow

```mermaid
sequenceDiagram
    participant Client as Client (UI/Action)
    participant Env as Environment (Flow)
    participant Grader as LLM (Prompt)

    Client->>Env: /reset { contractCode, auditMode }
    Env->>Env: Validate input schema
    Env-->>Client: Observation (code + metadata)

    Client->>Env: /step { action: findings[] }
    Env->>Grader: Evaluate findings against code
    Grader-->>Env: Reward + Feedback
    Env-->>Client: StepResult { reward, feedback }

    Note over Client,Grader: Single-step episode — AI-assisted triage pass
```

## Environment Variables

Create `apps/.env.local` from `apps/.env.example`:

```bash
SMART_CONTRACT_AUDIT_FLOW_ID="your-deployed-smart-contract-audit-flow-id"
LAMATIC_API_URL="https://your-project-endpoint.lamatic.ai"
LAMATIC_PROJECT_ID="your-lamatic-project-id"
LAMATIC_API_KEY="your-lamatic-api-key"
```

## Lamatic Setup

1. Sign in to Lamatic Studio.
2. Create or open a Lamatic project.
3. Import the `smart-contract-audit` flow from `flows/smart-contract-audit.ts`.
4. Configure a chat-capable text generation model for `Generate Audit Report`.
5. Deploy the flow.
6. Copy the deployed flow ID into `SMART_CONTRACT_AUDIT_FLOW_ID`.

## Run Locally

```bash
cd kits/smart-contract-audit-copilot/apps
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```text
kits/smart-contract-audit-copilot/
|-- lamatic.config.ts        # Kit metadata (name, type, steps, links)
|-- agent.md                 # Agent identity + capability doc
|-- README.md                # This file
|-- constitutions/
|   `-- default.md           # Guardrails (identity, safety, data handling, tone)
|-- flows/
|   `-- smart-contract-audit.ts  # Self-contained Lamatic flow (meta, nodes, edges)
|-- prompts/
|   |-- smart-contract-audit_system.md  # System prompt for audit behavior
|   `-- smart-contract-audit_user.md    # User prompt with contract code
|-- model-configs/
|   `-- smart-contract-audit_generate-report.ts  # LLM model configuration
|-- .env.example             # Environment variable template
`-- apps/
    |-- package.json         # Next.js app dependencies
    |-- next.config.mjs
    |-- tsconfig.json
    |-- lib/
    |   |-- types.ts         # TypeScript type definitions
    |   `-- lamatic-client.ts    # Lamatic SDK / GraphQL client
    |-- actions/
    |   `-- orchestrate.ts   # Server action: validation + parsing
    `-- app/
        |-- globals.css      # Tailwind styles
        `-- page.tsx         # Main UI: form, report cards, error states
```

## Important Limitations

- This kit does not execute exploits, run symbolic analysis, or formally verify contracts.
- Results depend on the submitted code and may miss inherited contracts, imported libraries, deployment assumptions, or protocol context.
- Use the output as developer triage before deeper manual review.

## Author

Built by Tanay Mitra as an AgentKit challenge contribution.
