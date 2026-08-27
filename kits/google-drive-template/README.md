# Google Drive Template

## About This Template

This template automatically indexes files from a Google Drive folder into a vector database, keeping a RAG (retrieval-augmented generation) knowledge base continuously in sync with your Drive content. On a schedule (or on demand), it pulls files from a chosen folder, splits their content into overlapping chunks, generates embeddings, and upserts the vectors with metadata into your vector store — so downstream chatbots, search, or retrieval flows always have fresh, indexed content to query.

This flow includes **6 nodes** working together to sync, chunk, embed, and index Drive content.

## How It Works

1. **Google Drive Trigger** (`triggerNode_1`) — Watches a target Google Drive folder (matches all file types via the `**` glob), authenticated with a Google Drive OAuth 2 credential. Runs on a cron schedule (default: every 6 hours) using `full_refresh_append` sync mode to pick up new and updated files.
2. **Chunking** (`chunkNode_411`) — Splits each file's content into ~1000-character chunks with 100 characters of overlap, using a recursive character text splitter to preserve context across chunk boundaries.
3. **Code — Extract Text** (`codeNode_173`) — Pulls the plain text (`pageContent`) out of each chunk into a flat array of strings ready for embedding.
4. **Vectorize** (`vectorizeNode_839`) — Generates embeddings for each text chunk using Gemini's `gemini-embedding-001` model.
5. **Code — Build Payload** (`codeNode_138`) — Pairs each embedding vector with metadata (the chunk's text content and the source file's `file_id`) for storage.
6. **Vector DB — Index** (`vectorNode_951`) — Upserts the vectors and metadata into your configured vector database, keyed on `file_id`, overwriting existing entries so re-synced files don't create duplicates.

## Use Cases

- Building a RAG knowledge base directly from a shared Google Drive folder (docs, wikis, policies, SOPs, etc.)
- Keeping an internal knowledge base automatically in sync as files are added or updated in Drive
- Feeding a retrieval pipeline that powers a Q&A chatbot or search experience (pair with a chat/retrieval flow, e.g. [`knowledge-chatbot`](../knowledge-chatbot))

## Prerequisites

- A Lamatic.ai workspace
- A **Google Drive OAuth 2** credential connected in Lamatic, with read access to the target folder
- A **Gemini API key** credential connected in Lamatic (used for embeddings via `gemini-embedding-001`)
- A **vector database** connected in your Lamatic workspace to index into

## Setup

1. Deploy/import this template into your Lamatic workspace.
2. Configure the trigger node (`triggerNode_1`):
   - Select your Google Drive OAuth 2 credentials
   - Set the Drive **folder** you want to sync
   - Adjust the sync schedule if needed (default cron: every 6 hours)
3. Configure the Vectorize node's embedding model (defaults to Gemini `gemini-embedding-001`) and connect your Gemini credential.
4. Configure the Vector DB node — select the vector database you want documents indexed into.
5. Run a test sync and confirm files are being chunked, embedded, and indexed as expected.
6. Enable the flow to keep the index continuously updated on schedule.

## Files Included

- `flows/fr1.ts` — the flow graph (trigger → chunk → embed → index)
- `scripts/fr1_code-node-173_code.ts` — extracts chunk text into a flat array
- `scripts/fr1_code-node-138_code.ts` — builds the vector + metadata payload
- `model-configs/fr1_vectorize-node-839_embedding-model-name.ts` — embedding model configuration
- `constitutions/default.md` — guardrails applied to this flow
- `agent.md` — agent identity and capability doc

## Tags

google-drive, rag, vector-database, embeddings, indexing, knowledge-base
