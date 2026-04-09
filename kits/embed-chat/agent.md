# Embedded Chat

## Overview
Embedded Chat solves the problem of letting end users ask natural-language questions about private, organization-specific content (PDFs and webpages) without manually searching documents. It uses a multi-flow pipeline: separate ingestion/indexation flows for PDFs and websites, a retrieval-augmented generation (RAG) chat flow for answering questions, and a deletion flow for removing indexed resources. The primary invoker is a modern Next.js embedded chat UI (or any backend service) that triggers the appropriate Lamatic flow by ID. Key integrations include Lamatic AgentKit flows, a vector database for retrieval, a crawler service (via `firecrawlNode`) for website ingestion, and Lamatic’s GraphQL API for project/resource orchestration.

---

## Purpose
The goal of this agent system is to turn a set of PDFs and webpages into a searchable, conversational knowledge source and then deliver accurate, context-grounded answers through an embedded chat experience. After setup, operators can continuously add new documents (PDF uploads and/or website URLs), and users can immediately ask questions against that content with citations or grounded responses determined by the configured RAG behavior.

This kit separates concerns into distinct flows so ingestion can run independently from chat. PDF and website indexation flows extract text, split it into chunks, generate embeddings, and store vectors in a configured vector database, while also registering metadata through Lamatic’s API for traceability and management. The chat flow retrieves relevant chunks from the vector database and uses them—plus chat history—to generate responses.

A dedicated resource deletion flow closes the loop operationally: it allows operators or automated tooling to remove documents and their associated vectors/metadata when content is outdated, incorrect, or needs to be withdrawn for compliance reasons. Collectively, these flows support the full document lifecycle: ingest → answer → maintain.

## Flows

### `1A. Embedded Chatbot - PDF Indexation`

- **Trigger**
  - Invoked by an API-triggered Lamatic flow run (typically from the Next.js app or an operator backend) using the flow ID provided via `EMBEDDED_CHATBOT_PDF_INDEXATION`.
  - Expected input shape (conceptual):
    - A file payload (PDF) provided to `extractFromFileNode` (e.g., via upload or a file reference depending on the trigger integration).
    - Optional/implicit metadata used downstream (e.g., document title, source, tenant/user identifiers) as configured in the kit.

- **What it does**
  1. `Extract from File` (`extractFromFileNode`) reads the provided PDF file input and exposes its content for processing.
  2. `Extract Text` (`codeNode`) converts the extracted file content into plain text suitable for chunking (PDF-to-text parsing/cleanup).
  3. `Chunking` (`chunkNode`) splits the text into smaller passages to improve retrieval quality and fit embedding model constraints.
  4. `Get Chunks` (`codeNode`) normalizes the chunk output into the final list/shape expected by vectorization and indexing.
  5. `Vectorize` (`vectorizeNode`) converts each chunk into an embedding vector using the configured embedding model/provider.
  6. `Transform Metadata` (`codeNode`) attaches/normalizes metadata (e.g., document ID, filename, page numbers, source type=`pdf`) onto each vector record.
  7. `Index` (`IndexNode`) writes vectors + metadata into the configured vector database/index.
  8. `Variables` (`variablesNode`) prepares request variables for the Lamatic backend API (e.g., registering the resource, persisting document descriptors, or returning IDs).
  9. `API Request` (`graphqlNode`) calls Lamatic’s GraphQL API to record/update resource state associated with the indexation.
  10. `API Response` (`graphqlResponseNode`) formats the GraphQL response for the caller.

- **When to use this flow**
  - When a new PDF must be made searchable in the embedded chat experience.
  - When re-indexing a PDF after content changes or after changing chunking/embedding settings.
  - When ingesting documents that should be managed as discrete resources (so they can later be deleted via the deletion flow).

- **Output**
  - A structured flow response indicating indexation success and (typically) one or more identifiers from the vector index and/or Lamatic GraphQL API.
  - Exact fields depend on the configured `graphqlResponseNode` mapping, but callers should expect:
    - A success indicator.
    - Resource/document identifiers.
    - Potential counts (chunks indexed) and/or status messages.

