// Flow: top-crypto-movers

// -- Meta --
export const meta = {
  "name": "Top_Crypto_Movers",
  "description": "Scheduled agent that pulls the top 100 cryptocurrencies from CoinGecko, deterministically ranks the five largest 24-hour gainers and losers in code, and uses an LLM to summarize the results into a daily Markdown report.",
  "tags": [
    "cryptocurrency",
    "coingecko",
    "market-data",
    "reporting",
    "automation",
    "cron",
    "llm-summarization"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Isaiah Ng",
    "email": "ngisaiah17@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_261": [
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
    "top_crypto_movers_llmnode_261_system_0": "@prompts/top-crypto-movers_llmnode-261_system_0.md",
    "top_crypto_movers_llmnode_261_user_1": "@prompts/top-crypto-movers_llmnode-261_user_1.md"
  },
  "modelConfigs": {
    "top_crypto_movers_llmnode_261_generative_model_name": "@model-configs/top-crypto-movers_llmnode-261_generative-model-name.ts"
  },
  "scripts": {
    "top_crypto_movers_code_node_672_code": "@scripts/top-crypto-movers_code-node-672_code.ts"
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
      "nodeId": "cronNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "Daily Crypto Trigger",
        "cronTimezone": "America/New_York",
        "cronExpression": "0 9 * * *"
      }
    }
  },
  {
    "id": "apiNode_407",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "url": "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "2",
        "nodeName": "Crypto Market Data",
        "retry_delay": "1000",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_672",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/top-crypto-movers_code-node-672_code.ts",
        "nodeName": "Rank Market Movers"
      }
    }
  },
  {
    "id": "LLMNode_261",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/top-crypto-movers_llmnode-261_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/top-crypto-movers_llmnode-261_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Daily Report",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/top-crypto-movers_llmnode-261_generative-model-name.ts"
      }
    }
  },
  {
    "id": "plus-node-addNode_148609",
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
    "id": "codeNode_672-LLMNode_261-779",
    "source": "codeNode_672",
    "target": "LLMNode_261",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-apiNode_407",
    "source": "triggerNode_1",
    "target": "apiNode_407",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_407-codeNode_672",
    "source": "apiNode_407",
    "target": "codeNode_672",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_261-plus-node-addNode_148609-192",
    "source": "LLMNode_261",
    "target": "plus-node-addNode_148609",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
