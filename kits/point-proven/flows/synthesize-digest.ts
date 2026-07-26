/*
 * # Synthesize Digest
 * A flow that retrieves indexed article chunks for a research query, groups them by source, and synthesizes a structured digest with per-article summaries, cross-source contradictions, consensus points, highlighted key terms, and traceable in-text citations.
 *
 * ## Purpose
 * This flow is responsible for turning a reading-list corpus into a citation-backed research digest. It accepts a natural-language `query` (and optional `max_articles`), searches the shared vector database, groups and dedupes hits by source URL, asks an LLM for a strict JSON synthesis, then post-processes the result to validate citations, convert `**bold**` highlights to `<mark>` HTML, and rebuild the ordered `sources` block.
 *
 * The outcome is a structured JSON object suitable for UIs, notebooks, or further automation: an executive brief with in-text `[n]` citations, article summaries, themes, contradictions, and consensus. That matters because multi-article research is easy to flatten incorrectly; this flow surfaces disagreements explicitly and keeps every claim tied to a numbered source.
 *
 * In the broader agent architecture, this flow sits on the consumption side of the reading-list pipeline. It depends on `Index Articles` having already populated the same Vector DB selection. Its role is retrieve-then-synthesize: search, group, generate, validate, respond.
 *
 * ## When To Use
 * - Use after at least one successful `Index Articles` run against the same Vector DB.
 * - Use when the caller needs a multi-source digest with citations and contradiction surfacing, not a single-article summary.
 * - Use for research questions across a curated reading list (for example, “AI regulation in 2025”).
 *
 * ## When Not To Use
 * - Do not use before indexing; empty or weak retrieval yields sparse digests.
 * - Do not use as a general chat widget; this flow is an API trigger returning structured JSON.
 * - Do not use when you only need keyword search without synthesis.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `query` | string | Yes | Research question used as the vector search query and echoed in the digest. |
 * | `max_articles` | number | No | Max distinct sources to include after ranking (default `5`). |
 *
 * Private node configuration:
 * - `vectorDB` / `embeddingModelName` on `searchNode_244` — must match `Index Articles`.
 * - Generative model via `@model-configs/synthesize-digest_llm-node.ts` on `LLMNode_812`.
 *
 * ## Outputs
 * Structured JSON: `query`, `executive_brief` (string bullets ending with `{ type: "sources", items: [...] }`), `article_summaries`, `cross_cutting_themes`, `cross_source_contradictions`, `consensus_points`, `warnings`.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `Index Articles` — required to populate the vector index (`prerequisiteSteps` in `lamatic.config.ts`).
 *
 * ### External Services
 * - Vector database + embedding model for `searchNode`.
 * - LLM provider for `LLMNode`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) exposes `query` and optional `max_articles`.
 * 2. `Vector Search` (`searchNode`) retrieves hits via `searchQuery: {{triggerNode_1.output.query}}`.
 * 3. `Group By Source` (`codeNode`) runs `@scripts/synthesize-digest_group-by-source.ts`.
 * 4. `Synthesize Digest` (`LLMNode`) uses system/user prompts and emits strict JSON.
 * 5. `Post Process` (`codeNode`) runs `@scripts/synthesize-digest_post-process.ts` (citation validation, `<mark>`, sources rebuild).
 * 6. `API Response` (`graphqlResponseNode`) returns the post-processed fields.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Empty `numbered_source_list` / sparse digest | Corpus empty or wrong Vector DB | Run Index Articles; align Vector DB |
 * | `warnings` with `invalid_citation_dropped` | LLM cited unknown `[n]` | Prefer lower temperature; re-run; check source list size |
 * | `llm_output_not_json` | Model returned prose/fences | Strengthen system prompt / lower temperature |
 *
 * ## Notes
 * - Highlights are markdown `**bold**` inside the LLM output and become `<mark>` in the API response.
 * - Invalid citations are dropped silently into `warnings` rather than failing the whole response.
 */

// Flow: synthesize-digest

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Synthesize Digest",
  "description": "Retrieve indexed articles for a query and synthesize a cited digest with summaries, contradictions, consensus, and highlighted key terms.",
  "tags": ["research", "analysis", "synthesis"],
  "testInput": {
    "query": "How do major actors propose regulating AI in 2025?",
    "max_articles": 4
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "ravijaanthony",
    "email": "ravijaanthony@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "searchNode_244": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Vector DB",
      "required": true,
      "isPrivate": true,
      "description": "Select the same vector database populated by Index Articles.",
      "defaultValue": ""
    },
    {
      "mode": "embedding",
      "name": "embeddingModelName",
      "type": "model",
      "label": "Embedding Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "embedder/text",
      "description": "Select the embedding model used for query-time retrieval (compatible with indexing).",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ],
  "LLMNode_812": [
    {
      "mode": "generative",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "text/text",
      "description": "Select the generative model used for digest synthesis.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "synthesize_digest_llm_node_system": "@prompts/synthesize-digest_llm-node_system.md",
    "synthesize_digest_llm_node_user": "@prompts/synthesize-digest_llm-node_user.md"
  },
  "modelConfigs": {
    "synthesize_digest_llm_node": "@model-configs/synthesize-digest_llm-node.ts"
  },
  "scripts": {
    "synthesize_digest_group_by_source": "@scripts/synthesize-digest_group-by-source.ts",
    "synthesize_digest_post_process": "@scripts/synthesize-digest_post-process.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
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
        "advance_schema": ""
      }
    }
  },
  {
    "id": "searchNode_244",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "modes": {},
      "values": {
        "nodeName": "Vector Search",
        "limit": 30,
        "filters": "[]",
        "certainty": "0.5",
        "searchQuery": "{{triggerNode_1.output.query}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_551",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Group By Source",
        "code": "@scripts/synthesize-digest_group-by-source.ts"
      }
    }
  },
  {
    "id": "LLMNode_812",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Synthesize Digest",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/synthesize-digest_llm-node_system.md"
          },
          {
            "id": "201de7d9-b31f-4065-bbae-3363983ce3bf",
            "role": "user",
            "content": "@prompts/synthesize-digest_llm-node_user.md"
          }
        ],
        "memories": "@model-configs/synthesize-digest_llm-node.ts",
        "messages": "@model-configs/synthesize-digest_llm-node.ts",
        "generativeModelName": "@model-configs/synthesize-digest_llm-node.ts"
      }
    }
  },
  {
    "id": "codeNode_919",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Post Process",
        "code": "@scripts/synthesize-digest_post-process.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_677",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"query\": \"{{codeNode_919.output.query}}\",\n  \"executive_brief\": \"{{codeNode_919.output.executive_brief}}\",\n  \"article_summaries\": \"{{codeNode_919.output.article_summaries}}\",\n  \"cross_cutting_themes\": \"{{codeNode_919.output.cross_cutting_themes}}\",\n  \"cross_source_contradictions\": \"{{codeNode_919.output.cross_source_contradictions}}\",\n  \"consensus_points\": \"{{codeNode_919.output.consensus_points}}\",\n  \"warnings\": \"{{codeNode_919.output.warnings}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-searchNode_244",
    "source": "triggerNode_1",
    "target": "searchNode_244",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_244-codeNode_551",
    "source": "searchNode_244",
    "target": "codeNode_551",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_551-LLMNode_812",
    "source": "codeNode_551",
    "target": "LLMNode_812",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_812-codeNode_919",
    "source": "LLMNode_812",
    "target": "codeNode_919",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_919-graphqlResponseNode_677",
    "source": "codeNode_919",
    "target": "graphqlResponseNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_677",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_677",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
