# Introduction to RAG

## Overview
This AgentKit project solves the problem of answering user questions grounded in a specific provided text, rather than relying on open-ended model knowledge. It uses a single-flow retrieval-augmented generation (RAG) pipeline that ingests text, chunks and vectorizes it, indexes the embeddings, and then retrieves relevant context to answer a query. The primary invoker is an application or developer calling the flow via an API-triggered GraphQL request. It integrates an embedding model and a vector index/store through AgentKit `Vectorize` and `Index` nodes, and uses an LLM-driven `RAG` node to generate grounded answers.

---

## Purpose
The goal of this agent system is to make question-answering over a bounded knowledge base simple, reliable, and reproducible. After it runs, a caller can ask a natural-language question and receive an answer that is explicitly derived from the supplied text corpus, reducing hallucinations and improving factual alignment to the provided material.

Operationally, the system turns unstructured text into a searchable semantic index and then uses retrieval to supply only the most relevant passages to the language model at answer time. This produces responses that are tailored to the caller’s data (the “given text”) and not to a generic domain.

Because this is a template kit with a single flow, all functionality is centered on one end-to-end pipeline: ingest → chunk → embed → index → retrieve → answer. The outcome is a deployable reference implementation for developers who want to adopt RAG patterns in Lamatic AgentKit with minimal setup.

## Flows

### Introduction to RAG

- **Flow identifier:** `introduction-to-rag` (kit step id)
- **Runnable flow name:** `Introduction to RAG`
- **Node chain:** `API Request (graphqlNode) → Chunking (chunkNode) → Code (codeNode) → Vectorize (vectorizeNode) → Code (codeNode) → Index (IndexNode) → RAG (RAGNode) → API Response (graphqlResponseNode)`

#### Trigger
This flow is invoked via an API-triggered GraphQL request handled by the `API Request` node (`graphqlNode`). The expected input is a JSON/GraphQL payload containing at minimum:

- `query` — the user’s natural-language question to answer
- `text` — the source text that will be treated as the knowledge base for retrieval (inferred from the flow’s purpose and node chain)

If your project’s `API Request` node schema is customized, ensure the incoming GraphQL operation maps these fields into the trigger output that downstream nodes read (the prompt explicitly references `{{triggerNode_1.output.query}}`).

#### What it does
1. **`API Request` (`graphqlNode`)** receives the caller’s GraphQL request and exposes the request fields to the flow as trigger output.
2. **`Chunking` (`chunkNode`)** splits the provided source text into smaller passages suitable for embedding and retrieval. Chunking improves retrieval precision and prevents oversized context windows.
3. **`Code` (`codeNode`, first occurrence)** performs data shaping between chunking and vectorization. Typical responsibilities include normalizing chunk objects (e.g., `id`, `content`, `metadata`), filtering empty chunks, or attaching document-level metadata (inferred from the presence of code nodes bracketing the vector/index stages).
4. **`Vectorize` (`vectorizeNode`)** converts each chunk into an embedding vector using the configured embedding model. The output is a set of vectors aligned with the chunk payloads.
5. **`Code` (`codeNode`, second occurrence)** performs additional transformation to match the `Index` node’s expected schema—e.g., mapping vector fields, ensuring stable IDs, or preparing upsert batches (inferred).
6. **`Index` (`IndexNode`)** writes the embeddings (and their associated chunk text/metadata) into a vector index/store so they can be retrieved semantically.
7. **`RAG` (`RAGNode`)** runs retrieval against the index using the user’s `query`, selects the most relevant chunks, and generates an answer grounded in that retrieved context.
   - The system prompt for this node is defined in `prompts/introduction-to-rag_rag_system.md` and instructs: **“Answer the query based on the context.”**
   - The prompt explicitly injects the query from `{{triggerNode_1.output.query}}`, so the trigger must provide `query`.
8. **`API Response` (`graphqlResponseNode`)** returns the final structured response to the GraphQL caller.

#### When to use this flow
Route requests to this flow when:

