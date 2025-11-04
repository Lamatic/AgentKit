const flowConfig = {
    "id": "95236a11-3502-460c-8e6e-3900024b90a3",
    "name": "Agentic Reasoning - Steps",
    "nodes": [
      {
        "id": "sticky-gm21yx26f",
        "data": {
          "modes": {},
          "width": 443,
          "height": 205,
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
          "width": 443,
          "height": 205
        },
        "position": {
          "x": -558.8531451598642,
          "y": 145.57633427649597
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-kzv63mb30",
        "data": {
          "modes": {},
          "width": 441,
          "height": 134,
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
          "width": 442,
          "height": 134
        },
        "position": {
          "x": -559.8587891973251,
          "y": 358.96860685022926
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-qnyx8cr1s",
        "data": {
          "modes": {},
          "width": 356,
          "height": 512,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-qnyx8cr1s",
            "text": "### **▶️ Try it out**\n\n---\n\n1. **🔌 Trigger via GraphQL API**\n\n### _This flow starts when an external service sends a POST request to your Lamatic GraphQL endpoint._\n\n### Example payload:\n\n### {\n\n### \"steps\": \"I'll begin by exploring how AI systems generate structured research queries and then perform real-time searches to gather relevant data.\"  \n} 2\\. **🧠 Step 1: Generate Search Queries**\n\n* The **Instructor LLM Node** (`Generate JSON`) reads your `steps` paragraph.\n* It generates **3 unique, focused search queries** that will guide the research phase.\n1. **🔁 Step 2: Web Search Loop**  \n   * Each generated query is looped through using the **For Loop Node**.  \n   * The **Web Search Node** (`Serper API`) fetches the top results (5 per query).\n2. **🧩 Step 3: Collate Research**  \n   * The **Code Node** merges and flattens all search results.  \n   * Produces two arrays:  \n   \\* `research`: full organic search result objects  \n   \\* `links`: a simple list of URLs\n3. **💬 Step 4: API Response**  \n   * The GraphQL Response Node returns:  \n### {  \n### \"research\": \\[...\\],  \n\"links\": \\[...\\]  \n}  \n   * This can be consumed directly by your frontend, notebook, or another flow.\n\n---\n\n### **▶️ Test it 👇🏻**\n\n### **Option A:** Use the **Run Flow** button with a sample `steps` value.\n\n### **Option B:** Send a POST request to Lamatic’s GraphQL endpoint using **Postman** or **curl**.\n\n### curl -X POST <https://api.lamatic.ai/graphql> \\\\\n\n### \\-H \"Content-Type: application/json\" \\\\  \n\\-d '{  \n\"steps\": \"I’ll start by exploring how supervisors delegate sub-agents for research and evidence gathering.\"  \n}'",
            "color": "yellow",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 356,
          "height": 512
        },
        "position": {
          "x": -926.1363703936187,
          "y": -22.691332356679425
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-note-609",
        "data": {
          "modes": {},
          "width": 437,
          "height": 162,
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
          "width": 437,
          "height": 162
        },
        "position": {
          "x": -558.4893779607153,
          "y": -20.966482834383157
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "triggerNode_1",
        "data": {
          "modes": {},
          "nodeId": "graphqlNode",
          "schema": {
            "sampleOutput": "string"
          },
          "values": {
            "id": "triggerNode_1",
            "headers": "",
            "retries": "0",
            "nodeName": "API Request",
            "webhookUrl": "",
            "responeType": "realtime",
            "retry_deplay": "0",
            "advance_schema": "{\n  \"query\": \"string\",\n  \"history\": [\n    {\n      \"role\": \"string\",\n      \"message\": \"string\"\n    }\n  ]\n}"
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
        }
      },
      {
        "id": "LLMNode_680",
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
            "id": "LLMNode_680",
            "tools": [],
            "prompts": [
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
                "role": "system",
                "content": "You are a Supervisor Agent step builder. For every user query, respond only with a single, simple paragraph in first person that explains what you are going to do to solve the query.\n\n---\n\n**Rules**\n\n* Always write in first person (e.g., “I will first check…”, “Then I’ll gather…”).\n* Keep it natural, concise, and readable (2–5 sentences).\n* Do not give the actual answer — only describe the process.\n* Mention that you will search, review information, and then prepare a structured final response.\n* If the query is related to the previous one, note that you’ll build on it. If not, note that you’ll treat it as new.\n* If you are given history, always assume it is relevant and the current query is connected to the last one.\n* **Explicitly restate the past topics, entities, or context (as nouns) that the user is referring to before describing your next steps, so the research team can follow.**\n* Make sure that you mention these past references naturally in your process description.\n\n---\n\n**Example with New Query**\n\nUser Query: How should I pack for my Jaipur trip next week?  \nStep-Thinking Output:  \n\"I’ll start by checking the latest weather forecast for Jaipur next week and looking into reliable travel resources on what to pack for that climate. Then I’ll gather advice on cultural considerations and common travel essentials to make sure nothing important is missed. Finally, I’ll organize everything into a clear guide so you know exactly what to bring for your trip.\"\n\n**Example with history**\n\nPrevious Query: Compare leather sofas vs fabric sofas\n\nAssistant Answer : Leather vs Fabric Sofas: A Comprehensive Comparison Choosing between....  \nCurrent Query: _How about cotton sofas compared to those two?_  \nStep-Thinking Output:  \n\"Since you mentioned sofa materials for durability earlier and are now asking specifically about cotton sofas compared to the other two materials we discussed (i.e. leather and fabric), I will start by reviewing the key properties of cotton as a sofa material. Then, I’ll compare those properties with the two previously mentioned materials in terms of durability, comfort, and maintenance. Finally, I’ll organize this into a structured comparison so you can clearly see how cotton stacks up against the leather and fabric sofas\""
              },
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
                "role": "user",
                "content": "USER QUERY : {{triggerNode_1.output.query}}"
              }
            ],
            "memories": "[]",
            "messages": "{{triggerNode_1.output.history}}",
            "nodeName": "Generate Text",
            "attachments": "",
            "credentials": "",
            "generativeModelName": {
              "type": "generator/text",
              "params": {},
              "model_name": "gpt-4o-mini",
              "credentialId": "6d70d145-9f23-4e29-b984-98ece28c56fd",
              "provider_name": "openai",
              "credential_name": "LAMATIC_OPENAI_API_KEY"
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
        "draggable": false
      },
      {
        "id": "responseNode_triggerNode_1",
        "data": {
          "modes": {},
          "nodeId": "graphqlResponseNode",
          "schema": {},
          "values": {
            "id": "responseNode_triggerNode_1",
            "nodeName": "API Response",
            "outputMapping": "{\n  \"steps\": \"{{LLMNode_680.output.generatedResponse}}\"\n}"
          }
        },
        "type": "responseNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 260
        }
      }
    ],
    "edges": [
      {
        "id": "triggerNode_1-LLMNode_680",
        "type": "defaultEdge",
        "source": "triggerNode_1",
        "target": "LLMNode_680",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "LLMNode_680-responseNode_triggerNode_1",
        "type": "defaultEdge",
        "source": "LLMNode_680",
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
    "created_at": "2025-11-04T16:43:37.779036+00:00"
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