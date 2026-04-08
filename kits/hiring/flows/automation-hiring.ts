// Flow: automation-hiring

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Hiring Automation",
  "description": "",
  "tags": [],
  "testInput": {
    "name": "Dhruv Pamneja",
    "email": "dhruvp@lamatic.ai",
    "job_description": "Frontend Engineer",
    "resume_url": "https://aseskssykbhhiborrwws.supabase.co/storage/v1/object/public/alpha/DhruvP_Resume.pdf"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "gmailNode_506": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for Gmail authentication. Required to access the Gmail API.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "InstructorLLMNode_145": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
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
      }
    }
  ],
  "gmailNode_995": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for Gmail authentication. Required to access the Gmail API.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "gmailNode_194": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for Gmail authentication. Required to access the Gmail API.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
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
    "evaluate_candidate_system": "@prompts/evaluate-candidate-system.md",
    "automation_hiring_evaluate_candidate_user": "@prompts/automation-hiring_evaluate-candidate_user.md"
  },
  "modelConfigs": {
    "automation_hiring_evaluate_candidate": "@model-configs/automation-hiring_evaluate-candidate.ts"
  },
  "scripts": {
    "automation_hiring_prepare_receipt_email": "@scripts/automation-hiring_prepare-receipt-email.ts",
    "automation_hiring_collate_resume_contents": "@scripts/automation-hiring_collate-resume-contents.ts",
    "automation_hiring_prepare_selection_mail": "@scripts/automation-hiring_prepare-selection-mail.ts",
    "automation_hiring_prepare_rejection_mail": "@scripts/automation-hiring_prepare-rejection-mail.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "gmailNode_506",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "bcc": "",
        "body": "{{codeNode_218.output}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": true,
        "subject": "Application Received – Lamatic.ai",
        "to_user": "",
        "nodeName": "Send Acknowledgement",
        "from_user": "",
        "credentials": "",
        "max_results": 10,
        "recipient_email": "{{triggerNode_1.output.email}}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_218",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_prepare-receipt-email.ts",
        "nodeName": "Prepare Receipt Email"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"output\": \"{{InstructorLLMNode_145.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1350
    },
    "selected": false
  },
  {
    "id": "codeNode_861",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_collate-resume-contents.ts",
        "nodeName": "Collate Resume Contents"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "extractFromFileNode_376",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "extractFromFileNode",
      "values": {
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.resume_url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "nodeName": "Extract Resume",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_145",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"score\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"score between 1 to 10 upto two decimal places\"\n    },\n    \"strength\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"list of strengths of candidate\"\n    },\n    \"weakness\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"list of weaknesses of candidate\"\n    },\n    \"recommendation\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"final verdict of being 'Selected' or 'Rejected'\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/evaluate-candidate-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/automation-hiring_evaluate-candidate_user.md"
          }
        ],
        "memories": "@model-configs/automation-hiring_evaluate-candidate.ts",
        "messages": "@model-configs/automation-hiring_evaluate-candidate.ts",
        "nodeName": "Evaluate Candidate",
        "attachments": "@model-configs/automation-hiring_evaluate-candidate.ts",
        "generativeModelName": "@model-configs/automation-hiring_evaluate-candidate.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "conditionNode_463",
    "data": {
      "label": "Condition",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_463-addNode_438",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{InstructorLLMNode_145.output.recommendation}}\",\n      \"operator\": \"==\",\n      \"value\": \"Selected\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_463-addNode_598",
            "condition": {}
          }
        ]
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "codeNode_362",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_prepare-selection-mail.ts",
        "nodeName": "Prepare Selection Mail"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "codeNode_803",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_prepare-rejection-mail.ts",
        "nodeName": "Prepare Rejection Mail"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "gmailNode_995",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "bcc": "",
        "body": "{{codeNode_362.output}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": true,
        "subject": "Congratulations - Lamatic.ai",
        "to_user": "",
        "nodeName": "Send Interview Mail",
        "from_user": "",
        "credentials": "",
        "max_results": 10,
        "recipient_email": "{{triggerNode_1.output.email}}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1200
    },
    "selected": false
  },
  {
    "id": "gmailNode_194",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "bcc": "",
        "body": "{{codeNode_803.output}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": true,
        "subject": "Application Update – Lamatic.ai",
        "to_user": "",
        "nodeName": "Send Rejection Mail",
        "from_user": "",
        "credentials": "",
        "max_results": 10,
        "recipient_email": "{{triggerNode_1.output.email}}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_218",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_218",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_218-gmailNode_506",
    "type": "defaultEdge",
    "source": "codeNode_218",
    "target": "gmailNode_506",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "gmailNode_506-extractFromFileNode_376",
    "data": {},
    "type": "defaultEdge",
    "source": "gmailNode_506",
    "target": "extractFromFileNode_376",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "extractFromFileNode_376-codeNode_861",
    "type": "defaultEdge",
    "source": "extractFromFileNode_376",
    "target": "codeNode_861",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_861-InstructorLLMNode_145",
    "type": "defaultEdge",
    "source": "codeNode_861",
    "target": "InstructorLLMNode_145",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_145-conditionNode_463",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_145",
    "target": "conditionNode_463",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_463-codeNode_362-429",
    "data": {
      "condition": "Condition 1",
      "branchName": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_463",
    "target": "codeNode_362",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_463-codeNode_803-862",
    "data": {
      "condition": "Else",
      "branchName": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_463",
    "target": "codeNode_803",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_362-gmailNode_995",
    "type": "defaultEdge",
    "source": "codeNode_362",
    "target": "gmailNode_995",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "gmailNode_995-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "gmailNode_995",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_803-gmailNode_194",
    "type": "defaultEdge",
    "source": "codeNode_803",
    "target": "gmailNode_194",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "gmailNode_194-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "gmailNode_194",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
