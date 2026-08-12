// Flow: enterprise-vendor-due-diligence

// -- Meta --
export const meta = {
  "name": "Enterprise Vendor Due Diligence",
  "description": "Evaluates a proposed vendor across company, security, data, commercial, and operational dimensions, then returns an evidence-backed procurement recommendation.",
  "tags": [
    "procurement",
    "risk",
    "security",
    "compliance",
    "enterprise"
  ],
  "testInput": {
    "vendor_name": "AcmeCloud Technologies",
    "vendor_website": "https://example.com",
    "country": "United States",
    "industry": "SaaS",
    "product_or_service": "Cloud CRM",
    "contract_value": "75000",
    "contract_currency": "USD",
    "contract_duration_months": "24",
    "data_access": "Customer names, emails, phone numbers, sales data and internal employee information",
    "business_justification": "Replace the existing CRM and improve lead management and sales automation."
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/enterprise-vendor-due-diligence",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sreeram A M",
    "email": "sreeram132003@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_Intake": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Company": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Security": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Commercial": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Evidence": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Risk": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Recommendation": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_Final": [
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
    "lamatic_assignment_instructor_llmnode_intake_system_0": "@prompts/lamatic-assignment_instructor-llmnode-intake_system_0.md",
    "lamatic_assignment_instructor_llmnode_intake_user_1": "@prompts/lamatic-assignment_instructor-llmnode-intake_user_1.md",
    "lamatic_assignment_instructor_llmnode_company_system_0": "@prompts/lamatic-assignment_instructor-llmnode-company_system_0.md",
    "lamatic_assignment_instructor_llmnode_company_user_1": "@prompts/lamatic-assignment_instructor-llmnode-company_user_1.md",
    "lamatic_assignment_instructor_llmnode_security_system_0": "@prompts/lamatic-assignment_instructor-llmnode-security_system_0.md",
    "lamatic_assignment_instructor_llmnode_security_user_1": "@prompts/lamatic-assignment_instructor-llmnode-security_user_1.md",
    "lamatic_assignment_instructor_llmnode_commercial_system_0": "@prompts/lamatic-assignment_instructor-llmnode-commercial_system_0.md",
    "lamatic_assignment_instructor_llmnode_commercial_user_1": "@prompts/lamatic-assignment_instructor-llmnode-commercial_user_1.md",
    "lamatic_assignment_instructor_llmnode_evidence_system_0": "@prompts/lamatic-assignment_instructor-llmnode-evidence_system_0.md",
    "lamatic_assignment_instructor_llmnode_evidence_user_1": "@prompts/lamatic-assignment_instructor-llmnode-evidence_user_1.md",
    "lamatic_assignment_instructor_llmnode_risk_system_0": "@prompts/lamatic-assignment_instructor-llmnode-risk_system_0.md",
    "lamatic_assignment_instructor_llmnode_risk_user_1": "@prompts/lamatic-assignment_instructor-llmnode-risk_user_1.md",
    "lamatic_assignment_instructor_llmnode_recommendation_system_0": "@prompts/lamatic-assignment_instructor-llmnode-recommendation_system_0.md",
    "lamatic_assignment_instructor_llmnode_recommendation_user_1": "@prompts/lamatic-assignment_instructor-llmnode-recommendation_user_1.md",
    "lamatic_assignment_instructor_llmnode_final_system_0": "@prompts/lamatic-assignment_instructor-llmnode-final_system_0.md",
    "lamatic_assignment_instructor_llmnode_final_user_1": "@prompts/lamatic-assignment_instructor-llmnode-final_user_1.md"
  },
  "modelConfigs": {
    "lamatic_assignment_instructor_llmnode_intake_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-intake_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_company_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-company_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_security_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-security_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_commercial_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-commercial_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_evidence_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-evidence_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_risk_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-risk_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_recommendation_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-recommendation_generative-model-name.ts",
    "lamatic_assignment_instructor_llmnode_final_generative_model_name": "@model-configs/lamatic-assignment_instructor-llmnode-final_generative-model-name.ts"
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
        "advance_schema": "{\n  \"vendor_name\": \"string\",\n  \"vendor_website\": \"string\",\n  \"country\": \"string\",\n  \"industry\": \"string\",\n  \"product_or_service\": \"string\",\n  \"contract_value\": \"string\",\n  \"contract_currency\": \"string\",\n  \"contract_duration_months\": \"string\",\n  \"data_access\": \"string\",\n  \"business_justification\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Intake",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Vendor_Name\": {\"type\": \"string\", \"required\": true},\n    \"Vendor_Website\": {\"type\": \"string\"},\n    \"Engagement_Profile\": {\"type\": \"string\", \"required\": true},\n    \"Data_Profile\": {\"type\": \"string\", \"required\": true},\n    \"Investigation_Priorities\": {\"type\": \"string\", \"required\": true},\n    \"Known_Facts\": {\"type\": \"string\", \"required\": true},\n    \"Unknowns\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "890effeb-d260-4dc8-96f0-1bee19fa4d73",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-intake_system_0.md"
          },
          {
            "id": "418fd875-e5ad-4674-8c1d-ea7f39a64a0e",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-intake_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Intake Normalizer",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-intake_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Company",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [
          {
            "name": "EnterpriseWebResearch"
          }
        ],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Company_Name\": {\"type\": \"string\", \"required\": true},\n    \"Company_Overview\": {\"type\": \"string\", \"required\": true},\n    \"Industry\": {\"type\": \"string\", \"required\": true},\n    \"Website\": {\"type\": \"string\"},\n    \"Products_or_Services\": {\"type\": \"string\", \"required\": true},\n    \"Geographic_Presence\": {\"type\": \"string\"},\n    \"Company_Information\": {\"type\": \"string\"},\n    \"Key_Findings\": {\"type\": \"string\", \"required\": true},\n    \"Verified_Facts\": {\"type\": \"string\", \"required\": true},\n    \"Vendor_Claims\": {\"type\": \"string\", \"required\": true},\n    \"Evidence_Sources\": {\"type\": \"string\", \"required\": true},\n    \"Unverified_Information\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "c1da96f5-ebad-4a1e-9fb2-cc64d2dff29b",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-company_system_0.md"
          },
          {
            "id": "28e4882a-1f76-40af-83b3-019ce7dfb53d",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-company_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Company Intelligence",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-company_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Security",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [
          {
            "name": "EnterpriseWebResearch"
          }
        ],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Risk_Level\": {\"type\": \"string\", \"required\": true},\n    \"Data_Sensitivity\": {\"type\": \"string\", \"required\": true},\n    \"Data_Access_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Security_Findings\": {\"type\": \"string\", \"required\": true},\n    \"Security_Evidence\": {\"type\": \"string\", \"required\": true},\n    \"Missing_Evidence\": {\"type\": \"string\", \"required\": true},\n    \"Recommended_Actions\": {\"type\": \"string\", \"required\": true},\n    \"Verified_Findings\": {\"type\": \"string\", \"required\": true},\n    \"Vendor_Claims\": {\"type\": \"string\", \"required\": true},\n    \"Unverified_Claims\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "49e22c30-ba91-468d-9a11-47d05e2ea093",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-security_system_0.md"
          },
          {
            "id": "7077fb0b-2407-4798-b300-76c36a21b9c9",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-security_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Security Data Risk",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-security_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Commercial",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Commercial_Risk_Level\": {\"type\": \"string\", \"required\": true},\n    \"Contract_Assessment\": {\"type\": \"string\", \"required\": true},\n    \"Business_Criticality\": {\"type\": \"string\", \"required\": true},\n    \"Operational_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Vendor_Lockin_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Financial_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Missing_Commercial_Evidence\": {\"type\": \"string\", \"required\": true},\n    \"Recommended_Actions\": {\"type\": \"string\", \"required\": true},\n    \"Evidence_Limitations\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "cec85b29-8b69-43ab-a0b5-73776244543e",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-commercial_system_0.md"
          },
          {
            "id": "73f3a7e0-f700-4747-9083-3d44309b792a",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-commercial_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Commercial Risk",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-commercial_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Evidence",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Evidence_Quality\": {\"type\": \"string\", \"required\": true},\n    \"Verified_Findings\": {\"type\": \"string\", \"required\": true},\n    \"User_Provided_Facts\": {\"type\": \"string\", \"required\": true},\n    \"Vendor_Claims\": {\"type\": \"string\", \"required\": true},\n    \"Contradictions\": {\"type\": \"string\", \"required\": true},\n    \"Unsupported_Claims\": {\"type\": \"string\", \"required\": true},\n    \"Missing_Evidence\": {\"type\": \"string\", \"required\": true},\n    \"High_Impact_Unknowns\": {\"type\": \"string\", \"required\": true},\n    \"Validation_Confidence\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "824f71e3-3607-4c25-ad77-6c7e19a7a932",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-evidence_system_0.md"
          },
          {
            "id": "9df7c9f9-5b81-4d47-bcc9-9d098930cb05",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-evidence_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Evidence Validator",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-evidence_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Risk",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Overall_Risk_Level\": {\"type\": \"string\", \"required\": true},\n    \"Security_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Data_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Commercial_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Operational_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Evidence_Risk\": {\"type\": \"string\", \"required\": true},\n    \"Risk_Rationale\": {\"type\": \"string\", \"required\": true},\n    \"Risk_Confidence\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "d94b5105-8023-4bc2-b26a-cabb9ca53661",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-risk_system_0.md"
          },
          {
            "id": "eae52e28-2762-41b5-bf4c-98457130c214",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-risk_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Risk Assessment",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-risk_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Recommendation",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Decision\": {\"type\": \"string\", \"required\": true},\n    \"Decision_Rationale\": {\"type\": \"string\", \"required\": true},\n    \"Blocking_Issues\": {\"type\": \"string\", \"required\": true},\n    \"Required_Actions\": {\"type\": \"string\", \"required\": true},\n    \"Conditional_Approval_Requirements\": {\"type\": \"string\", \"required\": true},\n    \"Priority\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "b118175e-5aef-4b56-b325-b7bcae62e7fc",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-recommendation_system_0.md"
          },
          {
            "id": "b069fad4-5e1e-40d1-a859-5b8c6cd009d2",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-recommendation_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Recommendation",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-recommendation_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_Final",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Vendor_Name\": {\"type\": \"string\", \"required\": true},\n    \"Executive_Summary\": {\"type\": \"string\", \"required\": true},\n    \"Overall_Risk_Level\": {\"type\": \"string\", \"required\": true},\n    \"Company_Assessment\": {\"type\": \"string\", \"required\": true},\n    \"Security_Assessment\": {\"type\": \"string\", \"required\": true},\n    \"Commercial_Assessment\": {\"type\": \"string\", \"required\": true},\n    \"Operational_Assessment\": {\"type\": \"string\", \"required\": true},\n    \"Key_Risks\": {\"type\": \"string\", \"required\": true},\n    \"Verified_Evidence\": {\"type\": \"string\", \"required\": true},\n    \"Vendor_Claims\": {\"type\": \"string\", \"required\": true},\n    \"Contradictions\": {\"type\": \"string\", \"required\": true},\n    \"Missing_Evidence\": {\"type\": \"string\", \"required\": true},\n    \"Recommended_Actions\": {\"type\": \"string\", \"required\": true},\n    \"Decision\": {\"type\": \"string\", \"required\": true},\n    \"Evidence_Confidence\": {\"type\": \"string\", \"required\": true},\n    \"Evidence_Limitations\": {\"type\": \"string\", \"required\": true}\n  }\n}",
        "prompts": [
          {
            "id": "9499a878-5540-4293-be47-eb665474937b",
            "role": "system",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-final_system_0.md"
          },
          {
            "id": "f351236e-8d80-44e3-8e66-8fed043f3021",
            "role": "user",
            "content": "@prompts/lamatic-assignment_instructor-llmnode-final_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Executive Vendor Assessment",
        "attachments": "",
        "generativeModelName": "@model-configs/lamatic-assignment_instructor-llmnode-final_generative-model-name.ts"
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
        "outputMapping": "{\"vendor_assessment\":\"{{InstructorLLMNode_Final.output}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_Intake",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_Intake",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Intake-InstructorLLMNode_Company",
    "source": "InstructorLLMNode_Intake",
    "target": "InstructorLLMNode_Company",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Intake-InstructorLLMNode_Security",
    "source": "InstructorLLMNode_Intake",
    "target": "InstructorLLMNode_Security",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Company-InstructorLLMNode_Security",
    "source": "InstructorLLMNode_Company",
    "target": "InstructorLLMNode_Security",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Intake-InstructorLLMNode_Commercial",
    "source": "InstructorLLMNode_Intake",
    "target": "InstructorLLMNode_Commercial",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Company-InstructorLLMNode_Commercial",
    "source": "InstructorLLMNode_Company",
    "target": "InstructorLLMNode_Commercial",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Intake-InstructorLLMNode_Evidence",
    "source": "InstructorLLMNode_Intake",
    "target": "InstructorLLMNode_Evidence",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Company-InstructorLLMNode_Evidence",
    "source": "InstructorLLMNode_Company",
    "target": "InstructorLLMNode_Evidence",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Security-InstructorLLMNode_Evidence",
    "source": "InstructorLLMNode_Security",
    "target": "InstructorLLMNode_Evidence",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Commercial-InstructorLLMNode_Evidence",
    "source": "InstructorLLMNode_Commercial",
    "target": "InstructorLLMNode_Evidence",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Intake-InstructorLLMNode_Risk",
    "source": "InstructorLLMNode_Intake",
    "target": "InstructorLLMNode_Risk",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Company-InstructorLLMNode_Risk",
    "source": "InstructorLLMNode_Company",
    "target": "InstructorLLMNode_Risk",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Security-InstructorLLMNode_Risk",
    "source": "InstructorLLMNode_Security",
    "target": "InstructorLLMNode_Risk",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Commercial-InstructorLLMNode_Risk",
    "source": "InstructorLLMNode_Commercial",
    "target": "InstructorLLMNode_Risk",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Evidence-InstructorLLMNode_Risk",
    "source": "InstructorLLMNode_Evidence",
    "target": "InstructorLLMNode_Risk",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Risk-InstructorLLMNode_Recommendation",
    "source": "InstructorLLMNode_Risk",
    "target": "InstructorLLMNode_Recommendation",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Evidence-InstructorLLMNode_Recommendation",
    "source": "InstructorLLMNode_Evidence",
    "target": "InstructorLLMNode_Recommendation",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Commercial-InstructorLLMNode_Recommendation",
    "source": "InstructorLLMNode_Commercial",
    "target": "InstructorLLMNode_Recommendation",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Security-InstructorLLMNode_Recommendation",
    "source": "InstructorLLMNode_Security",
    "target": "InstructorLLMNode_Recommendation",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Intake-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Intake",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Company-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Company",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Security-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Security",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Commercial-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Commercial",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Evidence-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Evidence",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Risk-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Risk",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Recommendation-InstructorLLMNode_Final",
    "source": "InstructorLLMNode_Recommendation",
    "target": "InstructorLLMNode_Final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_Final-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_Final",
    "target": "responseNode_triggerNode_1",
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
