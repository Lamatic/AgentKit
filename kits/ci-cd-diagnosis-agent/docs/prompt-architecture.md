# Prompt Architecture Document: CI/CD Failure Diagnosis Agent

## 1. Prompt Philosophy

The architecture of the prompt system is grounded in the following core principles:

*   **Single Responsibility:** Each prompt is designed to accomplish exactly one task (e.g., extract evidence, classify error). This prevents cognitive overload in the LLM, reducing hallucinations and improving adherence to constraints.
*   **Structured Inputs & Outputs (JSON-first):** Every prompt receives input as JSON and is strictly instructed (via system instructions and API schema constraints) to output JSON. This ensures deterministic data handoffs between agents.
*   **Deterministic Behavior:** Through strict temperature control, top-p limiting, and highly constrained system instructions, the system aims for consistent outputs given identical log inputs.
*   **Evidence-First Reasoning:** Agents are forbidden from synthesizing conclusions without citing verbatim log lines extracted early in the pipeline.
*   **Low Hallucination via Context Minimization:** Agents only receive the exact context required for their specific task. The Fix Generator, for example, does not receive the raw 10,000-line log; it only receives the extracted evidence, classification, and RAG context.
*   **Self-Verification:** The architecture inherently includes adversarial agents (Fix Verifier, Risk Reviewer) whose sole prompt objective is to find flaws in the preceding agent's output.

---

## 2. Prompt Lifecycle

The lifecycle dictates how context expands and contracts as it flows through the DAG (Directed Acyclic Graph):

1.  **Context Expansion (Ingestion):** The raw log enters the system.
2.  **Context Contraction (Log Cleaner & Evidence Extractor):** The prompt heavily filters the log, discarding success steps, timestamps, and boilerplate. Only the `Evidence Array` survives. The raw log is **discarded** from all downstream prompts.
3.  **State Management (Classification & Planning):** The evidence is enriched with a `Category` and a `Retrieval Plan`. This state is appended to a running "Job Context" JSON object.
4.  **Context Injection (RAG):** The prompt context expands again as highly relevant Markdown chunks are injected.
5.  **Synthesis (RCA & Fix Generator):** The prompt merges Evidence + Knowledge into a Root Cause and Fix.
6.  **Adversarial Filtering (Verifier & Risk Reviewer):** These prompts consume the Fix and Root Cause, outputting boolean flags and critiques. If verification fails, the failure state propagates to the output.
7.  **Final Serialization (Output Formatter):** All intermediate JSON states are aggregated into the final API payload.

---

## 3. Agent Prompt Specifications

### 1. Evidence Extractor
*   **Purpose:** Isolate failure indicators from a cleaned log.
*   **Inputs:** Cleaned log string.
*   **Outputs:** JSON array of raw log snippets.
*   **Reasoning Style:** Extraction / Pattern Matching.
*   **Focus:** Words like "Error", "Exception", "Exit code", "Failed".
*   **Ignore:** Warnings, deprecation notices.
*   **Constraints:** Must output verbatim quotes. No summarization.

### 2. Error Classifier
*   **Purpose:** Map evidence to a predefined taxonomy.
*   **Inputs:** Extracted evidence JSON.
*   **Outputs:** JSON enum (Category, Sub-category).
*   **Reasoning Style:** Rule-based classification.
*   **Focus:** High-level domains (Network, IAM, Dependencies).
*   **Ignore:** Specific line numbers or fix generation.
*   **Constraints:** Must strictly output one of the provided enum values.

### 3. Planner
*   **Purpose:** Decide what knowledge to retrieve.
*   **Inputs:** Evidence JSON, Classification JSON.
*   **Outputs:** JSON array of search queries and metadata filters.
*   **Reasoning Style:** Strategic / Planning.
*   **Focus:** Identifying knowledge gaps required to solve the specific error category.
*   **Constraints:** Max 3 queries. Queries must be concise.

