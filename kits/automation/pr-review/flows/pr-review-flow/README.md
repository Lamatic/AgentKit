# PR Review Flow

## Flow inputs

| Field | Type | Description |
|---|---|---|
| `pr_url` | string | Full GitHub PR URL e.g. `https://github.com/owner/repo/pull/123` |

## Flow output

A JSON object with `summary`, `issues`, `suggestions`, and `verdict`. The frontend parses and renders it automatically.

---

## Build in Lamatic Studio

This flow has 4 nodes: **API Request → Code → API → Generate JSON → API Response**

---

### Node 1 — API Request (Trigger)

Set the input schema to:
```json
{ "pr_url": "string" }
```

---

### Node 2 — Code node

Click **Add Variable +** and add `pr_url` mapped to **API Request → pr_url**.

Code:
```js
const match = pr_url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
if (!match) return { error: "Invalid PR URL: " + pr_url };
return { owner: match[1], repo: match[2], pr_number: match[3] };
```

---

### Node 3 — API node (HTTP Request)

- **Method:** GET
- **Endpoint URL:** build using variable pills:
  ```
  https://api.github.com/repos/ + Code:owner + / + Code:repo + /pulls/ + Code:pr_number
  ```
- **Headers:**
  ```json
  {"Accept": "application/vnd.github.v3.diff", "User-Agent": "lamatic-pr-review"}
  ```

This returns the raw unified diff of the PR.

---

### Node 4 — Generate JSON node

**Model:** Any — tested with Gemini 2.5 Pro.

**System prompt:**
```
You are a senior software engineer doing a thorough code review. You will receive a unified diff from a GitHub pull request.

Return ONLY a valid JSON object with this exact shape:
{
  "summary": "3-4 sentences describing what this PR does, why it exists, and what files/systems it touches",
  "issues": [
    {
      "severity": "CRITICAL",
      "file": "src/auth.ts",
      "line": 42,
      "description": "specific description of the problem and WHY it is dangerous",
      "code": "exact snippet from the diff that is problematic (max 3 lines)",
      "fix": "exact replacement code, ready to copy-paste (max 5 lines)",
      "fix_explanation": "one sentence explaining what the fix does and why it solves the problem"
    }
  ],
  "suggestions": [
    {
      "type": "PERF",
      "file": "src/utils.ts",
      "line": 18,
      "description": "specific improvement and its impact",
      "code": "current code snippet (max 3 lines)",
      "fix": "improved version, ready to copy-paste (max 5 lines)",
      "fix_explanation": "one sentence explaining the improvement"
    }
  ],
  "verdict": "approve"
}

Rules:
- verdict must be one of: "approve", "needs_changes", "discuss"
- severity must be one of: "CRITICAL", "WARNING", "INFO"
- type must be one of: "PERF", "STYLE", "TEST", "DOCS"
- fix field MUST be valid, working, copy-pasteable code — not a description of what to do
- fix_explanation must be plain English, not code
- file and line must reference actual files and line numbers from the diff
- If no issues or suggestions exist, use empty arrays
- No markdown, no code fences, no explanation outside the JSON. Just the raw JSON object.
```

**User message:** `Here is the PR diff:` + variable pill **API → output.message**

**Output Schema (Zod):** Import from this JSON:
```json
{
  "summary": "This PR updates auth",
  "issues": [
    {
      "severity": "CRITICAL",
      "file": "auth.ts",
      "line": 42,
      "description": "Missing null check",
      "code": "const user = getUser(id)",
      "fix": "const user = getUser(id);\nif (!user) throw new Error('User not found');",
      "fix_explanation": "Guards against null dereference when user does not exist"
    }
  ],
  "suggestions": [
    {
      "type": "PERF",
      "file": "utils.ts",
      "line": 18,
      "description": "Use map instead of forEach",
      "code": "results.forEach(r => out.push(r.id))",
      "fix": "const ids = results.map(r => r.id);",
      "fix_explanation": "map is more idiomatic and avoids mutating an external array"
    }
  ],
  "verdict": "needs_changes"
}
```

---

### Node 5 — API Response

Set Output Variables → add field `result` of type `obj`, mapped to **Generate JSON → output**.

---

## Notes

- Works on all public GitHub repos with no authentication required.
- For private repos, add a `GITHUB_TOKEN` env variable and pass it as `Authorization: Bearer {{GITHUB_TOKEN}}` in the API node header.
- Large PRs (500+ line diffs) may hit LLM token limits — consider truncating the diff in the Code node if needed.
- Recommended models: Gemini 2.5 Pro, GPT-4o, Claude 3.5 Sonnet.