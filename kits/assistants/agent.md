# Internal Assistant

## Overview
Internal Assistant is a Lamatic AgentKit bundle that builds an internal chatbot capable of finding precise answers across a company’s knowledge base. It uses a multi-flow architecture: dedicated indexation flows ingest content from different enterprise sources into a vector store, and assistant flows run retrieval-augmented generation (RAG) to answer questions using that indexed content. It is primarily invoked either by end users via a web chat widget or by employees inside Slack or Microsoft Teams, depending on which assistant flow is deployed. Key integrations include cloud content sources (Google Drive/Sheets, OneDrive, SharePoint, S3), databases (Postgres), web crawling/scraping via Firecrawl, a vector store/indexing layer, and Lamatic’s API/Project runtime.

---

## Purpose
The system’s goal is to turn scattered internal content into a searchable, answerable knowledge base and then provide a conversational interface that returns grounded, context-aware answers. After the system runs, teams spend less time hunting for documents, duplicating work, or relying on tribal knowledge; instead, they can ask questions and get precise responses sourced from the most relevant internal materials.

This kit is structured as two coordinated capabilities. First, ingestion/indexation flows pull content from a selected data source, normalize it into text, chunk it, create embeddings, and index it into a vector store with consistent metadata. Second, assistant flows (web, Slack, Teams) use a RAG node to retrieve the most relevant indexed chunks and generate a response aligned with the project’s constitution.

Collectively, the flows support a typical internal knowledge lifecycle: select a data source, run indexation to keep the vector index populated, then expose one or more conversational entry points for employees. The kit is designed so operators can swap the data source and the assistant channel independently (exactly one of each) while keeping the underlying retrieval and safety posture consistent.

## Flows

### `Crawling Indexation`
- **Trigger**
  - Invoked via an `API Request (graphqlNode)`.
  - Expected input shape: a GraphQL request payload that includes at minimum a target URL (or list of URLs) and crawl parameters (e.g., depth, allowed domains) understood by `Firecrawl (firecrawlNode)`.
- **What it does**
  - `API Request (graphqlNode)` receives a crawl job request and parses parameters.
  - `Firecrawl (firecrawlNode)` crawls the target site and returns discovered pages/content.
  - `Loop (forLoopNode)` iterates over crawled items/pages.
  - `Loop End (forLoopEndNode)` finalizes loop aggregation/iteration control.
  - `Variables (variablesNode)` normalizes per-item fields (e.g., source URL, title, timestamps) for downstream nodes.
  - `Chunking (chunkNode)` splits page text into retrieval-friendly chunks.
  - `Extract Chunks (codeNode)` extracts/reshapes chunk text into the exact list format required by vectorization.
  - `Vectorize (vectorizeNode)` generates embeddings for each chunk using the configured embedding model.
  - `Transform Metadata (codeNode)` builds consistent metadata (e.g., `source`, `url`, `documentId`, `chunkId`) associated with each vector.
  - `Index (vectorNode)` writes vectors + metadata to the configured vector store/index.
  - `API Response (graphqlResponseNode)` returns a success response including indexing counts/status.
- **When to use this flow**
  - When you need continuous discovery and ingestion of a website or documentation portal where content is distributed across multiple linked pages.
  - Prefer this over `Scraping Indexation` when crawl traversal is needed rather than a fixed list of pages.
- **Output**
  - GraphQL response from `graphqlResponseNode` with an indexing status payload (typically including success flag and counts of indexed pages/chunks).
- **Dependencies**
  - Firecrawl API access/config (required by `firecrawlNode`).
  - Vector store/index connectivity (required by `vectorNode`).
  - Embedding model configuration (required by `vectorizeNode`).
  - Lamatic project runtime and API access (see environment variables).

### `GDrive`
- **Trigger**
  - Invoked by the `Google Drive (googleDriveNode)` connector when the flow is run (operator-initiated run or orchestrated by the kit).
  - Expected input shape: Google Drive folder/file selection plus OAuth/connector configuration (Drive scopes) that determines which files are read.