### 4. Root Cause Analyzer
*   **Purpose:** Deduce *why* the failure occurred.
*   **Inputs:** Evidence JSON, Knowledge Base Markdown.
*   **Outputs:** JSON (Root Cause Summary, Detailed Explanation, Evidence Cited).
*   **Reasoning Style:** Deductive / Evidence-based.
*   **Focus:** Linking the symptoms (evidence) to the mechanics (knowledge).
*   **Constraints:** Must explicitly quote the evidence used in the deduction.

### 5. Fix Generator
*   **Purpose:** Provide actionable remediation.
*   **Inputs:** Root Cause JSON, Knowledge Base Markdown.
*   **Outputs:** JSON array of code snippets/commands.
*   **Reasoning Style:** Generative / Prescriptive.
*   **Focus:** Producing syntactically correct code or configuration changes.
*   **Constraints:** No conversational filler. Only output code/YAML/Bash.

### 6. Fix Verifier
*   **Purpose:** Prove the fix addresses the root cause.
*   **Inputs:** Fix JSON, Root Cause JSON, Evidence JSON.
*   **Outputs:** JSON (Boolean `is_valid`, Critique string).
*   **Reasoning Style:** Adversarial / Verification.
*   **Focus:** Finding logical flaws or missing steps in the fix.
*   **Constraints:** Assume the fix is flawed until proven otherwise.

### 7. Risk Reviewer
*   **Purpose:** Identify security or stability risks.
*   **Inputs:** Fix JSON.
*   **Outputs:** JSON (Risk Level Enum, Warning string).
*   **Reasoning Style:** Risk Analysis.
*   **Focus:** Destructive commands (`rm -rf`), over-permissioning (`chmod 777`, `*` IAM actions), exposed secrets.
*   **Constraints:** Default to High risk if any destructive command is present.

### 8. Output Formatter
*   **Purpose:** Serialize final output.
*   **Inputs:** All previous JSON outputs.
*   **Outputs:** Final API JSON Schema.
*   **Reasoning Style:** Data Mapping.
*   **Focus:** Strict schema adherence.
*   **Constraints:** Zero hallucination. Pure formatting.

---

## 4. Prompt Structure (Standard Template)

Every prompt in the system must follow this standardized template structure (implemented in Lamatic AgentKit as the System Prompt):

```text
# ROLE
You are the [Agent Name], a specialized AI agent responsible for [Purpose].

# OBJECTIVE
Your sole objective is to [Specific Goal].

# CONTEXT
You operate at step [X] of a CI/CD diagnostic pipeline. 
The current state of the pipeline is:
<pipeline_state>
{{ INPUT_JSON }}
</pipeline_state>

# AVAILABLE INFORMATION
<knowledge_base>
{{ RAG_CONTEXT }}
</knowledge_base>

# CONSTRAINTS & GUARDRAILS
1. MUST DO: [Constraint 1]
2. MUST NEVER: [Forbidden Behavior 1]
3. MUST NEVER: [Forbidden Behavior 2]

# REASONING INSTRUCTIONS
1. Analyze the input data.
2. [Specific reasoning step 1]
3. [Specific reasoning step 2]

# OUTPUT REQUIREMENTS
You must output strictly valid JSON matching the following schema:
```json
{{ EXPECTED_SCHEMA }}
```
Do not output Markdown backticks wrapping the JSON. Do not output any conversational text.
```

---

## 5. Guardrails

Strict negative constraints (Guardrails) are critical for production stability.

*   **Evidence Extractor:** *Never invent missing logs.* If no error is found, output an empty array.
*   **Error Classifier:** *Never assume technologies not explicitly mentioned or heavily implied by the evidence.*
*   **Planner:** *Never retrieve unrelated documentation.* Stick strictly to the classification domain.
*   **Root Cause Analyzer:** *Never generate fixes.* Your job ends at diagnosis.
*   **Fix Generator:** *Never output destructive commands without explicit warning.* 
*   **Fix Verifier:** *Never blindly approve.* You must find the explicit link between the fix and the root cause.
*   **All Agents:** *Never contradict previous verified information.* *Never output invalid JSON.*

---

## 6. Grounding Strategy

To prevent hallucinations, the prompt architecture employs a strict grounding strategy:

