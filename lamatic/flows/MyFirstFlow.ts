const flowConfig = {
  "id": "b2a918fb-7253-497e-8b3f-31feaece751c",
  "name": "My First Flow",
  "nodes": [
    {
      "id": "trigger",
      "data": {
        "modes": {},
        "nodeId": "graphqlNode",
        "values": {
          "id": "trigger",
          "headers": "",
          "retries": "0",
          "nodeName": "API Request",
          "webhookUrl": "",
          "responeType": "realtime",
          "retry_deplay": "0",
          "advance_schema": "{\n  \"reviewText\": \"string\",\n  \"starRating\": \"string\"\n}"
        },
        "trigger": true
      },
      "type": "triggerNode",
      "measured": {
        "width": 250,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 0
      },
      "selected": false
    },
    {
      "id": "llmNode",
      "data": {
        "label": "dynamicNode node",
        "modes": {},
        "nodeId": "LLMNode",
        "values": {
          "id": "llmNode",
          "tools": [],
          "prompts": [
            {
              "id": "40452419-1237-4f27-9e33-5f86f0114276",
              "role": "system",
              "content": "You are a professional customer support agent for a local business. Draft polite, contextual, and on-brand replies to Google Reviews. Maintain a warm tone for positive reviews. Express understanding and offer resolution steps for negative reviews."
            },
            {
              "id": "83ec945a-2afb-4230-9d75-7967d01058d8",
              "role": "user",
              "content": "Please write a short reply to this Google Review. The customer gave a rating of [starRating variable] stars. Their review: '[reviewText variable]'."
            }
          ],
          "memories": "[]",
          "messages": "[]",
          "nodeName": "Generate Text",
          "attachments": "",
          "credentials": "",
          "generativeModelName": [
            {
              "type": "generator/text",
              "params": {},
              "configName": "configA",
              "model_name": "deepseek-chat",
              "credentialId": "a948a0e4-dc91-444f-aaab-c4b8986e58ba",
              "provider_name": "deepseek",
              "credential_name": "keys"
            }
          ]
        }
      },
      "type": "dynamicNode",
      "measured": {
        "width": 250,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 130
      },
      "selected": false
    },
    {
      "id": "responseNode",
      "data": {
        "label": "Response",
        "nodeId": "graphqlResponseNode",
        "values": {
          "nodeName": "API Response",
          "outputMapping": "{\n  \"response\": \"{{llmNode.output.generatedResponse}}\"\n}"
        },
        "isResponseNode": true
      },
      "type": "responseNode",
      "measured": {
        "width": 250,
        "height": 89
      },
      "position": {
        "x": 0,
        "y": 260
      },
      "selected": false
    }
  ],
  "edges": [
    {
      "id": "trigger-llmNode",
      "type": "defaultEdge",
      "source": "trigger",
      "target": "llmNode",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "llmNode-responseNode",
      "type": "defaultEdge",
      "source": "llmNode",
      "target": "responseNode",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "response-trigger",
      "type": "responseEdge",
      "source": "trigger",
      "target": "responseNode",
      "sourceHandle": "to-response",
      "targetHandle": "from-trigger"
    }
  ],
  "status": "active",
  "created_at": "2026-07-20T06:55:05.233523+00:00"
};

export async function getNodesAndEdges(): Promise<{
    nodes: Record<string, any>[],
    edges: Record<string, any>[],
}> {
    return {
        nodes: flowConfig.nodes,
        edges: flowConfig.edges,
    }
}

export async function getFlowConfig(): Promise<Record<string, any>> {
    return flowConfig;
}