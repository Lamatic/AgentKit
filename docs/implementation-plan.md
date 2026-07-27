# Phase 4 Implementation Blueprint: CI/CD Diagnosis Agent

## 1. Development Order

To minimize integration headaches, components must be built in an "outside-in" and sequential manner. You cannot test the Root Cause Analyzer effectively without realistic inputs from the Evidence Extractor and RAG.

**Optimal Implementation Order:**
1.  **Log Cleaner (Code Node) & Output Formatter (Code Node):** Build the "bookends" first. Establishes how data enters and exits the system deterministically.
2.  **Evidence Extractor (LLM Node):** The first intelligent step. Generates the foundation for all subsequent steps.
3.  **Error Classifier (LLM Node):** Relies purely on the Extractor.
4.  **Planner (LLM Node):** Relies on Classifier and Extractor.
5.  **Knowledge Retrieval (Knowledge Node):** Connects the Planner to the Vector DB.
6.  **Root Cause Analyzer (LLM Node):** Merges Extractor and RAG.
7.  **Fix Generator (LLM Node):** Depends on RCA.
8.  **Fix Verifier & Risk Reviewer (LLM Nodes):** Can be built in parallel. Depend on the Fix Generator.

*Testing Strategy:* Each node is built as an isolated function/endpoint first, tested with mock JSON, and only chained in AgentKit once it reliably transforms mock input into the expected output schema.

---

## 2. Agent Implementation Blueprint

### 1. Log Cleaner
*   **Purpose:** Sanitize raw logs.
*   **Inputs:** Raw Log (String, `.txt`, `.log`).
*   **Outputs:** Cleaned Log (String).
*   **Internal Logic:** Regex-based removal of ISO timestamps, empty lines, and specific success boilerplate (`Step completed in...`). Truncate at 10,000 lines.
*   **Validation Rules:** Output must be a non-empty string.
*   **Edge Cases:** Log is purely binary garbage or empty.
*   **Error Handling:** Return error "Invalid log format".
*   **Performance / Latency:** < 50ms. Code-only execution.
*   **Testing:** Input 5MB raw log -> Assert output is < 1MB and retains "ERROR" strings.

### 2. Evidence Extractor
*   **Purpose:** Find the needle in the haystack.
*   **Inputs:** Cleaned Log (String).
*   **Outputs:** `{"evidence": ["log line 1", "log line 2"]}`
*   **Internal Logic:** LLM prompt requesting exact string matches of failure symptoms.
*   **Validation Rules:** Must be a valid JSON array of strings.
*   **Edge Cases:** Silent failure (no explicit "error" word).
*   **Error Handling:** If output is empty, prompt user "No recognizable failure found."
*   **Performance / Latency:** 2-5 seconds (requires reading large input context).
*   **Testing:** Input known failed log -> Assert `evidence` contains the specific stack trace.

### 3. Error Classifier
*   **Purpose:** Taxonomy mapping.
*   **Inputs:** `{"evidence": [...]}`
*   **Outputs:** `{"category": "Enum", "confidence": Float}`
*   **Internal Logic:** LLM classification against a hardcoded list of domains.
*   **Validation Rules:** `category` must exist in `['Dependency', 'Network', 'Permissions', 'Infrastructure', 'Syntax', 'Other']`.
*   **Edge Cases:** Ambiguous error spanning multiple categories.
*   **Error Handling:** Default to `Other` with low confidence.
*   **Performance / Latency:** < 1 second.
*   **Testing:** Pass "npm ERESOLVE" -> Assert `category == Dependency`.

### 4. Planner
*   **Purpose:** Formulate RAG search queries.
*   **Inputs:** Evidence JSON, Classifier JSON.
*   **Outputs:** `{"queries": ["string"], "filters": ["string"]}`
*   **Internal Logic:** LLM prompt to identify missing knowledge.
*   **Validation Rules:** Max 3 queries.
*   **Edge Cases:** Very generic error (e.g., `exit code 1`).
*   **Error Handling:** Output generic query for the category.
*   **Performance / Latency:** < 1.5 seconds.
*   **Testing:** Pass Permissions evidence -> Assert queries contain "chmod", "auth", or "token".