- **What it does**
  - `Google Drive (googleDriveNode)` enumerates and downloads eligible Drive files.
  - `chunking (chunkNode)` splits extracted document text into chunks.
  - `Extract Chunked Text (codeNode)` converts the chunking node output into a plain list of strings (or `{text, ...}` objects) required for embeddings.
  - `Get Vectors (vectorizeNode)` computes embeddings for each chunk.
  - `Transform Metadata (codeNode)` attaches Drive-specific metadata (file id, path, URL, modified time) and standard indexing fields.
  - `Index to DB (IndexNode)` persists vectors and metadata to the configured index/vector database.
  - `plus-node-addNode_870476 (addNode)` performs aggregation/accumulation (e.g., counts, status composition) for reporting.
  - `Variables (variablesNode)` finalizes run-level variables for downstream use or logging.
- **When to use this flow**
  - When the company’s knowledge base lives in Google Drive (docs, PDFs, files in shared drives) and you need them searchable by the assistants.
- **Output**
  - A run completion payload (implementation-dependent) indicating indexing status, typically including number of files processed and chunks indexed.
- **Dependencies**
  - Google Drive connector credentials (OAuth) for `googleDriveNode`.
  - Vector store/index connectivity for `IndexNode`.
  - Embedding model configuration for `vectorizeNode`.
  - Lamatic project runtime and API access.

### `GSheet`
- **Trigger**
  - Invoked by the `Google Sheets (googleSheetsNode)` connector when executed.
  - Expected input shape: Spreadsheet id/range/sheet selection and connector OAuth configuration.
- **What it does**
  - `Google Sheets (googleSheetsNode)` reads rows/cells from the configured sheet/range.
  - `Vectorise (vectorizeNode)` generates embeddings for row text content.
  - `Transform Metadata (codeNode)` formats metadata (sheet id, tab name, row index, column context) and standard indexing fields.
  - `Index to DB (IndexNode)` writes vectors + metadata into the index.
  - `addNode_894 (addNode)` accumulates per-row results (counts/status).
  - `Row Chunking (codeNode)` chunks or concatenates row data into retrieval-friendly units where needed.
  - `Variables (variablesNode)` finalizes run variables.
- **When to use this flow**
  - When structured knowledge is maintained in Google Sheets (FAQs, policies, catalogs) and must be retrievable by question.
- **Output**
  - A run completion payload with indexing status (rows processed, chunks indexed).
- **Dependencies**
  - Google Sheets connector credentials (OAuth) for `googleSheetsNode`.
  - Vector store/index connectivity for `IndexNode`.
  - Embedding model configuration for `vectorizeNode`.
  - Lamatic project runtime and API access.

### `Knowledge Chatbot`
- **Trigger**
  - Invoked by `Chat Widget (chatTriggerNode)`.
  - Expected input shape: a chat message payload, referenced in prompts as `{{triggerNode_1.output.chatMessage}}`.
- **What it does**
  - `Chat Widget (chatTriggerNode)` receives an end-user question from the embedded widget.
  - `RAG (RAGNode)` retrieves relevant chunks from the vector index and generates an answer using the configured system/user prompts.
    - Uses `knowledge-chatbot_rag_system.md` and `knowledge-chatbot_rag_user.md` (user prompt includes `USER QUERY : {{triggerNode_1.output.chatMessage}}`).
  - `Chat Response (chatResponseNode)` returns the final assistant message back to the widget client.
- **When to use this flow**
  - When you need a web-based internal assistant (e.g., intranet portal, internal tool) answering questions grounded in indexed content.
- **Output**
  - A chat response message suitable for the chat widget (text response, and optionally citations/metadata depending on `RAGNode` configuration).
