const flowConfig = {
  "id": "51bef2c3-e32e-4fa8-a695-3a38656c3a2e",
  "name": "5 - Multi Agent",
  "edges": [
    {
      "id": "triggerNode_1-agentNode_156-325",
      "type": "defaultEdge",
      "source": "triggerNode_1",
      "target": "agentNode_156",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "agentLoopEndNode_954-plus-node-addNode_986345-764",
      "type": "defaultEdge",
      "source": "agentLoopEndNode_954",
      "target": "plus-node-addNode_986345",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "agentNode_156-firecrawlNode_858-259",
      "data": {
        "condition": "Scraper"
      },
      "type": "conditionEdge",
      "source": "agentNode_156",
      "target": "firecrawlNode_858",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "firecrawlNode_858-agentLoopEndNode_954-569",
      "type": "defaultEdge",
      "source": "firecrawlNode_858",
      "target": "agentLoopEndNode_954",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "agentNode_156-InstructorLLMNode_309-281",
      "data": {
        "condition": "emailGenerator"
      },
      "type": "conditionEdge",
      "source": "agentNode_156",
      "target": "InstructorLLMNode_309",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "InstructorLLMNode_309-agentLoopEndNode_954-629",
      "type": "defaultEdge",
      "source": "InstructorLLMNode_309",
      "target": "agentLoopEndNode_954",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "agentNode_156-gmailNode_600-336",
      "data": {
        "condition": "emailDelivery"
      },
      "type": "conditionEdge",
      "source": "agentNode_156",
      "target": "gmailNode_600",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "gmailNode_600-agentLoopEndNode_954-649",
      "type": "defaultEdge",
      "source": "gmailNode_600",
      "target": "agentLoopEndNode_954",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "agentLoopEndNode_954-agentNode_156-455",
      "data": {
        "condition": "Agent Loop End"
      },
      "type": "agentLoopEdge",
      "source": "agentLoopEndNode_954",
      "target": "agentNode_156",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "agentNode_156-agentLoopEndNode_954-445",
      "data": {
        "condition": "Agent Loop End",
        "invisible": true
      },
      "type": "agentLoopEdge",
      "source": "agentNode_156",
      "target": "agentLoopEndNode_954",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    }
  ],
  "status": "active",
  "created_at": "2026-07-09T07:52:39.990793+00:00",
  "trigger_id": null,
  "nodes": [
    {
      "id": "sticky-note-291",
      "data": {
        "width": 515,
        "height": 419,
        "nodeId": "stickyNoteNode",
        "values": {
          "text": "# 🤖 Multi-Agent System With **Supervisor**\n\n---\n\nThe **Supervisor Agent** is a specialized AI agent in Lamatic.ai designed to manage and coordinate multi-agent flow. It serves as the central hub, collecting input, maintaining structured memory, and orchestrating the execution of sub-agents based on predefined logic. This ensures an efficient, iterative process for dynamic AI-powered applications such as structured decision-making systems and task automation.\n\n**Core Functionalities**\n\n1. **Multi-Agent Coordination** \\- Dynamically routes tasks across multiple agents.\n2. **Memory Retention** \\- Remembers previous interactions, reducing redundant queries.\n3. **Agent Path Definition** \\- Supports branching logic for flexible flow.\n4. **Loop Control** \\- Enables iterative execution with stopping conditions.\n\n---\n\n📖 Read the Docs - [Supervisor](https://lamatic.ai/docs/agents/supervisor-agent)",
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
        "width": 515,
        "height": 419
      },
      "position": {
        "x": -141.42421996374094,
        "y": -190.34133555717068
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-note-736",
      "data": {
        "width": 273,
        "height": 219,
        "nodeId": "stickyNoteNode",
        "values": {
          "text": "# 🪝Webhooks\n\n---\n\nUse built in Webhooks for asynchronous long running tasks. You can connect webhooks to external systems and third-party apps and trigger flow automation with it.",
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
        "width": 273,
        "height": 219
      },
      "position": {
        "x": 422.26084728610806,
        "y": -190.1482861706366
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-note-834",
      "data": {
        "width": 561,
        "height": 608,
        "nodeId": "stickyNoteNode",
        "values": {
          "text": "# **▶️ Try it out**\n\n---\n\n1. 🛠️ Configure Supervisor Node with instructions on how to complete the tasks  \n   1. **⚙️Setup Model**  \n   2. **✍🏻Configure Prompt** with instructions on how to achieve a tasks and what path to follow  \n   3. **Set Agent Paths** to give supervisor access to different tool chains  \n   4. Optional - Set Stop words and Max Iteration to force stop Agent at any time.  \n   5. ▶️**Test AI Node**\n2. Setup Firecrawl  \n_Firecrawl allows you to crawl any website and pass the data as markfown._  \n   1. Setup Firecrawl Credentials  \n   2. Pass the URL\n3. Setup Gmail  \n_Built in Gmail integration allows you to send emails._  \n   1. Setup Gmail Credentials  \n   2. Pass the Data\n4. Run flow by clicking  \n# ▶️ **Test 👇🏻**\n5. Find Setup instructions to connect webhook in your application  \n# **〈〉 Setup 👆🏻**",
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
        "width": 561,
        "height": 608
      },
      "position": {
        "x": 1173.4133594139666,
        "y": -29.05303361291009
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "triggerNode_1",
      "data": {
        "modes": {},
        "nodeId": "webhookTriggerNode",
        "values": {
          "nodeName": "Webhook"
        },
        "trigger": true
      },
      "type": "triggerNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 450,
        "y": 0
      },
      "selected": false
    },
    {
      "id": "agentNode_156",
      "data": {
        "label": "Agent Supervisor",
        "modes": {},
        "nodeId": "agentNode",
        "values": {
          "tools": [],
          "agents": [
            {
              "name": "Scraper",
              "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"url\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"leads email address\"\n    }\n  }\n}",
              "description": "This will scrape a leads portfolio website"
            },
            {
              "name": "emailGenerator",
              "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"scraped_data\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"scraped data from leads personal website\"\n    }\n  }\n}",
              "description": "This will generate personalised email for the lead based on their scraped website"
            },
            {
              "name": "emailDelivery",
              "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"subject\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"emailBody\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"recipientEmail\": {\n      \"type\": \"string\",\n      \"required\": true\n    }\n  }\n}",
              "description": "sends personalised email to the lead"
            }
          ],
          "prompts": [
            {
              "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
              "role": "system",
              "content": "You are an AI Assistant"
            },
            {
              "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
              "role": "user",
              "content": "You are the **supervisor agent** for a **lead personalization email system** triggered via webhook this is the data you will get from webhook {{triggerNode_1.output}}. Your job is to coordinate two sub-agents in this exact order:\n\n1. **Scraper Agent:** Extract key facts from the lead’s personal website (role, company, recent work, interests, etc.). Only use verified public info.\n2. **Email Generator Agent:** Use the scraped facts and lead details to craft a short, personalized outreach email (subject and email body).\n3. **Email Delivery Agent:** Use the email subject and body and send the personalised email to the user  \n**Rules:**  \n   * Always follow the order: Scraper → Email Generator → Email Delivery  \n   * Never invent details; skip personalization if no data is found."
            }
          ],
          "messages": "[]",
          "nodeName": "Supervisor",
          "stopWord": "",
          "connectedTo": "agentLoopEndNode_954",
          "maxIterations": 5,
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
      "type": "agentNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 450,
        "y": 130
      },
      "selected": false
    },
    {
      "id": "gmailNode_600",
      "data": {
        "label": "New",
        "logic": [],
        "modes": {},
        "nodeId": "gmailNode",
        "values": {
          "cc": "",
          "id": "gmailNode_600",
          "bcc": "",
          "body": "{{agentNode_156.output.emailBody}}",
          "action": "GMAIL_SEND_EMAIL",
          "is_html": false,
          "subject": "{{agentNode_156.output.subject}}",
          "to_user": "",
          "nodeName": "Gmail",
          "from_user": "",
          "credentials": "Gmail OAuth2",
          "max_results": 10,
          "recipient_email": "{{agentNode_156.output.recipientEmail}}"
        }
      },
      "type": "dynamicNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 900,
        "y": 260
      },
      "selected": false
    },
    {
      "id": "firecrawlNode_858",
      "data": {
        "label": "New",
        "logic": [],
        "modes": {
          "webhook": "list"
        },
        "nodeId": "firecrawlNode",
        "values": {
          "id": "firecrawlNode_858",
          "url": "{{agentNode_156.output.url}}",
          "mode": "syncSingleScrape",
          "urls": "",
          "delay": 0,
          "limit": 10,
          "mobile": false,
          "search": "",
          "timeout": 30000,
          "waitFor": 2000,
          "webhook": "",
          "nodeName": "Firecrawl",
          "crawlDepth": 1,
          "crawlLimit": 10,
          "credentials": "firecrawl lamatic",
          "excludePath": [],
          "excludeTags": [],
          "includePath": [],
          "includeTags": [],
          "sitemapOnly": false,
          "crawlSubPages": false,
          "ignoreSitemap": false,
          "webhookEvents": [
            "completed",
            "failed",
            "page",
            "started"
          ],
          "changeTracking": false,
          "webhookHeaders": "",
          "onlyMainContent": false,
          "webhookMetadata": "",
          "includeSubdomains": false,
          "maxDiscoveryDepth": 1,
          "allowBackwardLinks": false,
          "allowExternalLinks": false,
          "skipTlsVerification": false,
          "ignoreQueryParameters": true
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
      "id": "InstructorLLMNode_309",
      "data": {
        "label": "New",
        "logic": [],
        "modes": {},
        "nodeId": "InstructorLLMNode",
        "values": {
          "id": "InstructorLLMNode_309",
          "tools": [],
          "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"subject\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"email_body\": {\n      \"type\": \"string\",\n      \"required\": true\n    }\n  }\n}",
          "prompts": [
            {
              "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
              "role": "system",
              "content": "### \n\nYou are an expert cold email writer. Your job is to write short, personalized emails that invite professionals to join an AI-focused community."
            },
            {
              "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
              "role": "user",
              "content": "**Guidelines:**\n\n* Use only the data provided about the lead (no made-up details).\n* Keep the tone as specified professional\n* Structure output as:  \n   * **subject**  \n   * **Email body (80–180 words)**\n* Personalize using the lead’s background or interests and mention one of their best achievement or projects mentioned in the scraped data(ignore if achievements not available) .\n* Clearly communicate the **value of joining the AI community** (e.g., networking, early access to AI tools, learning opportunities).\n* Include a clear **call-to-action** to join.\n* Return only the formatted email content — no explanations.\n* in place of my name use \"lamatic\"\n\ninput:  \n{{agentNode_156.output.scraped_data}}"
            }
          ],
          "memories": "[]",
          "messages": "[]",
          "nodeName": "Generate JSON",
          "attachments": "",
          "generativeModelName": [
            {
              "type": "generator/text",
              "params": {},
              "configName": "default",
              "model_name": "gpt-4o-mini",
              "credentialId": "2823d3c3-74b8-45a2-85da-2e45151955f8",
              "provider_name": "openai",
              "credential_name": "openai-1"
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
        "x": 450,
        "y": 260
      },
      "selected": false
    },
    {
      "id": "agentLoopEndNode_954",
      "data": {
        "label": "agentLoopEndNode node",
        "modes": {},
        "nodeId": "agentLoopEndNode",
        "values": {
          "nodeName": "Agent Loop End",
          "connectedTo": "agentNode_156"
        }
      },
      "type": "agentLoopEndNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 450,
        "y": 390
      },
      "selected": false
    },
    {
      "id": "plus-node-addNode_986345",
      "data": {
        "label": "+",
        "nodeId": "addNode",
        "values": {}
      },
      "type": "addNode",
      "measured": {
        "width": 216,
        "height": 100
      },
      "position": {
        "x": 450,
        "y": 520
      },
      "selected": false
    }
  ]
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