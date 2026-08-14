/*
 * # ADR Copilot - Architecture Decision Record Flow
 * An automated engineering intelligence flow that transforms raw system design proposals, technical notes, and architectural RFCs into standardized MADR 3.0 records.
 *
 * ## Purpose
 * This flow synthesizes complex technical design decisions, trade-offs, constraints, and operational impacts into a structured Architecture Decision Record (ADR).
 * It evaluates multiple technical alternatives, formats pros/cons matrices, extracts decision drivers, generates Mermaid.js architecture diagrams, and outputs a complete MADR markdown document.
 *
 * ## When To Use
 * - When an engineering team needs to formalize an architectural choice (e.g. database selection, messaging queue vs RPC, event-driven architecture).
 * - When drafting an RFC or technical proposal that requires standardized documentation.
 * - When analyzing system design trade-offs and risks before major infrastructure changes.
 *
 * ## When Not To Use
 * - For non-technical or general prose summarization tasks.
 * - For real-time infrastructure deployment or live code execution.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `instructions` | `string` | Yes | The technical proposal, design notes, or RFC text. |
 * | `constraints` | `string` | No | Operational constraints (e.g., latency budget, team stack, cost limit). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `object` | The finalized MADR decision object containing markdownContent, decisionDrivers, consideredOptions, and mermaidDiagram. |
 */

// Flow: adr-copilot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "ADR Copilot Flow",
  "description": "Automated Architecture Decision Record generator using MADR 3.0 standards",
  "tags": ["architecture", "engineering", "madr"],
  "testInput": {
    "instructions": "We are deciding between PostgreSQL + PGVector vs Dedicated Qdrant for vector search in our high-throughput AI search engine.",
    "constraints": "Sub-50ms query latency required, budget under $500/mo, team is proficient in SQL."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to analyze architecture proposals.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "system": "@prompts/adr-copilot_system.md",
    "user": "@prompts/adr-copilot_user.md"
  },
  "modelConfigs": {
    "llm": "@model-configs/adr-copilot_llm.ts"
  },
  "scripts": {
    "parse_json": "@scripts/adr-copilot_parse-json.ts",
    "finalise_output": "@scripts/adr-copilot_finalise-output.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 300,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "LLMNode_1",
    "data": {
      "label": "Analyze & Draft ADR",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "prompt_sys_1",
            "role": "system",
            "content": "@prompts/adr-copilot_system.md"
          },
          {
            "id": "prompt_usr_1",
            "role": "user",
            "content": "@prompts/adr-copilot_user.md"
          }
        ],
        "memories": "@model-configs/adr-copilot_llm.ts",
        "messages": "@model-configs/adr-copilot_llm.ts",
        "nodeName": "Architect LLM",
        "attachments": "@model-configs/adr-copilot_llm.ts",
        "credentials": "@model-configs/adr-copilot_llm.ts",
        "generativeModelName": "@model-configs/adr-copilot_llm.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 300,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "codeNode_1",
    "data": {
      "label": "Parse ADR JSON",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/adr-copilot_parse-json.ts",
        "nodeName": "Parse JSON"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 300,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_2",
    "data": {
      "label": "Finalise Output",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/adr-copilot_finalise-output.ts",
        "nodeName": "Finalise Output"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 300,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"answer\": \"{{codeNode_2.output}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 300,
      "y": 600
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_1-codeNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_1",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_1-codeNode_2",
    "type": "defaultEdge",
    "source": "codeNode_1",
    "target": "codeNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_2-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_2",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
