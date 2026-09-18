# Visual Return Assessor

## Overview

This project solves the problem of automated e-commerce return decisions and policy compliance verification from a single API surface. It implements a multi-flow AgentKit system that routes customer return claims and policy document uploads to dedicated Lamatic orchestrator flows (`VISUAL_RETURN_ASSESSOR` and `POLICY_DATA_INGESTION`). The system coordinates computer vision damage checks, vector search (RAG) over stored warranty rules, and automated fraud risk scoring. The primary invoker is a Next.js web UI that calls these flows via Lamatic’s GraphQL API layer using Lamatic SDK to render real-time assessment verdicts, confidence scores, and policy citations.

---

## Purpose

The goal of this agent system is to streamline e-commerce customer support operations by providing automated return decisions and dynamic policy management:

- **Automated Return Decisions:** Process customer return requests synchronously by evaluating submitted damage photos against stored product policies.
- **Dynamic Policy Management:** Allow support operations to upload and index category-specific return and warranty rules without updating application code.
- **Fraud Mitigation & Risk Scoring:** Compute visual damage confidence, product authenticity match, and overall fraud risk scores to automatically escalate suspicious claims for manual review.
- **Centralized Execution:** Shift complex prompt engineering, vision model processing, and vector search orchestration into Lamatic Studio to maintain a lightweight, maintainable Next.js frontend.

---

## Flows

### 1. `Visual Return Assessor`

- **Flow ID / Env key mapping:** `VISUAL_RETURN_ASSESSOR`

#### Trigger

- **Invocation Type:** Synchronous API request via a GraphQL trigger node (`API Request (graphqlNode)`).
- **Expected Input Shape:**
  ```json
  {
    "orderId": "string",
    "userEmail": "string",
    "itemCategory": "string",
    "claimReason": "string",
    "imageBinary": "string"
  }
  ```

#### What it does

Step-by-step walkthrough of the node chain:

1. `API Request (graphqlNode)`
   - Receives the GraphQL/API payload from the Next.js frontend or external service.
   - Exposes incoming fields (`orderId`, `userEmail`, `itemCategory`, `claimReason`, `imageBinary`) to downstream nodes.

2. `Visual Damage Analysis (VisionLLMNode)`
   - Evaluates `imageBinary` to identify physical defects (e.g., screen cracks, leather scuffs, water ingress).
   - Generates visual inspection notes and damage confidence metrics.

3. `Policy Context Retrieval (VectorSearchNode)`
   - Queries vector storage using `itemCategory` to retrieve active warranty and return rules.

4. `Verdict Calculation (LLMNode)`
   - Cross-references visual findings and `claimReason` against retrieved policy guidelines to synthesize a verdict.
   - Computes an aggregate fraud risk score based on damage consistency, and claim parameters.

5. `Finalise Output (codeNode)`
   - Consolidates execution metrics into a single structured response payload (`APPROVE`, `REJECT`, or `MANUAL_REVIEW`).

6. `API Response (graphqlResponseNode)`
   - Returns the finalized payload to the client interface.

#### When to use this flow

Use this flow whenever a customer or support agent submits a product return claim accompanied by visual damage evidence.

#### Output

- **Success Response:** A JSON object returned by `graphqlResponseNode`.
- **Structure:**
  ```json
  {
    "success": true,
    "decision": "APPROVE",
    "confidenceScore": 0.94,
    "fraudRiskScore": 0.12,
    "authenticityMatch": true,
    "damageType": "Surface Scratches",
    "policyReference": "Section 3: Claims regarding items damaged upon arrival are eligible for immediate replacement.",
    "reasoning": "Visual inspection verified surface damage matching claim description within the 30-day window."
  }
  ```

#### Dependencies

- **Lamatic runtime & project configuration**: `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`
- **Flow ID / Env key mapping:**: `VISUAL_RETURN_ASSESSOR`
- **Model providers**: Vision LLM , Embedding model, RAG LLM, Policy Evaluator LLM, Vector Store providers configured in Lamatic Studio.

---

### 2. `Policy Data Ingestion`