- **Dependencies**
  - Vector store/index populated by one or more indexation flows.
  - LLM configuration used by `RAGNode` (model-configs).
  - Prompt files: `knowledge-chatbot_rag_system.md`, `knowledge-chatbot_rag_user.md`.
  - Lamatic runtime configuration and API access.

### `Onedrive`
- **Trigger**
  - Invoked by the `Onedrive Business (onedriveNode)` connector when executed.
  - Expected input shape: OneDrive folder/file selection and Microsoft connector auth.
- **What it does**
  - `Onedrive Business (onedriveNode)` lists/downloads documents.
  - `Chunking (chunkNode)` splits text into chunks.
  - `Get Chunks (codeNode)` extracts chunk strings for embedding.
  - `Vectorize (vectorizeNode)` creates embeddings.
  - `Transform Metadata (codeNode)` attaches OneDrive metadata and standard fields.
  - `Index (IndexNode)` persists vectors into the index.
  - `plus-node-addNode_960424 (addNode)` aggregates run stats.
  - `Variables (variablesNode)` finalizes run variables.
- **When to use this flow**
  - When internal documents live in Microsoft 365 OneDrive/SharePoint-backed libraries exposed via OneDrive Business.
- **Output**
  - Run completion payload with indexing status.
- **Dependencies**
  - Microsoft OneDrive connector credentials for `onedriveNode`.
  - Vector store/index connectivity for `IndexNode`.
  - Embedding model configuration for `vectorizeNode`.

### `Postgres`
- **Trigger**
  - Invoked by `Postgres (postgresNode)` when executed.
  - Expected input shape: connection configuration and a query/table selection that determines which rows are embedded.
- **What it does**
  - `Postgres (postgresNode)` reads records from the configured database.
  - `Vectorise (vectorizeNode)` creates embeddings for row-derived text.
  - `Transform Metadata (codeNode)` standardizes metadata (table, primary key, updated_at) and indexing fields.
  - `Index to DB (IndexNode)` writes vectors + metadata to the index.
  - `addNode_894 (addNode)` aggregates results.
  - `Row Chunking (codeNode)` chunks/serializes row content into retrieval units.
  - `Variables (variablesNode)` finalizes variables.
- **When to use this flow**
  - When operational knowledge lives in relational tables (tickets, runbooks, FAQs, product catalogs) and you want semantic search over those records.
- **Output**
  - Run completion payload with indexing status.
- **Dependencies**
  - Postgres connection credentials for `postgresNode`.
  - Vector store/index connectivity for `IndexNode`.
  - Embedding model configuration for `vectorizeNode`.

### `S3`
- **Trigger**
  - Invoked by `S3 (s3Node)` when executed.
  - Expected input shape: bucket/prefix selection and AWS credentials with read access.
- **What it does**
  - `S3 (s3Node)` lists and downloads objects from the configured bucket/prefix.
  - `addNode_290 (addNode)` aggregates/controls object processing flow.
  - `Extract from File (extractFromFileNode)` extracts content from supported file types (e.g., PDF, DOCX) into raw text.
  - `Extract Text (codeNode)` normalizes extractor output into clean text.
  - `Chunking (chunkNode)` splits text into chunks.
  - `Get Chunks (codeNode)` formats chunk list for embeddings.
  - `Vectorize (vectorizeNode)` computes embeddings.
  - `Transform Metadata (codeNode)` attaches S3 metadata (bucket, key, last_modified) and standard fields.
  - `Index (IndexNode)` writes to the index.
  - `Variables (variablesNode)` finalizes run variables.
- **When to use this flow**
  - When your knowledge base is stored as files in S3 (data rooms, policy PDFs, exported docs) and must be searchable.
- **Output**
  - Run completion payload with object/file and chunk indexing stats.
- **Dependencies**
  - AWS credentials and region config for `s3Node`.
  - File extraction support for `extractFromFileNode`.
  - Vector store/index connectivity for `IndexNode`.
  - Embedding model configuration for `vectorizeNode`.

