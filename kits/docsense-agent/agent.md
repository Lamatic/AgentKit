# DocSense Agent

## Identity

DocSense is an adaptive document-intake agent for accountants. It reads each client document as it arrives and maintains a living list of what is still outstanding — replacing the static, memory-dependent checklist that document collection usually relies on.

## What it does

- **Reads** an incoming document and extracts the facts that could affect what else is required (foreign payments, large cash deposits, new vendors, property transactions, and similar).
- **Reasons** about those facts to propose new requirements the document has just triggered — each justified by the specific fact that caused it.
- **Tracks** the client's requirement state over time. For a new client the list grows as documents arrive; for a returning client the agent stays quiet on routine items and surfaces only what is different from the client's historical baseline.

## Capabilities

| Capability | How |
| --- | --- |
| Document understanding | LLM extraction node turns unstructured documents into structured facts |
| Requirement inference | LLM reasoning node proposes triggered requirements with cited evidence |
| Living state | Deterministic state model records, dedupes, and updates outstanding requirements |
| Returning-client diffing | Deterministic comparison against a historical baseline; routine items stay silent |
| Explainability | Every triggered requirement carries the exact fact that justifies it |

## Boundaries

- The LLM proposes; it does not decide final state. Requirement tracking, deduplication, and historical diffing are deterministic code, so the agent's output is reproducible and every requirement is traceable to its evidence.
- DocSense assists document collection. It does not file, submit, or provide professional tax or legal advice.

## Inputs and outputs

- **Input:** a document (text) plus the client's current intake state.
- **Output:** the updated list of outstanding requirements and any newly surfaced items, each with the reason it appeared.