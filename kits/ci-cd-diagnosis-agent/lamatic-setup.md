# Lamatic Studio Setup Guide

To finish Step 3 (Workflow Configuration), you must build the 10-node DAG in Lamatic Studio. I cannot access the Lamatic web interface for you, but I have prepared all the prompts and JSON schemas you need to copy and paste into the visual nodes.

## 1. Log Cleaner (Code Node)
**Type:** Code
**Purpose:** Truncates logs and masks secrets.
**Code:**
```javascript
export default async function (params) {
  let log = params.logContent || "";
  // Keep only the last 10,000 characters to avoid token limits
  if (log.length > 10000) {
    log = log.slice(-10000);
  }
  // Basic secret masking
  log = log.replace(/(AKIA|A3T[A-Z0-9]|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, "[REDACTED_AWS_KEY]");
  log = log.replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_GITHUB_TOKEN]");
  return { cleanedLog: log };
}
```

## 2. Evidence Extractor (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
You are a CI/CD Diagnostic Expert. Extract the exact, verbatim lines from the provided log that indicate the failure.
Do not infer or hallucinate. Return only the extracted lines as a JSON array of strings.
<raw_log>
{{variables.cleanedLog}}
</raw_log>
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "evidence": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["evidence"]
}
```

## 3. Error Classifier (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
Classify the error based on the following extracted evidence.
Evidence: {{variables.evidence}}
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "enum": ["Dependency", "Infrastructure", "Network", "Permissions", "Configuration", "Unknown"] },
    "sub_category": { "type": "string" },
    "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["category", "confidence_score"]
}
```

## 4. Planner (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
Based on the error category ({{variables.category}}) and evidence ({{variables.evidence}}), generate 1 to 3 search queries to find the solution in the knowledge base.
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "queries": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["queries"]
}
```

## 5. Root Cause Analyzer (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
Analyze the root cause of the failure using the provided evidence and knowledge base documents.
Evidence: {{variables.evidence}}
Knowledge: {{variables.knowledge_retrieval_results}}
You MUST cite exact lines from the evidence.
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "root_cause_summary": { "type": "string" },
    "detailed_explanation": { "type": "string" },
    "evidence_cited": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["root_cause_summary", "detailed_explanation", "evidence_cited"]
}
```

## 6. Fix Generator (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
Generate an actionable fix for the root cause.
Root Cause: {{variables.root_cause_summary}}
Detailed Explanation: {{variables.detailed_explanation}}
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "fixes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "language": { "type": "string" },
          "code": { "type": "string" }
        },
        "required": ["description", "language", "code"]
      }
    }
  },
  "required": ["fixes"]
}
```

## 7. Fix Verifier (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
Act as an adversarial reviewer. Verify if the proposed fixes actually resolve the root cause without side effects.
Fixes: {{variables.fixes}}
Root Cause: {{variables.root_cause_summary}}
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "is_fix_valid": { "type": "boolean" },
    "verification_notes": { "type": "string" }
  },
  "required": ["is_fix_valid", "verification_notes"]
}
```

## 8. Risk Reviewer (LLM Node)
**Type:** LLM (Google Gemini)
**System Prompt:**
```text
Review the proposed fixes for security risks (e.g., rm -rf, wildcard permissions).
Fixes: {{variables.fixes}}
```
**JSON Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "level": { "type": "string", "enum": ["Low", "Medium", "High", "Unknown"] },
    "warning": { "type": "string" }
  },
  "required": ["level"]
}
```

## 9. Output Formatter (Code Node)
**Type:** Code
**Purpose:** Formats the final JSON response.
**Code:**
```javascript
export default async function (params) {
  return {
    metadata: {
      job_id: params.job_id || "unknown",
      timestamp: new Date().toISOString(),
      ci_provider: params.ciProvider || "unknown"
    },
    classification: params.classification || {},
    analysis: params.analysis || {},
    resolution: {
      is_fix_valid: params.verification.is_fix_valid,
      verification_notes: params.verification.verification_notes,
      fixes: params.fixes,
      security_warnings: params.risk.warning
    },
    risk: params.risk || { level: "Unknown" }
  };
}
```