1.  **Isolation:** The model is explicitly told via the `<pipeline_state>` and `<knowledge_base>` XML tags exactly what constitutes ground truth.
2.  **Citation Requirement:** The Root Cause Analyzer prompt includes a mandatory `evidence_cited` array in its JSON schema. If the LLM makes a claim, it must populate this array with a verbatim quote from the input log. If it cannot, the validation layer rejects the generation.
3.  **Knowledge Restriction:** The prompt states: *"If the answer cannot be deduced from the provided `<knowledge_base>`, you must state 'Insufficient context to diagnose' and halt."*

---

## 7. Reasoning Strategy

Different nodes require fundamentally different reasoning approaches tailored in their prompts:

*   **Extraction (Evidence Extractor):** *Pattern Matching.* "Scan the text for indicators of failure. Do not infer."
*   **Classification (Error Classifier):** *Rule-based.* "Map the extracted patterns to the provided taxonomy based on keyword weighting."
*   **Deduction (Root Cause Analyzer):** *Evidence-based.* "Given Symptom A and Knowledge B, deduce the mechanical failure point C."
*   **Adversarial (Verifier / Risk Reviewer):** *Red Teaming.* "Assume the proposed fix is malicious or incorrect. Attempt to prove how it fails to address the root cause."

*Trade-off / Recommendation:* Forcing LLMs into adversarial reasoning (Red Teaming) significantly reduces "yes-man" hallucinations where the model blindly approves bad fixes.

---

## 8. Confidence Strategy

Confidence must be calculable and grounded, not arbitrary. The Root Cause Analyzer prompt must calculate a `confidence_score` (0.0 to 1.0) based on specific criteria defined in the prompt:

*   **1.0 (High):** Exact error string match found in the log AND exact error string match found in the RAG Knowledge Base.
*   **0.7 (Medium):** Error string found, but RAG knowledge only provides generic domain context, requiring LLM deduction.
*   **0.3 (Low):** No explicit error string found (silent failure); deduction based entirely on context clues.
*   **0.0 (Zero):** Neither evidence nor knowledge provides insight.

*Scoring Methodology:* The prompt requires the LLM to output a `confidence_reasoning` string *before* outputting the float `confidence_score` (Chain-of-Thought), forcing it to justify the math.

---

## 9. Prompt Optimisation

For a deterministic diagnostic pipeline, prompt parameters should be strictly controlled at the AgentKit node level:

*   **Temperature:** `0.0` for all agents except the Fix Generator (which can be `0.2` to allow slight creative problem solving). Deterministic behavior is paramount for CI/CD debugging.
*   **Top-P:** `0.1` to force the model to select only the highest probability tokens.
*   **Max Output Length:** Capped tightly per agent (e.g., 500 tokens for Classifier, 2000 for RCA) to prevent runaway generations.
*   **Structured Output Mode:** Use Gemini's strict JSON mode (`response_mime_type: "application/json"`) combined with passing the JSON Schema directly to the API, eliminating the need for complex regex parsing.

---

## 10. Example Inputs and Outputs

### Agent: Error Classifier
**Example Input:**
```json
{
  "evidence": ["npm ERR! code ERESOLVE", "npm ERR! ERESOLVE unable to resolve dependency tree"]
}
```
**Expected Output:**
```json
{
  "category": "Dependency",
  "sub_category": "Peer Dependency Conflict",
  "reasoning": "The 'ERESOLVE' code specifically indicates a peer dependency resolution failure in NPM."
}
```
**Failure Example (Edge Case):** Model hallucinates a category not in the enum.
**Recovery Behavior:** Lamatic node validation catches schema mismatch, triggers a retry with an appended system prompt: *"Your previous output was invalid. You MUST choose from: [Enum List]"*.

---

## 11. Inter-Agent Contracts

The transitions between agents are strictly typed JSON contracts.

### Example Contract: Root Cause Analyzer → Fix Generator

**Input Schema (What Fix Generator receives):**
```json
{
  "type": "object",
  "required": ["root_cause_summary", "evidence", "knowledge_chunks"],
  "properties": {
    "root_cause_summary": { "type": "string" },
    "evidence": { "type": "array", "items": { "type": "string" } },
    "knowledge_chunks": { "type": "array", "items": { "type": "string" } }
  }
}
```

