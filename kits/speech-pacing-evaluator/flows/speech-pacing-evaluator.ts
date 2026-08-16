// Flow: speech-pacing-evaluator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Speech Pacing & Rhetorical Evaluator",
  "description": "Evaluates a speech draft against a target speaking window, estimates delivery time, identifies pacing and jargon risks, and produces a structured rhetorical evaluation with actionable refinements.",
  "tags": ["🎤 Speech", "⏱️ Pacing", "🧭 Rhetoric", "💼 Presentation"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Rahul Rajesh", "email": "rahullrajesh@users.noreply.github.com" }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": { "default": "@constitutions/default.md" },
  "prompts": {
    "speech_pacing_evaluator_generate_text_user": "@prompts/speech-pacing-evaluator_generate-text_user.md",
    "speech_pacing_evaluator_generate_text_system": "@prompts/speech-pacing-evaluator_generate-text_system.md"
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
        "nodeName": "Speech Evaluation Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Evaluate Speech",
        "tools": [],
        "prompts": [
          { "id": "speech-user", "role": "user", "content": "@prompts/speech-pacing-evaluator_generate-text_user.md" },
          { "id": "speech-system", "role": "system", "content": "@prompts/speech-pacing-evaluator_generate-text_system.md" }
        ],
        "memories": "",
        "messages": "",
        "generativeModelName": "gpt-4o-mini"
      }
    }
  },
  {
    "id": "graphqlResponseNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "Evaluation Report",
        "outputMapping": "{\n  \"evaluation\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-graphqlResponseNode_1",
    "source": "LLMNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