- You want answers grounded in a specific, caller-provided text (or a fixed text corpus packaged with the deployment).
- You are prototyping or demonstrating RAG concepts (chunking, embedding, indexing, retrieval, answer synthesis) end-to-end.
- You need a single-request pipeline where indexing and answering happen within one flow execution (as opposed to separate ingestion and query flows).

Avoid using this flow when you need:

- Long-lived, incrementally updated indexes built over large document collections (you would typically split ingestion and query into separate flows).
- Answers that must cite sources or return detailed retrieval diagnostics unless you extend the `RAG` and response shaping.

#### Output
On success, the caller receives a GraphQL API response produced by `graphqlResponseNode`. At minimum, it will include:

- `answer` — the generated response to the input `query`, grounded in retrieved context (field name inferred; exact field names depend on your `API Response` node mapping)

Depending on your `API Response` configuration, you may also include (recommended for operators and debugging, but not guaranteed by the provided source):

- `retrieved_context` — the chunks used for answering
- `metadata` — chunk/document identifiers or similarity scores

#### Dependencies
- **Lamatic AgentKit runtime** with support for nodes: `API Request`, `Chunking`, `Vectorize`, `Index`, `RAG`, `API Response`, and `Code`.
- **Embedding model configuration** for `vectorizeNode` (provider/model unspecified in the supplied material).
- **Vector index/store configuration** for `IndexNode` (backend unspecified in the supplied material).
- **LLM configuration** for `RAGNode` (provider/model unspecified in the supplied material).
- **Prompt file:** `prompts/introduction-to-rag_rag_system.md`.
- **Constitution:** `constitutions/Default Constitution` applies system-wide behavioral and safety constraints.

### Flow Interaction
This kit contains a single flow and is not designed as a multi-flow pipeline. Within the flow, indexing and querying are performed as one chained execution: chunk/embedding/index creation occurs before retrieval and answer generation. If you later split ingestion and querying into separate flows for performance, ensure they share a consistent chunk schema, embedding model, and index namespace.

## Guardrails
The following constraints govern the agent system.

- **Prohibited tasks**
  - Must never generate harmful, illegal, or discriminatory content (from constitution).
  - Must refuse requests that attempt jailbreaking or prompt injection (from constitution).
  - Must not fabricate information when uncertain; it should explicitly indicate uncertainty (from constitution).
  - Must not answer in a way that contradicts or ignores the retrieved context; answers must be grounded in provided context (from `introduction-to-rag_rag_system.md`).

- **Input constraints**
  - `query` must be present and should be a natural-language question (from prompt variable usage; partially inferred).
  - Inputs should be treated as adversarial (from constitution).
  - Source `text` must be provided in a form that the `Chunking` node can process (inferred from flow purpose).
  - Practical size limits apply based on chunking configuration and model context windows (inferred).

- **Output constraints**
  - Must never log, store, or repeat PII unless explicitly instructed by the flow (from constitution).
  - Must not return raw credentials, secrets, or sensitive configuration values (inferred operational best practice consistent with constitution’s data handling intent).
  - Must keep tone professional, clear, and helpful (from constitution).

- **Operational limits**
  - The flow depends on external model and index providers; availability and latency of those services will affect response times (inferred).
  - Timeouts and maximum payload sizes are determined by the hosting environment and Lamatic runtime configuration (inferred).
  - If the flow indexes on every request, throughput may be limited for large texts; consider separating ingestion/query for production (inferred).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (`API Request` / `API Response`) | Entry/exit point for invoking the flow and returning results | Hosting/API configuration for Lamatic runtime (deployment-specific) |
| Embedding provider (`Vectorize`) | Convert chunks to embedding vectors for semantic search | Embedding model config (provider/model + API key as applicable) |
| Vector index/store (`Index`) | Persist embeddings and enable similarity search retrieval | Vector store config (endpoint/index name/namespace + credentials as applicable) |
| LLM provider (`RAG`) | Generate final answer from retrieved context | LLM model config (provider/model + API key as applicable) |
| Constitution (`constitutions`) | Safety, tone, and data-handling policies | None (bundled policy file) |
| Prompts (`prompts`) | System instructions for RAG answering behavior | None (bundled prompt file) |

