/*
 * # Clinical Note Red-Flag Scanner
 * This flow accepts a clinical note as text input and returns a structured, severity-ranked
 * JSON report of documentation red flags as the canonical entrypoint for clinical documentation
 * compliance analysis.
 *
 * ## Purpose
 * This flow is responsible for scanning clinical notes (discharge summaries, progress notes,
 * procedure notes, consultation notes) against 10 red-flag categories: consent, drug interactions,
 * allergies, vitals, history, dosing, follow-up, assessment, identity markers, and regulatory
 * compliance. It solves the problem of silently incomplete clinical documentation that creates
 * patient-safety exposure and regulatory risk.
 *
 * The outcome is a structured JSON report containing a summary, flag count, and an array of
 * individually documented red flags — each with a severity level, explanation, location reference,
 * and specific remediation recommendation. This output is designed for clinician triage,
 * compliance dashboards, and CDI (Clinical Documentation Improvement) workflows.
 *
 * Within the broader agent context, this is an entry-point flow in a single-pass analysis chain.
 * It sits after invocation and before any hypothetical downstream enrichment or alerting layers.
 * The flow itself performs the complete analysis through the LLM node, then immediately returns
 * the result.
 *
 * ## When To Use
 * - Use when a caller needs an on-demand compliance scan of a clinical note provided as text.
 * - Use when the desired input is clinical narrative text rather than structured EHR data.
 * - Use when the caller needs machine-readable, severity-ranked output for dashboards or alerts.
 * - Use when a backend service, EHR integration, or compliance tool needs a synchronous
 *   API-style "note text → red flag report" transformation.
 *
 * ## When Not To Use
 * - Do not use as a medical diagnostic tool — it reviews documentation completeness only.
 * - Do not use for patient-facing interactions — it provides no medical advice.
 * - Do not use when the input is not clinical narrative (lab results, imaging, admin docs).
 * - Do not use for real-time clinical decision support during patient encounters.
 * - Do not use when credentials for the Gemini provider are unavailable.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `clinicalNote` | `string` | Yes | Full text of the clinical note to scan. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result` | `string` (JSON) | Structured red-flag report with summary, flagCount, and flags array. |
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly by an API request.
 *
 * ### Downstream Flows
 * - None defined in this kit. The flow returns its result directly to the caller.
 */

// Flow: clinical-note-red-flag-scanner

// -- Meta --
export const meta = {
  "name": "clinical-note-red-flag-scanner",
  "description": "Accepts a clinical note as text and returns a structured, severity-ranked JSON list of documentation red flags — missing consent, drug interactions, incomplete vitals, ambiguous dosing — for clinician and compliance triage.",
  "tags": ["healthcare", "compliance", "clinical-ai", "documentation", "safety"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/clinical-note-red-flag-scanner",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/clinical-note-red-flag-scanner",
  "author": {
    "name": "Vilsee Kumar Shandilya",
    "email": "viilseekshandilya@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_453": [
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
    "clinical_note_red_flag_scanner_llmnode_453_system_0": "@prompts/clinical-note-red-flag-scanner_llmnode-453_system_0.md",
    "clinical_note_red_flag_scanner_llmnode_453_user_1": "@prompts/clinical-note-red-flag-scanner_llmnode-453_user_1.md"
  },
  "modelConfigs": {
    "clinical_note_red_flag_scanner_llmnode_453_generative_model_name": "@model-configs/clinical-note-red-flag-scanner_llmnode-453_generative-model-name.ts"
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
        "advance_schema": "{\n  \"clinicalNote\": {\n    \"type\": \"string\",\n    \"minLength\": 10,\n    \"pattern\": \"^.*\\\\S.*$\"\n  }\n}"
      }
    }
  },
  {
    "id": "LLMNode_453",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/clinical-note-red-flag-scanner_llmnode-453_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/clinical-note-red-flag-scanner_llmnode-453_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Analyse Note",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/clinical-note-red-flag-scanner_llmnode-453_generative-model-name.ts"
      }
    }
  },
  {
    "id": "variablesNode_197",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "nodeName": "Variables",
        "mapping": "{\n  \"finalText\": {\n    \"type\": \"string\",\n    \"value\": \"{{LLMNode_453.output.generatedResponse}}\"\n  }\n}",
        "id": "variablesNode_197"
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{variablesNode_197.output.finalText}}\"\n}",
        "id": "responseNode_triggerNode_1"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_453",
    "source": "triggerNode_1",
    "target": "LLMNode_453",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_453-variablesNode_197",
    "source": "LLMNode_453",
    "target": "variablesNode_197",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "variablesNode_197-responseNode_triggerNode_1",
    "source": "variablesNode_197",
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
