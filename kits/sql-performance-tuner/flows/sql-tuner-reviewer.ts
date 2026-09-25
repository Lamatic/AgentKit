/*
 * # SQL Tuner Reviewer
 * A Lamatic flow that explains the deterministic outcome of the bounded SQLite
 * tuning run after the application has selected the winner.
 *
 * The reviewer cannot change verdicts, select a different candidate, or promote
 * an unproven optimization. It only writes the final operator-facing summary.
 */

// Flow: sql-tuner-reviewer

// -- Meta --
export const meta = {
  "name": "SQL Tuner Reviewer",
  "description": "Explains the final measured SQLite tuning outcome without changing the deterministic winner.",
  "tags": ["agentkit-challenge", "sql", "sqlite", "performance", "review"],
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
  "InstructorLLMNode_201": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "instructor",
      "description": "Select the model that synthesizes deterministic tuning evidence.",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "gemini",
          "credential_name": "",
          "params": { "temperature": 0.1 }
        }
      ],
      "typeOptions": { "loadOptionsMethod": "listModels" }
    }
  ],
  "InstructorLLMNode_202": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "instructor",
      "description": "Select the model that explains the measured SQL tuning outcome.",
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
    "sql_tuner_synthesizer_system": "@prompts/sql-tuner-reviewer_instructor-llmnode-201_system_0.md",
    "sql_tuner_synthesizer_user": "@prompts/sql-tuner-reviewer_instructor-llmnode-201_user_1.md",
    "sql_tuner_reviewer_system": "@prompts/sql-tuner-reviewer_instructor-llmnode-202_system_0.md",
    "sql_tuner_reviewer_user": "@prompts/sql-tuner-reviewer_instructor-llmnode-202_user_1.md"
  },
  "modelConfigs": {
    "sql_tuner_synthesizer_model": "@model-configs/sql-tuner-reviewer_instructor-llmnode-201_generative-model-name.ts",
    "sql_tuner_reviewer_model": "@model-configs/sql-tuner-reviewer_instructor-llmnode-202_generative-model-name.ts"
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
        "advance_schema": "{\n  \"originalQuery\": \"string\",\n  \"baseline\": \"object\",\n  \"experiments\": \"array\",\n  \"deterministicOutcome\": \"string\",\n  \"winningExperimentNumber\": \"number\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_201",
    "type": "dynamicNode",
    "position": {
      "x": 320,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Evidence Synthesizer",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"outcome\": { \"type\": \"string\", \"enum\": [\"improved\", \"no_proven_improvement\"], \"required\": true },\n    \"baselineSummary\": { \"type\": \"string\", \"required\": true },\n    \"experimentLessons\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"winningSql\": { \"type\": \"string\" },\n    \"limitationsText\": { \"type\": \"string\", \"required\": true },\n    \"citedExperimentsCsv\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          {
            "id": "sql-tuner-synthesizer-system",
            "role": "system",
            "content": "@prompts/sql-tuner-reviewer_instructor-llmnode-201_system_0.md"
          },
          {
            "id": "sql-tuner-synthesizer-user",
            "role": "user",
            "content": "@prompts/sql-tuner-reviewer_instructor-llmnode-201_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/sql-tuner-reviewer_instructor-llmnode-201_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_202",
    "type": "dynamicNode",
    "position": {
      "x": 640,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Final Reviewer",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"outcome\": { \"type\": \"string\", \"enum\": [\"improved\", \"no_proven_improvement\"], \"required\": true },\n    \"headline\": { \"type\": \"string\", \"required\": true },\n    \"evidenceSummary\": { \"type\": \"string\", \"required\": true },\n    \"recommendation\": { \"type\": \"string\", \"required\": true },\n    \"limitationsText\": { \"type\": \"string\", \"required\": true },\n    \"citedExperimentsCsv\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          {
            "id": "sql-tuner-reviewer-system",
            "role": "system",
            "content": "@prompts/sql-tuner-reviewer_instructor-llmnode-202_system_0.md"
          },
          {
            "id": "sql-tuner-reviewer-user",
            "role": "user",
            "content": "@prompts/sql-tuner-reviewer_instructor-llmnode-202_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/sql-tuner-reviewer_instructor-llmnode-202_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_202",
    "type": "dynamicNode",
    "position": {
      "x": 960,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"outcome\": \"{{InstructorLLMNode_202.output.outcome}}\",\n  \"headline\": \"{{InstructorLLMNode_202.output.headline}}\",\n  \"evidenceSummary\": \"{{InstructorLLMNode_202.output.evidenceSummary}}\",\n  \"recommendation\": \"{{InstructorLLMNode_202.output.recommendation}}\",\n  \"limitationsText\": \"{{InstructorLLMNode_202.output.limitationsText}}\",\n  \"citedExperimentsCsv\": \"{{InstructorLLMNode_202.output.citedExperimentsCsv}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_201",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_201",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_201-InstructorLLMNode_202",
    "source": "InstructorLLMNode_201",
    "target": "InstructorLLMNode_202",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_202-graphqlResponseNode_202",
    "source": "InstructorLLMNode_202",
    "target": "graphqlResponseNode_202",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_202",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
