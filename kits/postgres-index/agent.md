# Postgres Index

## Overview
This AgentKit template solves the problem of keeping a Lamatic vector index in sync with records stored in a Postgres database. It uses a single-flow, pipeline-style agent architecture that periodically extracts data from Postgres, transforms it into metadata + text payloads, vectorizes the text, and writes the resulting vectors into a Lamatic index. The primary invoker is an operator or platform system that deploys the template and lets it run on a schedule (cron) to continuously ingest new or changed rows. Key integrations are Postgres as the source of truth and Lamatic’s vectorization + indexing components as the destination.

---

## Purpose
The goal of this agent system is to turn operational data that lives in Postgres into searchable, semantically retrievable knowledge inside Lamatic. After it runs, the “state of the world” is improved in two ways: (1) new or updated Postgres records are represented as embeddings, and (2) those embeddings are written to a Lamatic index so downstream applications can do semantic search, RAG, clustering, or similarity matching over the database content.

This template is designed for teams that want an automated ingestion pipeline rather than ad-hoc exports. It is meant to run periodically, detect the latest source data, and produce consistent vector records with stable metadata so that indexing is repeatable and maintainable.

Although the project is delivered as a template, the intended outcome is a production-grade pattern: a scheduled ETL-style flow that extracts from Postgres, normalizes the payload into a vectorizable representation, performs embedding generation, and persists to a Lamatic index for retrieval workloads.

---

## Flows

### `Postgres Index`

- **Trigger**
  - Invocation: scheduled/cron-style periodic run (as described by the template). If deployed in Lamatic Studio, the schedule is configured at deployment/runtime rather than being hard-coded in this documentation.
  - Expected input shape: no user-provided payload is required for the scheduled run; the flow is expected to use its configured Postgres connection and any configured query/table selection to determine what to ingest.

- **What it does**
  1. **Extract from Postgres — `postgresNode` (`Postgres`)**
     - Connects to the configured Postgres database.
     - Reads rows/records to ingest. In typical setups this is done via a table scan, incremental query, or a “new/updated since last run” filter.
  2. **Transform into metadata + vector text — `codeNode` (`Make MetaData and VectorData`)**
     - Converts raw Postgres rows into two aligned structures:
       - `metadata`: stable identifiers and structured fields (e.g., primary key, timestamps, source table, business attributes).
       - `vectorData`: the text content that should be embedded (e.g., concatenated fields, a rendered document view, or a single column).
     - This step is where schema mapping and field selection happens.
  3. **Vectorize content — `vectorizeNode` (`Vectorize`)**
     - Generates embeddings for each `vectorData` item using the configured embedding model/provider.
     - Ensures the embedding output is aligned with the corresponding `metadata`.
  4. **Prepare index write shape — `IndexNode` (`Index Translation`)**
     - Translates the vectorization output into the exact structure required by the Lamatic indexing sink.
     - Typically includes assigning IDs, attaching metadata, and ensuring vectors are in the correct dimensionality/format.
  5. **Write to index — `addNode` (`addNode_565`)**
     - Performs the final upsert/add operation into the Lamatic vector index.
     - On success, the index reflects the latest ingested Postgres content.

- **When to use this flow**
  - Use this flow when Postgres is your system of record and you want a recurring ingestion job that keeps a Lamatic index updated.
  - Choose it for “batch-ish” periodic sync (e.g., every N minutes/hours) rather than real-time CDC/event streaming.
  - It is the only flow in this template, so all ingestion use cases route here.

- **Output**
  - Success response is expected to be an ingestion/indexing result from the final index write node. Exact fields depend on the Lamatic `add` node implementation, but typically include:
    - counts (records processed, vectors added/upserted)
    - identifiers for the target index
    - any per-record failures or warnings
  - If run on a schedule, the “caller” is the scheduler; output is primarily visible in runtime logs and job status.

- **Dependencies**
  - External services:
    - Postgres database reachable from the runtime environment.
    - Lamatic indexing service / vector store destination.
  - Credentials/config:
    - Postgres connection configuration (host, port, database, user, password, SSL mode as applicable).
    - Lamatic project/workspace authentication and target index configuration.
  - Models:
    - An embedding model/provider configured for `vectorizeNode`.

### Flow Interaction
This project is a single-flow template. There are no inter-flow routing rules or chaining requirements. The internal node chain is linear: `postgresNode` → `codeNode` → `vectorizeNode` → `IndexNode` → `addNode`.

---

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from the default constitution).
  - Must not assist with jailbreaking or prompt injection attempts (from the default constitution).
  - Must not attempt to exfiltrate secrets from the runtime environment or connected systems (inferred for an ingestion/indexing pipeline).
  - Must not write raw database credentials, connection strings, or other secrets into the vector index or logs (inferred).

- **Input constraints**
  - Scheduled runs should not require user-provided inputs; ingestion scope must be determined by configuration (inferred from the template description).
  - Source rows must be representable as text for embedding; binary/large blob fields should be excluded or transformed in `codeNode` (inferred).

