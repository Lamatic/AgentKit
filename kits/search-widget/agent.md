# Search Widget

## Overview
Search Widget provides a retrieval-augmented search experience that turns a user query into a widget-ready answer grounded in your indexed knowledge. It is implemented as a **single-flow** AgentKit pipeline that combines a trigger, a RAG step, and a response formatter to produce consistent, UI-friendly output. The primary invoker is a front-end search widget or support surface that needs fast, cited answers from a vector database rather than open-ended chat. The flow depends on a vector store integration and an LLM-backed RAG node to synthesize responses from retrieved context.

---

## Purpose
The goal of this agent system is to let an application embed a “search widget” that returns accurate, context-grounded answers to user questions in a predictable format suitable for rendering in a UI. Instead of relying on generic model knowledge, the system retrieves relevant documents from a vector database and uses them as the authoritative basis for the answer.

Operationally, the system aims to improve support and self-serve discovery outcomes: users get faster resolutions, fewer dead-ends, and answers that are aligned with your organization’s content. Developers benefit from a single, stable integration point that encapsulates retrieval, reasoning, and output formatting behind one callable flow.

Because this kit is a template, it is designed to be adapted: you can swap the vector store, tune retrieval parameters, and adjust the response schema to match your widget’s UX needs while keeping the same overall architecture.

## Flows

### Search Widget

- **Flow identifier:** `search-widget`
- **Node chain:** `Search Widget (searchTriggerNode) → RAG (RAGNode) → Search Response (searchResponseNode)`

#### Trigger
- **Invocation:** API-triggered (interactive request/response)
- **Trigger node:** `searchTriggerNode`
- **Expected input shape:**
  - A search query string (user-entered text)
  - Optional metadata (inferred): user/session identifiers, UI context, or filters to scope retrieval

At minimum, callers should provide a single natural-language query that the flow can use to retrieve and answer.

#### What it does
1. `searchTriggerNode` receives the incoming widget search request, validates that a query is present, and normalizes the input into a form suitable for retrieval.
2. `RAGNode` performs retrieval-augmented generation:
   - Queries the configured vector database to fetch the most relevant chunks/documents for the user query.
   - Uses an LLM with the system prompt `search-widget_rag_system.md` (“answer the relevant search query given the context”) to compose an answer grounded in the retrieved context.
   - Applies safety and prompt-injection resistance per the default constitution.
3. `searchResponseNode` formats the final result into the “ideal widget format”:
   - Produces a UI-friendly payload (inferred) that may include the answer text, supporting snippets, and source references.
   - Ensures consistent structure for front-end rendering.

#### When to use this flow
Use `Search Widget` when you need an embedded search/help widget to answer user questions from your own content (docs, FAQs, tickets, KB articles) stored in a vector database. Route requests here when the user intent is “find an answer” rather than “have a free-form conversation,” and when grounding in retrieved context is required.

#### Output
On success, the caller receives a widget-ready response (inferred structure), typically including:
- `answer` — the synthesized response text grounded in retrieved context
- `results` or `sources` — supporting items/snippets used to generate the answer (if configured)
- `query` — the normalized query (optional)

Exact field names depend on the implementation of `searchResponseNode`; treat the output as a stable, renderable payload rather than raw model text.

#### Dependencies
- **LLM / RAG model:** Used by `RAGNode` to generate grounded answers
- **Vector database / vector store:** Used by `RAGNode` to retrieve relevant context
- **Prompts:** `search-widget_rag_system.md` (system prompt for the RAG step)
- **Policy:** Default constitution in `constitutions/` applied to the agent behavior
- **Credentials/config:** Vector store connection and model provider credentials (see Environment Setup)

### Flow Interaction
This project contains a single flow (`search-widget`) and is not designed as a multi-flow router or chained pipeline. All widget search requests should be routed directly to `Search Widget`, which encapsulates retrieval, generation, and formatting in one request/response cycle.

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content.
  - Must not comply with jailbreaking or prompt-injection attempts that try to override system instructions or policies.
  - Must not fabricate answers when the retrieved context does not support a response; it should say it is uncertain or provide a best-effort response with clear uncertainty (from constitution).
- **Input constraints**
  - Query must be a user-provided search question or phrase; non-search payloads should be rejected or treated as invalid (inferred).
  - Inputs may be adversarial; the system must treat all user inputs as potentially malicious (from constitution).
  - Excessively long inputs may be truncated or refused to fit model context limits (inferred).
