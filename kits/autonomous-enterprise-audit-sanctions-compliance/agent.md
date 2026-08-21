# Autonomous Enterprise Audit Sanctions Compliance — Agent Overview

## Identity

Autonomous Enterprise Audit Sanctions Compliance is a compliance automation agent built on Lamatic.ai. It helps organizations screen high-profile corporate clients and vendors by extracting onboarding documents, checking prior audit history, searching compliance knowledge, verifying records through an external API, and escalating risky cases to human compliance managers.

## Purpose

Onboarding teams often need to review sanctions exposure, document completeness, prior audit context, and public compliance signals before they can approve a vendor or client. This agent reduces that process to a single automated flow: ingest the document, analyze it, route the case, preserve the decision trail, and surface high-risk exceptions for human review.

## Capabilities

- **Document extraction** — Uses agentic document extraction to pull vendor details, checklist items, and sign-off metadata from uploaded files
- **Risk classification** — Routes the document into memory retrieval, hybrid search, or direct API verification based on the classifier decision
- **Compliance memory lookup** — Searches prior audit history for repeated vendors, previous checks, and related context
- **Hybrid compliance search** — Looks up internal compliance knowledge, regulations, and indexed audit records
- **External verification** — Calls an API-based verification step for onboarding or audit validation
- **Supervisor routing** — Uses a supervisor agent to choose between low-risk approval and high-risk escalation
- **Human escalation** — Posts alerts to Slack for compliance managers when review is required
- **Persistent audit logging** — Stores approved decisions in memory and vector storage for future retrieval
- **Structured output** — Produces a JSON decision summary with vendor name, document title, risk level, audit status, and rationale

## Flow Description

| Node                     | Role                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `Webhook`                | Receives the uploaded vendor onboarding document or audit file URL           |
| `Extract from File`      | Reads the incoming file and prepares it for extraction                       |
| `Agentic Doc Extraction` | Extracts structured vendor, checklist, and sign-off data from the document   |
| `Classifier`             | Routes the request to memory retrieval, hybrid search, or API verification   |
| `Memory Retrieve`        | Pulls prior audit history for the vendor from memory                         |
| `Hybrid Search`          | Searches indexed compliance knowledge and internal policy context            |
| `API`                    | Sends onboarding and compliance details to an external verification endpoint |
| `Supervisor`             | Evaluates the combined evidence and chooses the final path                   |
| `MCP`                    | Supports deeper investigation for high-risk escalation cases                 |
| `Slack`                  | Notifies compliance operators when manual review is needed                   |
| `Generate JSON`          | Produces the final structured audit summary                                  |
| `Vectorize`              | Converts the approved decision summary into embeddings                       |
| `VectorDB`               | Stores the indexed audit record for future retrieval                         |
| `Memory Add`             | Writes the immutable-style audit note into memory                            |
| `Agent Loop End`         | Closes the supervisor loop                                                   |
| `End`                    | Terminates the flow                                                          |

## Model

- **OCR model:** Used by `Agentic Doc Extraction` for document parsing
- **Generative model:** Used by the classifier, supervisor, MCP, and JSON generation steps
- **Embedding model:** Used by memory retrieval, hybrid search, vectorization, and memory storage
- **Output format:** Structured JSON plus optional Slack escalation notifications

## Guardrails

See `constitutions/default.md` for the agent identity and safety rules applied to this workflow.

Operational guardrails include:

- Do not approve vendors with missing required sign-offs or incomplete onboarding metadata
- Escalate suspicious, inconsistent, or high-risk results to a human compliance manager
- Preserve audit history for every approved or escalated review path
- Treat external verification results as decision support, not a replacement for compliance judgment
- Avoid writing unverified claims into persistent memory or vector storage

## Integration Reference

This agent integrates with the following external systems:

- **Document OCR and extraction** for onboarding packet parsing
- **External compliance API** for business or vendor verification
- **Slack** for escalation and human-in-the-loop review alerts
- **Vector database** for indexed audit retrieval
- **Memory store** for audit history and repeated vendor lookup

## Environment Setup

Required configuration depends on how your Lamatic project is deployed, but the flow typically needs:

- OCR credentials for the extraction node
- A generative model connection for classifier, supervisor, and JSON generation nodes
- An embedding model connection for retrieval, hybrid search, vectorization, and memory storage
- External API credentials or sandbox access for compliance verification
- Slack OAuth credentials for manual escalation notifications
- Vector database access for indexed audit storage

## Quickstart

1. Import the `autonomous-enterprise-audit-sanctions-compliance` flow into Lamatic Studio.
2. Connect the OCR model for `Agentic Doc Extraction`.
3. Connect the generative model used by `Classifier`, `Supervisor`, `MCP`, and `Generate JSON`.
4. Connect the embedding model used by `Memory Retrieve`, `Hybrid Search`, `Vectorize`, and `Memory Add`.
5. Configure the external compliance API step.
6. Add Slack credentials and choose the escalation channel.
7. Select the vector database for indexed audit records.
8. Deploy the flow and send a vendor document or onboarding packet to the webhook.

## Example Interaction

**User:** Review this vendor onboarding packet for sanctions and compliance risk.

**Agent:**

- Extracts vendor details, checklist status, and sign-off data from the document
- Retrieves prior audit history and searches internal compliance knowledge
- Verifies the record against the external API
- Routes low-risk cases into JSON generation, vector storage, and memory logging
- Escalates high-risk cases to MCP and Slack for human review

## Common Failure Modes

| Symptom                              | Cause                                                             | Fix                                                                            |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Document is not parsed correctly     | OCR credentials or source file format issue                       | Verify the OCR model connection and ensure the upload is a supported file type |
| Vendor is routed to the wrong branch | Classification prompt or model configuration mismatch             | Check the classifier prompts and selected generative model                     |
| Memory lookup returns no context     | Vendor has no prior audit record or embedding setup is incomplete | Confirm the memory collection and embedding model configuration                |
| Hybrid search returns weak results   | Vector database or embedding configuration is not tuned           | Verify the embedding model and indexed records                                 |
| High-risk cases are not escalated    | Slack credentials or supervisor routing is misconfigured          | Check Slack OAuth, supervisor prompts, and MCP tool access                     |
| Final JSON is incomplete             | Output schema mismatch in the generation node                     | Validate the `Generate JSON` schema and upstream fields                        |

## Author

Anupam Maiti — [personalusecase10@gmail.com](mailto:personalusecase10@gmail.com)
