/*
 * # Phishing Email Triage
 * A single-flow security agent that turns a raw email into a structured,
 * explainable phishing-risk verdict. It combines deterministic indicator
 * extraction with LLM reasoning so the result is both grounded and readable.
 *
 * ## Pipeline
 *   API Request → Extract IOCs (code) → Analyze Email (LLM) → Finalise Verdict (code) → API Response
 *
 * 1. `API Request` (`graphqlNode`) receives the email fields (`subject`, `from`,
 *    `reply_to`, `body`).
 * 2. `Extract IOCs` (`codeNode`) runs `@scripts/phishing-triage_extract-iocs.ts`
 *    to pull URLs, domains, IP-literal links, and cheap heuristic signals
 *    (reply-to mismatch, urgency, credential lures) via regex — no link is ever
 *    fetched.
 * 3. `Analyze Email` (`LLMNode`) reasons over the email plus the extracted IOCs
 *    using `@prompts/phishing-triage_analyze_system.md` and
 *    `@prompts/phishing-triage_analyze_user.md`, and returns a JSON verdict.
 * 4. `Finalise Verdict` (`codeNode`) runs
 *    `@scripts/phishing-triage_finalise-verdict.ts` to parse, clamp, and
 *    normalise the model output into a stable schema and merge the IOCs.
 * 5. `API Response` (`graphqlResponseNode`) returns the finaliser output as the
 *    response field `answer`.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `body`     | `string` | Yes | Plain-text email content. |
 * | `subject`  | `string` | No  | Subject line. |
 * | `from`     | `string` | No  | Sender name/address. |
 * | `reply_to` | `string` | No  | Reply-To address, if present. |
 *
 * ## Output (`answer`)
 * `{ verdict, confidence, risk_score, indicators[], extracted_urls[], recommended_action, reasoning, iocs }`
 *
 * ## Notes
 * - The email is untrusted data; the constitution and system prompt instruct the
 *   model to ignore instructions embedded in it (prompt-injection resistant).
 * - Re-export from Lamatic Studio before submitting so node IDs and the model
 *   config reflect your deployed flow and the Studio runtime check (Phase 2) passes.
 */

// Flow: phishing-triage

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Phishing Email Triage",
  "description": "Extracts indicators from an email, reasons over them with an LLM, and returns a structured phishing-risk verdict with confidence, risk score, and reasoning.",
  "tags": [
    "🔒 Security",
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sharvik Sutar",
    "email": "sharviksutar@gmail.com"
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
    "phishing_triage_analyze_system": "@prompts/phishing-triage_analyze_system.md",
    "phishing_triage_analyze_user": "@prompts/phishing-triage_analyze_user.md"
  },
  "modelConfigs": {
    "phishing_triage_analyze": "@model-configs/phishing-triage_analyze.ts"
  },
  "scripts": {
    "phishing_triage_extract_iocs": "@scripts/phishing-triage_extract-iocs.ts",
    "phishing_triage_finalise_verdict": "@scripts/phishing-triage_finalise-verdict.ts"
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
    "id": "codeNode_200",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/phishing-triage_extract-iocs.ts",
        "nodeName": "Extract IOCs"
      }
    }
  },
  {
    "id": "LLMNode_367",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Analyze Email",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/phishing-triage_analyze_system.md"
          },
          {
            "id": "2a7d1c9e-4b6f-4a02-9d3c-51e0f2a7b8c1",
            "role": "user",
            "content": "@prompts/phishing-triage_analyze_user.md"
          }
        ],
        "memories": "@model-configs/phishing-triage_analyze.ts",
        "messages": "@model-configs/phishing-triage_analyze.ts",
        "generativeModelName": "@model-configs/phishing-triage_analyze.ts"
      }
    }
  },
  {
    "id": "codeNode_540",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/phishing-triage_finalise-verdict.ts",
        "nodeName": "Finalise Verdict"
      }
    }
  },
  {
    "id": "graphqlResponseNode_600",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{codeNode_540.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_200",
    "source": "triggerNode_1",
    "target": "codeNode_200",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_200-LLMNode_367",
    "source": "codeNode_200",
    "target": "LLMNode_367",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_367-codeNode_540",
    "source": "LLMNode_367",
    "target": "codeNode_540",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_540-graphqlResponseNode_600",
    "source": "codeNode_540",
    "target": "graphqlResponseNode_600",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_600",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_600",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