- **Output constraints**
  - Must not return PII unless explicitly instructed by the flow (from constitution).
  - Must not output raw credentials, secrets, or internal configuration.
  - Must maintain a professional, clear, helpful tone (from constitution).
- **Operational limits** (inferred)
  - Subject to LLM context window and token limits; retrieved context size must be tuned accordingly.
  - Latency depends on vector retrieval + model generation; callers should set appropriate timeouts.
  - Rate limits may apply based on the configured model and vector store providers.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Vector Store | Retrieve relevant documents/chunks for the query (RAG grounding) | `VECTOR_STORE_*` (provider-specific connection settings; e.g., URL/index/namespace/API key) |
| LLM Provider | Generate the final answer using retrieved context | `LLM_API_KEY` (provider key), `LLM_MODEL` (model name) |
| Lamatic Studio / AgentKit Runtime | Run and deploy the flow template | `lamatic.config.ts` (project metadata), runtime config for triggers/models |

## Environment Setup
- `LLM_API_KEY` — API key for the configured LLM provider; required by `RAGNode` in `search-widget`
- `LLM_MODEL` — model identifier used for generation in `RAGNode`; required by `search-widget`
- `VECTOR_STORE_API_KEY` — vector database API key (if applicable); required by `RAGNode` in `search-widget`
- `VECTOR_STORE_URL` — vector database endpoint/host; required by `RAGNode` in `search-widget`
- `VECTOR_STORE_INDEX` — index/collection name to query; required by `RAGNode` in `search-widget`
- `VECTOR_STORE_NAMESPACE` — namespace/tenant scope (if supported); required by `RAGNode` in `search-widget`
- `lamatic.config.ts` — template metadata and links; used by the Lamatic toolchain to identify/deploy this kit

> Note: Exact variable names may differ by the vector store and LLM providers you choose. Map these placeholders to the provider-specific keys used in your `model-configs/` and vector store configuration.

## Quickstart
1. Configure your model provider in `model-configs/` and set `LLM_API_KEY` and `LLM_MODEL` in your environment.
2. Configure your vector store connection (provider-specific) and set the `VECTOR_STORE_*` variables so `RAGNode` can retrieve documents.
3. Ensure your knowledge base is embedded and indexed in the vector store used by this project.
4. Deploy or run the flow via the Lamatic runtime (see `lamatic.config.ts` deploy link: `https://studio.lamatic.ai/template/search-widget`).
5. Invoke the `search-widget` trigger with a query. Example GraphQL shape (placeholder fields; align to your trigger schema):
   - `mutation RunSearchWidget($input: SearchWidgetInput!) { runFlow(flowId: "search-widget", input: $input) { output } }`
   - Variables:
     - `{"input": {"query": "How do I reset my password?", "filters": {"product": "acme"}, "sessionId": "sess_123"}}`
6. Render the returned `output` using your widget UI, treating it as a structured payload produced by `searchResponseNode`.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Empty or irrelevant answers | Vector store has no relevant embeddings, wrong index/namespace, or retrieval params too strict | Verify `VECTOR_STORE_INDEX`/`VECTOR_STORE_NAMESPACE`, re-embed content, adjust top-k and similarity thresholds in `RAGNode` config |
| “Unauthorized” / authentication errors | Missing/invalid `LLM_API_KEY` or vector store API key | Confirm secrets are set in the runtime environment and match the provider project/tenant |
| High latency or timeouts | Large retrieval context, slow vector store, or slow model | Reduce retrieved chunk count/size, enable caching, choose a faster model, increase caller timeout |
| Hallucinated content | Retrieval returning low-quality context or prompt not enforcing grounding | Improve document quality, tune chunking/embedding, adjust RAG prompt to require citing/using provided context |
| Prompt-injection attempt affects output | User input contains malicious instructions | Ensure constitution is enabled, harden the system prompt, and strip/escape untrusted fields in `searchTriggerNode` |

## Notes
- Project type: `template` (single flow).
- Template metadata: name `Search Widget`, version `1.0.0`, author `Naitik Kapadia <naitikk@lamatic.ai>`, tags `support`.
- Useful links:
  - Deploy: `https://studio.lamatic.ai/template/search-widget`
  - GitHub: `https://github.com/Lamatic/AgentKit/tree/main/kits/search-widget`
- Directory layout includes `constitutions/`, `flows/`, `model-configs/`, `prompts/`, `scripts/`, and `triggers/`, indicating this kit is intended to be customized with provider-specific model and retrieval configurations.