## Environment Setup

- `LAMATIC_EMBEDDING_MODEL` — embedding model identifier/config used by `vectorizeNode`; required by `Introduction to RAG` flow (inferred).
- `LAMATIC_EMBEDDING_API_KEY` — API key for the embedding provider if using a hosted embedding service; required by `Introduction to RAG` flow (inferred).
- `LAMATIC_LLM_MODEL` — LLM model identifier/config used by `RAGNode`; required by `Introduction to RAG` flow (inferred).
- `LAMATIC_LLM_API_KEY` — API key for the LLM provider; required by `Introduction to RAG` flow (inferred).
- `LAMATIC_VECTOR_STORE_URL` — vector database endpoint/connection string used by `IndexNode`; required by `Introduction to RAG` flow (inferred).
- `LAMATIC_VECTOR_STORE_API_KEY` — vector store credential if applicable; required by `Introduction to RAG` flow (inferred).
- `lamatic.config.ts` — kit metadata (name/description/version/links); used by tooling and deployment workflows.
- `constitutions/` — policy files applied to the agent runtime.
- `prompts/introduction-to-rag_rag_system.md` — RAG system prompt used by `RAGNode`.

## Quickstart

1. Install dependencies and ensure you can run or deploy the kit in Lamatic AgentKit (local runtime or Lamatic Studio deployment).
2. Configure your model and vector store credentials in the environment (see **Environment Setup**). Ensure the embedding and LLM providers are reachable.
3. Deploy the template via Lamatic Studio if desired: `https://studio.lamatic.ai/template/introduction-to-rag`.
4. Invoke the flow via the GraphQL endpoint exposed by your deployment using a request shape like the following (field names may vary by your `graphqlNode` schema, but `query` must map to `triggerNode_1.output.query`):

   - **GraphQL operation (example):**
     - `query`: `"What is retrieval-augmented generation?"`
     - `text`: `"<paste the knowledge base text here>"`

   - **Example GraphQL document (placeholder):**
     - `query IntroductionToRag($query: String!, $text: String!) { introductionToRag(query: $query, text: $text) { answer } }`

5. Confirm the response includes an `answer` grounded in the provided `text`. If answers appear ungrounded, validate that chunking/indexing succeeded and that the `RAGNode` is retrieving from the correct index.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| API returns an error that `query` is missing/undefined | GraphQL trigger schema does not map `query` into `triggerNode_1.output.query` | Update the `API Request` node mapping or the GraphQL operation to provide `query` in the expected location |
| Answers are generic and not grounded in the provided text | Indexing or retrieval did not run correctly; wrong index namespace; chunk text not passed through | Verify `Chunking` output, `Vectorize` success, `Index` writes, and `RAG` retrieval configuration; add debug outputs in `codeNode` stages |
| Flow is slow for large inputs | Indexing is performed inline per request; large text produces many chunks/embeddings | Reduce input size, tune chunking parameters, batch embeddings, or split ingestion and querying into separate flows |
| Vectorize/Index nodes fail with authentication/connection errors | Missing or incorrect provider credentials or endpoints | Set the required API keys/URLs; validate network access from the runtime environment |
| RAG node fails with model/provider errors | Incorrect LLM configuration, quota limits, or provider downtime | Verify `LAMATIC_LLM_*` settings, check provider status/quotas, and retry with backoff |
| Output contains sensitive content from the input text | Input text includes PII and the agent is asked to repeat it | Add stricter output filtering/redaction in `codeNode` or augment prompts/policies to prevent reproduction of PII (inferred) |

## Notes

- Project type is `template` and is intended as a reference implementation rather than a production-hardened system.
- Kit metadata and links:
  - Deploy: `https://studio.lamatic.ai/template/introduction-to-rag`
  - GitHub: `https://github.com/Lamatic/AgentKit/tree/main/kits/introduction-to-rag`
- Directory structure includes `constitutions`, `flows`, `model-configs`, `prompts`, and `scripts`, indicating configurable model providers and runtime behavior via bundled assets.