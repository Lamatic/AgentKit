const flowConfig = {
    "id": "d28a5a76-8f9c-4169-91d8-ea4593bac0d2",
    "name": "Agentic Reasoning - Search",
    "nodes": [
      {
        "id": "sticky-note-609",
        "data": {
          "modes": {},
          "width": 453,
          "height": 197,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-note-609",
            "text": "### **⚡️ Flow Trigger**\n\n---\n\n### _A trigger initiates the flow. It can be a built-in tool or an integration with an external application._\n\n### Trigger Types:\n\n### **📱App** \\- Initiate flow from an external application integration\n\n### **🔌 Interface** \\- API / Webhook\n\n### **💬 Widget** \\- Prebuilt UI component ( Chat, Search )\n\n---\n\n📖 Read Docs - [Flows](https://lamatic.ai/docs/flows)",
            "color": "purple",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 453,
          "height": 197
        },
        "position": {
          "x": -552.9859671753022,
          "y": -11.90733425595539
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-qnyx8cr1s",
        "data": {
          "modes": {},
          "width": 322,
          "height": 893,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-qnyx8cr1s",
            "text": "### **▶️ Try it out**\n\n---\n\n1. **🔌 Trigger via GraphQL API**  \n### _This flow starts when an external service sends a POST request to your Lamatic GraphQL endpoint._  \n### Example payload:  \n### {  \n \"steps\": \"I'll begin by exploring how AI systems generate structured research queries and then perform real-time searches to gather relevant data.\"  \n}\n2. **🧠 Step 1: Generate Search Queries**  \n   * The **Instructor LLM Node** (`Generate JSON`) reads your `steps` paragraph.  \n   * It generates **3 unique, focused search queries** that will guide the research phase.\n3. **🔁 Step 2: Web Search Loop**  \n   * Each generated query is looped through using the **For Loop Node**.  \n   * The **Web Search Node** (`Serper API`) fetches the top results (5 per query).\n4. **🧩 Step 3: Collate Research**  \n   * The **Code Node** merges and flattens all search results.  \n   * Produces two arrays:  \n         * `research`: full organic search result objects  \n         * `links`: a simple list of URLs\n5. **💬 Step 4: API Response**  \n   * The GraphQL Response Node returns:  \n   ### {  \n   \"research\": \\[...\\],  \n   \"links\": \\[...\\]  \n   }  \n   * This can be consumed directly by your frontend, notebook, or another flow.\n\n---\n\n### **▶️ Test it 👇🏻**\n\n### **Option A:** Use the **Run Flow** button with a sample `steps` value.  \n**Option B:** Send a POST request to Lamatic’s GraphQL endpoint using **Postman** or **curl**.\n\n### curl -X POST https://api.lamatic.ai/graphql \\\\  \n\\-H \"Content-Type: application/json\" \\\\  \n\\-d '{  \n \"steps\": \"I’ll start by exploring how supervisors delegate sub-agents for research and evidence gathering.\"  \n}'",
            "color": "yellow",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 322,
          "height": 893
        },
        "position": {
          "x": -893.0343540441895,
          "y": -14.254590736808552
        },
        "selected": true,
        "draggable": true
      },
      {
        "id": "sticky-kzv63mb30",
        "data": {
          "modes": {},
          "width": 462,
          "height": 145,
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
          "width": 462,
          "height": 145
        },
        "position": {
          "x": -554.3936656690696,
          "y": 737.0658295318717
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-gm21yx26f",
        "data": {
          "modes": {},
          "width": 454,
          "height": 528,
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
          "width": 454,
          "height": 528
        },
        "position": {
          "x": -550.5597417245873,
          "y": 197.44255403182262
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
            "nodeName": "API Request",
            "responeType": "realtime",
            "advance_schema": "{\n  \"steps\": \"string\"\n}"
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
        "id": "InstructorLLMNode_445",
        "data": {
          "modes": {},
          "nodeId": "InstructorLLMNode",
          "schema": {},
          "values": {
            "id": "InstructorLLMNode_445",
            "tools": [],
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"queries\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"required\": true\n      },\n      \"description\": \"This is the collection of queries based on which the research will be prepared\"\n    }\n  }\n}",
            "prompts": [
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
                "role": "system",
                "content": "You are a **Search Query Generator Agent**.  \nYour task is to carefully read the reasoning steps provided (a single paragraph in first person that explains how the Supervisor Agent will approach the query). From that paragraph, you must generate exactly **3 unique, high-quality search queries** that would help gather the most relevant information.\n\n### Rules\n\n1. **Output only 3 search queries** — no more, no less.\n2. Each query should be **concise, specific, and directly tied** to the reasoning steps.\n3. The queries should cover **different aspects** of the problem, not duplicates.\n4. Phrase them as **natural web searches** that a user might type into Google or Bing.\n5. Do not repeat wording unnecessarily; prioritize variety to maximize coverage.\n6. Return them as a **JSON object** in this format:\n\n```\n{\n  \"queries\": [\n    \"string\",\n    \"string\",\n    \"string\"\n  ]\n}\n\n```\n\n### Example\n\n**Reasoning Input:**  \n\"I’ll treat this as a new query and start by searching reputable furniture guides, consumer reports, and expert reviews comparing leather and cotton sofas across durability, comfort, maintenance, stain resistance, pet/kid suitability, climate, sustainability, and cost of ownership. Then I’ll review care guides, warranty terms, and current price ranges, plus look into ethical/sustainability certifications for both materials. I’ll also check for common pitfalls (like cracking, pilling, fading, allergies) and real-world user feedback to validate trade-offs. Finally, I’ll prepare a structured side-by-side comparison with pros/cons, lifespan and maintenance expectations, and tailored recommendations based on different household needs and budgets.\"\n\n**Expected Output:**\n\n```\n{\n  \"queries\": [\n    \"leather vs cotton sofa durability comfort maintenance comparison\",\n    \"ethical sustainable upholstery certifications and eco-friendly sofa materials\",\n    \"real-world user reviews and common issues with leather and cotton sofas\"\n  ]\n}\n```"
              },
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
                "role": "user",
                "content": "STEPS : {{triggerNode_1.output.steps}}"
              }
            ],
            "memories": "[]",
            "messages": "[]",
            "nodeName": "Generate JSON",
            "attachments": "",
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
        "id": "forLoopNode_626",
        "data": {
          "modes": {},
          "nodeId": "forLoopNode",
          "schema": {
            "currentValue": "object"
          },
          "values": {
            "id": "forLoopNode_626",
            "wait": 0,
            "endValue": "10",
            "nodeName": "Loop",
            "increment": "1",
            "connectedTo": "forLoopEndNode_366",
            "iterateOver": "list",
            "initialValue": "0",
            "iteratorValue": "{{InstructorLLMNode_445.output.queries}}"
          }
        },
        "type": "forLoopNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 260
        },
        "draggable": false
      },
      {
        "id": "webSearchNode_441",
        "data": {
          "modes": {},
          "nodeId": "webSearchNode",
          "schema": {
            "output": "object"
          },
          "values": {
            "id": "webSearchNode_441",
            "page": 1,
            "type": "https://google.serper.dev/search",
            "query": "{{forLoopNode_626.output.currentValue}}",
            "country": "",
            "results": "5",
            "language": "",
            "location": "",
            "nodeName": "Web Search",
            "dateRange": "",
            "credentials": "Serper Basic Auth"
          }
        },
        "type": "dynamicNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 390
        },
        "draggable": false
      },
      {
        "id": "forLoopEndNode_366",
        "data": {
          "modes": {},
          "nodeId": "forLoopEndNode",
          "schema": {
            "loopOutput": "object"
          },
          "values": {
            "id": "forLoopEndNode_366",
            "nodeName": "Loop End",
            "connectedTo": "forLoopNode_626"
          }
        },
        "type": "forLoopEndNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 520
        },
        "draggable": false
      },
      {
        "id": "codeNode_201",
        "data": {
          "modes": {},
          "nodeId": "codeNode",
          "schema": {},
          "values": {
            "id": "codeNode_201",
            "code": "const researchArray = {{forLoopEndNode_366.output.loopOutput}};\n\nconst research = researchArray.flatMap((searchEntry) => {\n  return searchEntry.webSearchNode_441.output.output.organic;\n});\n\nconst links = research.map((item) => item.link);\n\noutput = {\n  research: research,\n  links: links\n};",
            "nodeName": "Collate Research"
          }
        },
        "type": "dynamicNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 650
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
            "headers": "{\"content-type\":\"application/json\"}",
            "retries": "0",
            "nodeName": "API Response",
            "webhookUrl": "",
            "retry_delay": "0",
            "outputMapping": "{\n  \"research\": \"{{codeNode_201.output.research}}\",\n  \"links\": \"{{codeNode_201.output.links}}\"\n}"
          }
        },
        "type": "responseNode",
        "measured": {
          "width": 216,
          "height": 93
        },
        "position": {
          "x": 0,
          "y": 780
        }
      }
    ],
    "edges": [
      {
        "id": "triggerNode_1-InstructorLLMNode_445",
        "type": "defaultEdge",
        "source": "triggerNode_1",
        "target": "InstructorLLMNode_445",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "InstructorLLMNode_445-forLoopNode_626",
        "type": "defaultEdge",
        "source": "InstructorLLMNode_445",
        "target": "forLoopNode_626",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "forLoopNode_626-webSearchNode_441",
        "data": {
          "condition": "Loop Start",
          "invisible": true
        },
        "type": "conditionEdge",
        "source": "forLoopNode_626",
        "target": "webSearchNode_441",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "webSearchNode_441-forLoopEndNode_366",
        "type": "defaultEdge",
        "source": "webSearchNode_441",
        "target": "forLoopEndNode_366",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "forLoopEndNode_366-codeNode_201",
        "type": "defaultEdge",
        "source": "forLoopEndNode_366",
        "target": "codeNode_201",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "codeNode_201-responseNode_triggerNode_1",
        "type": "defaultEdge",
        "source": "codeNode_201",
        "target": "responseNode_triggerNode_1",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "forLoopNode_626-forLoopEndNode_366",
        "data": {
          "condition": "Loop",
          "invisible": false
        },
        "type": "loopEdge",
        "source": "forLoopNode_626",
        "target": "forLoopEndNode_366",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "forLoopEndNode_366-forLoopNode_626",
        "data": {
          "condition": "Loop",
          "invisible": true
        },
        "type": "loopEdge",
        "source": "forLoopEndNode_366",
        "target": "forLoopNode_626",
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
    "created_at": "2025-11-04T16:50:17.220015+00:00"
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