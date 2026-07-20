# DevOps Log Troubleshooter Template

## Description
This Lamatic flow template creates a RAG-powered agent that ingests raw server and pipeline error logs, cross-references them against your internal documentation, and instantly generates structured Markdown troubleshooting runbooks. It is highly effective for debugging complex orchestration failures across Kubernetes, Docker, Jenkins, and Nginx deployments.

## Setup Instructions
1. **Import the Template:** Load this template into your Lamatic Studio workspace.
2. **Configure Vector DB:** Ensure your Markdown documentation is properly chunked and ingested into the `SchemaLogsRaw` Vector Database.
3. **Deploy:** Deploy the flow to generate your unique API Webhook URL.

## Usage Example
Send a POST request to the API Response node with your raw deployment logs:

```json
{
  "build_logs": "nginx: [emerg] host not found in upstream \"backend\" in /etc/nginx/nginx.conf:24"
}