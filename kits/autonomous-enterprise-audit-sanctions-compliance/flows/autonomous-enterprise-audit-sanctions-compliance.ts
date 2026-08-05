// Flow: autonomous-enterprise-audit-sanctions-compliance

// -- Meta --
export const meta = {
  "name": "Autonomous Enterprise Audit Sanctions Compliance",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Anupam Maiti",
    "email": "personalusecase10@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "agenticDocExtractionNode_581": [
    {
      "name": "ocrModelName",
      "label": "OCR Model",
      "type": "model"
    }
  ],
  "agentClassifierNode_252": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "memoryRetrieveNode_264": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "agentNode_143": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "mcpNode_737": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "slackNode_425": [
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
  "InstructorLLMNode_771": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "vectorizeNode_704": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_637": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ],
  "memoryNode_421": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
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
    "autonomous_enterprise_audit_sanctions_compliance_agentic_doc_extraction_node_581_system_0": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agentic-doc-extraction-node-581_system_0.md",
    "autonomous_enterprise_audit_sanctions_compliance_agent_classifier_node_252_system_0": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-classifier-node-252_system_0.md",
    "autonomous_enterprise_audit_sanctions_compliance_agent_classifier_node_252_user_1": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-classifier-node-252_user_1.md",
    "autonomous_enterprise_audit_sanctions_compliance_agent_node_143_system_0": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-node-143_system_0.md",
    "autonomous_enterprise_audit_sanctions_compliance_agent_node_143_user_1": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-node-143_user_1.md",
    "autonomous_enterprise_audit_sanctions_compliance_instructor_llmnode_771_system_0": "@prompts/autonomous-enterprise-audit-sanctions-compliance_instructor-llmnode-771_system_0.md",
    "autonomous_enterprise_audit_sanctions_compliance_instructor_llmnode_771_user_1": "@prompts/autonomous-enterprise-audit-sanctions-compliance_instructor-llmnode-771_user_1.md"
  },
  "modelConfigs": {
    "autonomous_enterprise_audit_sanctions_compliance_agent_classifier_node_252_generative_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_agent-classifier-node-252_generative-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_memory_retrieve_node_264_embedding_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_memory-retrieve-node-264_embedding-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_hybrid_search_node_546_embedding_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_hybrid-search-node-546_embedding-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_agent_node_143_generative_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_agent-node-143_generative-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_mcp_node_737_generative_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_mcp-node-737_generative-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_instructor_llmnode_771_generative_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_instructor-llmnode-771_generative-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_vectorize_node_704_embedding_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_vectorize-node-704_embedding-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_memory_node_421_generative_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_memory-node-421_generative-model-name.ts",
    "autonomous_enterprise_audit_sanctions_compliance_memory_node_421_embedding_model_name": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_memory-node-421_embedding-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "plus-node-addNode_926214",
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
    "id": "plus-node-addNode_795125",
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
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webhookTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Webhook"
      }
    }
  },
  {
    "id": "extractFromFileNode_877",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "id": "extractFromFileNode_877",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.prompt}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "nodeName": "Extract from File",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": false,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    }
  },
  {
    "id": "agenticDocExtractionNode_581",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agenticDocExtractionNode",
      "values": {
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"vendor_details\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"vendor_name\": {\n          \"type\": \"string\"\n        },\n        \"primary_contact\": {\n          \"type\": \"string\"\n        },\n        \"email\": {\n          \"type\": \"string\"\n        },\n        \"phone_number\": {\n          \"type\": \"string\"\n        },\n        \"address\": {\n          \"type\": \"string\"\n        },\n        \"tax_id_ein\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"compliance_checklist\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"category\": {\n            \"type\": \"string\",\n            \"description\": \"e.g., Documentation, Contract Setup, Performance Monitoring\"\n          },\n          \"item\": {\n            \"type\": \"string\"\n          },\n          \"status\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"completed\",\n              \"pending\",\n              \"unknown\"\n            ],\n            \"description\": \"Inferred from checkbox or item mark\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"sign_off_info\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"role\": {\n            \"type\": \"string\"\n          },\n          \"date\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"document_metadata\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"document_title\": {\n          \"type\": \"string\"\n        },\n        \"has_all_signoffs\": {\n          \"type\": \"boolean\"\n        }\n      },\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "b7f4a2c1-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
            "role": "system",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agentic-doc-extraction-node-581_system_0.md"
          }
        ],
        "maxPages": 2,
        "nodeName": "Agentic Doc Extraction",
        "joinPages": true,
        "bboxSchema": "",
        "imageLimit": 0,
        "documentUrl": "{{triggerNode_1.output.prompt}}",
        "tableFormat": "off",
        "imageMinSize": 0,
        "ocrModelName": [
          {
            "type": "ocr/document",
            "params": {},
            "configName": "configA",
            "model_name": "mistral/mistral-ocr-latest",
            "credentialId": "bb2f5d05-9c8d-4e02-a753-6f59783b609e",
            "provider_name": "mistral",
            "credential_name": "agentkit"
          }
        ],
        "outputFormat": "json",
        "extractFooter": false,
        "extractHeader": false,
        "includeBlocks": false,
        "includeImages": false,
        "advancedConfigs": false,
        "confidenceScoresGranularity": "off"
      }
    }
  },
  {
    "id": "agentClassifierNode_252",
    "type": "agentClassifierNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentClassifierNode",
      "values": {
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-classifier-node-252_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-classifier-node-252_user_1.md"
          }
        ],
        "nodeName": "Classifier",
        "classifier": [
          {
            "label": "Memory Retrieve",
            "value": "agentClassifierNode_252-addNode_484",
            "description": "Use when the document requires checking past session history, previous audit logs, or entity interaction history."
          },
          {
            "label": "Hybrid Search",
            "value": "agentClassifierNode_252-plus-node-addNode_508532-616",
            "description": "Use when the document requires searching internal regulatory knowledge bases, legal policies, or sanctions compliance indices."
          },
          {
            "label": "API",
            "value": "agentClassifierNode_252-addNode_891",
            "description": "Use when the document is a vendor onboarding form or compliance checklist requiring immediate external database verification or API submission."
          }
        ],
        "generativeModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_agent-classifier-node-252_generative-model-name.ts"
      }
    }
  },
  {
    "id": "memoryRetrieveNode_264",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "id": "memoryRetrieveNode_264",
        "limit": "3",
        "filters": "[]",
        "nodeName": "Memory Retrieve",
        "searchQuery": "Vendor: {{agenticDocExtractionNode_581.output.structuredData.0.annotation.vendor_details.vendor_name}} | Content: {{agenticDocExtractionNode_581.output.extractedText}}",
        "memoryCollection": "Memory",
        "embeddingModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_memory-retrieve-node-264_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "hybridSearchNode_546",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "hybridSearchNode",
      "values": {
        "id": "hybridSearchNode_546",
        "alpha": "0.25",
        "limit": "3",
        "autocut": "0",
        "filters": "[]",
        "nodeName": "Hybrid Search",
        "vectorDB": "Vectordb",
        "certainty": "0.85",
        "fusionType": "relativeScoreFusion",
        "searchQuery": "Vendor: {{agenticDocExtractionNode_581.output.structuredData.0.annotation.vendor_details.vendor_name}} | Compliance Checklist: {{agenticDocExtractionNode_581.output.structuredData.0.annotation.compliance_checklist}} | Text: {{agenticDocExtractionNode_581.output.extractedText}}",
        "boostProperties": false,
        "embeddingModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_hybrid-search-node-546_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "apiNode_483",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_483",
        "url": "https://api-sandbox.middesk.com/v1/businesses",
        "body": "{\n  \"vendor_name\": \"{{ agenticDocExtractionNode_581.output.structuredData.0.annotation.vendor_details.vendor_name || '' }}\",\n  \"has_all_signoffs\": \"{{ agenticDocExtractionNode_581.output.structuredData.0.annotation.document_metadata.has_all_signoffs || false }}\",\n  \"document_title\": \"{{ agenticDocExtractionNode_581.output.structuredData.0.annotation.document_metadata.document_title || '' }}\",\n  \"compliance_checklist\": \"{{ agenticDocExtractionNode_581.output.structuredData.0.annotation.compliance_checklist || [] }}\",\n  \"extracted_text\": \"{{ agenticDocExtractionNode_581.output.extractedText || '' }}\"\n}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": true
      }
    }
  },
  {
    "id": "plus-node-addNode_492984",
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
    "id": "agentNode_143",
    "type": "agentNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentNode",
      "values": {
        "tools": [],
        "agents": [
          {
            "name": "LowRiskAgent",
            "schema": {},
            "description": "Route to this path when all compliance checks pass no sanctions matches or flags are found all required sign-offs are present and the entity is deemed fully compliant for automated indexing and storage."
          },
          {
            "name": "HighRiskAgent",
            "schema": {},
            "description": "Route to this path when there are missing sign-offs failed compliance checks potential sanctions flags missing mandatory metadata or any severe risk indicators requiring human intervention and Slack escalation."
          }
        ],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-node-143_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_agent-node-143_user_1.md"
          }
        ],
        "messages": "[]",
        "nodeName": "Supervisor",
        "stopWord": "",
        "connectedTo": "agentLoopEndNode_747",
        "maxIterations": 5,
        "generativeModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_agent-node-143_generative-model-name.ts"
      }
    }
  },
  {
    "id": "mcpNode_737",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "mcpNode",
      "values": {
        "memories": "[]",
        "messages": "[]",
        "nodeName": "MCP",
        "attachments": "",
        "credentials": "MCP Server",
        "selectedTools": [
          "hub_repo_search"
        ],
        "promptTemplate": "Evaluate high-risk escalation details for vendor  and verify compliance records against external audit rules.{{agenticDocExtractionNode_581.output.extractedText}}",
        "generativeModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_mcp-node-737_generative-model-name.ts"
      }
    }
  },
  {
    "id": "slackNode_425",
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
        "id": "slackNode_425",
        "text": "Hi, this is your Lamatic Slack Bot. \nHow can I help you? Send your queries using the /ask command.",
        "action": "postMessage",
        "nodeName": "Slack",
        "channelName": "C0BMENFFABC",
        "credentials": "Slack OAuth"
      }
    }
  },
  {
    "id": "InstructorLLMNode_771",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"vendor_name\": {\n      \"type\": \"string\",\n      \"description\": \"Name of the audited vendor entity\"\n    },\n    \"document_title\": {\n      \"type\": \"string\",\n      \"description\": \"Title of the onboarding or compliance document\"\n    },\n    \"risk_level\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"LOW\"\n      ],\n      \"description\": \"Determined risk classification level\"\n    },\n    \"audit_status\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"APPROVED\"\n      ],\n      \"description\": \"Overall audit status\"\n    },\n    \"summary\": {\n      \"type\": \"string\",\n      \"description\": \"Brief summary of the Supervisor decision\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_instructor-llmnode-771_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/autonomous-enterprise-audit-sanctions-compliance_instructor-llmnode-771_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_instructor-llmnode-771_generative-model-name.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_704",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_704",
        "nodeName": "Vectorize",
        "inputText": "{{InstructorLLMNode_771.output.vendor_name}}{{InstructorLLMNode_771.output.document_title}}{{InstructorLLMNode_771.output.summary}}",
        "embeddingModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_vectorize-node-704_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_637",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_637",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "Vectordb",
        "primaryKeys": [
          "vendor_name"
        ],
        "vectorsField": "{{vectorizeNode_704.output.vectors}}",
        "metadataField": "{{InstructorLLMNode_771.output.vendor_name}}{{InstructorLLMNode_771.output.summary}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "memoryNode_421",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryNode",
      "values": {
        "id": "memoryNode_421",
        "nodeName": "Memory Add",
        "uniqueId": "{{InstructorLLMNode_771.output.vendor_name}}",
        "sessionId": "",
        "memoryValue": [
          {
            "role": "user",
            "content": "Vendor {{ Agentic Doc Extraction: structuredData.0.annotation.vendor_details.vendor_name }} successfully cleared low-risk compliance audit for {{ Agentic Doc Extraction: structuredData.0.annotation.document_metadata.document_title }} on {{ $now }}."
          }
        ],
        "memoryCollection": "Memory",
        "embeddingModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_memory-node-421_embedding-model-name.ts",
        "generativeModelName": "@model-configs/autonomous-enterprise-audit-sanctions-compliance_memory-node-421_generative-model-name.ts"
      }
    }
  },
  {
    "id": "agentLoopEndNode_747",
    "type": "agentLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentLoopEndNode",
      "values": {
        "nodeName": "Agent Loop End",
        "connectedTo": "agentNode_143"
      }
    }
  },
  {
    "id": "endNode_686",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "endNode",
      "values": {
        "nodeName": "End"
      }
    }
  },
  {
    "id": "plus-node-addNode_676314",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_877-262",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_877",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_877-agenticDocExtractionNode_581-669",
    "source": "extractFromFileNode_877",
    "target": "agenticDocExtractionNode_581",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agenticDocExtractionNode_581-agentClassifierNode_252-187",
    "source": "agenticDocExtractionNode_581",
    "target": "agentClassifierNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_252-memoryRetrieveNode_264-651",
    "source": "agentClassifierNode_252",
    "target": "memoryRetrieveNode_264",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_252-apiNode_483-112",
    "source": "agentClassifierNode_252",
    "target": "apiNode_483",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_252-hybridSearchNode_546-234",
    "source": "agentClassifierNode_252",
    "target": "hybridSearchNode_546",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "memoryRetrieveNode_264-plus-node-addNode_492984-800",
    "source": "memoryRetrieveNode_264",
    "target": "plus-node-addNode_492984",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_483-plus-node-addNode_492984-843",
    "source": "apiNode_483",
    "target": "plus-node-addNode_492984",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "hybridSearchNode_546-plus-node-addNode_492984-291",
    "source": "hybridSearchNode_546",
    "target": "plus-node-addNode_492984",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_492984-agentNode_143-587",
    "source": "plus-node-addNode_492984",
    "target": "agentNode_143",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentNode_143-InstructorLLMNode_771-893",
    "source": "agentNode_143",
    "target": "InstructorLLMNode_771",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_771-vectorizeNode_704",
    "source": "InstructorLLMNode_771",
    "target": "vectorizeNode_704",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_704-vectorNode_637",
    "source": "vectorizeNode_704",
    "target": "vectorNode_637",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_637-memoryNode_421",
    "source": "vectorNode_637",
    "target": "memoryNode_421",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryNode_421-agentLoopEndNode_747",
    "source": "memoryNode_421",
    "target": "agentLoopEndNode_747",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__vectorizeNode_704bottom-InstructorLLMNode_771top",
    "source": "vectorizeNode_704",
    "target": "InstructorLLMNode_771",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentNode_143-mcpNode_737-624",
    "source": "agentNode_143",
    "target": "mcpNode_737",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "mcpNode_737-slackNode_425",
    "source": "mcpNode_737",
    "target": "slackNode_425",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "slackNode_425-agentLoopEndNode_747",
    "source": "slackNode_425",
    "target": "agentLoopEndNode_747",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentLoopEndNode_747-endNode_686-536",
    "source": "agentLoopEndNode_747",
    "target": "endNode_686",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "endNode_686-plus-node-addNode_676314-995",
    "source": "endNode_686",
    "target": "plus-node-addNode_676314",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentLoopEndNode_747-agentNode_143-198",
    "source": "agentLoopEndNode_747",
    "target": "agentNode_143",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentLoopEdge"
  },
  {
    "id": "agentNode_143-agentLoopEndNode_747-977",
    "source": "agentNode_143",
    "target": "agentLoopEndNode_747",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentLoopEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
