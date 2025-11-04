const flowConfig = {
    "id": "4887fcc1-8a38-4105-b0fa-dae605a1abbf",
    "name": "Slack RAG Bot",
    "nodes": [
      {
        "id": "sticky-note-609",
        "data": {
          "modes": {},
          "width": 539,
          "height": 179,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-note-609",
            "text": "### **⚡️ Flow Trigger**\n\n---\n\n### _A trigger initiates the flow. It can be a built-in tool or an integration with an external application._\n\n### Trigger Types:\n\n### **📱App** \\- Initiate flow from an external application integration\n\n### **🔌 Interface** \\- API / Webhook\n\n### **💬 Widget** \\- Prebuilt UI component ( Chat, Search )\n\n---\n\n### 📖 Read Docs - [Flows](https://lamatic.ai/docs/flows)",
            "color": "purple",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 539,
          "height": 179
        },
        "position": {
          "x": -625.1984516940639,
          "y": -97.95725752075595
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-qnyx8cr1s",
        "data": {
          "modes": {},
          "width": 381,
          "height": 533,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-qnyx8cr1s",
            "text": "### **▶️ Try it out**\n\n1. **💬 Trigger via Slack Command**  \n### _This flow starts when a user sends a message in Slack using the defined command (e.g.,_ `/ask`_)._  \nThe trigger node captures the user's query and sends it into the flow.  \n### Example:\n\n### /ask What are the key points from our sales handbook?  \n\n1. **🧠 RAG Node**  \n### _Your query is processed through the RAG pipeline._\n\n### The text from Slack (`{{triggerNode_1.output.text}}`) becomes the **query**.\n\n### The system searches your connected **Vector DB (TestDB)** for relevant context documents.\n\n### The retrieved content is passed to the **LLM (GPT-4o-mini)** for a context-aware response.\n\n1. **💌 Slack Response Node**\n\n### _The generated answer is automatically posted back to the same Slack channel_  \n→ Using `{{RAGNode_555.output.modelResponse}}` as the message text.\n\n---\n\n### **▶️ Test it 👇🏻**\n\n### **Option A:** Type `/ask <your query>` directly in the configured Slack channel  \n**Option B:** Use the “Run Flow” button to simulate a manual trigger\n\n---\n\n### 🧭 \\_Once it runs, check the Slack channel to see the model’s response posted in real-time.",
            "color": "yellow",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 381,
          "height": 533
        },
        "position": {
          "x": -1014.8422059300116,
          "y": -96.96605785668953
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-kzv63mb30",
        "data": {
          "modes": {},
          "width": 552,
          "height": 111,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-kzv63mb30",
            "text": "### **💬 Flow response**\n\n---\n\n### _The final step of your flow can send output to an external system, which is particularly useful for flows initiated by triggers like Chat or GraphQL API integrations._",
            "color": "green",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 552,
          "height": 111
        },
        "position": {
          "x": -626.7369160490516,
          "y": 326.7055300017479
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-gm21yx26f",
        "data": {
          "modes": {},
          "width": 542,
          "height": 211,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-gm21yx26f",
            "text": "### **➕ Nodes**\n\n---\n\n### _Nodes are the fundamental building blocks of a flow. Each node serves a specific purpose, acting as a self-contained unit that processes input and produces output. This modular approach allows users to create complex flows by interconnecting various nodes._\n\n### Node Types :\n\n### **📱 Apps** \\- Integrate third-party applications into your flow.\n\n### **🤖 AI** \\- Perform AI operations within your flow.\n\n### **🛢️ Data** \\- Manipulate and transform data within your flow.\n\n### **♾️ Logic** \\- Control the flow of execution in your flow.",
            "color": "blue",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 542,
          "height": 211
        },
        "position": {
          "x": -624.4752297482132,
          "y": 90.03433994003484
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "triggerNode_1",
        "data": {
          "modes": {
            "channelName": "list"
          },
          "nodeId": "slackNode",
          "schema": {
            "ok": "string",
            "ts": "string",
            "error": "string",
            "channel": "string",
            "message": "string",
            "warning": "string",
            "response_metadata": "string"
          },
          "values": {
            "id": "triggerNode_1",
            "command": "ask",
            "nodeName": "Slack Trigger",
            "channelName": "C08E8M9KWDV",
            "credentials": "Slack OAuth",
            "immediateResponseData": "Loading..."
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
        "id": "RAGNode_555",
        "data": {
          "logic": [],
          "modes": {},
          "nodeId": "RAGNode",
          "schema": {
            "_meta": "object",
            "references": "string",
            "modelResponse": "string"
          },
          "values": {
            "id": "RAGNode_555",
            "limit": 10,
            "filters": "",
            "prompts": [
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
                "role": "system",
                "content": "You are a slack bot trained on documents. You are suppose to answer based on the user's current query and context documents given to you only. "
              },
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
                "role": "user",
                "content": "CURRENT QUERY : {{triggerNode_1.output.text}}"
              }
            ],
            "memories": "[]",
            "messages": "[]",
            "nodeName": "RAG",
            "vectorDB": [
              "TestDB"
            ],
            "certainty": "0.5",
            "queryField": "{{triggerNode_1.output.text}}",
            "embeddingModelName": {
              "type": "embedder/text",
              "params": {},
              "model_name": "text-embedding-ada-002",
              "credentialId": "0fc2f9ae-4a22-41e3-b63a-3e7db8902a9e",
              "provider_name": "openai",
              "credential_name": "OPENAI_KEY"
            },
            "generativeModelName": [
              {
                "type": "generator/text",
                "params": {},
                "configName": "default",
                "model_name": "gpt-4o-mini",
                "credentialId": "0fc2f9ae-4a22-41e3-b63a-3e7db8902a9e",
                "provider_name": "openai",
                "credential_name": "OPENAI_KEY"
              }
            ]
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
        "id": "slackNode_103",
        "data": {
          "logic": [],
          "modes": {
            "channelName": "list"
          },
          "nodeId": "slackNode",
          "schema": {
            "ok": "string",
            "ts": "string",
            "error": "string",
            "channel": "string",
            "message": "string",
            "warning": "string",
            "response_metadata": "string"
          },
          "values": {
            "id": "slackNode_103",
            "text": "{{RAGNode_555.output.modelResponse}}",
            "action": "postMessage",
            "nodeName": "Slack",
            "channelName": "C08E8M9KWDV",
            "credentials": "Slack OAuth"
          }
        },
        "type": "dynamicNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 260
        },
        "selected": false
      },
      {
        "id": "plus-node-addNode_683384",
        "data": {
          "modes": {},
          "nodeId": "addNode",
          "values": {
            "nodeName": ""
          }
        },
        "type": "addNode",
        "measured": {
          "width": 218,
          "height": 100
        },
        "position": {
          "x": 0,
          "y": 390
        }
      }
    ],
    "edges": [
      {
        "id": "triggerNode_1-RAGNode_555",
        "type": "defaultEdge",
        "source": "triggerNode_1",
        "target": "RAGNode_555",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "RAGNode_555-slackNode_103",
        "type": "defaultEdge",
        "source": "RAGNode_555",
        "target": "slackNode_103",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "slackNode_103-plus-node-addNode_683384",
        "type": "defaultEdge",
        "source": "slackNode_103",
        "target": "plus-node-addNode_683384",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      }
    ],
    "status": "active",
    "created_at": "2025-11-04T07:26:30.391529+00:00"
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