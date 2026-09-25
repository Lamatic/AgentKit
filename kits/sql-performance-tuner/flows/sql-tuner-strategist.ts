/*
 * # SQL Tuner Strategist
 * A Lamatic flow that receives bounded SQLite evidence and chooses one next
 * optimization experiment or a justified conclusion.
 *
 * The application remains authoritative for SQL safety, execution, equivalence,
 * benchmarking, duplicate detection, and winner selection. This flow only
 * diagnoses the supplied evidence and proposes the next distinct action.
 */

// Flow: sql-tuner-strategist

// -- Meta --
export const meta = {
  "name": "SQL Tuner Strategist",
  "description": "Chooses one safe, distinct SQLite tuning experiment from measured baseline and prior experiment evidence.",
  "tags": ["agentkit-challenge", "sql", "sqlite", "performance", "strategy"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/sql-performance-tuner",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/sql-performance-tuner/AGENT_CONTRACT.md",
  "deployUrl": "",
  "author": {
    "name": "Vivek Jadav",
    "email": "jadavvivek0501@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_100": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "instructor",
      "description": "Select the model that diagnoses measured SQLite evidence.",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "gemini",
          "credential_name": "",
          "params": { "temperature": 0.2 }
        }
      ],
      "typeOptions": { "loadOptionsMethod": "listModels" }
    }
  ],
  "InstructorLLMNode_101": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "instructor",
      "description": "Select the model that proposes the next bounded SQL tuning experiment.",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "gemini",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "sql_tuner_evidence_system": "@prompts/sql-tuner-strategist_instructor-llmnode-100_system_0.md",
    "sql_tuner_evidence_user": "@prompts/sql-tuner-strategist_instructor-llmnode-100_user_1.md",
    "sql_tuner_strategist_system": "@prompts/sql-tuner-strategist_instructor-llmnode-101_system_0.md",
    "sql_tuner_strategist_user": "@prompts/sql-tuner-strategist_instructor-llmnode-101_user_1.md"
  },
  "modelConfigs": {
    "sql_tuner_evidence_model": "@model-configs/sql-tuner-strategist_instructor-llmnode-100_generative-model-name.ts",
    "sql_tuner_strategist_model": "@model-configs/sql-tuner-strategist_instructor-llmnode-101_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"contractVersion\": \"string\",\n  \"originalQuery\": \"string\",\n  \"schema\": \"array\",\n  \"baseline\": \"object\",\n  \"experiments\": \"array\",\n  \"attemptedStrategies\": \"array\",\n  \"remainingExperiments\": \"number\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_100",
    "type": "dynamicNode",
    "position": {
      "x": 320,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Evidence Analyst",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"bottleneck\": { \"type\": \"string\", \"required\": true },\n    \"evidenceLessons\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"strategiesToAvoid\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"recommendedDirection\": { \"type\": \"string\", \"enum\": [\"index\", \"rewrite\", \"revise\", \"conclude\"], \"required\": true },\n    \"reasoning\": { \"type\": \"string\", \"required\": true }\n  }\n}",
        "prompts": [
          {
            "id": "sql-tuner-evidence-system",
            "role": "system",
            "content": "@prompts/sql-tuner-strategist_instructor-llmnode-100_system_0.md"
          },
          {
            "id": "sql-tuner-evidence-user",
            "role": "user",
            "content": "@prompts/sql-tuner-strategist_instructor-llmnode-100_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/sql-tuner-strategist_instructor-llmnode-100_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_101",
    "type": "dynamicNode",
    "position": {
      "x": 640,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Experiment Strategist",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"action\": { \"type\": \"string\", \"enum\": [\"create_index\", \"rewrite_query\", \"conclude\"], \"required\": true },\n    \"strategy\": { \"type\": \"string\", \"enum\": [\"covering_index\", \"filter_first_index\", \"grouping_first_index\", \"partial_index\", \"query_rewrite\", \"revise_failed_candidate\", \"conclude\"], \"required\": true },\n    \"hypothesis\": { \"type\": \"string\" },\n    \"expectedPlanChange\": { \"type\": \"string\" },\n    \"sql\": { \"type\": \"string\" },\n    \"indexSql\": { \"type\": \"string\" },\n    \"adaptationLearned\": { \"type\": \"string\" },\n    \"differsFromPrevious\": { \"type\": \"string\" },\n    \"respondsToExperiment\": { \"type\": \"number\" },\n    \"stopCondition\": { \"type\": \"string\" },\n    \"conclusionCode\": { \"type\": \"string\", \"enum\": [\"winner_found\", \"budget_exhausted\", \"no_safe_distinct_experiment\", \"insufficient_evidence\"] },\n    \"reasoning\": { \"type\": \"string\" },\n    \"evidenceUsedCsv\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          {
            "id": "sql-tuner-strategist-system",
            "role": "system",
            "content": "@prompts/sql-tuner-strategist_instructor-llmnode-101_system_0.md"
          },
          {
            "id": "sql-tuner-strategist-user",
            "role": "user",
            "content": "@prompts/sql-tuner-strategist_instructor-llmnode-101_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/sql-tuner-strategist_instructor-llmnode-101_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_101",
    "type": "dynamicNode",
    "position": {
      "x": 960,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"action\": \"{{InstructorLLMNode_101.output.action}}\",\n  \"strategy\": \"{{InstructorLLMNode_101.output.strategy}}\",\n  \"hypothesis\": \"{{InstructorLLMNode_101.output.hypothesis}}\",\n  \"expectedPlanChange\": \"{{InstructorLLMNode_101.output.expectedPlanChange}}\",\n  \"sql\": \"{{InstructorLLMNode_101.output.sql}}\",\n  \"indexSql\": \"{{InstructorLLMNode_101.output.indexSql}}\",\n  \"adaptation\": {\n    \"learnedFromEvidence\": \"{{InstructorLLMNode_101.output.adaptationLearned}}\",\n    \"differsFromPrevious\": \"{{InstructorLLMNode_101.output.differsFromPrevious}}\",\n    \"respondsToExperiment\": \"{{InstructorLLMNode_101.output.respondsToExperiment}}\"\n  },\n  \"stopCondition\": \"{{InstructorLLMNode_101.output.stopCondition}}\",\n  \"conclusionCode\": \"{{InstructorLLMNode_101.output.conclusionCode}}\",\n  \"reasoning\": \"{{InstructorLLMNode_101.output.reasoning}}\",\n  \"evidenceUsedCsv\": \"{{InstructorLLMNode_101.output.evidenceUsedCsv}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_100",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_100",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_100-InstructorLLMNode_101",
    "source": "InstructorLLMNode_100",
    "target": "InstructorLLMNode_101",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_101-graphqlResponseNode_101",
    "source": "InstructorLLMNode_101",
    "target": "graphqlResponseNode_101",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_101",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
