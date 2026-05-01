// Flow: forge-invoice

// -- Meta --
export const meta = {
  "name": "Forge Invoice",
  "description": "Generates a professional invoice with confirmed line items, freelancer/client details, and payment instructions.",
  "tags": ["finance", "invoicing", "generative"],
  "testInput": "{\"project_title\":\"E-commerce Website\",\"freelancer_name\":\"John Doe\",\"client_name\":\"Acme Corp\",\"total_amount\":\"5000\",\"currency\":\"USD\",\"line_items\":\"[{\\\"description\\\":\\\"Development\\\",\\\"amount\\\":5000}]\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/forge/flows/forge-invoice",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_invoice": [
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
    "forge_invoice_llmnode_invoice_system_0": "@prompts/forge-invoice_llmnode-invoice_system_0.md",
    "forge_invoice_llmnode_invoice_user_1": "@prompts/forge-invoice_llmnode-invoice_user_1.md"
  },
  "modelConfigs": {
    "forge_invoice_llmnode_invoice_generative_model_name": "@model-configs/forge-invoice_llmnode-invoice_generative-model-name.ts"
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
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"freelancer_name\": \"string\",\n  \"freelancer_address\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"freelancer_email\": \"string\",\n  \"freelancer_payment_details\": \"string\",\n  \"client_name\": \"string\",\n  \"client_address\": \"string\",\n  \"client_country\": \"string\",\n  \"client_email\": \"string\",\n  \"invoice_date\": \"string\",\n  \"due_date\": \"string\",\n  \"project_title\": \"string\",\n  \"line_items\": \"string\",\n  \"currency\": \"string\",\n  \"total_amount\": \"string\",\n  \"payment_instructions\": \"string\",\n  \"notes\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_invoice",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_invoice",
        "tools": [],
        "prompts": [
          {
            "id": "invoice-sys-001",
            "role": "system",
            "content": "@prompts/forge-invoice_llmnode-invoice_system_0.md"
          },
          {
            "id": "invoice-user-001",
            "role": "user",
            "content": "@prompts/forge-invoice_llmnode-invoice_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Invoice Generation Agent",
        "generativeModelName": "@model-configs/forge-invoice_llmnode-invoice_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_003",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"invoice\": \"{{LLMNode_invoice.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_invoice",
    "source": "triggerNode_1",
    "target": "LLMNode_invoice",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_invoice-graphqlResponseNode_003",
    "source": "LLMNode_invoice",
    "target": "graphqlResponseNode_003",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_003",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_003",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
