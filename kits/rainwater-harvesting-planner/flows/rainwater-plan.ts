/*
 * # Rainwater Plan
 * Turns a rooftop rainwater harvest that was already computed in code (from 5 years of real daily rainfall)
 * into a practical plan: system type, tank and recharge advice, components, installation steps,
 * maintenance schedule, indicative cost, water-quality guidance and local checks.
 *
 * ## Purpose
 * The numbers (harvest, demand, tank size, overflow) are deterministic and come from the kit's app
 * (`apps/lib/calc.ts`). This flow does the part an LLM is good at: explaining those numbers and turning
 * them into an actionable, safe plan in English or Hindi. The constitution forbids changing the numbers
 * or inventing subsidies, laws or brands.
 *
 * ## Inputs (API Request, all strings)
 * | Field | Description |
 * |---|---|
 * | `location` | Resolved place name, e.g. "Ludhiana, Punjab, India" |
 * | `roof_type` | Human-readable roof type |
 * | `household_size` | Number of people |
 * | `primary_use` | What the stored water is for |
 * | `budget_inr` | Budget in INR or "not specified" |
 * | `language` | "English" or "Hindi" |
 * | `rainfall` | JSON string: 5-year rainfall summary |
 * | `calculation` | JSON string: harvest, demand, recommended tank, reliability, overflow |
 *
 * ## Outputs (API Response)
 * `summary`, `system_type`, `tank_advice`, `recharge_advice`, `components[] {name, purpose}`,
 * `installation_steps[]`, `maintenance[] {task, frequency}`, `cost_estimate {low_inr, high_inr, notes}`,
 * `water_quality`, `warnings[]`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives the inputs above.
 * 2. `Generate JSON` (`InstructorLLMNode_333`) — structured-output LLM call using
 *    `@prompts/rainwater-plan_instructor-llmnode-333_system_0.md` and `@prompts/rainwater-plan_instructor-llmnode-333_user_1.md`, constrained by the JSON schema.
 * 3. `API Response` (`graphqlResponseNode`) — maps every schema field to the response.
 *
 * After the flow returns, the app runs `apps/lib/verify.ts` to check the written plan against the
 * computed numbers (tank size, recharge guidance, cost range) and warns the user if they disagree.
 */

// Flow: rainwater-plan

// -- Meta --
export const meta = {
  "name": "rainwater-plan",
  "description": "Turns a computed rooftop rainwater harvest (real 5-year rainfall, tank sizing, overflow) into a practical installation, maintenance, cost and safety plan.",
  "tags": [
    "sustainability",
    "water",
    "home",
    "planning"
  ],
  "testInput": {
    "location": "Ludhiana, Punjab, India",
    "roof_type": "RCC / concrete (flat)",
    "household_size": "4",
    "primary_use": "Toilet flushing & cleaning (55 L/person/day)",
    "budget_inr": "40000",
    "language": "English",
    "rainfall": "{\"years\": [2021, 2022, 2023, 2024, 2025], \"annualRainfallMm\": 730, \"monthlyRainfallMm\": [20, 25, 20, 10, 20, 80, 210, 200, 110, 15, 5, 15], \"rainyDaysPerYear\": 49, \"wettestMonth\": \"Jul\", \"driestMonths\": [\"Nov\"]}",
    "calculation": "{\"roofAreaM2\": 93, \"runoffCoefficient\": 0.8, \"annualHarvestL\": 45800, \"maxDailyHarvestL\": 3900, \"dailyDemandL\": 220, \"annualDemandL\": 80355, \"annualCoveragePct\": 57, \"recommendedTankL\": 7500, \"reliabilityPct\": 38, \"annualOverflowL\": 15300, \"rechargePit\": {\"needed\": true, \"designStormL\": 1600, \"excavationM3\": 4, \"pits\": 1, \"diameterM\": 1.6, \"depthM\": 2}}"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/rainwater-harvesting-planner",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aryan Sharma",
    "email": "aryansharma732005@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_333": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "rainwater_plan_instructor_llmnode_333_system_0": "@prompts/rainwater-plan_instructor-llmnode-333_system_0.md",
    "rainwater_plan_instructor_llmnode_333_user_1": "@prompts/rainwater-plan_instructor-llmnode-333_user_1.md"
  },
  "modelConfigs": {
    "rainwater_plan_instructor_llmnode_333_generative_model_name": "@model-configs/rainwater-plan_instructor-llmnode-333_generative-model-name.ts"
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
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"location\": \"string\",\n  \"roof_type\": \"string\",\n  \"household_size\": \"string\",\n  \"primary_use\": \"string\",\n  \"budget_inr\": \"string\",\n  \"language\": \"string\",\n  \"rainfall\": \"string\",\n  \"calculation\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_333",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"system_type\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"tank_advice\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"recharge_advice\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"components\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"purpose\": {\n            \"type\": \"string\",\n            \"required\": true\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"installation_steps\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"maintenance\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"task\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"frequency\": {\n            \"type\": \"string\",\n            \"required\": true\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"cost_estimate\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"low_inr\": {\n          \"type\": \"number\",\n          \"required\": true\n        },\n        \"high_inr\": {\n          \"type\": \"number\",\n          \"required\": true\n        },\n        \"notes\": {\n          \"type\": \"string\",\n          \"required\": true\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"water_quality\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"warnings\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/rainwater-plan_instructor-llmnode-333_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/rainwater-plan_instructor-llmnode-333_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/rainwater-plan_instructor-llmnode-333_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"summary\": \"{{InstructorLLMNode_333.output.summary}}\",\n  \"system_type\": \"{{InstructorLLMNode_333.output.system_type}}\",\n  \"tank_advice\": \"{{InstructorLLMNode_333.output.tank_advice}}\",\n  \"recharge_advice\": \"{{InstructorLLMNode_333.output.recharge_advice}}\",\n  \"components\": \"{{InstructorLLMNode_333.output.components}}\",\n  \"installation_steps\": \"{{InstructorLLMNode_333.output.installation_steps}}\",\n  \"maintenance\": \"{{InstructorLLMNode_333.output.maintenance}}\",\n  \"cost_estimate\": \"{{InstructorLLMNode_333.output.cost_estimate}}\",\n  \"water_quality\": \"{{InstructorLLMNode_333.output.water_quality}}\",\n  \"warnings\": \"{{InstructorLLMNode_333.output.warnings}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_333",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_333",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_333-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_333",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