### `Scraping Indexation`
- **Trigger**
  - Invoked via an `API Request (graphqlNode)`.
  - Expected input shape: GraphQL request specifying one or more URLs (typically a fixed set) and scrape parameters for `Firecrawl (firecrawlNode)`.
- **What it does**
  - `API Request (graphqlNode)` receives scrape targets.
  - `Firecrawl (firecrawlNode)` fetches and extracts content from the target URL(s).
  - `Loop (forLoopNode)` iterates over each scraped page/item.
  - `Loop End (forLoopEndNode)` finalizes loop control.
  - `Variables (variablesNode)` maps fields into a consistent schema.
  - `Chunking (chunkNode)` chunks the page text.
  - `Extract Chunks (codeNode)` extracts chunk strings.
  - `Vectorize (vectorizeNode)` generates embeddings.
  - `Transform Metadata (codeNode)` standardizes metadata.
  - `Index (vectorNode)` writes to the vector store.
  - `API Response (graphqlResponseNode)` returns scrape/index status.
- **When to use this flow**
  - When you have a known, fixed set of pages to ingest (e.g., specific docs URLs) and do not need recursive crawling.
- **Output**
  - GraphQL response payload with status and counts.
- **Dependencies**
  - Firecrawl API access/config.
  - Vector store/index connectivity for `vectorNode`.
  - Embedding model configuration for `vectorizeNode`.

### `Sharepoint`
- **Trigger**
  - Invoked by `Sharepoint Business (sharepointNode)` when executed.
  - Expected input shape: site/library/folder selection and Microsoft connector auth.
- **What it does**
  - `Sharepoint Business (sharepointNode)` enumerates and downloads documents.
  - `Chunking (chunkNode)` splits document text.
  - `Get Chunks (codeNode)` extracts chunk strings.
  - `Vectorize (vectorizeNode)` generates embeddings.
  - `Transform Metadata (codeNode)` attaches SharePoint metadata (site, library, path) and standard fields.
  - `Index (IndexNode)` writes to the index.
  - `plus-node-addNode_960424 (addNode)` aggregates run stats.
  - `Variables (variablesNode)` finalizes variables.
- **When to use this flow**
  - When internal knowledge is stored in SharePoint document libraries and must be retrievable via RAG.
- **Output**
  - Run completion payload with indexing status.
- **Dependencies**
  - Microsoft SharePoint connector credentials.
  - Vector store/index connectivity.
  - Embedding model configuration.

### `Slack Assistant`
- **Trigger**
  - Invoked by `Slack Trigger (slackNode)` (Slack event/webhook).
  - Expected input shape: Slack message event payload, referenced in prompts as `{{triggerNode_1.output.text}}`.
- **What it does**
  - `Slack Trigger (slackNode)` receives an incoming Slack message (DM or channel, depending on app configuration).
  - `RAG (RAGNode)` retrieves relevant indexed chunks and drafts an answer using:
    - `slack-assistant_rag_system.md`
    - `slack-assistant_rag_user.md` (includes `USER QUERY : {{triggerNode_1.output.text}}`)
  - `Slack (slackNode)` posts the generated reply back to Slack.
  - `plus-node-addNode_983981 (addNode)` aggregates status/telemetry for the run.
- **When to use this flow**
  - When employees primarily work in Slack and you want the internal assistant available where questions are asked.
- **Output**
  - A posted Slack message (and an execution status payload in the run logs).
- **Dependencies**
  - Slack app credentials/webhook/event subscription configuration.
  - Vector store/index populated by indexation flows.
  - LLM configuration and prompts for `RAGNode`.

### `Teams Assistant`
- **Trigger**
  - Invoked by `Teams (teamsNode)` (Microsoft Teams bot/message event).
  - Expected input shape: Teams message payload, referenced in prompts as `{{triggerNode_1.output.text}}`.
