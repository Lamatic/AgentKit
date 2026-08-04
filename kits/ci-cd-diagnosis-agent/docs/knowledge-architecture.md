# Knowledge Base Architecture: CI/CD Failure Diagnosis RAG

## 1. Folder Structure

To ensure the knowledge base remains manageable as it scales to hundreds of documents, we use a domain-driven folder hierarchy rather than a flat or purely alphabetical structure. 

```text
knowledge/
├── platforms/                  # CI/CD orchestration layers
│   ├── github-actions/
│   ├── gitlab-ci/
│   └── jenkins/
├── infrastructure/             # Compute and configuration management
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   └── cloud-providers/        # aws, azure, gcp subfolders
├── languages/                  # Ecosystem-specific package managers & builds
│   ├── node/                   # covers npm, yarn, pnpm
│   ├── python/                 # covers pip, poetry
│   ├── java/                   # covers maven, gradle
│   └── go/
├── security/                   # Auth, IAM, and secrets
│   ├── authentication/
│   ├── permissions/
│   └── ssl-tls/
├── networking/                 # Connectivity issues
│   ├── proxy/
│   └── dns/
└── version-control/            # Git-specific failures
    └── git/                    # covers LFS, submodules, branch protection
```

**Why this hierarchy?**
This nested structure perfectly maps to the Error Classifier's output taxonomy. It allows for strict metadata filtering during retrieval (e.g., if the error is categorized as `languages/node`, the RAG agent won't waste context windows on `infrastructure/terraform` documents). It also makes it easier for human contributors to find and update related technologies.

---

## 2. Knowledge Categories

The system must support the following major CI/CD failure categories, mapped directly to how developers experience them:

*   **Dependency Management:** Missing packages, peer dependency conflicts, registry 404s, lockfile out of sync.
*   **Authentication & Authorization:** 401/403 errors, expired tokens, missing secrets, invalid IAM role assumption, permission denied (`chmod` issues).
*   **Containerization (Docker):** Image pull rate limits, build failures, entrypoint crashes, architecture mismatches (e.g., ARM vs x86).
*   **Resource Exhaustion:** Out of Memory (OOM / Exit Code 137), disk full (No space left on device), CPU timeouts.
*   **Networking:** DNS resolution failures, connection refused, proxy timeouts, SSL certificate verification failures.
*   **Infrastructure as Code (Terraform):** State lock acquisition failures, invalid provider configurations, drift detection errors.
*   **Build & Compilation:** Syntax errors, missing compiler toolchains, heap out of memory during build.
*   **Pipeline Configuration:** YAML syntax errors, missing workflows, invalid cron expressions, unresolvable composite actions.
*   **Version Control (Git):** Shallow clone limitations, Git LFS quota exceeded, submodule initialization failures, branch protection bypass rejections.
*   **Caching & Artifacts:** Cache corruption, cache miss leading to timeouts, artifact upload/download failures.

---

## 3. Document Template

Every troubleshooting document must adhere to this Markdown template to optimize vector embedding and LLM comprehension.

```markdown
---
id: [unique-identifier-e.g.-docker-exit-137]
title: [Human readable title]
domain: [infrastructure | languages | platforms | security | networking]
technology: [e.g., docker, npm, github-actions]
severity: [high | medium | low]
keywords: [comma, separated, keywords, exit code 137, oom, killed]
last_updated: YYYY-MM-DD
---

## Problem Overview
Brief 1-2 sentence description of the failure.

## Typical Error Messages
```text
Exact, copy-pasted log output (e.g., "Killed", "Exit code 137", "FATAL ERROR: Ineffective mark-compacts near heap limit")
```

## Root Causes
1. **[Cause 1 Name]:** Description of why this happens mechanically.
2. **[Cause 2 Name]:** Description.

## Diagnosis Steps
- Run `command X` to verify memory limits.
- Check if file `Y` exists.

## Recommended Fixes

### Fix 1: [Name of primary fix]
**Description:** What this fix does.
**Implementation:**
```yaml | bash
# Code to apply
```

### Alternative Fixes
- **Workaround:** If Fix 1 is not possible due to X, do Y.

## Verification Steps
How the Fix Verifier agent or human can prove the issue is resolved.

## References
Links to official docs or GitHub issues.
```

---

## 4. Metadata Strategy

Metadata is stored in standard YAML frontmatter at the top of every document.

