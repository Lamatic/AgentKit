/*
 * # investigate
 * The investigation flow for Incident Copilot. Takes a production alert and produces
 * a ranked set of evidence-grounded root-cause hypotheses, grounded in runbooks (RAG)
 * and recent repository activity (GitHub tool call), and made incident-aware through
 * memory so follow-up runs revise the ranking instead of starting over.
 *
 * ## Inputs (trigger advance_schema)
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `alertText`   | string  | Yes | The raw alert / symptom description. |
 * | `incidentId`  | string  | Yes | Stable ID; scopes memory so follow-ups revise prior hypotheses. |
 * | `repoUrl`     | string? | No  | GitHub repo of the affected service; enables the recent-changes check. |
 * | `githubToken` | string? | No  | Optional token for private repos / higher rate limits. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `hypotheses`      | array   | Ranked `{ rank, title, confidence, reasoning, supportingEvidence[], contradictingEvidence[], nextStep }`. |
 * | `summary`         | string  | One-line investigation summary. |
 * | `insufficientInfo`| boolean | True when the alert is too vague to diagnose responsibly. |
 *
 * ## Node walkthrough
 * 1. `API Request` (graphqlNode) — receives the alert payload.
 * 2. `Runbook_RAG` (RAGNode) — retrieves the most relevant runbook excerpts for the alert.
 * 3. `Parse_Repo` (codeNode) — turns the optional repoUrl into GitHub API params, or flags no-repo.
 * 4. `Fetch_Commits` (apiNode) — GET recent commits for the affected repo (skipped/degraded if no repo).
 * 5. `Shape_Changes` (codeNode) — compacts commits into an evidence summary; graceful on failure.
 * 6. `Retrieve_Prior` (memoryRetrieveNode) — loads prior hypotheses for this incidentId (empty on first run).
 * 7. `Diagnose` (InstructorLLMNode) — schema-enforced ranked hypotheses from alert + runbooks + changes + prior.
 * 8. `Remember` (memoryNode) — writes the new hypothesis set back under the incidentId.
 * 9. `API Response` — returns hypotheses, summary, insufficientInfo.
 *
 * The three evidence branches (RAG, changes, prior memory) run independently and fan in
 * at `Diagnose`, mirroring the parallel-fetch-then-synthesise pattern used across AgentKit.
 */

// Flow: investigate

