# Visual Return Assessor

This AgentKit contains 2 flows:

1. **Ecommerce Visual Return** (`flows/ecommerce-visual-return.ts`)
2. **Data Ingestion** (`flows/data-ingestion.ts`)

---

## Overview

**Visual Return Assessor** is an enterprise AI agent system built with Lamatic.ai. It solves the problem of automated e-commerce return decisions and policy compliance verification from a single API surface.

It implements a multi-flow system that routes customer return claims and policy document uploads to dedicated Lamatic orchestrator flows (`VISUAL_RETURN_ASSESSOR` and `POLICY_DATA_INGESTION`). The system coordinates computer vision damage checks, vector search (RAG) over stored warranty rules, and automated fraud risk scoring to issue verdicts (`APPROVED`, `REJECTED`, or `MANUAL_REVIEW`).

---

## Flow Architecture & Specifications

### 1. Ecommerce Visual Return (`flows/ecommerce-visual-return.ts`)

- **Flow ID / Env key mapping:** `VISUAL_RETURN_ASSESSOR`
- **Invocation Type:** Synchronous API request via a GraphQL trigger node (`API Request (graphqlNode)`).

#### Trigger Input Shape

```json
{
  "orderId": "string",
  "userEmail": "string",
  "itemCategory": "string",
  "claimReason": "string",
  "imageBinary": "string"
}
```

#### Node Chain Execution

1. **`API Request (graphqlNode)`**: Receives the payload from the application layer.
2. **`Visual Damage Analysis (VisionLLMNode)`**: Evaluates `imageBinary` to identify physical defects (cracks, scuffs, water ingress) and generates damage metrics.
3. **`Policy Context Retrieval (VectorSearchNode)`**: Queries vector storage using `itemCategory` to retrieve active warranty/return rules.
4. **`Verdict Calculation (LLMNode)`**: Cross-references visual findings and `claimReason` against retrieved policy guidelines. Computes an aggregate fraud risk score based on damage consistency, serial matching, and parameters.
5. **`Finalise Output (codeNode_395)`**: Consolidates execution metrics into a single payload structure.
6. **`API Response (graphqlResponseNode)`**: Returns the finalized payload to the client.

#### Response Output Payload

```json
{
  "success": true,
  "decision": "APPROVED",
  "confidenceScore": 0.94,
  "fraudRiskScore": 0.12,
  "authenticityMatch": true,
  "damageType": "Surface Scratches",
  "policyReference": "Section 3: Claims regarding items damaged upon arrival are eligible for immediate replacement.",
  "reasoning": "Visual inspection verified surface damage matching claim description within the 30-day window."
}
```

---

### 2. Data Ingestion (`flows/data-ingestion.ts`)

- **Flow ID / Env key mapping:** `POLICY_DATA_INGESTION`
- **Invocation Type:** API request via a GraphQL trigger node (`API Request (graphqlNode)`).

#### Trigger Input Shape

```json
{
  "documentName": "string",
  "brand": "string",
  "category": "string",
  "content": "string"
}
```

#### Node Chain Execution

1. **`API Request (graphqlNode)`**: Receives policy document metadata and text/Base64 stream.
2. **`Document Extractor (codeNode)`**: Decodes data and extracts plain text content.
3. **`Text Chunking & Embedding (EmbeddingNode)`**: Splits policy rules into semantic chunks and generates vector embeddings.
4. **`Vector Storage Ingestion (VectorStoreNode)`**: Stores embedded chunks tagged with `category` and `brand` metadata.
5. **`API Response (graphqlResponseNode)`**: Returns vector indexing execution status.

---

## Guardrails

- **Mandatory Photo Verification:** Return requests missing valid `imageBinary` data default to `REJECTED` or require mandatory re-submission.
- **Fraud Risk Threshold:** Any claim yielding a fraud risk score above **0.50** automatically overrides automated approval to `MANUAL_REVIEW`.
- **Category-Scoped Retrieval:** Policy searches are strictly partitioned by `category` metadata to prevent rule contamination across product types.
- **Safety & PII:** Redacts `userEmail` and sensitive PII before sending context to LLM nodes; strictly prohibits prompt injection attempts within claim reason text.

---

## Prerequisites & Setup

### 1. Build in Lamatic Studio

1. Sign in or sign up at Lamatic.ai.
2. Create a project (if you don’t have one yet).
3. Click **"+ New Flow"** and select **"Templates"**.
4. Create and deploy the **`Visual Return Assessor`** and **`Policy Data Ingestion`** flows.
5. Configure your Vision LLM, Vector Store, and logic nodes in Lamatic Studio.
6. Obtain your deployed Flow IDs and project API credentials.

### 2. Environment Variables

Create an `apps/.env.local` file:

```bash
# Lamatic API Credentials
LAMATIC_API_KEY="your_lamatic_api_key"
LAMATIC_PROJECT_ID="your_lamatic_project_id"
LAMATIC_API_URL="your_lamatic_api_url"

# Flow ID Routing
VISUAL_RETURN_ASSESSOR="your_visual_return_assessor_flow_id"
POLICY_DATA_INGESTION="your_policy_data_ingestion_flow_id"
```

### 3. Install & Run Locally

```bash
cd apps
npm install
npm run dev
# Open http://localhost:3000
```

---

## Integration Reference

| Integration Type           | Purpose                                                                | Required Credential / Config Key                           |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| Lamatic Flow Runtime (API) | Execute deployed flow(s) and access Lamatic project resources          | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing   | Select the deployed flow instance for visual assessments               | `VISUAL_RETURN_ASSESSOR`                                   |
| AgentKit Flow ID Routing   | Select the deployed flow instance for policy ingestion                 | `POLICY_DATA_INGESTION`                                    |
| LLM & Vision Providers     | Analyze images and perform reasoning                                   | Configured in Lamatic Studio                               |
| Next.js App (UI)           | User-facing dashboard for processing returns and uploading policy docs | App runtime config                                         |

---

## Common Failure Modes

| Symptom                     | Likely Cause                                                                    | Fix                                                                               |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Request fails with 401/403  | Missing or incorrect `LAMATIC_API_KEY` / project mismatch                       | Re-copy keys from Lamatic Studio; ensure `LAMATIC_PROJECT_ID` matches scope       |
| Flow not found / 404        | `VISUAL_RETURN_ASSESSOR` or `POLICY_DATA_INGESTION` points to non-deployed flow | Deploy the flow in Lamatic Studio; update environment variables with new Flow IDs |
| Forced `MANUAL_REVIEW`      | Fraud risk score > 0.50 or photo inspection unverified                          | Check image quality, verify serial number records, or adjust policy thresholds    |
| Vector lookup returns empty | `POLICY_DATA_INGESTION` has not been run for category                           | Upload and process a policy document for the target category first                |

---

## Repository Structure

```
├── constitutions/                     # AgentKit generated
├── flows/                            # AgentKit generated
├── model-configs/                    # AgentKit generated
├── prompts/                          # AgentKit generated
├── scripts/                          # AgentKit generated
├── apps/                             # Web application workspace
│   ├── actions/
│   │   └── orchestrate.ts             # Lamatic GraphQL orchestration & flow routing
│   ├── app/
│   │   └── page.tsx                  # Return assessment submission & policy document ingestion portal
│   └── lib/
│       └── lamatic-client.ts         # Lamatic SDK client
├── agent.md                          # Agent architecture and system specifications
├── lamatic.config.ts                 # AgentKit documentation
├── README.md
```