**Output Schema (What Fix Generator produces):**
```json
{
  "type": "object",
  "required": ["fixes"],
  "properties": {
    "fixes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "code_snippet": { "type": "string" },
          "language": { "type": "string" }
        }
      }
    }
  }
}
```
*Validation Rule:* The `fixes` array must not be empty unless `root_cause_summary` indicates the error is unfixable (e.g., cloud provider outage).

---

## 12. Failure Handling

Prompts must explicitly instruct agents on how to handle edge cases gracefully:

*   **Logs are incomplete/Evidence missing:** Extractor outputs `[]`. Classifier outputs `Category: Unknown`. Pipeline halts and asks the user for full logs.
*   **Knowledge retrieval returns nothing:** Root Cause Analyzer prompt triggers fallback: *"If `<knowledge_base>` is empty, rely on your internal training data but cap confidence at 0.5."*
*   **Multiple root causes exist:** RCA outputs an array of causes. Fix generator iterates over them.
*   **Contradictory evidence exists:** Risk Reviewer flags the diagnosis as `Low Confidence` and outputs the contradiction in the warning field.

---

## 13. Output Quality Standards

Acceptance criteria for a production-ready prompt:

1.  **JSON Validity:** 100% adherence to schema with no Markdown wrapping.
2.  **No Hallucinated Technologies:** A Node.js failure must never result in a suggested Python `pip` fix.
3.  **Actionable Fixes:** Fixes must be copy-pasteable code, not generic advice.
4.  **Evidence-Backed:** Every conclusion must have a direct line drawn to the raw log snippet.

---

## 14. Testing Strategy

Prompt evaluation must be automated before deploying prompt changes.

*   **Golden Datasets:** Maintain a repository of 100 historical CI/CD logs with known root causes and fixes.
*   **Classification Accuracy Test:** Run the Extractor + Classifier. Assert that `expected_category == actual_category` for 95%+ of the dataset.
*   **Root Cause Accuracy:** Use an "LLM-as-a-Judge" (a separate LLM call) to compare the generated RCA against the ground-truth RCA from the golden dataset.
*   **Robustness Test:** Introduce typos, whitespace, and truncated ends to the golden logs to ensure the Evidence Extractor doesn't fail catastrophically.

---

## 15. Prompt Versioning

Prompts are code and must be treated as such.

*   **Version Naming:** Semantic versioning (e.g., `v1.2.0`). Minor bumps for phrasing tweaks, major bumps for schema changes.
*   **A/B Testing:** Lamatic AgentKit should route 10% of traffic to `vNext` prompts. Collect user upvote/downvote metrics.
*   **Regression Testing:** A prompt change designed to fix a Terraform hallucination must be run against the Docker golden dataset to ensure it didn't break Docker diagnosis.

---

## 16. Future Improvements

*   **Dynamic Few-Shot Prompting:** Instead of static examples in the prompt, use a vector DB to retrieve 3 highly similar past diagnoses and inject them as few-shot examples to improve accuracy dynamically.
*   **Multi-Model Routing:** Use a fast, cheap model (Claude Haiku / Gemini Flash) for the Evidence Extractor, and dynamically route to a frontier model (Gemini Pro) only for the Root Cause Analyzer.
*   **Tool-Aware Prompting:** Upgrade the Fix Verifier to have access to a sandbox environment tool to actually run the bash script and observe the output, rather than relying purely on synthetic reasoning.

---

## 17. Developer Checklist: Writing the Final Prompts

Before implementing a Lamatic Node, developers must verify their prompt against this checklist:

- [ ] Does the prompt follow the Standard Template (Role, Objective, Context, Constraints)?
- [ ] Is the output schema strictly defined in JSON?
- [ ] Are negative constraints (MUST NEVER) explicitly listed?
- [ ] Is the prompt devoid of multiple responsibilities?
- [ ] Does it enforce evidence citation (where applicable)?
- [ ] Is temperature set to 0.0 (or minimal required)?
- [ ] Have you tested the prompt against at least one Success log and one Edge-case log?
- [ ] Is fallback behavior defined for missing input data?
