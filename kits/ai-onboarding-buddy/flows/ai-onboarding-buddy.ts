/*
 * # AI Onboarding Buddy
 * A multi-step generative employee enablement flow that analyzes a new hire's background and skill gaps against a job description, then constructs a tailored 30/60/90-day plan and a warm welcome message.
 *
 * ## Purpose
 * This flow is designed to solve the common corporate problem of generic, one-size-fits-all onboarding. By comparing what a candidate already knows (from their resume) with what their new role demands, it creates a targeted plan to bridge their specific gaps.
 *
 * The outcome is a structured API response containing strength/gap lists, a personalized three-phase milestone plan, and a manager welcome message.
 *
 * ## When To Use
 * - Use when an HR system or ATS wants to generate a personalized onboarding plan for a newly hired employee.
 * - Use when team leads want to identify technical gaps and assign relevant learning resources before day one.
 * - Use when you want to auto-generate warm, personalized welcome greetings from managers.
 *
 * ## When Not To Use
 * - Do not use as a generic resume parser (use the `resume-parser` kit instead).
 * - Do not use when no target job description is available.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `candidateProfile` | `string` | Yes | Resume or profile summary of the new hire. |
 * | `jobDescription` | `string` | Yes | Target job description. |
 * | `companyContext` | `string` | No | Optional details about team tools and product context. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `object` | JSON payload with skillGapAnalysis, onboardingPlan, and welcomeMessage. |
 */

// Flow: ai-onboarding-buddy

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "AI Onboarding Buddy",
  "description": "A generative employee-enablement agent that analyzes new hire skill gaps and constructs a tailored 30/60/90-day onboarding plan alongside manager welcome messages.",
  "tags": [
    "Generative",
    "Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/ai-onboarding-buddy",
  "author": {
    "name": "Anshuk Jirli",
    "email": "geeked.anshuk666@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "gap_analyzer_system": "@prompts/gap-analyzer_system.md",
    "plan_generator_system": "@prompts/plan-generator_system.md",
    "welcome_drafter_system": "@prompts/welcome-drafter_system.md"
  },
  "modelConfigs": {
    "gap_analyzer": "@model-configs/gap-analyzer.ts",
    "plan_generator": "@model-configs/plan-generator.ts",
    "welcome_drafter": "@model-configs/welcome-drafter.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "gapAnalyzer_2",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Skill Gap Analyzer",
        "tools": [],
        "prompts": [
          {
            "id": "gap-sys",
            "role": "system",
            "content": "@prompts/gap-analyzer_system.md"
          },
          {
            "id": "gap-usr",
            "role": "user",
            "content": "Candidate Profile:\n{{triggerNode_1.output.candidateProfile}}\n\nJob Description:\n{{triggerNode_1.output.jobDescription}}"
          }
        ],
        "generativeModelName": "@model-configs/gap-analyzer.ts"
      }
    }
  },
  {
    "id": "planGenerator_3",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Plan Generator",
        "tools": [],
        "prompts": [
          {
            "id": "plan-sys",
            "role": "system",
            "content": "@prompts/plan-generator_system.md"
          },
          {
            "id": "plan-usr",
            "role": "user",
            "content": "Gap Analysis:\n{{gapAnalyzer_2.output.generatedResponse}}\n\nCompany Context (optional):\n{{triggerNode_1.output.companyContext}}"
          }
        ],
        "generativeModelName": "@model-configs/plan-generator.ts"
      }
    }
  },
  {
    "id": "welcomeDrafter_4",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Welcome message drafter",
        "tools": [],
        "prompts": [
          {
            "id": "welcome-sys",
            "role": "system",
            "content": "@prompts/welcome-drafter_system.md"
          },
          {
            "id": "welcome-usr",
            "role": "user",
            "content": "Candidate Profile:\n{{triggerNode_1.output.candidateProfile}}\n\nOnboarding Plan:\n{{planGenerator_3.output.generatedResponse}}"
          }
        ],
        "generativeModelName": "@model-configs/welcome-drafter.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_5",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"skillGapAnalysis\": {{gapAnalyzer_2.output.generatedResponse}},\n  \"onboardingPlan\": {{planGenerator_3.output.generatedResponse}},\n  \"welcomeMessage\": \"{{welcomeDrafter_4.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-to-gap",
    "source": "triggerNode_1",
    "target": "gapAnalyzer_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "gap-to-plan",
    "source": "gapAnalyzer_2",
    "target": "planGenerator_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plan-to-welcome",
    "source": "planGenerator_3",
    "target": "welcomeDrafter_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "welcome-to-response",
    "source": "welcomeDrafter_4",
    "target": "graphqlResponseNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "trigger-response-edge",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_5",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
