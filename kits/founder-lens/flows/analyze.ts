// Flow: analyze

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Founder Lens - Analyze",
  "description": "Runs 10 parallel Exa.ai searches and synthesis to generate a structured Founder Brief.",
  "tags": [
    "🤖 Agentic",
    "🔍 Research",
    "📈 Analysis"
  ],
  "testInput": "{\"idea\":\"Uber for private tutors\",\"userId\":\"test-user-001\",\"sessionId\":\"test-session-001\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/founder-lens/flows/analyze",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/founder-lens#analyze-flow",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_decompose": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
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
  ],
  "LLMNode_contrarian": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
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
  ],
  "LLMNode_finalBrief": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
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
  ],
  "vectorizeNode_brief": [
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
  "IndexNode_brief": [
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
  ],
  "memoryNode_storeAnalysis": [
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
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "analyze_phase_0_idea_deconstruction_system": "@prompts/analyze_phase-0-idea-deconstruction_system.md",
    "analyze_phase_0_idea_deconstruction_user": "@prompts/analyze_phase-0-idea-deconstruction_user.md",
    "analyze_phase_7_the_contrarian_system": "@prompts/analyze_phase-7-the-contrarian_system.md",
    "analyze_phase_7_the_contrarian_user": "@prompts/analyze_phase-7-the-contrarian_user.md",
    "analyze_final_synthesis_founder_brief_system": "@prompts/analyze_final-synthesis-founder-brief_system.md",
    "analyze_final_synthesis_founder_brief_user": "@prompts/analyze_final-synthesis-founder-brief_user.md"
  },
  "scripts": {
    "analyze_get_current_date": "@scripts/analyze_get-current-date.ts",
    "analyze_parse_decomposition": "@scripts/analyze_parse-decomposition.ts",
    "analyze_consolidate_research": "@scripts/analyze_consolidate-research.ts",
    "analyze_brief_to_memory_facts": "@scripts/analyze_brief-to-memory-facts.ts",
    "analyze_pair_vectors_with_metadata": "@scripts/analyze_pair-vectors-with-metadata.ts"
  },
  "modelConfigs": {
    "analyze_phase_0_idea_deconstruction": "@model-configs/analyze_phase-0-idea-deconstruction.ts",
    "analyze_phase_7_the_contrarian": "@model-configs/analyze_phase-7-the-contrarian.ts",
    "analyze_final_synthesis_founder_brief": "@model-configs/analyze_final-synthesis-founder-brief.ts"
  },
  "memory": {
    "analyze_memory_add_store_analysis": "@memory/analyze_memory-add-store-analysis.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "schema": {
        "sampleOutput": "string"
      },
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"idea\": \"string\",\n  \"userId\": \"string\",\n  \"sessionId\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "codeNode_currentDate",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "year": "string",
        "prevYear": "string",
        "dateString": "string"
      },
      "values": {
        "id": "codeNode_currentDate",
        "code": "@scripts/analyze_get-current-date.ts",
        "nodeName": "Get Current Date"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2142.5,
      "y": 130
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "LLMNode_decompose",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "schema": {
        "_meta": "object",
        "images": "array",
        "tool_calls": "object",
        "generatedResponse": "string"
      },
      "values": {
        "id": "LLMNode_decompose",
        "tools": [],
        "prompts": [
          {
            "id": "decomp-sys-001",
            "role": "system",
            "content": "@prompts/analyze_phase-0-idea-deconstruction_system.md"
          },
          {
            "id": "decomp-user-001",
            "role": "user",
            "content": "@prompts/analyze_phase-0-idea-deconstruction_user.md"
          }
        ],
        "memories": "@model-configs/analyze_phase-0-idea-deconstruction.ts",
        "messages": "@model-configs/analyze_phase-0-idea-deconstruction.ts",
        "nodeName": "Phase 0 - Idea Deconstruction",
        "generativeModelName": "@model-configs/analyze_phase-0-idea-deconstruction.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 260
    },
    "selected": true,
    "draggable": false
  },
  {
    "id": "codeNode_parseDecomp",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "q0": "string",
        "q1": "string",
        "q2": "string",
        "q3": "string",
        "q4": "string",
        "q5": "string",
        "q6": "string",
        "q7": "string",
        "category": "string",
        "fullDecomp": "string",
        "assumptions": "string",
        "targetCustomer": "string",
        "adjacentMarkets": "string"
      },
      "values": {
        "id": "codeNode_parseDecomp",
        "code": "@scripts/analyze_parse-decomposition.ts",
        "nodeName": "Parse Decomposition"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 390
    },
    "draggable": false
  },
  {
    "id": "apiNode_vctrends",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_vctrends",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q1}}\",\"type\":\"deep\",\"num_results\":5,\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - VC Trends",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 520
    },
    "draggable": false
  },
  {
    "id": "apiNode_unfair",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_unfair",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q7}}\",\"type\":\"deep\",\"num_results\":5,\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Unfair Advantage",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 4050,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_twitter",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_twitter",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{triggerNode_1.output.idea}} complaints frustrating broken worst terrible switching\",\"type\":\"auto\",\"num_results\":10,\"includeDomains\":[\"twitter.com\",\"x.com\"],\"contents\":{\"text\":{\"max_characters\":2000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Twitter Customer Complaints",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2700,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_success",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_success",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q5}} how founder got first customers story\",\"type\":\"deep\",\"num_results\":5,\"includeDomains\":[\"indiehackers.com\",\"news.ycombinator.com\",\"techcrunch.com\",\"blog.ycombinator.com\"],\"contents\":{\"text\":{\"max_characters\":4000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Success DNA",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 3150,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_reviews",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_reviews",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{triggerNode_1.output.idea}} alternatives reviews complaints problems\",\"type\":\"auto\",\"num_results\":8,\"includeDomains\":[\"g2.com\",\"capterra.com\",\"producthunt.com\"],\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Reviews",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2250,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_market",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_market",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q0}}\",\"type\":\"deep\",\"num_results\":5,\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Market Size",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_dead",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_dead",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q3}}\",\"type\":\"deep\",\"num_results\":5,\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Dead Competitors",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 1350,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_customer",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_customer",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q4}}\",\"type\":\"auto\",\"num_results\":8,\"includeDomains\":[\"reddit.com\",\"g2.com\",\"capterra.com\",\"news.ycombinator.com\"],\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Customer Voice",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 1800,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "apiNode_competitors",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_competitors",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q2}}\",\"type\":\"deep\",\"num_results\":5,\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Competitors",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 900,
      "y": 520
    },
    "draggable": false
  },
  {
    "id": "apiNode_bizmodel",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "schema": {
        "output": "object"
      },
      "values": {
        "id": "apiNode_bizmodel",
        "url": "https://api.exa.ai/search",
        "body": "{\"query\":\"{{codeNode_parseDecomp.output.q6}}\",\"type\":\"deep\",\"num_results\":5,\"contents\":{\"text\":{\"max_characters\":3000}}}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-key\":\" \"}",
        "retries": "0",
        "nodeName": "Exa Search - Business Model",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 3600,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_consolidate",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "phase1_market": "string",
        "phase5_unfair": "string",
        "phase4_success": "string",
        "phase3_customer": "string",
        "phase6_bizmodel": "string",
        "phase2_competitive": "string"
      },
      "values": {
        "id": "codeNode_consolidate",
        "code": "@scripts/analyze_consolidate-research.ts",
        "nodeName": "Consolidate Research"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 650
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "LLMNode_contrarian",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "schema": {
        "_meta": "object",
        "images": "array",
        "tool_calls": "object",
        "generatedResponse": "string"
      },
      "values": {
        "id": "LLMNode_contrarian",
        "tools": [],
        "prompts": [
          {
            "id": "contr-sys-001",
            "role": "system",
            "content": "@prompts/analyze_phase-7-the-contrarian_system.md"
          },
          {
            "id": "contr-user-001",
            "role": "user",
            "content": "@prompts/analyze_phase-7-the-contrarian_user.md"
          }
        ],
        "memories": "@model-configs/analyze_phase-7-the-contrarian.ts",
        "messages": "@model-configs/analyze_phase-7-the-contrarian.ts",
        "nodeName": "Phase 7 - The Contrarian",
        "generativeModelName": "@model-configs/analyze_phase-7-the-contrarian.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2142.5,
      "y": 780
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "LLMNode_finalBrief",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "schema": {
        "_meta": "object",
        "images": "array",
        "tool_calls": "object",
        "generatedResponse": "string"
      },
      "values": {
        "id": "LLMNode_finalBrief",
        "tools": [],
        "prompts": [
          {
            "id": "brief-sys-001",
            "role": "system",
            "content": "@prompts/analyze_final-synthesis-founder-brief_system.md"
          },
          {
            "id": "brief-user-001",
            "role": "user",
            "content": "@prompts/analyze_final-synthesis-founder-brief_user.md"
          }
        ],
        "memories": "@model-configs/analyze_final-synthesis-founder-brief.ts",
        "messages": "@model-configs/analyze_final-synthesis-founder-brief.ts",
        "nodeName": "Final Synthesis - Founder Brief",
        "generativeModelName": "@model-configs/analyze_final-synthesis-founder-brief.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 910
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_briefToFacts",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "factsArray": "array",
        "factsString": "string",
        "metadataArray": "array"
      },
      "values": {
        "id": "codeNode_briefToFacts",
        "code": "@scripts/analyze_brief-to-memory-facts.ts",
        "nodeName": "Brief To Memory Facts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 1040
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "vectorizeNode_brief",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "vectorizeNode",
      "schema": {
        "_meta": "object",
        "vectors": "object"
      },
      "values": {
        "id": "vectorizeNode_brief",
        "nodeName": "Vectorize Brief",
        "inputText": "{{codeNode_briefToFacts.output.factsArray}}",
        "embeddingModelName": "",
        "generativeModelName": {}
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 1170
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_pairVectorsMetadata",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "vectors": "object",
        "metadata": "object"
      },
      "values": {
        "id": "codeNode_pairVectorsMetadata",
        "code": "@scripts/analyze_pair-vectors-with-metadata.ts",
        "nodeName": "Pair Vectors With Metadata"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2142.5,
      "y": 1300
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "IndexNode_brief",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "IndexNode",
      "schema": {
        "message": "string",
        "recordsIndexed": "string",
        "duplicateRecordsDeleted": "string"
      },
      "values": {
        "id": "IndexNode_brief",
        "nodeName": "Index Brief to VectorDB",
        "vectorDB": "",
        "webhookURL": "",
        "primaryKeys": [
          "userId",
          "sessionId"
        ],
        "vectorsField": "{{codeNode_pairVectorsMetadata.output.vectors}}",
        "metadataField": "{{codeNode_pairVectorsMetadata.output.metadata}}",
        "duplicateOperation": "overwrite",
        "embeddingModelName": {
          "type": "embedder/text",
          "params": {},
          "model_name": "gemini/gemini-embedding-001",
          "credentialId": "5207df06-27af-4865-b9d3-3e41e57b05e0",
          "provider_name": "gemini",
          "credential_name": "embeddings"
        },
        "generativeModelName": {}
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2142.5,
      "y": 1430
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "memoryNode_storeAnalysis",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "memoryNode",
      "schema": {
        "memoryActions": "object",
        "extractedFacts": "object"
      },
      "values": {
        "id": "memoryNode_storeAnalysis",
        "nodeName": "Memory Add - Store Analysis",
        "uniqueId": "@memory/analyze_memory-add-store-analysis.ts",
        "sessionId": "@memory/analyze_memory-add-store-analysis.ts",
        "memoryValue": "@memory/analyze_memory-add-store-analysis.ts",
        "memoryCollection": "@memory/analyze_memory-add-store-analysis.ts",
        "embeddingModelName": "@memory/analyze_memory-add-store-analysis.ts",
        "generativeModelName": "@memory/analyze_memory-add-store-analysis.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 1560
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "graphqlResponseNode_999",
    "data": {
      "modes": {},
      "nodeId": "graphqlResponseNode",
      "schema": {},
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"brief\": \"{{LLMNode_finalBrief.output.generatedResponse}}\",\n  \"decomposition\": \"{{codeNode_parseDecomp.output.fullDecomp}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 2025,
      "y": 1690
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_currentDate",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_currentDate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-LLMNode_decompose",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_decompose",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_currentDate-LLMNode_decompose",
    "type": "defaultEdge",
    "source": "codeNode_currentDate",
    "target": "LLMNode_decompose",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_decompose-codeNode_parseDecomp",
    "type": "defaultEdge",
    "source": "LLMNode_decompose",
    "target": "codeNode_parseDecomp",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_market",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_market",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_vctrends",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_vctrends",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_competitors",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_competitors",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_dead",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_dead",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_customer",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_customer",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_reviews",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_reviews",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_success",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_success",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_bizmodel",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_bizmodel",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_unfair",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_unfair",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_parseDecomp-apiNode_twitter",
    "type": "defaultEdge",
    "source": "codeNode_parseDecomp",
    "target": "apiNode_twitter",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_market-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_market",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_vctrends-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_vctrends",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_competitors-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_competitors",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_dead-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_dead",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_customer-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_customer",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_reviews-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_reviews",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_twitter-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_twitter",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_success-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_success",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_bizmodel-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_bizmodel",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_unfair-codeNode_consolidate",
    "type": "defaultEdge",
    "source": "apiNode_unfair",
    "target": "codeNode_consolidate",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_consolidate-LLMNode_contrarian",
    "type": "defaultEdge",
    "source": "codeNode_consolidate",
    "target": "LLMNode_contrarian",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_consolidate-LLMNode_finalBrief",
    "type": "defaultEdge",
    "source": "codeNode_consolidate",
    "target": "LLMNode_finalBrief",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_contrarian-LLMNode_finalBrief",
    "type": "defaultEdge",
    "source": "LLMNode_contrarian",
    "target": "LLMNode_finalBrief",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_finalBrief-codeNode_briefToFacts",
    "type": "defaultEdge",
    "source": "LLMNode_finalBrief",
    "target": "codeNode_briefToFacts",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_briefToFacts-vectorizeNode_brief",
    "type": "defaultEdge",
    "source": "codeNode_briefToFacts",
    "target": "vectorizeNode_brief",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_brief-codeNode_pairVectorsMetadata",
    "type": "defaultEdge",
    "source": "vectorizeNode_brief",
    "target": "codeNode_pairVectorsMetadata",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_briefToFacts-codeNode_pairVectorsMetadata",
    "type": "defaultEdge",
    "source": "codeNode_briefToFacts",
    "target": "codeNode_pairVectorsMetadata",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_pairVectorsMetadata-IndexNode_brief",
    "type": "defaultEdge",
    "source": "codeNode_pairVectorsMetadata",
    "target": "IndexNode_brief",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_briefToFacts-memoryNode_storeAnalysis",
    "type": "defaultEdge",
    "source": "codeNode_briefToFacts",
    "target": "memoryNode_storeAnalysis",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "IndexNode_brief-memoryNode_storeAnalysis",
    "type": "defaultEdge",
    "source": "IndexNode_brief",
    "target": "memoryNode_storeAnalysis",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "memoryNode_storeAnalysis-graphqlResponseNode_999",
    "type": "defaultEdge",
    "source": "memoryNode_storeAnalysis",
    "target": "graphqlResponseNode_999",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-graphqlResponseNode_999",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_999",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
