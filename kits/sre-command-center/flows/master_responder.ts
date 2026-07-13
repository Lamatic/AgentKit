/**
 * ============================================================================
 * FLOW 03: MASTER RESPONDER MULTI-AGENT TRIAGE & REMEDIATION (THE FIXER)
 * ============================================================================
 * 
 * Architecture Overview:
 * Autonomous multi-agent incident triage, retrieval-augmented runbook synthesis,
 * and automated multi-channel notification dispatcher.
 *
 * Multi-Agent Pipeline Lifecycle:
 * 1. triggerNode_1: Receives real-time incident alert JSON payload.
 * 2. InstructorLLMNode_1 (L1 Triage Agent): Extracts structured incident classification,
 *    severity level, affected service, and generates an optimized semantic search query.
 * 3. searchNode_1 (Vector DB Search): Queries Lamatic VectorDB (`runbooks`) for top-5
 *    relevant remediation chunks matching the incident signature.
 * 4. conditionNode_1 (Dynamic Router):
 *    - Primary Branch: If VectorDB returns runbooks, route directly to L2 Remediation Agent.
 *    - Fallback Branch: If VectorDB returns empty, query Google Web Search (`webSearchNode_1`)
 *      and scrape live technical documentation via `firecrawlNode_1`.
 * 5. LLMNode_1 (L2 Remediation Agent): Synthesizes retrieved runbook context or live docs
 *    into an executive SRE post-mortem report + step-by-step shell/SQL commands.
 * 6. branchNode_1 (Notification Fan-Out): Parallel dispatch to:
 *    - slackNode_1: Posts incident summary to Slack channel `#sre-incident-alerts` (`C0BGM5D8Q2F`).
 *    - gmailNode_1: Sends formal executive alert email to primary SRE lead (`rajputnik911@gmail.com`).
 * 7. responseNode_triggerNode_1: Returns complete markdown remediation report to UI.
 * ============================================================================
 */

// Flow: flow-3-master-responder-the-fixer