### 5. Knowledge Retrieval
*   **Purpose:** Vector DB lookup.
*   **Inputs:** Planner JSON.
*   **Outputs:** `{"context": ["markdown chunks"]}`
*   **Internal Logic:** Hybrid vector search (Pinecone/Weaviate native integration).
*   **Validation Rules:** Returns array of strings.
*   **Edge Cases:** 0 results found.
*   **Error Handling:** Pass empty array downstream (RCA must handle lack of knowledge).
*   **Performance / Latency:** < 500ms.
*   **Testing:** Mock vector DB -> Assert Top-K chunks match query.

### 6. Root Cause Analyzer
*   **Purpose:** Deduce mechanics of failure.
*   **Inputs:** Evidence JSON, Knowledge JSON.
*   **Outputs:** `{"root_cause": "string", "cited_evidence": ["string"]}`
*   **Internal Logic:** LLM deductive reasoning combining symptom and theory.
*   **Validation Rules:** `cited_evidence` must be a subset of input `evidence`.
*   **Edge Cases:** Knowledge contradicts evidence.
*   **Error Handling:** Output low confidence score.
*   **Performance / Latency:** 3-6 seconds.
*   **Testing:** Input specific Docker OOM evidence + Docker memory docs -> Assert root cause explicitly mentions memory limits.

### 7. Fix Generator
*   **Purpose:** Prescribe code changes.
*   **Inputs:** Root Cause JSON, Knowledge JSON.
*   **Outputs:** `{"fixes": [{"type": "bash", "code": "..."}]}`
*   **Internal Logic:** LLM code generation.
*   **Validation Rules:** Must output valid array.
*   **Edge Cases:** Unfixable error (e.g., GitHub is down).
*   **Error Handling:** Output type "manual_intervention" with explanation.
*   **Performance / Latency:** 2-4 seconds.
*   **Testing:** Pass Dependency root cause -> Assert output contains `npm install` command.

### 8. Fix Verifier
*   **Purpose:** Adversarial validation.
*   **Inputs:** Fix JSON, Root Cause JSON.
*   **Outputs:** `{"is_valid": true/false, "reasoning": "..."}`
*   **Internal Logic:** LLM prompted to find logical holes.
*   **Validation Rules:** Must return boolean.
*   **Edge Cases:** Fix is partially correct.
*   **Error Handling:** Mark `is_valid: false`.
*   **Performance / Latency:** 1-2 seconds.
*   **Testing:** Pass known bad fix -> Assert `is_valid == false`.

### 9. Risk Reviewer
*   **Purpose:** Security guard.
*   **Inputs:** Fix JSON.
*   **Outputs:** `{"risk_level": "Low/Med/High", "warning": "..."}`
*   **Internal Logic:** LLM security analysis.
*   **Validation Rules:** Enum constraint.
*   **Edge Cases:** Ambiguous command (e.g., downloading script via `curl`).
*   **Error Handling:** Default to `Medium` risk.
*   **Performance / Latency:** 1-2 seconds.
*   **Testing:** Pass `chmod 777` -> Assert `risk_level == High`.

### 10. Output Formatter
*   **Purpose:** Final serialization.
*   **Inputs:** All previous JSON outputs.
*   **Outputs:** Final API JSON payload.
*   **Internal Logic:** Code-based JSON mapping/aggregation.
*   **Validation Rules:** Must validate against final OpenAPI schema.
*   **Edge Cases:** Missing optional fields from upstream.
*   **Error Handling:** Substitute with null/defaults.
*   **Performance / Latency:** < 10ms.
*   **Testing:** Input mocked graph state -> Assert valid final JSON string.

---

## 3. Node Design (Lamatic AgentKit Context)