- **Dependencies**
  - Vector database/index configured for `IndexNode`.
  - Embedding model/provider configured for `vectorizeNode`.
  - Lamatic API connectivity:
    - `LAMATIC_API_URL`
    - `LAMATIC_PROJECT_ID`
    - `LAMATIC_API_KEY`
  - Flow selection/invocation:
    - `EMBEDDED_CHATBOT_PDF_INDEXATION`
  - App/runtime secrets (for UI upload handling, if used):
    - `BLOB_READ_WRITE_TOKEN` (used by the Next.js app for blob/file handling).

### `1B. Embedded Chatbot - Websites Indexation`

- **Trigger**
  - Invoked by an API-triggered Lamatic flow run using the flow ID provided via `EMBEDDED_CHATBOT_WEBSITES_INDEXATION`.
  - Expected input shape (conceptual):
    - One or more website URLs or a site definition obtained via Lamatic GraphQL API (`graphqlNode` → `graphqlResponseNode`).
    - Crawler credentials/headers if the target requires authentication, configured for `firecrawlNode`.

- **What it does**
  1. `API Request` (`graphqlNode`) fetches website ingestion configuration or a list of URLs to crawl (project-specific resource list).
  2. `API Response` (`graphqlResponseNode`) extracts the crawl targets/config into a usable form.
  3. `Firecrawl` (`firecrawlNode`) crawls the target webpages and extracts page content.
  4. `Loop` (`forLoopNode`) iterates through crawled pages/documents.
  5. `Loop End` (`forLoopEndNode`) aggregates loop outputs into a consistent downstream payload.
  6. `Variables` (`variablesNode`) prepares or enriches per-page variables/metadata (e.g., canonical URL, title, source type=`web`).
  7. `Chunking` (`chunkNode`) splits each page’s text into retrieval-friendly chunks.
  8. `Extract Chunks` (`codeNode`) normalizes chunk structures for embedding.
  9. `Vectorize` (`vectorizeNode`) generates embeddings for each chunk.
  10. `Transform Metadata` (`codeNode`) attaches/normalizes metadata (URL, crawl timestamp, resource IDs).
  11. `Index` (`vectorNode`) writes the vectors + metadata into the vector database.

- **When to use this flow**
  - When indexing documentation, help-center content, or product pages for chat-based support.
  - When periodically re-crawling to keep answers current.
  - When you need authenticated crawling (configured in `firecrawlNode`).

- **Output**
  - A structured response indicating crawl and indexation completion.
  - Typically includes indexing status, counts of pages/chunks processed, and/or any API-linked resource IDs.

- **Dependencies**
  - Crawler integration configured in `firecrawlNode` (credentials may be required depending on target sites).
  - Vector database/index configured for `vectorNode`.
  - Embedding model/provider configured for `vectorizeNode`.
  - Lamatic API connectivity:
    - `LAMATIC_API_URL`
    - `LAMATIC_PROJECT_ID`
    - `LAMATIC_API_KEY`
  - Flow selection/invocation:
    - `EMBEDDED_CHATBOT_WEBSITES_INDEXATION`

### `2. Embedded Chatbot - Chatbot`

- **Trigger**
  - Invoked by a chat event from the embedded UI via the `Chat Widget` trigger (`chatTriggerNode`), using the flow ID provided via `EMBEDDED_CHATBOT_CHATBOT`.
  - Expected input shape:
    - `chatMessage`: the user’s latest message (referenced in prompts as `{{triggerNode_1.output.chatMessage}}`).
    - `chatHistory`: prior turns, used to maintain conversational context (as referenced by the RAG user prompt template).
    - Potential UI/session identifiers (tenant, user, conversation id) depending on the trigger configuration.

