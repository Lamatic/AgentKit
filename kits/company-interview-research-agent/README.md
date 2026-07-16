# Company Interview Research Agent

> A Lamatic AgentKit template that generates a **company-specific interview preparation brief** for a candidate, given only a company name and job title, no resume required.

[![AgentKit Challenge](https://img.shields.io/badge/agentkit-challenge-blue)](https://github.com/Lamatic/AgentKit/pulls?q=is:open+is:pr+label:agentkit-challenge)
[![Kit Type](https://img.shields.io/badge/type-template-green)](https://github.com/Lamatic/AgentKit/tree/main/kits/company-interview-research-agent)
[![Flow Count](https://img.shields.io/badge/flows-1-orange)](https://github.com/Lamatic/AgentKit/tree/main/kits/company-interview-research-agent/flows)

---

## What This Kit Does

Most interview prep tools match your resume against a job description. This
kit does something different. Given just a company name and a job title, it:

1. **Performs live web research** on the target company, culture, values,
   and hiring practices, pulled fresh at request time, not from static
   training data.
2. **Classifies the likely interview format** for the role, technical or
   case-based versus behavioral or mixed, using a dedicated reasoning step
   before writing anything.
3. **Generates a structured interview brief** covering a company snapshot,
   the likely interview format with reasoning, 4-5 likely question themes,
   and 3 smart questions to ask the interviewer.

**All in a single API call. No resume needed. No setup beyond importing the flow.**

---
## Workflow

<img width="1447" height="874" alt="image" src="https://github.com/user-attachments/assets/516d59d9-71b2-47de-83af-60888417117b" />

## Quickstart

### Step 1: Import the Flow

1. Log in to your [Lamatic workspace](https://studio.lamatic.ai).
2. Navigate to **Flows -> Import Flow**.
3. Upload `flows/company-interview-research-agent.ts`.
4. Configure your Serper API key and Google Gemini credential under
   **Settings -> Connections**.

### Step 2: Retrieve the API Endpoint

After deploying your flow, open your Trigger Node (API Request) to copy
your GraphQL trigger endpoint URL and flow ID.

### Environment Variables

When invoking this kit outside Lamatic Studio, configure:

- `LAMATIC_GRAPHQL_ENDPOINT` - your deployed Trigger Node GraphQL URL.
- `LAMATIC_FLOW_ID` - the deployed flow's ID.
- `SERPER_API_KEY` - Serper credential configured in Lamatic **Settings -> Connections**.
- `GEMINI_API_KEY` - Google Gemini credential configured in Lamatic **Settings -> Connections**.

### Step 3: Call the API

```bash
curl -X POST "$LAMATIC_GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query ExecuteWorkflow($workflowId: String!, $company_name: String, $job_title: String) { executeWorkflow(workflowId: $workflowId, payload: { company_name: $company_name, job_title: $job_title }) { status result } }",
    "variables": {
      "workflowId": "'"$LAMATIC_FLOW_ID"'",
      "company_name": "PG&E",
      "job_title": "Data Analyst"
    }
  }'
```

---

## Folder Structure

```
kits/company-interview-research-agent/
├── flows/
│   └── company-interview-research-agent.ts   # The Lamatic flow code
├── prompts/                                  # Node system and user prompts
│   ├── company-interview-research-agent_agent-classifier-node-548_system_0.md
│   ├── company-interview-research-agent_agent-classifier-node-548_user_1.md
│   ├── company-interview-research-agent_llmnode-621_system_0.md
│   └── company-interview-research-agent_llmnode-621_user_1.md
├── model-configs/                            # Node model configuration files
│   ├── company-interview-research-agent_agent-classifier-node-548_generative-model-name.ts
│   └── company-interview-research-agent_llmnode-621_generative-model-name.ts
├── constitutions/
│   └── default.md                            # Flow boundary rules
├── agent.md                                  # Agent identity and context
├── lamatic.config.ts                         # Kit metadata
├── README.md                                 # This guide
└── .gitignore
```
---

## Example Output

Input:
```json
{
  "company_name": "PG&E",
  "job_title": "Data Analyst"
}
```

Output:
```json
{
  "interview_brief": "Here's your interview preparation brief for a Data Analyst role at PG&E:\n\n### PG&E Data Analyst Interview Prep Brief\n\n**1. Company Snapshot**\nPG&E is a major utility company serving millions of customers in Northern and Central California...\n\n**2. Interview Format (Data Analyst - Classifier 1)**\nAs a technical professional role, expect a multi-stage process...\n\n**3. 4-5 Likely Question Themes**\n1. Technical Data Analysis & Tool Proficiency...\n\n**4. 3 Smart Questions to Ask the Interviewer**\n1. What are the most significant data challenges..."
}
```

---

## Testing

To test the deployed flow, run a POST request using `curl` with your payload:

```bash
curl -X POST "$LAMATIC_GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query ExecuteWorkflow($workflowId: String!, $company_name: String, $job_title: String) { executeWorkflow(workflowId: $workflowId, payload: { company_name: $company_name, job_title: $job_title }) { status result } }",
    "variables": {
      "workflowId": "'"$LAMATIC_FLOW_ID"'",
      "company_name": "Google",
      "job_title": "Product Manager"
    }
  }'
```

---

## Use Cases

- Interview preparation for job seekers
- Career coaching tools
- Recruiting platforms offering candidate prep resources