*   **Code Nodes (Log Cleaner, Output Formatter):** Use Code Nodes because string manipulation (Regex) and JSON aggregation are deterministic tasks. Using an LLM for these is expensive, slow, and prone to hallucinations (e.g., LLMs modifying log line numbers or hallucinating JSON keys).
*   **LLM Nodes (Extractor, Classifier, Planner, RCA, Fix, Verifier, Risk):** Use LLM nodes. Each must be configured with a specific Prompt Template, strict JSON output schema enforcement (`response_format`), and temperature overrides (0.0).
*   **Knowledge Node (Retrieval):** Use AgentKit's native Knowledge/RAG node to abstract vector database connections, embedding generation, and chunk retrieval.

---

## 4. Input Validation

*   **Max Log Size:** Limit to 5MB at the API gateway. Larger files are rejected with a 413 Payload Too Large.
*   **File Types:** Only accept `.txt` or `.log` via MIME type validation.
*   **JSON Field Validation:** Between every LLM node, the AgentKit flow must validate the JSON schema. If an LLM outputs `{"cat": "Network"}` instead of `{"category": "Network"}`, the flow must halt or trigger an automatic LLM retry.
*   **Missing Evidence:** If Extractor returns `[]`, halt pipeline and return early: "No explicit failure detected in logs."

---

## 5. Output Validation

Every LLM Node must have an associated JSON Schema defined in Lamatic.
*   **Downstream Reaction:** If Node A produces invalid output after 1 retry, Node B does not execute. The system gracefully degrades, returning a 500 error specifying which agent failed (e.g., `Error: Root Cause Analyzer failed schema validation`).

---

## 6. Independent Testing & 7. Mock Data

To build independently, developers use Mock JSON files.

**Mock Data 1: NPM Dependency Conflict**
*   *Input to Classifier:* `{"evidence": ["npm ERR! ERESOLVE unable to resolve dependency tree", "npm ERR! peer react@\"^17.0.0\" from react-dom@17.0.2"]}`
*   *Expected Classifier Output:* `{"category": "Dependency", "confidence": 0.99}`

**Mock Data 2: Docker OOM**
*   *Input to RCA:* `{"evidence": ["Killed", "Exit code 137"], "knowledge": ["Exit code 137 in Docker means Out of Memory (OOM)..."]}`
*   *Expected RCA Output:* `{"root_cause": "The Docker container ran out of memory, triggered by the OS OOM killer."}`

Developers must write unit tests that pass these specific mock JSON strings into the LLM API and assert the parsed JSON response matches expectations.

---

## 8. Development Milestones

**Milestone 1: Ingestion & Egress**
*   *Objective:* Build API, Log Cleaner, and Output Formatter.
*   *Deliverables:* Code nodes working locally. You can upload a log and get a mocked JSON response.

**Milestone 2: Triage Engine**
*   *Objective:* Implement Extractor and Classifier.
*   *Deliverables:* Uploading a log accurately returns extracted lines and a Category enum.

**Milestone 3: Context Engine**
*   *Objective:* Planner and RAG integration.
*   *Deliverables:* System can query a local vector DB populated with 5 MVP markdown files based on classified errors.

**Milestone 4: Diagnostic Engine**
*   *Objective:* RCA and Fix Generator.
*   *Deliverables:* System generates actionable code fixes based on mock RAG context.

**Milestone 5: Validation & Integration**
*   *Objective:* Build Verifier/Risk Reviewer, connect all nodes in Lamatic AgentKit.
*   *Deliverables:* End-to-End working pipeline.

---

## 9. Integration Readiness Checklist

A node is ready to be linked into the main AgentKit DAG only when:
- [ ] Schema validation for inputs/outputs is strictly typed.
- [ ] Temperature is configured appropriately (0.0).
- [ ] It has passed at least 5 isolated tests using Mock Data.
- [ ] It handles empty or null inputs gracefully without crashing.
- [ ] Latency is within acceptable limits (< 5 seconds per LLM call).

---

## 10. Performance Expectations