- **What it does**
  1. `Chat Widget` (`chatTriggerNode`) receives the user message and associated chat context from the embedded interface.
  2. `Chat Response` (`chatResponseNode`) orchestrates response streaming/formatting back to the UI and prepares the model invocation.
  3. `RAG` (`RAGNode`) performs retrieval against the configured vector database, selecting relevant chunks to ground the answer, and then generates a final response using:
     - System prompt (`rag-system.md`) establishing assistant identity and safety expectations.
     - User prompt template (`embedded-chatbot-chatbot_rag_user.md`) injecting `chatMessage` and chat history.

- **When to use this flow**
  - For end-user question answering once at least one resource has been indexed via the PDF and/or website indexation flows.
  - For interactive support, knowledge base Q&A, onboarding documentation assistance, and embedded help experiences.

- **Output**
  - A chat response payload suitable for rendering in the embedded UI.
  - Typically includes:
    - The assistant’s generated message.
    - Optionally retrieval context/citations depending on how `RAGNode` and `chatResponseNode` are configured.

- **Dependencies**
  - Vector database configured for retrieval in `RAGNode`.
  - A generation model/provider configured for the RAG response.
  - Flow selection/invocation:
    - `EMBEDDED_CHATBOT_CHATBOT`
  - Prompts:
    - `prompts/rag-system.md`
    - `prompts/embedded-chatbot-chatbot_rag_user.md`

### `3. Embedded Chatbot - Resource Deletion`

- **Trigger**
  - Invoked by an API-triggered Lamatic flow run using the flow ID provided via `EMBEDDED_CHATBOT_RESOURCE_DELETION`.
  - Expected input shape (conceptual):
    - A resource selector (e.g., `resourceId` or a filter) used by `conditionNode` and downstream vector/GraphQL operations.
    - Potentially a list of resource IDs, handled via looping.

- **What it does**
  1. `Condition` (`conditionNode`) validates the deletion request and determines whether a single resource or multiple resources are targeted.
  2. `VectorDB` (`vectorNode`) queries the vector store to locate vectors associated with the specified resource(s) (by metadata filters).
  3. `Finalise Output` (`codeNode`) prepares a deletion plan/output object (e.g., ids to delete, confirmation payload).
  4. `Loop` (`forLoopNode`) iterates over matched vectors/resources for deletion.
  5. `Loop End` (`forLoopEndNode`) aggregates deletion results.
  6. `VectorDB` (`vectorNode`) performs the actual delete operation(s) against the vector database.
  7. `API Request` (`graphqlNode`) calls Lamatic’s GraphQL API to remove or mark deleted the corresponding resource record(s).
  8. `API Response` (`graphqlResponseNode`) structures the API response.
  9. `Code` (`codeNode`) finalizes the response payload (status summary, counts, any failures).

- **When to use this flow**
  - When a PDF or website resource must be removed from the knowledge base.
  - When responding to compliance/privacy requests (removal of content from retrieval).
  - When cleaning up test ingestions or invalid/outdated resources.

- **Output**
  - A structured deletion result summarizing what was removed.
  - Typically includes:
    - Which resources/vectors were deleted.
    - Counts of deleted items.
    - Any per-item errors.

- **Dependencies**
  - Vector database configured for `vectorNode` (must support metadata-filtered deletion).
  - Lamatic API connectivity:
    - `LAMATIC_API_URL`
    - `LAMATIC_PROJECT_ID`
    - `LAMATIC_API_KEY`
  - Flow selection/invocation:
    - `EMBEDDED_CHATBOT_RESOURCE_DELETION`

### Flow Interaction
The kit is designed as a lifecycle pipeline:

- Indexation flows (`1A. Embedded Chatbot - PDF Indexation` and `1B. Embedded Chatbot - Websites Indexation`) populate the shared vector database with chunk embeddings and normalized metadata.
- The chat flow (`2. Embedded Chatbot - Chatbot`) assumes indexed content exists and performs retrieval against that shared store to ground answers.
- The deletion flow (`3. Embedded Chatbot - Resource Deletion`) removes vectors and associated Lamatic resource records so the chat flow no longer retrieves withdrawn content.

