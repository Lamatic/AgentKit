# 📡 API Endpoint Reference

This document provides technical documentation for all HTTP REST API endpoints provided by the **AgentKit CI/CD Diagnosis Agent**.

---

## 1. System Health Probe

### `GET /api/health`
Probes live system health, Node memory usage, GitHub REST API reachability, and Lamatic AI endpoint connectivity.

- **Authentication**: None (Public)
- **Rate Limit**: Unrestricted
- **Response Format**: `JSON`

#### Example Response (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2026-07-28T16:37:11.541Z",
  "uptimeSeconds": 71,
  "latencyMs": 1042,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "githubRestApi": "healthy",
    "lamaticAiEngine": "healthy",
    "memoryUsageMb": 83
  }
}
```

---

## 2. GitHub OAuth Authentication

### `GET /api/auth/github`
Initiates GitHub OAuth 2.0 PKCE flow. Generates state & code verifier, sets HTTP-only CSRF cookies, and redirects user to `https://github.com/login/oauth/authorize`.

- **Response**: `302 Found` (Redirects to GitHub)

### `GET /api/auth/github/callback`
Handles GitHub OAuth callback. Exchanges `code` for access token, validates `state`, fetches GitHub user profile, seals access token in AES-256-GCM cookie (`agentkit_session`), and redirects to `/`.

- **Query Parameters**: `code`, `state`
- **Response**: `302 Found` -> `/`

### `POST /api/auth/github/disconnect`
Clears session cookie and disconnects user's GitHub integration.

- **Response (200 OK)**: `{"success": true}`

---

## 3. GitHub Resource Discovery

### `GET /api/github/repos`
Fetches user's connected GitHub repositories with pagination, search query, and sorting.

- **Authentication**: Session Cookie (`agentkit_session`)
- **Query Parameters**: `page` (default 1), `per_page` (default 10), `q` (search query)
- **Response (200 OK)**:
```json
{
  "repos": [
    {
      "id": 123456,
      "name": "AgentKit",
      "full_name": "pawanchhimwal/AgentKit",
      "owner": { "login": "pawanchhimwal", "avatar_url": "..." },
      "private": false,
      "html_url": "https://github.com/pawanchhimwal/AgentKit",
      "default_branch": "main",
      "updated_at": "2026-07-28T16:00:00Z"
    }
  ],
  "page": 1,
  "hasMore": false
}
```

### `GET /api/github/runs`
Fetches GitHub Actions workflow runs for a repository.

- **Authentication**: Session Cookie
- **Query Parameters**: `owner`, `repo`, `page`
- **Response (200 OK)**: Array of `GitHubWorkflowRun` objects with status badges (`❌ Failed`, `✅ Success`).

---

## 4. AI Diagnosis Endpoints

### `POST /api/github/diagnose`
Automated GitHub Actions run log retrieval and Lamatic AI diagnosis execution proxy.

- **Authentication**: Session Cookie (`agentkit_session`)
- **Request Body**:
```json
{
  "owner": "pawanchhimwal",
  "repo": "AgentKit",
  "runId": 142
}
```
- **Execution Steps**:
  1. Fetches raw `.zip` archive from `GET /repos/{owner}/{repo}/actions/runs/{runId}/logs`.
  2. Unpacks `.zip` in RAM via `fflate` (zero disk footprint).
  3. Isolates failing step log, strips ANSI escape codes, and redacts AWS & GitHub secrets.
  4. Calls Lamatic SDK `executeFlow()` proxy.
  5. Validates against `DiagnosisSchema` and returns diagnosis JSON.

#### Response (200 OK)
```json
{
  "metadata": { "job_id": "run_142", "timestamp": "...", "ci_provider": "github" },
  "classification": {
    "category": "Infrastructure",
    "sub_category": "Memory Limit Exceeded",
    "confidence_score": 1.0
  },
  "analysis": {
    "root_cause_summary": "JavaScript Heap Out of Memory (OOM Exit Code 137)",
    "detailed_explanation": "...",
    "evidence_cited": ["FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory", "Killed"]
  },
  "resolution": {
    "is_fix_valid": true,
    "verification_notes": "...",
    "fixes": [
      { "description": "Set NODE_OPTIONS in Dockerfile", "language": "dockerfile", "code": "ENV NODE_OPTIONS=\"--max-old-space-size=4096\"" }
    ]
  },
  "risk": { "level": "Low", "warning": "Low operational risk." }
}
```
