/*
 * # 1. Claim Appeal Writer - Index Policy
 * Chunks and vectorises the policyholder's insurance policy document into the project's managed vector store so the appeal drafter can retrieve and cite the exact clauses that govern a denied claim.
 *
 * ## Purpose
 * An appeal is only persuasive when it quotes the policy the insurer itself wrote. This flow takes the plain text of a policy document (Evidence of Coverage, Summary Plan Description, certificate of insurance), splits it into overlapping chunks, embeds each chunk, and indexes it with metadata that scopes retrieval to a single `policyId` and lets every retrieved excerpt be cited by chunk number.
 *
 * ## When To Use
 * - Once per policy document, before calling `draft-appeal`.
 * - Re-run with the same `policyId` to overwrite a stale index (duplicate operation is `overwrite`).
 *
 * ## When Not To Use
 * - Do not call with empty `policyText`; there is nothing to index.
 * - Do not use for the denial letter — that is analysed, not indexed (see `analyze-denial`).
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `policyText` | `string` | Yes | Full plain text of the policy document. The app extracts this from an uploaded PDF. |
 * | `policyId` | `string` | Yes | Caller-generated identifier (e.g. a UUID). Used to scope retrieval in `draft-appeal`. |
 * | `policyTitle` | `string` | No | Human-readable name shown in citations. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `policyId` | `string` | Echo of the input identifier. |
 * | `chunks` | `number` | Number of chunks indexed. |
 * | `status` | `object` | Raw index-node result. |
 *
 * ## Node Walkthrough
 * 1. `API Request` — receives `policyText`, `policyId`, `policyTitle`.
 * 2. `Chunking` — recursive character splitter, 800 chars with 100 overlap, splitting on paragraph, line, and sentence boundaries so clause text stays intact.
 * 3. `Prepare Chunks` (code) — flattens chunk objects to a string array.
 * 4. `Vectorize` — embeds every chunk with the project's embedding model.
 * 5. `Transform Metadata` (code) — pairs vectors with `{ content, policyId, title, source, chunkIndex }`.
 * 6. `Index` — writes to the managed vector DB, primary key `source` (`<policyId>#chunk-<n>`), overwrite on duplicates.
 * 7. `API Response` — returns `policyId`, `chunks`, `status`.
 *
 * ## Environment Variables (used by the app)
 * - `CLAIM_APPEAL_INDEX_POLICY` — deployed flow ID
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`
 */

// Flow: index-policy

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Claim Appeal Writer - Index Policy",
  "description": "Chunk and vectorise an insurance policy document for clause-level retrieval.",
  "tags": [],
  "testInput": {
    "policyId": "demo-policy-001",
    "policyTitle": "Demo Health Plan \u2014 Evidence of Coverage",
    "policyText": "SECTION 4. MEDICAL NECESSITY. A service is medically necessary when it is consistent with generally accepted standards of medical practice and is clinically appropriate in type, frequency, extent, site and duration for the diagnosis or treatment of the member's condition."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "vectorizeNode_990": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "description": "Select the model to convert the texts into vector representations.",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "vectorNode_580": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "description": "Select the vector database where the vectors will be indexed."
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "index_policy_prepare_chunks": "@scripts/index-policy_prepare-chunks.ts",
    "index_policy_transform_metadata": "@scripts/index-policy_transform-metadata.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "trigger",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "trigger",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\"policyText\": \"string\", \"policyId\": \"string\", \"policyTitle\": \"string\"}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "chunkNode_832",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_832",
        "nodeName": "Chunking",
        "chunkField": "{{trigger.output.policyText}}",
        "numOfChars": 800,
        "overlapChars": 100,
        "separators": [
          "\n\n",
          "\n",
          ". ",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "codeNode_961",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_961",
        "code": "@scripts/index-policy_prepare-chunks.ts",
        "nodeName": "Prepare Chunks"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "vectorizeNode_990",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_990",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_961.output}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "codeNode_918",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_918",
        "code": "@scripts/index-policy_transform-metadata.ts",
        "nodeName": "Transform Metadata"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "vectorNode_580",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_580",
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": [
          "source"
        ],
        "vectorsField": "{{vectorizeNode_990.output.vectors}}",
        "metadataField": "{{codeNode_918.output}}",
        "duplicateOperation": "overwrite"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "responseNode",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"policyId\": \"{{trigger.output.policyId}}\",\n  \"chunks\": \"{{codeNode_961.output}}\",\n  \"status\": \"{{vectorNode_580.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 900
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-chunkNode_832",
    "type": "defaultEdge",
    "source": "trigger",
    "target": "chunkNode_832",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "chunkNode_832-codeNode_961",
    "type": "defaultEdge",
    "source": "chunkNode_832",
    "target": "codeNode_961",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_961-vectorizeNode_990",
    "type": "defaultEdge",
    "source": "codeNode_961",
    "target": "vectorizeNode_990",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_990-codeNode_918",
    "type": "defaultEdge",
    "source": "vectorizeNode_990",
    "target": "codeNode_918",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_918-vectorNode_580",
    "type": "defaultEdge",
    "source": "codeNode_918",
    "target": "vectorNode_580",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorNode_580-responseNode",
    "type": "defaultEdge",
    "source": "vectorNode_580",
    "target": "responseNode",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode",
    "type": "responseEdge",
    "source": "trigger",
    "target": "responseNode",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