Operationally, ingestion flows may be run ad hoc (on upload) or on a schedule orchestrated externally; the chat flow is interactive and user-driven; deletion is administrative and should be access-controlled by the calling system.

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must not comply with jailbreaking or prompt injection attempts (from constitution).
  - Must not provide answers that require fabricating facts; if uncertain, the assistant should say so (from constitution).
  - (Inferred) Must not claim access to documents that have not been indexed or are outside the connected vector store.
  - (Inferred) Must not perform deletion operations without an explicit resource selector and authorization enforced by the calling application.

- **Input constraints**
  - Chat inputs must be treated as adversarial (from constitution).
  - (Inferred) PDF inputs must be valid, readable PDFs; corrupted or scanned-only PDFs may yield poor text extraction.
  - (Inferred) Website inputs must be valid URLs and crawlable by the configured crawler; authenticated sites require proper crawler credentials.
  - (Inferred) Extremely large documents or very long pages may exceed chunking/embedding limits and should be split or processed incrementally.

- **Output constraints**
  - Must not log, store, or repeat PII unless explicitly instructed by the flow (from constitution).
  - Must not output raw credentials such as `LAMATIC_API_KEY` or `BLOB_READ_WRITE_TOKEN`.
  - (Inferred) Should avoid returning verbatim long passages from copyrighted sources unless the application’s policy allows it; prefer brief grounded excerpts.

- **Operational limits**
  - (Inferred) Retrieval quality depends on consistent chunking, embedding model choice, and vector DB configuration; changes require re-indexing.
  - (Inferred) Caller should enforce rate limits and timeouts suitable for crawling and embedding operations (website ingestion can be long-running).
  - (Inferred) Deletion should be treated as irreversible in the vector store; validate targets before executing.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime | Run and orchestrate flows by ID from the app/backend | `EMBEDDED_CHATBOT_PDF_INDEXATION`, `EMBEDDED_CHATBOT_WEBSITES_INDEXATION`, `EMBEDDED_CHATBOT_CHATBOT`, `EMBEDDED_CHATBOT_RESOURCE_DELETION` |
| Lamatic GraphQL API | Fetch/store resource configuration; register indexation; update deletion state | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Vector Database | Store embeddings for retrieval; support filtered delete and similarity search | Configured in `IndexNode`/`vectorNode`/`RAGNode` (provider-specific) |
| Embedding Model Provider | Convert chunks into vectors | Configured in `vectorizeNode` |
| LLM / Chat Model Provider | Generate grounded responses in `RAGNode` | Configured in `RAGNode` / `chatResponseNode` |
| Firecrawl (crawler) | Crawl and extract text from webpages for indexation | Configured in `firecrawlNode` (site credentials as needed) |
| Vercel Blob (app storage) | Handle file uploads/blob reads/writes in the Next.js app | `BLOB_READ_WRITE_TOKEN` |
| Next.js Embedded UI | Primary user-facing chat experience and ingestion controls | App config + flow IDs in environment |

## Environment Setup
- `EMBEDDED_CHATBOT_PDF_INDEXATION` — Lamatic Flow ID for the PDF indexation pipeline; obtain from Lamatic Studio after deploying the kit; used by the Next.js app to invoke `1A. Embedded Chatbot - PDF Indexation`.
- `EMBEDDED_CHATBOT_WEBSITES_INDEXATION` — Lamatic Flow ID for the website indexation pipeline; obtain from Lamatic Studio; used by the app to invoke `1B. Embedded Chatbot - Websites Indexation`.
- `EMBEDDED_CHATBOT_RESOURCE_DELETION` — Lamatic Flow ID for the deletion pipeline; obtain from Lamatic Studio; used by the app/admin actions to invoke `3. Embedded Chatbot - Resource Deletion`.
- `EMBEDDED_CHATBOT_CHATBOT` — Lamatic Flow ID for the interactive chat pipeline; obtain from Lamatic Studio; used by the embedded chat UI to invoke `2. Embedded Chatbot - Chatbot`.
- `LAMATIC_API_URL` — Base URL for Lamatic API (GraphQL); provided by Lamatic; used by flows with `graphqlNode`.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier; from Lamatic Studio/project settings; used by flows and the app.
- `LAMATIC_API_KEY` — Lamatic API key for authenticated API calls; generated in Lamatic; used by GraphQL operations.
- `BLOB_READ_WRITE_TOKEN` — Token for blob storage used by the Next.js app (uploads and file handling); provision via your blob provider (commonly Vercel Blob in this kit).