- **Flow ID / Env key mapping:** `POLICY_DATA_INGESTION`

#### Trigger

- **Invocation Type:** API request via a GraphQL trigger node (`API Request (graphqlNode)`).
- **Expected Input Shape:**
  ```json
  {
    "documentName": "string",
    "brand": "string",
    "category": "string",
    "content": "string"
  }
  ```

#### What it does

Step-by-step walkthrough of the node chain:

1. `API Request (graphqlNode)`
   - Receives document metadata (`documentName`, `brand`, `category`) and file `content`.

2. `Document Extractor (extractFromFileNode)`
   - Decodes Base64 data and extracts plain text from incoming `.pdf` or `.txt` content streams.

3. `Text Chunking & Embedding (EmbeddingNode)`
   - Splits policy rules into semantic chunks and generates vector embeddings.

4. `Vector Storage Ingestion (VectorStoreNode)`
   - Stores embedded chunks tagged with `category` `content` and `brand` metadata for downstream RAG retrieval.

5. `API Response (graphqlResponseNode)`
   - Returns confirmation status of successful vector indexing.

#### When to use this flow

Use this flow when uploading new warranty policies, updating category return guidelines, or seeding terms for visual assessments.

---

## Guardrails

- **Mandatory Photo Verification:** Return requests missing valid `imageBinary` data default to `REJECT` or require mandatory re-submission.
- **Fraud Risk Threshold:** Any claim yielding a fraud risk score above **0.50** automatically overrides automated approval to `MANUAL_REVIEW`.
- **Category-Scoped Retrieval:** Policy searches are strictly partitioned by `category` metadata to prevent rule contamination across product types.
- **Safety:** Strictly prohibits prompt injection attempts within claim reason text.

---

## Integration Reference

| IntegrationType            | Purpose                                                                | Required Credential / Config Key                           |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| Lamatic Flow Runtime (API) | Execute deployed flow(s) and access Lamatic project resources          | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing   | Select the deployed flow instance for visual assessments               | `VISUAL_RETURN_ASSESSOR`                                   |
| AgentKit Flow ID Routing   | Select the deployed flow instance for policy ingestion                 | `POLICY_DATA_INGESTION`                                    |
| LLM & Vision Providers     | Analyze images and perform reasoning                                   | Configured in Lamatic Studio                               |
| Next.js App (UI)           | User-facing dashboard for processing returns and uploading policy docs | App runtime config; consumes env vars above                |

---

## Environment Setup

- `LAMATIC_API_KEY` — API key for accessing the Lamatic project.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier.
- `LAMATIC_API_URL` — Base URL for Lamatic API.
- `VISUAL_RETURN_ASSESSOR` — Deployed Flow ID for the return claim workflow.
- `POLICY_DATA_INGESTION` — Deployed Flow ID for the policy ingestion workflow.

Example `.env.local`:

```env
LAMATIC_API_KEY="your_lamatic_api_key"
LAMATIC_PROJECT_ID="your_lamatic_project_id"
LAMATIC_API_URL="your_lamatic_api_url"
VISUAL_RETURN_ASSESSOR="your_visual_return_assessor_flow_id"
POLICY_DATA_INGESTION="your_policy_data_ingestion_flow_id"
```

---

## Common Failure Modes

| Symptom                     | Likely Cause                                                                    | Fix                                                                               |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Request fails with 401/403  | Missing or incorrect `LAMATIC_API_KEY` / project mismatch                       | Re-copy keys from Lamatic Studio; ensure `LAMATIC_PROJECT_ID` matches scope       |
| Flow not found / 404        | `VISUAL_RETURN_ASSESSOR` or `POLICY_DATA_INGESTION` points to non-deployed flow | Deploy the flow in Lamatic Studio; update environment variables with new Flow IDs |
| Forced `MANUAL_REVIEW`      | Fraud risk score > 0.50 or photo inspection unverified                          | Check image quality, verify serial number records, or adjust policy thresholds    |
| Vector lookup returns empty | `POLICY_DATA_INGESTION` has not been run for category                           | Upload and process a policy document for the target category first                |