// -- Meta --
export const meta = {
  "name": "Flow 3 Master Responder The Fixer",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Nikhil Rajput",
    "email": "rajputnik911@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "searchNode_1": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "webSearchNode_1": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "firecrawlNode_1": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    },
    {
      "name": "urls",
      "label": "URLs",
      "type": "monacoText"
    }
  ],
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "slackNode_1": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    },
    {
      "name": "channelName",
      "label": "Channel",
      "type": "resourceLocator"
    }
  ],
  "gmailNode_1": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "flow_3_master_responder_the_fixer_instructor_llmnode_1_system_0": "@prompts/flow-3-master-responder-the-fixer_instructor-llmnode-1_system_0.md",
    "flow_3_master_responder_the_fixer_instructor_llmnode_1_user_1": "@prompts/flow-3-master-responder-the-fixer_instructor-llmnode-1_user_1.md",
    "flow_3_master_responder_the_fixer_llmnode_1_system_0": "@prompts/flow-3-master-responder-the-fixer_llmnode-1_system_0.md",
    "flow_3_master_responder_the_fixer_llmnode_1_user_1": "@prompts/flow-3-master-responder-the-fixer_llmnode-1_user_1.md"
  },
  "modelConfigs": {
    "flow_3_master_responder_the_fixer_instructor_llmnode_1_generative_model_name": "@model-configs/flow-3-master-responder-the-fixer_instructor-llmnode-1_generative-model-name.ts",
    "flow_3_master_responder_the_fixer_search_node_1_embedding_model_name": "@model-configs/flow-3-master-responder-the-fixer_search-node-1_embedding-model-name.ts",
    "flow_3_master_responder_the_fixer_llmnode_1_generative_model_name": "@model-configs/flow-3-master-responder-the-fixer_llmnode-1_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "sticky-note-607",
    "type": "stickyNoteNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "stickyNoteNode",
      "values": {
        "text": "⚠️ Note: Web search is currently disabled because I'm unable to obtain a valid API key. Please check and restore this feature.",
        "color": "yellow",
        "nodeId": "stickyNoteNode",
        "nodeName": "Sticky Note",
        "nodeType": "stickyNoteNode"
      }
    }
  },
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
        "nodeName": "GraphQL Trigger — Master Responder",
        "responeType": "realtime",
        "advance_schema": "{\n  \"input\": {}\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_1",
        "tools": [],
        "schema": "{\"type\":\"object\",\"properties\":{\"category\":{\"type\":\"string\"},\"severity\":{\"type\":\"string\"},\"affected_service\":{\"type\":\"string\"},\"search_query\":{\"type\":\"string\"},\"use_vector_db\":{\"type\":\"boolean\"},\"reasoning\":{\"type\":\"string\"}},\"required\":[\"category\",\"severity\",\"affected_service\",\"search_query\",\"use_vector_db\",\"reasoning\"]}",
        "prompts": [
          {
            "id": "5478ceab-2da4-4d0a-be60-03599e8290de",
            "role": "system",
            "content": "@prompts/flow-3-master-responder-the-fixer_instructor-llmnode-1_system_0.md"
          },
          {
            "id": "646784a1-69c9-423d-9707-e023cc5a057f",
            "role": "user",
            "content": "@prompts/flow-3-master-responder-the-fixer_instructor-llmnode-1_user_1.md"
          }
        ],
        "messages": "[]",
        "nodeName": "L1 Triage Agent",
        "attachments": "",
        "generativeModelName": "@model-configs/flow-3-master-responder-the-fixer_instructor-llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "searchNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_1",
        "topK": 5,
        "limit": 5,
        "query": "<workflow.InstructorLLMNode_1.output.search_query>",
        "nodeName": "Runbook Vector DB Search",
        "vectorDB": "runbook",
        "collection": "runbooks",
        "searchQuery": "{{InstructorLLMNode_1.output.search_query}}",
        "embeddingModelName": "@model-configs/flow-3-master-responder-the-fixer_search-node-1_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "conditionNode_1",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Route: Vector DB or Web Search",
        "conditions": [
          {
            "label": "Runbook Result",
            "value": "conditionNode_1-addNode_101",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{searchNode_1.output.searchResults}}\",\n      \"operator\": \"==\",\n      \"value\": \"[]\"\n    }\n  ]\n}"
          },
          {
            "label": "Web Search Fallback",
            "value": "conditionNode_1-addNode_102",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "webSearchNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_1",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{InstructorLLMNode_1.output.search_query}}",
        "results": 5,
        "nodeName": "Web Search Fallback",
        "credentials": "PLACEHOLDER"
      }
    }
  },
  {
    "id": "firecrawlNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "firecrawlNode",
      "values": {
        "id": "firecrawlNode_1",
        "url": "{{webSearchNode_1.output.output}}",
        "mode": "syncSingleScrape",
        "mobile": false,
        "timeout": 30000,
        "waitFor": 2000,
        "nodeName": "Firecrawl Top Result",
        "crawlLimit": "7",
        "credentials": "Firecrawl",
        "excludeTags": [],
        "includeTags": [],
        "changeTracking": false,
        "onlyMainContent": true,
        "skipTlsVerification": false
      }
    }
  },
  {
    "id": "plus-node-addNode_666355",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "tools": [],
        "prompts": [
          {
            "id": "4f463eff-886b-4bca-9b69-fd54e10bc926",
            "role": "system",
            "content": "@prompts/flow-3-master-responder-the-fixer_llmnode-1_system_0.md"
          },
          {
            "id": "a0c3bb0c-678b-438f-9e2e-19b3f3196040",
            "role": "user",
            "content": "@prompts/flow-3-master-responder-the-fixer_llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Remediation Report",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flow-3-master-responder-the-fixer_llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "branchNode_1",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "id": "branchNode_1",
        "branches": [
          {
            "label": "Notify on Slack",
            "value": "branchNode_1-slackNode_1"
          },
          {
            "label": "Notify on Gmail",
            "value": "branchNode_1-gmailNode_1"
          }
        ],
        "nodeName": "Notification Fan-Out"
      }
    }
  },
  {
    "id": "slackNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "values": {
        "id": "slackNode_1",
        "text": "{{LLMNode_1.output.generatedResponse}}",
        "action": "postMessage",
        "nodeName": "Slack Incident Notification",
        "channelName": "C0BGM5D8Q2F",
        "credentials": "Slack OAuth"
      }
    }
  },
  {
    "id": "gmailNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "gmailNode",
      "values": {
        "cc": [],
        "id": "gmailNode_1",
        "bcc": [],
        "body": "{{LLMNode_1.output.generatedResponse}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": false,
        "subject": "Incident Report: —{{InstructorLLMNode_1.output.category}}",
        "nodeName": "Email Incident Report",
        "credentials": "Gmail OAuth",
        "recipient_email": "rajputnik911@gmail.com"
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
        "headers": "{\"content-type\": \"application/json\"}",
        "retries": "0",
        "nodeName": "API Response — Remediation Report",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"report_markdown\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_1",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_1-webSearchNode_1",
    "source": "conditionNode_1",
    "target": "webSearchNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_1-branchNode_1",
    "source": "LLMNode_1",
    "target": "branchNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "branchNode_1-slackNode_1",
    "source": "branchNode_1",
    "target": "slackNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "conditionNode_1-plus-node-addNode_666355",
    "source": "conditionNode_1",
    "target": "plus-node-addNode_666355",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "webSearchNode_1-firecrawlNode_1",
    "source": "webSearchNode_1",
    "target": "firecrawlNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_1-LLMNode_1",
    "source": "firecrawlNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_666355-LLMNode_1",
    "source": "plus-node-addNode_666355",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "branchNode_1-gmailNode_1",
    "source": "branchNode_1",
    "target": "gmailNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "slackNode_1-responseNode_triggerNode_1",
    "source": "slackNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "gmailNode_1-responseNode_triggerNode_1",
    "source": "gmailNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_1-searchNode_1",
    "source": "InstructorLLMNode_1",
    "target": "searchNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_1-conditionNode_1",
    "source": "searchNode_1",
    "target": "conditionNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