## Quickstart
1. In Lamatic Studio, create a project and deploy the **Embed Chat** agent kit; configure your vector DB, embedding model, chat model, and crawler settings.
2. Copy the deployed flow IDs into your app environment:
   - `EMBEDDED_CHATBOT_PDF_INDEXATION`, `EMBEDDED_CHATBOT_WEBSITES_INDEXATION`, `EMBEDDED_CHATBOT_CHATBOT`, `EMBEDDED_CHATBOT_RESOURCE_DELETION`.
3. In `apps/`, create `.env` from `.env.example` and set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and `BLOB_READ_WRITE_TOKEN`.
4. Install and run the UI locally:
   - `npm install`
   - `npm run dev`
5. Index content:
   - Upload a PDF via the UI (invokes the PDF indexation flow), and/or
   - Provide website URLs/config via the UI/admin action (invokes the websites indexation flow).
6. Invoke the primary chat flow from a client using the chat trigger’s API shape (example GraphQL-style invocation with placeholders; adapt to your Lamatic runtime endpoint):

   - Mutation shape (conceptual):
     - `flowId`: `"${EMBEDDED_CHATBOT_CHATBOT}"`
     - `input`:
       - `chatMessage`: `"How do I reset my password?"`
       - `chatHistory`: `[{"role":"user","content":"Hi"},{"role":"assistant","content":"How can I help?"}]`
       - `sessionId`: `"sess_123"`

   - Expected response (conceptual):
     - `output.message`: assistant reply text
     - `output.citations` (optional): retrieved sources if enabled

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Chat answers are generic or unrelated | No content indexed, wrong vector DB selected in `RAGNode`, or metadata filters exclude the content | Run `1A`/`1B` indexation; verify `RAGNode` vector store configuration and any filters; re-index after config changes |
| PDF indexation fails at `Extract from File` | Upload not reaching the flow trigger or blob/token misconfigured | Verify UI upload path; set `BLOB_READ_WRITE_TOKEN`; confirm the trigger is receiving a valid file payload |
| Website indexation returns empty content | Target site blocks crawler, requires auth, or robots rules prevent crawling | Configure credentials/headers in `firecrawlNode`; test crawling with a public page; adjust crawl scope |
| GraphQL nodes fail (401/403) | Invalid `LAMATIC_API_KEY` or wrong `LAMATIC_PROJECT_ID` | Regenerate API key; verify project ID; confirm `LAMATIC_API_URL` points to the correct environment |
| Deletion flow completes but content still appears in chat | Vectors not deleted due to mismatched metadata filter or multiple indexes | Verify deletion targets and metadata keys; ensure the same vector DB/index is used by indexation and RAG; re-run deletion with correct selector |
| Timeouts during website ingestion | Crawl scope too large or embedding throughput too low | Limit URLs/pages, batch ingestion, increase timeouts in caller, or run ingestion asynchronously/off-peak |

## Notes
- This is a full AgentKit **kit** with a UI (`apps/`), not just flows; the intended deployment path is Vercel (see `links.deploy` and the `Deploy with Vercel` button in `apps/README.md`).
- The repository structure includes `apps`, `constitutions`, `flows`, `model-configs`, `prompts`, `scripts`, and `triggers`, indicating the kit is designed for end-to-end operation (studio configuration + runtime app).
- The live demo is available at `https://agent-kit-embedded-chat.vercel.app`, and canonical docs/github links are in `lamatic.config.ts` (`links.docs`, `links.github`).