*   **`domain` & `technology`:** Used for **hard filtering**. If the Classifier agent detects a Docker issue, the retriever filters out all vectors where `technology != docker`. This eliminates cross-contamination.
*   **`keywords`:** Improves BM25/keyword search scoring for highly specific terms (e.g., `EACCES`, `SIGKILL`) that semantic embeddings sometimes misinterpret.
*   **`severity`:** Helps prioritize results or dictate the tone of the Risk Reviewer agent.
*   **`last_updated`:** Allows the system to prioritize newer fixes for rapidly evolving tools (like GitHub Actions runners).

**How it improves retrieval:** Metadata allows the system to execute a "pre-filter" before running the expensive vector similarity search. This dramatically reduces false positives and ensures the LLM receives context that is mechanically relevant to the tech stack.

---

## 5. Chunking Strategy

**Recommendation: Header-based Semantic Chunking**

*   **Strategy:** Instead of blindly chunking by character count (which can split code blocks or separate an error message from its fix), we parse the Markdown structure and chunk by `##` headers.
*   **Chunk Size:** Variable, but aiming for 256–750 tokens per chunk.
*   **Overlap:** 50 tokens (to maintain context across sequential steps if a section is too long and must be split).
*   **When to Split:** Blindly split only if a single section (e.g., `## Recommended Fixes`) exceeds 1,000 tokens.
*   **Trade-offs:** Header-based chunking requires a more complex ingestion script than simple fixed-length chunking. However, it guarantees that a chunk containing an error message also contains the immediate context around it, massively improving the Root Cause Analyzer's output quality.

---

## 6. Retrieval Strategy

The Retrieval architecture uses **Hybrid Search** (Dense Vector + Sparse BM25 Keyword) paired with **Metadata Pre-filtering**.

1.  **Planner Output to Retrieval:** The Planner agent outputs specific JSON: 
    `{"query": "npm install peer dependency conflict", "filters": {"technology": ["node", "npm"]}}`
2.  **Pre-filtering:** The Vector DB excludes all chunks where `technology` is not `node` or `npm`.
3.  **Hybrid Search:**
    *   *Semantic Search (Dense):* Finds conceptually similar documents (e.g., matches "package conflict" with "peer dependency").
    *   *Keyword Search (BM25):* Ensures exact matches for specific error codes (e.g., `ERR_PNPM_PEER_DEP_ISSUES`).
4.  **Ranking (Reciprocal Rank Fusion - RRF):** Merges the results of Semantic and Keyword searches to bubble up the best matches.
5.  **Top-K Selection:** Select the Top 3 to 5 chunks to inject into the Root Cause Analyzer's context window (keeping total retrieved context under 3,000 tokens).

---

## 7. Knowledge Writing Guidelines

*   **Avoid Unnecessary Theory:** Do not explain *what* Docker is. Explain *why* Docker just failed.
*   **Include Real Error Messages:** The `Typical Error Messages` section must contain raw, unedited text straight from terminal output. This is what the vector DB matches against the Evidence Extractor.
*   **Actionable Fixes:** Never write "Check your permissions." Write: "Run `chmod +x entrypoint.sh`."
*   **Format Strictly:** Always use fenced code blocks for logs and commands.
*   **Atomic Scope:** One document per specific failure type. Do not write a generic "Docker Issues" document; write "docker/exit-137-oom.md" and "docker/no-space-left.md".
*   **Consistency:** Use a CI linter (like `markdownlint` or a custom Python script) to enforce the YAML frontmatter schema before merging new knowledge into the repo.

---

## 8. Initial Knowledge Inventory (MVP)

To launch the MVP successfully, the following high-priority documents must be created to cover the ~80% of common CI/CD failures:

**Platforms (github-actions/)**
*   `yaml-syntax-errors.md` (Invalid workflow formatting)
*   `composite-action-not-found.md` (Missing or private action repos)
*   `cache-miss-timeout.md` (Slow builds due to cache configuration)

**Infrastructure (docker/)**
*   `exit-code-137.md` (OOM / memory limits)
*   `no-space-left-on-device.md` (Runner disk exhaustion)
*   `docker-hub-rate-limit.md` (Too many pull requests error)
*   `platform-architecture-mismatch.md` (exec format error / ARM vs x86)

**Languages (node/)**
*   `npm-peer-dependency-conflict.md` (ERESOLVE unable to resolve dependency tree)
*   `npm-ci-lockfile-mismatch.md` (package-lock.json not matching package.json)
*   `node-heap-out-of-memory.md` (JavaScript heap out of memory during Webpack/Vite build)

**Security & Permissions (security/)**
*   `permission-denied-sh.md` (Missing execution bit on bash scripts)
*   `github-token-permissions.md` (403 when trying to push tags or packages)

---

## 9. Retrieval Examples

