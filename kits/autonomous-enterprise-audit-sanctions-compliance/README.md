# Autonomous Enterprise Audit Sanctions Compliance

An AI-powered compliance workflow for onboarding high-profile corporate clients and vendors. This kit screens entities against sanctions and risk signals, extracts and verifies onboarding documents, audits public financial and compliance records, and stores a durable memory trail of the checks that were performed. High-risk cases are escalated to human compliance managers with Slack and external verification support.

## What It Does

Send a vendor onboarding packet, audit document, or compliance checklist to the webhook and get back an automated compliance decision that can:

- Screen the entity using document extraction, classifier routing, and retrieval against prior audit memory
- Search internal compliance knowledge using hybrid search over stored vectors and indexed records
- Verify onboarding details through an external API check before final classification
- Escalate suspicious, incomplete, or high-risk cases to a supervisor path with MCP-assisted investigation
- Record approved low-risk audits in immutable memory and vector storage for future lookup
- Notify compliance operators in Slack when manual review is required
- Return a structured JSON summary with vendor name, document title, risk level, audit status, and decision summary

## Quick Start

### Prerequisites

- A [Lamatic.ai](https://lamatic.ai) account
- OCR model access for the document extraction step
- A generative model connection for the classifier, supervisor, and JSON output nodes
- An embedding model connection for memory retrieval, hybrid search, vectorization, and memory storage
- A valid external compliance API endpoint or sandbox credential for the API verification step
- Slack OAuth credentials if you want escalation alerts in Slack
- A configured vector database for indexed audit records

### Setup in Lamatic Studio

1. Import the `autonomous-enterprise-audit-sanctions-compliance` flow into your Lamatic project.
2. Connect the OCR model used by `Agentic Doc Extraction`.
3. Connect the generative model used by the `Classifier`, `Supervisor`, and `Generate JSON` nodes.
4. Connect the embedding model used by `Memory Retrieve`, `Hybrid Search`, `Vectorize`, and `Memory Add`.
5. Configure the external API node for your compliance verification service.
6. Add Slack credentials and select the destination channel for escalation alerts.
7. Select your vector database for the indexing step.
8. Deploy the flow.

### Usage

Invoke the webhook trigger with a vendor onboarding document URL or file reference. Example inputs:

```text
https://example.com/vendor-onboarding-pack.pdf
```

```text
https://example.com/compliance-checklist.pdf
```

```text
https://example.com/corporate-vendor-audit-file.pdf
```

The flow extracts the document, classifies the case, performs retrieval and search, verifies external compliance data, and then routes to either the low-risk approval path or the high-risk escalation path.

## Flow Architecture

```text
Webhook
	↓
Extract from File
	↓
Agentic Doc Extraction
	↓
Classifier
	├── Memory Retrieve
	├── Hybrid Search
	└── API
	↓
Supervisor
	├── MCP
	└── Slack
	↓
Generate JSON
	↓
Vectorize
	↓
VectorDB
	↓
Memory Add
	↓
End
```

## Configuration

| Setting | Purpose |
|---------|---------|
| Trigger | Webhook upload or document URL |
| OCR | Document parsing and field extraction |
| Classifier | Routes the audit into memory, search, or API verification paths |
| External API | Compliance and onboarding verification |
| Supervisor | Final routing for low-risk or high-risk decisions |
| Slack | Manual review and escalation alerts |
| Vector DB | Indexed audit history and retrieval support |
| Memory | Persistent audit log and future lookup context |

## Example Output

```json
{
  "vendor_name": "Acme Global Holdings",
  "document_title": "Vendor Onboarding Packet",
  "risk_level": "LOW",
  "audit_status": "APPROVED",
  "summary": "The vendor passed sanctions screening, document verification, and compliance checks. Audit details were stored in memory for future review."
}
```

For high-risk cases, the flow can instead route the vendor to human review, post a Slack alert, and preserve the investigation context for follow-up.

## Contributing

This kit is part of [Lamatic AgentKit](https://github.com/Lamatic/AgentKit). Contributions, issues, and pull requests are welcome.

## License

MIT - see [LICENSE](../../LICENSE)
