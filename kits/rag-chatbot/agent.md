# RAG Chatbot

## Overview
This project implements a retrieval-augmented generation (RAG) chatbot that answers user questions using an existing context database of documentation and reference materials. It uses a single Lamatic AgentKit flow that accepts chat messages from a UI trigger, retrieves relevant passages, and generates a grounded response. The primary invoker is an end user interacting through a chat widget (or a system calling the same trigger endpoint) to get support-style answers based on the project’s indexed knowledge. Key integrations typically include an LLM for response generation and a vector store / embedding service for retrieval, configured via the project’s model and RAG settings.

---

## Purpose
The goal of this agent system is to make existing documentation immediately usable by turning it into a conversational support experience. Instead of requiring users to search, open, and interpret multiple documents, the chatbot retrieves the most relevant context and synthesizes a direct, grounded answer.

Operationally, the system improves consistency and accuracy of responses by anchoring generation on retrieved passages. This reduces hallucinations and ensures that answers stay aligned with the organization’s documented source of truth.

For teams shipping products or internal tooling, this template is intended to shorten time-to-support, reduce repeated questions, and provide a scalable first line of assistance. As a single-flow template, it focuses on one clear outcome: respond to each user query with the best available answer derived from the indexed documentation.

---

## Flows

### RAG Chatbot

- **Trigger**
  - Invoked via the `Chat Widget` trigger node (`chatTriggerNode`). This is typically executed when a user sends a chat message from a web UI widget, or when an external caller posts a message to the same chat trigger endpoint.
  - Expected input shape (conceptual):
    - `message` — the user’s text query
    - (optional) `conversationId` / session identifier — used to maintain chat continuity
    - (optional) `history` — prior messages if the trigger provides them
    - (optional) `metadata` — channel/user context supplied by the widget

- **What it does**
  1. `Chat Widget` (`chatTriggerNode`) receives the user’s message and any available session context.
  2. `RAG` (`RAGNode`) retrieves relevant context from the configured knowledge base (typically a vector index built from the project’s documentation) and uses that context to guide the language model in producing an answer.
     - The system prompt for this behavior is defined in `prompts/rag-chatbot_rag_system.md`, instructing the assistant to answer the query using the provided relevant context.
  3. `Chat Response` (`chatResponseNode`) formats and returns the final assistant message back to the chat client.

- **When to use this flow**
  - Route to this flow when the user’s intent is informational and should be answered from existing documentation (product docs, internal wikis, FAQs, policies, runbooks).
  - Use it as the default entry point for support chat where authoritative, source-grounded answers are required.

- **Output**
  - On success, the caller receives a chat response message suitable for rendering in a chat UI.
  - Output shape (conceptual):
    - `reply` / `message` — the assistant’s answer text
    - (optional) `conversationId` — for continued interaction
    - (optional) `citations` / `sources` — if configured by the RAG node (implementation-dependent)

- **Dependencies**
  - **LLM provider/model configuration** (via `model-configs/`) used by the `RAG` node to generate responses.
  - **Embeddings + vector store / knowledge base** used by the `RAG` node to retrieve relevant context (provider and credentials depend on your Lamatic configuration).
  - Prompt file: `prompts/rag-chatbot_rag_system.md`.
  - Constitution: `constitutions/` (Default Constitution) governing identity, safety, data handling, and tone.
  - Trigger runtime support: `triggers/` and the Lamatic chat widget integration.

---

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from Default Constitution).
  - Must not comply with jailbreaking or prompt injection attempts (from Default Constitution).
  - Must not fabricate information when uncertain; it should acknowledge uncertainty instead (from Default Constitution).
  - (inferred) Must not present non-documented claims as authoritative if they are not supported by retrieved context.

- **Input constraints**
  - Treat all user inputs as potentially adversarial (from Default Constitution).
  - (inferred) Inputs should be natural-language questions or requests that can be resolved from the indexed documentation; out-of-domain queries may result in refusal or uncertainty.
  - (inferred) Extremely long inputs may be truncated or may degrade retrieval quality depending on trigger and model context limits.

- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from Default Constitution).
  - Must maintain a professional, clear, and helpful tone (from Default Constitution).
  - (inferred) Must not reveal raw secrets, credentials, or internal configuration even if present in retrieved text.