// -- Meta --
export const meta = {
  "name": "investigate",
  "description": "Investigates a production alert: grounds ranked root-cause hypotheses in runbooks (RAG) and recent GitHub activity (tool call), with incident-scoped memory so follow-ups revise rather than restart.",
  "tags": ["🤖 Agentic", "🛠️ Devtools"],
  "testInput": {
    "alertText": "[PagerDuty] checkout-service p99 latency 1.4s (threshold 800ms) and 5xx error rate 3.1% for 8 minutes. orders-service also elevated. Started ~09:12 UTC. No paging from payments-service.",
    "incidentId": "INC-2043",
    "repoUrl": "",
    "githubToken": ""
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Tushar Anand", "email": "tusharanand797@gmail.com" }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_diagnose": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Model used to rank hypotheses. Use temperature 0 for repeatable triage.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": { "temperature": 0 }
        }
      ],
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "investigate_rag_system": "@prompts/investigate_rag_system.md",
    "investigate_diagnose_system": "@prompts/investigate_diagnose_system.md",
    "investigate_diagnose_user": "@prompts/investigate_diagnose_user.md"
  },
  "modelConfigs": {
    "investigate_rag": "@model-configs/investigate_rag.ts",
    "investigate_diagnose": "@model-configs/investigate_diagnose.ts"
  },
  "scripts": {
    "investigate_parse_repo": "@scripts/investigate_parse-repo.ts",
    "investigate_shape_changes": "@scripts/investigate_shape-changes.ts"
  },
  "memory": {
    "investigate_memory_add": "@memory/investigate_memory-add.ts",
    "investigate_memory_retrieve": "@memory/investigate_memory-retrieve.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"alertText\": \"string\",\n  \"incidentId\": \"string\",\n  \"repoUrl\": \"string?\",\n  \"githubToken\": \"string?\"\n}"
      }
    }
  },
  {
    "id": "RAGNode_runbooks",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "Runbook_RAG",
        "limit": "@model-configs/investigate_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "a1b2c3d4-0001-4a5b-8c7d-000000000001",
            "role": "system",
            "content": "@prompts/investigate_rag_system.md"
          }
        ],
        "memories": "@model-configs/investigate_rag.ts",
        "messages": "@model-configs/investigate_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/investigate_rag.ts",
        "queryField": "{{triggerNode_1.output.alertText}}",
        "embeddingModelName": "@model-configs/investigate_rag.ts",
        "generativeModelName": "@model-configs/investigate_rag.ts"
      }
    }
  },
  {
    "id": "codeNode_parse",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_parse",
        "nodeName": "Parse_Repo",
        "code": "@scripts/investigate_parse-repo.ts"
      }
    }
  },
  {
    "id": "apiNode_github",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_github",
        "url": "https://api.github.com/repos/{{codeNode_parse.output.owner}}/{{codeNode_parse.output.repo}}/commits?per_page=10",
        "body": "",
        "method": "GET",
        "headers": "{{codeNode_parse.output.headers}}",
        "retries": "0",
        "nodeName": "Fetch_Commits",
        "retry_delay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_changes",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_changes",
        "nodeName": "Shape_Changes",
        "code": "@scripts/investigate_shape-changes.ts"
      }
    }
  },
  {
    "id": "memoryRetrieveNode_prior",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "nodeName": "Retrieve_Prior",
        "limit": "@memory/investigate_memory-retrieve.ts",
        "filters": "@memory/investigate_memory-retrieve.ts",
        "searchQuery": "@memory/investigate_memory-retrieve.ts",
        "memoryCollection": "@memory/investigate_memory-retrieve.ts",
        "embeddingModelName": "@memory/investigate_memory-retrieve.ts",
        "generativeModelName": "@memory/investigate_memory-retrieve.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_diagnose",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_diagnose",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": { \"type\": \"string\" },\n    \"insufficientInfo\": { \"type\": \"boolean\" },\n    \"hypotheses\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"rank\": { \"type\": \"number\" },\n          \"title\": { \"type\": \"string\" },\n          \"confidence\": { \"type\": \"string\", \"enum\": [\"high\", \"medium\", \"low\"] },\n          \"reasoning\": { \"type\": \"string\" },\n          \"supportingEvidence\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n          \"contradictingEvidence\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n          \"nextStep\": { \"type\": \"string\" }\n        },\n        \"required\": [\"rank\", \"title\", \"confidence\", \"reasoning\", \"supportingEvidence\", \"contradictingEvidence\", \"nextStep\"]\n      }\n    }\n  },\n  \"required\": [\"summary\", \"insufficientInfo\", \"hypotheses\"]\n}",
        "prompts": [
          {
            "id": "a1b2c3d4-0002-4a5b-8c7d-000000000002",
            "role": "system",
            "content": "@prompts/investigate_diagnose_system.md"
          },
          {
            "id": "a1b2c3d4-0003-4a5b-8c7d-000000000003",
            "role": "user",
            "content": "@prompts/investigate_diagnose_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Diagnose",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/investigate_diagnose.ts"
      }
    }
  },
  {
    "id": "memoryNode_add",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "memoryNode",
      "values": {
        "nodeName": "Remember",
        "uniqueId": "@memory/investigate_memory-add.ts",
        "sessionId": "@memory/investigate_memory-add.ts",
        "memoryValue": "@memory/investigate_memory-add.ts",
        "memoryCollection": "@memory/investigate_memory-add.ts",
        "embeddingModelName": "@memory/investigate_memory-add.ts",
        "generativeModelName": "@memory/investigate_memory-add.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"hypotheses\": \"{{InstructorLLMNode_diagnose.output.hypotheses}}\",\n  \"summary\": \"{{InstructorLLMNode_diagnose.output.summary}}\",\n  \"insufficientInfo\": \"{{InstructorLLMNode_diagnose.output.insufficientInfo}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_runbooks",
    "source": "triggerNode_1",
    "target": "RAGNode_runbooks",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-codeNode_parse",
    "source": "triggerNode_1",
    "target": "codeNode_parse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-memoryRetrieveNode_prior",
    "source": "triggerNode_1",
    "target": "memoryRetrieveNode_prior",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_parse-apiNode_github",
    "source": "codeNode_parse",
    "target": "apiNode_github",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_github-codeNode_changes",
    "source": "apiNode_github",
    "target": "codeNode_changes",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_runbooks-InstructorLLMNode_diagnose",
    "source": "RAGNode_runbooks",
    "target": "InstructorLLMNode_diagnose",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_changes-InstructorLLMNode_diagnose",
    "source": "codeNode_changes",
    "target": "InstructorLLMNode_diagnose",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryRetrieveNode_prior-InstructorLLMNode_diagnose",
    "source": "memoryRetrieveNode_prior",
    "target": "InstructorLLMNode_diagnose",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_diagnose-memoryNode_add",
    "source": "InstructorLLMNode_diagnose",
    "target": "memoryNode_add",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryNode_add-responseNode_triggerNode_1",
    "source": "memoryNode_add",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