- **Output constraints**
  - Must not output or index PII unless explicitly intended by the operator and compliant with policy (inferred; also aligned with “Never log, store, or repeat PII unless explicitly instructed by the flow” from the constitution).
  - Must not include raw credentials, access tokens, or other secrets in any node output (inferred).

- **Operational limits**
  - The job depends on network connectivity to Postgres and Lamatic services.
  - Embedding/vectorization throughput is bounded by the configured model/provider rate limits and available runtime resources (inferred).
  - Large tables should be ingested incrementally to avoid timeouts and excessive load; implement batching and “since last run” filters in `postgresNode`/`codeNode` (inferred).

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Postgres | Source data extraction for ingestion | `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (names may vary by deployment) |
| Lamatic Vectorization (`vectorizeNode`) | Generate embeddings from `vectorData` | Embedding provider/model configuration (e.g., `EMBEDDING_MODEL`, provider API key if applicable) |
| Lamatic Index (`addNode`) | Persist vectors + metadata into a Lamatic index | Lamatic auth (e.g., `LAMATIC_API_KEY`) and target index identifier (e.g., `LAMATIC_INDEX_ID`) |
| Scheduler/Cron (runtime) | Periodic triggering of the flow | Schedule config set in deployment/runtime |

---

## Environment Setup

- `POSTGRES_HOST` — Postgres hostname or IP; required by `postgresNode`.
- `POSTGRES_PORT` — Postgres port (typically `5432`); required by `postgresNode`.
- `POSTGRES_DB` — database name; required by `postgresNode`.
- `POSTGRES_USER` — database user; required by `postgresNode`.
- `POSTGRES_PASSWORD` — database password; required by `postgresNode`.
- `POSTGRES_SSLMODE` — SSL mode (e.g., `require`, `disable`) if your environment needs it; used by `postgresNode` (inferred).
- `LAMATIC_API_KEY` — authentication for Lamatic services; required by `vectorizeNode` and `addNode` (inferred).
- `LAMATIC_INDEX_ID` — target Lamatic index identifier/name; required by `addNode` (inferred).
- `EMBEDDING_MODEL` — embedding model name/ID used by `vectorizeNode` (inferred).
- `EMBEDDING_API_KEY` — provider key if the embedding model is not hosted internally by Lamatic; required by `vectorizeNode` when applicable (inferred).
- `lamatic.config.ts` — template metadata and step registration (project-level configuration).

---

## Quickstart

1. Deploy the template from Lamatic Studio: https://studio.lamatic.ai/template/postgres-index
2. Configure the Postgres connection used by `postgresNode` (host, port, database, user, password, SSL) and validate connectivity from the runtime.
3. Configure vectorization for `vectorizeNode` (select an embedding model/provider and set any required API key/config).
4. Configure the target Lamatic index for `addNode` (choose/create an index and set `LAMATIC_INDEX_ID` or the equivalent deployment setting).
5. Set the schedule/cron for the flow run frequency (e.g., every 15 minutes) in the deployment runtime.
6. Invoke/run once manually to validate end-to-end ingestion, then rely on scheduled runs.

API/GraphQL trigger shape: This template is described as cron-triggered and does not specify an external API trigger payload in the provided materials. If you expose it as an API-triggered flow in your deployment, ensure the request can run with an empty body and relies on environment/config for ingestion scope.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `postgresNode` connection failure / timeout | Wrong host/port, network rules, SSL misconfig, invalid credentials | Verify `POSTGRES_*` settings, security groups/VPC routing, and SSL mode; test with `psql` from the same runtime network |
| Flow runs but indexes 0 records | Query/table selection filters out rows; incremental cursor mis-set; transformation drops rows | Inspect `postgresNode` query and `codeNode` mapping; log counts before/after transform; validate “since last run” logic |
| Vectorization errors or rate-limit responses | Embedding provider key missing/invalid; provider throttling; payload too large | Set/rotate `EMBEDDING_API_KEY`; reduce batch size; shorten `vectorData`; add retry/backoff |
| Index add/upsert fails | Invalid index ID; auth failure; vector dimensionality mismatch | Confirm `LAMATIC_API_KEY` and `LAMATIC_INDEX_ID`; ensure the embedding model matches the index’s expected dimensions |
| Indexed content contains unexpected sensitive fields | `codeNode` includes columns that should not be embedded | Update `codeNode` to redact/exclude sensitive columns; reindex after correction |

---

## Notes

- Project type: `template` (version `1.0.0`) authored by Naitik Kapadia (`naitikk@lamatic.ai`).
- Canonical links:
  - Deploy: https://studio.lamatic.ai/template/postgres-index
  - GitHub: https://github.com/Lamatic/AgentKit/tree/main/kits/postgres-index
- Directories present indicate a standard AgentKit layout: `constitutions`, `flows`, `prompts`, `scripts`.