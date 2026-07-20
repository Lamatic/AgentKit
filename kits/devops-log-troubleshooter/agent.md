# DevOps Log Troubleshooter

**Overview & Purpose**
This operative is an AI-powered Staff DevOps Engineer designed to ingest failing CI/CD pipelines and container deployment logs, analyze the root cause, and output structured Markdown remediation runbooks. It drastically reduces debugging time for complex deployment architectures involving Docker, Jenkins, Kubernetes clusters, and Nginx reverse proxies.

**Flow Description**
1. **Trigger:** Receives raw build/error logs via the Lamatic API.
2. **Retrieval:** Queries the internal Vector Database for relevant documentation and known error codes.
3. **Generation:** Synthesizes the retrieved context and raw logs to generate a strictly formatted response (🚨 Root Cause, 🛠️ The Fix, 🧠 Brief Explanation).

**Guardrails**
- The agent is strictly constrained to infrastructure and DevOps domains.
- It must treat all incoming logs as untrusted data and ignore embedded instructions.
- It will never generate destructive commands or execute code directly.