- **What it does**
  - `Teams (teamsNode)` receives a Teams message.
  - `RAG (RAGNode)` retrieves relevant indexed chunks and generates an answer using:
    - `teams-assistant_rag_system.md`
    - `teams-assistant_rag_user.md` (includes `USER QUERY : {{triggerNode_1.output.text}}`)
  - `Teams (teamsNode)` sends the response back into the conversation.
  - `plus-node-addNode_557807 (addNode)` aggregates run status.
- **When to use this flow**
  - When the organization uses Microsoft Teams as the primary collaboration surface.
- **Output**
  - A Teams bot reply message (and execution status in run logs).
- **Dependencies**
  - Microsoft Teams bot/app credentials and webhook/event configuration.
  - Vector store/index populated by indexation flows.
  - LLM configuration and prompts for `RAGNode`.

### Flow Interaction
Indexation flows (`GDrive`, `GSheet`, `Onedrive`, `Sharepoint`, `S3`, `Postgres`, `Scraping Indexation`, `Crawling Indexation`) all produce the same functional artifact: embedded chunks stored in a shared vector index with consistent metadata. Assistant flows (`Knowledge Chatbot`, `Slack Assistant`, `Teams Assistant`) depend on that index being populated; they do not ingest source systems directly.

Operationally, the kit’s `steps` enforce a common deployment pattern: choose exactly one `data-source` option and exactly one `assistant` option. Once indexation has run successfully at least once (and ideally on a schedule or via repeated runs), route user questions to the selected assistant flow. If you change the selected data source, re-index before expecting accurate answers.

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (constitution).
  - Must not comply with jailbreaking or prompt-injection attempts (constitution).
  - Must not fabricate facts; if uncertain, the assistant should say so (constitution).
  - (Inferred) Must not answer using information outside the indexed company knowledge base as authoritative; when retrieval is weak, respond with uncertainty and request clarification.
- **Input constraints**
  - Treat all user inputs as potentially adversarial (constitution).
  - (Inferred) User queries should be plain-text questions; extremely long inputs may be truncated by channel limits (Slack/Teams/widget).
  - (Inferred) Indexation inputs must reference accessible resources (valid URLs for Firecrawl, accessible buckets/drives, valid DB queries).
- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (constitution).
  - Must not output raw credentials, tokens, or secrets (inferred from internal-assistant use case).
  - Must not output offensive content; maintain professional tone (constitution).
- **Operational limits**
  - Depends on Lamatic runtime availability and correct project configuration.
  - (Inferred) Indexation throughput is bounded by source API rate limits (Google/Microsoft/AWS), Firecrawl limits, embedding model throughput, and vector store write capacity.
  - (Inferred) Assistant responses are bounded by model context window; retrieval should use chunking to stay within limits.

## Integration Reference
| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic API | Run flows, authenticate project executions | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Google Drive | Ingest files for indexation (`GDrive`) | Google OAuth/connector config (Drive scopes) |
| Google Sheets | Ingest sheet rows for indexation (`GSheet`) | Google OAuth/connector config (Sheets scopes) |
| Microsoft OneDrive Business | Ingest files for indexation (`Onedrive`) | Microsoft OAuth/connector config |
| Microsoft SharePoint Business | Ingest libraries/files for indexation (`Sharepoint`) | Microsoft OAuth/connector config |
| Slack | Receive messages and post replies (`Slack Assistant`) | Slack app credentials, event subscriptions |
| Microsoft Teams | Receive messages and post replies (`Teams Assistant`) | Teams bot/app registration credentials |
| AWS S3 | Ingest objects for indexation (`S3`) | AWS access keys/role, region, bucket permissions |
| Postgres | Ingest relational records (`Postgres`) | DB host/user/password (connector config) |
| Firecrawl | Crawl/scrape web content (`Crawling Indexation`, `Scraping Indexation`) | Firecrawl API key/config |
| Vector store / Index DB | Store embeddings and metadata; retrieve for RAG | Index connection/config (via `IndexNode`/`vectorNode`) |
| LLM / Embeddings provider | Generate answers and embeddings (`RAGNode`, `vectorizeNode`) | Model configuration in `model-configs` |