**Example 1: Missing Execution Bit**
*   *Evidence Extractor:* `/entrypoint.sh: Permission denied`
*   *Planner Output:* `{"query": "bash script permission denied entrypoint", "filters": {"domain": ["security", "infrastructure"]}}`
*   *Retrieved Chunks:*
    *   **Chunk A (Top 1):** `security/permission-denied-sh.md` -> `## Recommended Fixes: Run git update-index --chmod=+x entrypoint.sh` (Selected due to exact keyword match on "Permission denied" and semantic match on bash scripts).

**Example 2: Node.js Memory Crash**
*   *Evidence Extractor:* `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`
*   *Planner Output:* `{"query": "JavaScript heap out of memory allocation failed", "filters": {"technology": ["node"]}}`
*   *Retrieved Chunks:*
    *   **Chunk A (Top 1):** `node/node-heap-out-of-memory.md` -> `## Recommended Fixes: export NODE_OPTIONS="--max-old-space-size=4096"` (Selected due to exact string match).

---

## 10. Knowledge Expansion Strategy

Adding new technologies (e.g., Rust, Kubernetes, Bazel) requires **zero architectural or code changes**.

1.  **Drop-in Expansion:** A developer writes a new Markdown file (e.g., `languages/rust/borrow-checker-ci.md`) using the standard template.
2.  **Auto-indexing:** A background AgentKit job (or GitHub Action) parses the new `.md` file, chunks it by headers, extracts the YAML frontmatter, generates embeddings, and upserts it to the Vector DB.
3.  **Immediate Availability:** The Error Classifier's underlying LLM is already capable of recognizing Rust errors. It classifies the evidence, the Planner queries it, and the RAG system instantly finds the new Rust documentation.

---

## 11. Quality Standards (Acceptance Criteria)

Before a knowledge document can be merged into the `knowledge/` directory, it must pass these criteria:
*   [ ] **Schema Valid:** YAML frontmatter contains all required fields (`id`, `title`, `domain`, `technology`, `keywords`).
*   [ ] **Real Evidence:** The `Typical Error Messages` section contains at least one real, raw log snippet.
*   [ ] **Actionable Fix:** The `Recommended Fixes` section contains runnable code (CLI commands, YAML blocks), not just prose.
*   [ ] **No Duplication:** The error discussed is not already covered by an existing document (verified by vector similarity check against existing docs).

---

## 12. Common Retrieval Mistakes & Mitigations

| Problem | Cause | Mitigation Strategy |
| :--- | :--- | :--- |
| **Retrieving Too Much Context** | Vector search returning highly similar but irrelevant docs (e.g., fetching 5 different Docker docs). | **Top-K Limiting & Score Thresholds:** Cap retrieval to 3 chunks. Discard chunks with a similarity score below 0.75. |
| **Missing Relevant Chunks** | Pure semantic search failing on cryptic error codes (e.g., `EACCES`). | **Hybrid Search:** BM25 keyword search ensures exact alphanumeric error codes are found even if semantic meaning is ambiguous. |
| **Conflicting Advice** | Two documents describing similar errors for different tech stacks (e.g., npm vs yarn). | **Strict Pre-filtering:** Force the Planner to output the `technology` filter, ensuring the DB only searches the `node/npm` namespace. |
| **Poor Metadata** | Authors forgetting to add relevant keywords. | **LLM Auto-tagging:** Use an AgentKit node during the ingestion phase to automatically generate and append `keywords` to the YAML frontmatter before vectorizing. |

---

## 13. Future Improvements

*   **Feedback Loops (Self-Healing):** When the system successfully diagnoses a novel error and the user confirms the generated fix worked, an Agent autonomously drafts a new Markdown document and submits a Pull Request to the `knowledge/` repo.
*   **Knowledge Analytics:** Track which Markdown files are retrieved most often. High-frequency retrievals indicate a systemic issue in the organization's CI/CD pipeline that human engineers should permanently fix at the infrastructure level.
*   **GraphRAG Integration:** Move beyond flat vector searches to Knowledge Graphs, mapping relationships between components (e.g., "Docker Build" depends on "GitHub Actions Runner Disk Space").

---

## 14. Prioritized MVP List (Write These First)

To unblock development and testing of the RAG pipeline immediately, author these 5 files first:

1.  `infrastructure/docker/exit-code-137.md` (Tests basic RAG and exact code matching)
2.  `languages/node/npm-peer-dependency-conflict.md` (Tests complex multi-line error extraction matching)
3.  `platforms/github-actions/yaml-syntax-errors.md` (Tests YAML code block fix generation)
4.  `security/permissions/permission-denied-sh.md` (Tests simple bash command fix generation)
5.  `infrastructure/docker/no-space-left-on-device.md` (Tests environment-level root cause analysis)