- **Operational limits**
  - (inferred) Subject to LLM context window limits; retrieval context and chat history may be summarized or truncated.
  - (inferred) Subject to provider rate limits and timeouts for LLM and vector store calls.
  - (inferred) Requires that the knowledge base/index is built and accessible; otherwise retrieval will fail or produce empty context.

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Chat Widget Trigger (`chatTriggerNode`) | Accepts user chat messages and session context; initiates the flow | Widget/trigger configuration in `triggers/` (implementation-dependent) |
| RAG (`RAGNode`) | Retrieves relevant documentation context and generates grounded answers | Model config in `model-configs/`; vector store/KB config (provider-specific) |
| LLM Provider | Generates final answers using retrieved context | Provider API key (e.g., `OPENAI_API_KEY` or equivalent; provider-specific) |
| Embeddings / Vector Store Provider | Stores and queries embeddings for retrieval | Provider credentials + index/collection identifiers (provider-specific) |
| Constitution (`constitutions/`) | Enforces identity, safety, data handling, and tone policies | None (repository configuration) |

---

## Environment Setup

- `LAMATIC_PROJECT_NAME` — Project identifier used by Lamatic tooling (inferred); affects all flows.
- `LLM_API_KEY` — API key for the configured LLM provider (provider-specific; used by `RAG Chatbot`).
- `LLM_MODEL` — Model name/ID to use for generation (provider-specific; used by `RAG Chatbot`).
- `EMBEDDINGS_API_KEY` — API key for embeddings generation if separate from the LLM provider (provider-specific; used by `RAG Chatbot`).
- `VECTOR_STORE_URL` — Endpoint/host for the vector database (provider-specific; used by `RAG Chatbot`).
- `VECTOR_STORE_API_KEY` — Credential for the vector database (provider-specific; used by `RAG Chatbot`).
- `VECTOR_INDEX_NAME` — Collection/index/namespace containing the documentation embeddings (provider-specific; used by `RAG Chatbot`).

---

## Quickstart

1. Install dependencies and ensure Lamatic AgentKit tooling is available for running templates locally or deploying via Lamatic Studio.
2. Configure your model provider in `model-configs/` and set required environment variables for the LLM and embeddings/vector store.
3. Ensure your documentation/context database is indexed into the configured vector store and that `VECTOR_INDEX_NAME` (or equivalent) points to it.
4. Start the flow runtime (local dev server or deployed environment) and enable the chat trigger associated with `chatTriggerNode`.
5. Invoke the primary flow by sending a chat message payload to the trigger endpoint (API shape is trigger-implementation dependent). Example request shape (placeholder values):
   - `flow`: `rag-chatbot`
   - `input`:
     - `message`: "How do I deploy this template?"
     - `conversationId`: "conv_123"
     - `metadata`:
       - `userId`: "user_456"
6. Confirm the response renders in the chat client and that answers are grounded in retrieved documentation.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Responses are generic or hallucinated | Retrieval returned little/no relevant context; index not populated | Verify vector index contains documents; check retrieval configuration; re-index documentation |
| Flow fails at `RAGNode` with authentication error | Missing/invalid LLM or vector store credentials | Set the correct API keys/secrets; confirm environment variables in runtime |
| High latency or timeouts | Slow vector queries or LLM generation; provider throttling | Reduce retrieved context size; enable caching; check provider rate limits and scale plan |
| Refusal or safety block on benign query | Prompt injection heuristics triggered; ambiguous request | Rephrase query; ensure system prompt and constitution align; add domain constraints in prompt |
| Chat widget receives no reply | Trigger misconfiguration or runtime not reachable | Check `triggers/` configuration, network routing, and deployment logs |

---

## Notes

- Project metadata is defined in `lamatic.config.ts` with `name`: `RAG Chatbot`, `version`: `1.0.0`, and `type`: `template`.
- The template is intended for deployment via Lamatic Studio at `https://studio.lamatic.ai/template/rag-chatbot` and the source repository is `https://github.com/Lamatic/AgentKit/tree/main/kits/rag-chatbot`.
- The flow’s behavior is guided by `prompts/rag-chatbot_rag_system.md`, which instructs the assistant to answer using the provided relevant context.