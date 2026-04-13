const flowConfig = {
  "id": "18865415-fe46-438c-87c6-17006439ff31",
  "name": "1 - Getting Started",
  "nodes": [
    {
      "id": "sticky-gm21yx26f",
      "data": {
        "modes": {},
        "width": 646,
        "height": 296,
        "nodeId": "stickyNoteNode",
        "values": {
          "id": "sticky-gm21yx26f",
          "text": "# **➕ Nodes**\n\n---\n\n_Nodes are the fundamental building blocks of a flow. Each node serves a specific purpose, acting as a self-contained unit that processes input and produces output. This modular approach allows users to create complex flows by interconnecting various nodes._\n\nNode Types :\n\n1. **📱 Apps** \\- Integrate third-party applications into your flow.\n2. **🤖 AI** \\- Perform AI operations within your flow.\n3. **🛢️ Data** \\- Manipulate and transform data within your flow.\n4. **♾️ Logic** \\- Control the flow of execution in your flow.",
          "color": "blue",
          "nodeId": "stickyNoteNode",
          "nodeName": "Sticky Note",
          "nodeType": "stickyNoteNode"
        }
      },
      "type": "stickyNoteNode",
      "zIndex": -10,
      "dragging": false,
      "measured": {
        "width": 646,
        "height": 296
      },
      "position": {
        "x": -711.153989769601,
        "y": 64.44929392988769
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-kzv63mb30",
      "data": {
        "modes": {},
        "width": 645,
        "height": 121,
        "nodeId": "stickyNoteNode",
        "values": {
          "id": "sticky-kzv63mb30",
          "text": "# **💬 Flow response**\n\n---\n\n## _The final step of your flow can send output to an external system, which is particularly useful for flows initiated by triggers like Chat or GraphQL API integrations._",
          "color": "green",
          "nodeId": "stickyNoteNode",
          "nodeName": "Sticky Note",
          "nodeType": "stickyNoteNode"
        }
      },
      "type": "stickyNoteNode",
      "zIndex": -10,
      "dragging": false,
      "measured": {
        "width": 645,
        "height": 121
      },
      "position": {
        "x": -710.6880629678146,
        "y": 370.6310610504351
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-qnyx8cr1s",
      "data": {
        "modes": {},
        "width": 517,
        "height": 458,
        "nodeId": "stickyNoteNode",
        "values": {
          "id": "sticky-qnyx8cr1s",
          "text": "# **▶️ Try it out**\n\n---\n\n1. Chat Widget trigger allows you to run a flow whenever a users sends a message.  \n**🎨Customize Chat Widget appearance and behaviour inside the chat widget node**\n2. 🛠️ Configure AI Node for text Generation  \n_AI Nodes allows you to generate content and reasoning with LLMs_  \n   1. **⚙️Setup Model**  \n   2. **✍🏻Configure Prompt**  \n   3. ▶️**Test AI Node**\n3. ➕ Map the output to the chat response\n4. Run flow by clicking  \n# ▶️ **Test 👇🏻**\n5. Find Setup instructions to embed this widget on your website  \n# **〈〉 Setup 👆🏻**",
          "color": "yellow",
          "nodeId": "stickyNoteNode",
          "nodeName": "Sticky Note",
          "nodeType": "stickyNoteNode"
        }
      },
      "type": "stickyNoteNode",
      "zIndex": -10,
      "dragging": false,
      "measured": {
        "width": 517,
        "height": 458
      },
      "position": {
        "x": 268.19044217648616,
        "y": -33.369788167744034
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-note-609",
      "data": {
        "modes": {},
        "width": 644,
        "height": 235,
        "nodeId": "stickyNoteNode",
        "values": {
          "id": "sticky-note-609",
          "text": "# **⚡️ Flow Trigger**\n\n---\n\n_A trigger initiates the flow. It can be a built-in tool or an integration with an external application._\n\nTrigger Types:\n\n1. **📱App** \\- Initiate flow from an external application integration\n2. **🔌 Interface** \\- API / Webhook\n3. **💬 Widget** \\- Prebuilt UI component ( Chat, Search )\n\n---\n\n📖 Read Docs - [Flows](https://lamatic.ai/docs/flows)",
          "color": "purple",
          "nodeId": "stickyNoteNode",
          "nodeName": "Sticky Note",
          "nodeType": "stickyNoteNode"
        }
      },
      "type": "stickyNoteNode",
      "zIndex": -10,
      "dragging": false,
      "measured": {
        "width": 644,
        "height": 235
      },
      "position": {
        "x": -711.2333044557109,
        "y": -174.3119227329574
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "triggerNode_1",
      "data": {
        "modes": {},
        "nodeId": "chatTriggerNode",
        "schema": {},
        "values": {
          "id": "triggerNode_1",
          "chat": "",
          "domains": [
            "*"
          ],
          "nodeName": "Chat Widget",
          "chatConfig": {
            "botName": "Lamatic Bot",
            "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
            "position": "right",
            "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
            "displayMode": "popup",
            "placeholder": "Compose your message",
            "suggestions": [
              "What is lamatic?",
              "How do I add data to my chatbot?",
              "Explain this product to me"
            ],
            "errorMessage": "Oops! Something went wrong. Please try again.",
            "hideBranding": false,
            "primaryColor": "#ef4444",
            "headerBgColor": "#000000",
            "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
            "headerTextColor": "#FFFFFF",
            "showEmojiButton": true,
            "suggestionBgColor": "#f1f5f9",
            "userMessageBgColor": "#FEF2F2",
            "agentMessageBgColor": "#f1f5f9",
            "suggestionTextColor": "#334155",
            "userMessageTextColor": "#d12323",
            "agentMessageTextColor": "#334155"
          }
        },
        "trigger": true
      },
      "type": "triggerNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 0
      },
      "selected": false
    },
    {
      "id": "LLMNode_567",
      "data": {
        "label": "dynamicNode node",
        "modes": {},
        "nodeId": "LLMNode",
        "schema": {
          "_meta": "object",
          "images": "array",
          "tool_calls": "object",
          "generatedResponse": "string"
        },
        "values": {
          "id": "LLMNode_567",
          "tools": [],
          "prompts": [
            {
              "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
              "role": "system",
              "content": "You are an AI Assistant"
            },
            {
              "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
              "role": "user",
              "content": "You are William Shakespeare reborn — a master of iambic rhythm, rich metaphors, and eloquent verse.  \nWhen asked something , answer as a poem in the **style of Shakespeare**.\n\ninput:\n\n{{triggerNode_1.output.chatMessage}}"
            }
          ],
          "memories": "[]",
          "messages": "{{triggerNode_1.output.chatHistory}}",
          "nodeName": "Generate Text",
          "attachments": "",
          "credentials": "",
          "generativeModelName": {
            "type": "generator/text",
            "params": {},
            "model_name": "gpt-4o-mini",
            "credentialId": "2823d3c3-74b8-45a2-85da-2e45151955f8",
            "provider_name": "openai",
            "credential_name": "openai-1"
          }
        }
      },
      "type": "dynamicNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 130
      },
      "selected": false
    },
    {
      "id": "responseNode_triggerNode_1",
      "data": {
        "label": "Response",
        "modes": {},
        "nodeId": "chatResponseNode",
        "schema": {},
        "values": {
          "id": "responseNode_triggerNode_1",
          "content": "{{LLMNode_567.output.generatedResponse}}",
          "nodeName": "Chat Response",
          "references": "",
          "webhookUrl": "",
          "webhookHeaders": ""
        },
        "isResponseNode": true
      },
      "type": "responseNode",
      "measured": {
        "width": 216,
        "height": 93
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
      "id": "triggerNode_1-LLMNode_567",
      "type": "defaultEdge",
      "source": "triggerNode_1",
      "target": "LLMNode_567",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "LLMNode_567-responseNode_triggerNode_1",
      "type": "defaultEdge",
      "source": "LLMNode_567",
      "target": "responseNode_triggerNode_1",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "response-responseNode_triggerNode_1",
      "type": "responseEdge",
      "source": "triggerNode_1",
      "target": "responseNode_triggerNode_1",
      "sourceHandle": "to-response",
      "targetHandle": "from-trigger"
    }
  ],
  "status": "active",
  "created_at": "2026-03-20T04:40:58.351541+00:00"
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