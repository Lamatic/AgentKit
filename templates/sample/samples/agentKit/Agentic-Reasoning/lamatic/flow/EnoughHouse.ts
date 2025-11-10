const flowConfig = {
    "id": "b0343abc-d6c3-409e-8680-63b7cfce0604",
    "name": "Agent Reasoning - Generate",
    "nodes": [
      {
        "id": "sticky-gm21yx26f",
        "data": {
          "modes": {},
          "width": 469,
          "height": 162,
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
        "dragging": false,
        "measured": {
          "width": 469,
          "height": 162
        },
        "position": {
          "x": -572.6894543200675,
          "y": 153.35810090274606
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-kzv63mb30",
        "data": {
          "modes": {},
          "width": 469,
          "height": 135,
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
        "dragging": false,
        "measured": {
          "width": 469,
          "height": 135
        },
        "position": {
          "x": -572.2235275182811,
          "y": 328.3629397026828
        },
        "selected": false,
        "draggable": true
      },
      {
        "id": "sticky-qnyx8cr1s",
        "data": {
          "modes": {},
          "width": 354,
          "height": 478,
          "nodeId": "stickyNoteNode",
          "values": {
            "id": "sticky-qnyx8cr1s",
            "text": "### **▶️ Try it out**\n\n---\n\n1. **🔌 Trigger via GraphQL API**  \n### This flow begins when you send a **POST** request to Lamatic’s GraphQL endpoint with a **query** and its corresponding **research** array.  \n### **Example Input:**  \n### {  \n \"query\": \"What are the key provisions of the EU AI Act?\",  \n \"research\": \\[  \n \\[  \n {  \n \"title\": \"EU AI Act Overview\",  \n \"link\": \"https://ec.europa.eu/ai-act\",  \n \"snippet\": \"The AI Act establishes harmonized rules for artificial intelligence...\",  \n \"date\": \"2024-03-10\",  \n \"position\": \"1\"  \n },  \n {  \n \"title\": \"Key Provisions of EU AI Act\",  \n \"link\": \"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021PC0206\",  \n \"snippet\": \"Defines AI system categories, compliance obligations, and prohibited practices...\",  \n \"date\": \"2024-03-15\",  \n \"position\": \"2\"  \n }  \n \\]  \n \\]  \n}\n\n---\n\n1. **🧠 Step: Generate Final Markdown**  \n   * The **AI Node (Generate Text)** takes your `query` and `research` inputs.  \n   * It produces a **well-structured, markdown-formatted article** based entirely on the provided research.  \n   * The output includes:  \n         * Clean section titles  \n         * Inline `[Title](URL)` references  \n         * Even spacing and paragraph formatting\n\n---\n\n1. **💬 Flow Response**  \n### The **GraphQL Response Node** returns:  \n### {  \n \"answer\": \"# EU AI Act Overview\\\\n\\\\n## Introduction\\\\nThe European Union AI Act...\"  \n}  \n### The `answer` field contains the **final article** ready to render directly in markdown.\n\n---\n\n1. **▶️ Test it 👇🏻**  \n### Run the flow manually with a sample payload  \n**or** use cURL / Postman to call your Lamatic endpoint:  \n### curl -X POST https://api.lamatic.ai/graphql \\\\  \n\\-H \"Content-Type: application/json\" \\\\  \n\\-d '{  \n \"query\": \"Summarize the GDPR key principles\",  \n \"research\": \\[\\[{ \"title\": \"GDPR Overview\", \"link\": \"https://gdpr.eu/\", \"snippet\": \"The GDPR is the EU’s data protection law...\", \"date\": \"2024-02-10\", \"position\": \"1\" }\\]\\]  \n}'\n\n---\n\n### 🧭 _Inspect_ `LLMNode_168.output.generatedResponse` _in your run preview to view the formatted markdown article._",
            "color": "yellow",
            "nodeId": "stickyNoteNode",
            "nodeName": "Sticky Note",
            "nodeType": "stickyNoteNode"
          }
        },
        "type": "stickyNoteNode",
        "dragging": false,
        "measured": {
          "width": 354,
          "height": 478
        },
        "position": {
          "x": -941.3354092710149,
          "y": -12.806964036752447
        },
        "selected": true,
        "draggable": true
      },
      {
        "id": "sticky-note-609",
        "data": {
          "modes": {},
          "width": 470,
          "height": 160,
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
        "dragging": false,
        "measured": {
          "width": 470,
          "height": 160
        },
        "position": {
          "x": -574.2262904319621,
          "y": -12.52704447087089
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
            "advance_schema": "{\n  \"query\": \"string\",\n  \"research\": [\n    [\n      {\n        \"title\": \"string\",\n        \"link\": \"string\",\n        \"snippet\": \"string\",\n        \"date\": \"string\",\n        \"position\": \"string\"\n      }\n    ]\n  ]\n}"
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
        "id": "LLMNode_168",
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
            "id": "LLMNode_168",
            "tools": [],
            "prompts": [
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
                "role": "system",
                "content": "You are an **AI Expert Editor**.  \nYou will be given:\n\n1. A **user query**\n2. A collection of **search results (research contexts)**\n\nYour job is to produce a **final markdown-formatted answer**.\n\n### Strict Formatting Rules:\n\n* Use **Markdown heading syntax only**:  \n   * `#` for the main title (Overview or the main subject).  \n   * `##` for section headings (e.g., Early Life, Career, etc.).  \n   * `###` for sub-sections if needed.\n* Do **not** use underlines (`---` or `===`) for headings.\n* Structure the answer like a clean, well-written article or blog post.\n* Leave blank lines or space by adding `\\n` and making sure it's formatted well and evenly spaced.\n* Embed links inline using `[Title](URL)` — never raw links.\n* Base the **main content ONLY on search results**.\n* Make sure your final answer is a proper well edited blog with proper spacing in markdown format which can be displayed as it is.\n* Make sure you have referenced each link you use in your answer properly.\n\n### Example Skeleton (must follow this structure)\n\n```\n# Main Topic Title\n\n## Section 1 Title\nContent with inline references like [Wikipedia](https://wikipedia.org).\n\n## Section 2 Title\nContent here with more references.\n\n...\n```\n\n### Output Rules:\n\n* The output must always be in **valid markdown** (not JSON).\n* The supervisor will wrap your answer in JSON later, so you only need to output markdown"
              },
              {
                "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
                "role": "user",
                "content": "QUERY : {{triggerNode_1.output.query}}\n\nRESEARCH : {{triggerNode_1.output.research}}"
              }
            ],
            "memories": "[]",
            "messages": "[]",
            "nodeName": "Generate Text",
            "attachments": "",
            "credentials": "",
            "generativeModelName": {
              "type": "generator/text",
              "params": {},
              "model_name": "gpt-4o-2024-08-06",
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
            "headers": "{\"content-type\":\"application/json\"}",
            "retries": "0",
            "nodeName": "API Response",
            "webhookUrl": "",
            "retry_delay": "0",
            "outputMapping": "{\n  \"answer\": \"{{LLMNode_168.output.generatedResponse}}\"\n}"
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
        "id": "triggerNode_1-LLMNode_168",
        "type": "defaultEdge",
        "source": "triggerNode_1",
        "target": "LLMNode_168",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      },
      {
        "id": "LLMNode_168-responseNode_triggerNode_1",
        "type": "defaultEdge",
        "source": "LLMNode_168",
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
    "created_at": "2025-11-04T16:58:14.420622+00:00"
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