*   **Total Expected Latency:** 15–25 seconds for a complete E2E run.
*   **Bottlenecks:** The Evidence Extractor must read the entire cleaned log. If the cleaned log is 100k tokens, this node will dominate latency.
*   **Optimization:** Run Fix Verifier and Risk Reviewer in *parallel* within the AgentKit DAG since they both independently consume the output of the Fix Generator. This saves 2-3 seconds.

---

## 11. Observability

*   **Tracing:** Enable detailed step tracing in AgentKit. Every node transition must log: `[Timestamp] Node Name -> Output Size in Bytes`.
*   **Debug Output:** Create a `?debug=true` flag on the API that returns not just the Output Formatter's JSON, but the raw JSON outputs of *every* agent in the DAG for UI introspection.
*   **Metrics:** Monitor LLM token usage per node to identify if the Log Cleaner is failing to compress effectively.

---

## 12. Common Implementation Mistakes

*   **Mixing Responsibilities:** Asking the Extractor to also suggest a fix. *Avoidance:* Keep prompts heavily constrained to one objective.
*   **Passing Too Much Context:** Passing the full 5MB raw log to the Root Cause Analyzer. *Avoidance:* Only pass the JSON `evidence` array.
*   **Skipping Output Enforcement:** Relying on "Please output JSON" in the prompt instead of using strict API features. *Avoidance:* Always use Structured Output mode / JSON Schema validation.

---

## 13. Future Compatibility

Because the system uses an orchestrated DAG with strictly typed JSON schemas:
*   **Adding GitHub PR Generation:** Simply add a new Code Node after the Output Formatter that takes the `fixes` JSON and triggers the GitHub API. No preceding nodes need to be touched.
*   **Slack Integration:** Build a new Slack API entrypoint that feeds text into the existing pipeline and formats the Output Formatter's JSON into Slack Block Kit.

---

## 14. Developer Checklist

**Log Cleaner (Code)**
- [ ] Regex strips timestamps.
- [ ] Regex strips progress bars.
- [ ] Retains max 10,000 lines.

**Evidence Extractor (LLM)**
- [ ] Receives string, outputs JSON array.
- [ ] Does not hallucinate non-existent log lines.
- [ ] Correctly handles empty inputs.

**Error Classifier (LLM)**
- [ ] Outputs only approved Enum values.
- [ ] Calculates a rational confidence score.

**Planner (LLM)**
- [ ] Extracts metadata filters based on Classifier.
- [ ] Outputs concise search queries.

**Root Cause Analyzer (LLM)**
- [ ] Explains mechanically *why* it failed.
- [ ] Cites exact evidence lines in a separate array.

**Fix Generator (LLM)**
- [ ] Code snippets are syntactically valid.
- [ ] Does not output conversational filler.

**Fix Verifier & Risk Reviewer (LLM)**
- [ ] Evaluates independently.
- [ ] Defaults to strict/safe evaluation.

---

## 15. Week-by-Week Execution Roadmap

**Week 1: Foundations & Triage**
*   **Day 1-2:** Scaffold API, define all JSON schemas (Zod/TypeScript), build Log Cleaner (Code Node).
*   **Day 3-4:** Write and test Prompts for Evidence Extractor and Error Classifier using isolated LLM API calls.
*   **Day 5:** Build Output Formatter (Code Node) to serialize mock JSON.

**Week 2: Knowledge & Diagnosis**
*   **Day 1-2:** Populate local Vector DB with the 5 MVP Markdown files. Build Knowledge Retrieval integration.
*   **Day 3-4:** Write and test Prompts for Planner, Root Cause Analyzer, and Fix Generator using Mock RAG Data.
*   **Day 5:** E2E testing of the Diagnostic Engine (Mock Log -> Mock Fix).

**Week 3: Validation & Orchestration**
*   **Day 1-2:** Write and test Prompts for Fix Verifier and Risk Reviewer.
*   **Day 3-4:** Assemble the complete DAG in Lamatic AgentKit. Wire all nodes together ensuring strict JSON data passing.
*   **Day 5:** System Testing, Latency optimization (parallelizing Verifier/Reviewer), and deployment to staging.