## Environment Setup
- `LAMATIC_API_URL` — Base URL for the Lamatic API endpoint; set to your Lamatic deployment URL; used by all flows.
- `LAMATIC_PROJECT_ID` — The Lamatic project identifier; obtain from Lamatic console; used by all flows.
- `LAMATIC_API_KEY` — API key for authenticating Lamatic API calls; provision from Lamatic console/secret manager; used by all flows.
- (Connector-specific secrets) — Source and channel connectors (Google/Microsoft/AWS/Slack/Teams/Postgres/Firecrawl) require their own credentials configured in Lamatic; these are not enumerated in `.env.example` but are required by the corresponding flows.

## Quickstart
1. Create a `.env` from `.env.example` and set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`.
2. In Lamatic, configure the connector credentials for your chosen `data-source` (e.g., Google Drive OAuth, S3 IAM role, Postgres connection) and for your chosen assistant channel (web chat widget, Slack app, or Teams bot).
3. Run the selected indexation flow once to populate the vector index.
4. Invoke the primary assistant flow.

   Example GraphQL call shape for API-triggered indexation flows (placeholders; adjust to your Lamatic GraphQL schema and node expectations):
   - Mutation (for `Scraping Indexation` / `Crawling Indexation`):
     - `query`: `mutation RunIndexation($input: RunFlowInput!) { runFlow(input: $input) { status result } }`
     - `variables`:
       - `input.flowName`: `"Scraping Indexation"` (or `"Crawling Indexation"`)
       - `input.payload.urls`: `["https://docs.example.com/page-1", "https://docs.example.com/page-2"]`
       - `input.payload.crawl`: `{ "enabled": true, "maxDepth": 2, "allowDomains": ["docs.example.com"] }`
5. For the web assistant, send a chat message via the chat widget UI; the flow expects a field equivalent to `chatMessage` (as referenced by `{{triggerNode_1.output.chatMessage}}`).
6. For Slack/Teams, message the configured bot/app; the flow expects message text at `text` (as referenced by `{{triggerNode_1.output.text}}`).

## Common Failure Modes
| Symptom | Likely Cause | Fix |
|---|---|---|
| Assistant replies are generic or say it cannot find the answer | Index is empty, stale, or retrieval returns no relevant chunks | Re-run the chosen indexation flow; verify vectors were written; confirm metadata and chunking; test retrieval in `RAGNode` configuration |
| Indexation flow fails with auth/permission errors | Connector credentials missing/expired or insufficient scopes | Re-authorize the connector (Google/Microsoft/AWS); confirm app scopes and resource permissions |
| `Scraping Indexation` / `Crawling Indexation` returns errors from `Firecrawl` | Invalid URL, blocked site, rate limit, or missing API key | Validate URLs; configure allowlists; add/rotate Firecrawl key; retry with lower concurrency/depth |
| Slack/Teams bot does not respond | Event subscription/webhook misconfigured, app not installed in correct workspace/tenant | Verify bot installation, permissions, event subscriptions, and that the trigger node receives events |
| Large documents produce partial coverage or missing sections | Extraction/chunking limits or unsupported file types | Confirm `extractFromFileNode` supports the file type; tune chunking settings; split documents upstream |
| Postgres ingestion indexes unexpected fields | Row serialization/chunking logic in `Row Chunking (codeNode)` not aligned to schema | Update row-to-text mapping and metadata transformation to include the correct columns and identifiers |

## Notes
- Project type is `bundle` (multi-flow, no UI), intended to be composed by selecting exactly one `data-source` and one `assistant` step.
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/assistants`.
- Prompting is channel-specific but consistent in intent: each assistant uses a system prompt identifying it as a helpful assistant trained on builder-defined data, and a user prompt that injects the channel’s message field (`chatMessage` for widget, `text` for Slack/Teams).