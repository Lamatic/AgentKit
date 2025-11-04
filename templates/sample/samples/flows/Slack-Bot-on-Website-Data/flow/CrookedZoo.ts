const flowConfig = {
  "id": "f5dfbdf8-0e08-40f9-9ff2-1091399afc51",
  "name": "Scrapping Websites Indexation",
  "nodes": [
    {
      "id": "sticky-gm21yx26f",
      "data": {
        "modes": {},
        "width": 683,
        "height": 889,
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
        "width": 683,
        "height": 889
      },
      "position": {
        "x": -847.0386648188429,
        "y": 280.92513207360435
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-kzv63mb30",
      "data": {
        "modes": {},
        "width": 689,
        "height": 185,
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
        "width": 689,
        "height": 185
      },
      "position": {
        "x": -857.0805062057627,
        "y": 1193.344780096305
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-qnyx8cr1s",
      "data": {
        "modes": {},
        "width": 610,
        "height": 878,
        "nodeId": "stickyNoteNode",
        "values": {
          "id": "sticky-qnyx8cr1s",
          "text": "# **▶️ Try it out**\n\n1. **Trigger via GraphQL / API**  \n\\_This flow is initiated using an API request. Pass an array of URLs to begin processing:  \n```json  \n{  \n\"urls\": [\"https://example.com/page1\", \"https://example.com/page2\"]  \n}  \n```\n2. **🔍 Firecrawl Node**  \n_Scrapes and extracts main content from all provided URLs._  \nYou can control crawling depth, timeouts, and exclusion filters.\n3. **🔁 Loop + Chunking**  \n_Each page’s content is chunked into smaller sections for better embedding._  \nChunks are extracted and processed sequentially in a loop.\n4. **🧠 Vectorization**  \n_Each chunk is converted into a vector using your configured embedding model._\n5. **🗂️ Index to Vector DB**  \n_Vectors and their metadata (title, description, source) are stored in your selected database._\n\n# **▶️ Test it 👇🏻**\n\n**Option A:** Run directly using the GraphQL API trigger  \n**Option B:** Test via the in-app “Run Flow” button\n\n_Once done, check your Vector DB to confirm that all records were indexed successfully!_",
          "color": "yellow",
          "nodeId": "stickyNoteNode",
          "nodeName": "Sticky Note",
          "nodeType": "stickyNoteNode"
        }
      },
      "type": "stickyNoteNode",
      "dragging": false,
      "measured": {
        "width": 610,
        "height": 878
      },
      "position": {
        "x": -1466.406867821386,
        "y": 284.2903797711152
      },
      "selected": false,
      "draggable": true
    },
    {
      "id": "sticky-note-609",
      "data": {
        "modes": {},
        "width": 691,
        "height": 250,
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
        "width": 691,
        "height": 250
      },
      "position": {
        "x": -846.0854460055239,
        "y": -9.156120915628719
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
          "nodeName": "API Request",
          "responeType": "realtime",
          "advance_schema": "{\n  \"urls\": \"[string]\"\n}"
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
      "id": "firecrawlNode_785",
      "data": {
        "logic": [],
        "modes": {
          "webhook": "list"
        },
        "nodeId": "firecrawlNode",
        "schema": {
          "data": "array",
          "total": "number",
          "status": "string",
          "success": "boolean",
          "completed": "string",
          "expiresAt": "string",
          "creditsUsed": "number"
        },
        "values": {
          "id": "firecrawlNode_785",
          "url": "",
          "mode": "syncBatchScrape",
          "urls": "{{triggerNode_1.output.urls}}",
          "delay": 0,
          "limit": 10,
          "mobile": false,
          "search": "",
          "timeout": 30000,
          "waitFor": 2000,
          "nodeName": "Firecrawl",
          "crawlDepth": 1,
          "crawlLimit": 10,
          "credentials": "FIRECRAWL_API_KEY",
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
          "onlyMainContent": true,
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
        "y": 130
      },
      "selected": false
    },
    {
      "id": "forLoopNode_370",
      "data": {
        "modes": {},
        "nodeId": "forLoopNode",
        "schema": {
          "currentValue": "object"
        },
        "values": {
          "wait": 0,
          "endValue": "10",
          "nodeName": "Loop",
          "increment": "1",
          "connectedTo": "forLoopEndNode_301",
          "iterateOver": "list",
          "initialValue": "0",
          "iteratorValue": "{{firecrawlNode_785.output.data}}"
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
      }
    },
    {
      "id": "variablesNode_658",
      "data": {
        "modes": {},
        "nodeId": "variablesNode",
        "schema": {},
        "values": {
          "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.title}}\"\n  },\n  \"description\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.description}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.url}}\"\n  }\n}",
          "nodeName": "Variables"
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
      }
    },
    {
      "id": "chunkNode_968",
      "data": {
        "modes": {},
        "nodeId": "chunkNode",
        "schema": {
          "chunks": "string"
        },
        "values": {
          "nodeName": "Chunking",
          "chunkField": "{{forLoopNode_370.output.currentValue.markdown}}",
          "numOfChars": 500,
          "separators": [
            "\n\n",
            "\n",
            " "
          ],
          "chunkingType": "recursiveCharacterTextSplitter",
          "overlapChars": 50
        }
      },
      "type": "dynamicNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 520
      }
    },
    {
      "id": "codeNode_794",
      "data": {
        "modes": {},
        "nodeId": "codeNode",
        "schema": {},
        "values": {
          "code": "let docs = {{ chunkNode_968.output.chunks }};\n\nlet outputDocs = docs.map((doc) => doc.pageContent)\n\nreturn outputDocs",
          "nodeName": "Extract Chunks"
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
      }
    },
    {
      "id": "vectorizeNode_314",
      "data": {
        "logic": [],
        "modes": {},
        "nodeId": "vectorizeNode",
        "schema": {
          "_meta": "object",
          "vectors": "object"
        },
        "values": {
          "id": "vectorizeNode_314",
          "nodeName": "Vectorize",
          "inputText": "{{codeNode_794.output}}",
          "embeddingModelName": {
            "type": "embedder/text",
            "params": {},
            "model_name": "text-embedding-ada-002",
            "credentialId": "0fc2f9ae-4a22-41e3-b63a-3e7db8902a9e",
            "provider_name": "openai",
            "credential_name": "OPENAI_KEY"
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
        "y": 780
      },
      "selected": false
    },
    {
      "id": "codeNode_305",
      "data": {
        "modes": {},
        "nodeId": "codeNode",
        "schema": {},
        "values": {
          "code": "let vectors = {{ vectorizeNode_314.output.vectors }};\nlet metadataProps = [];\nlet texts = {{codeNode_794.output}};\n\nfor (const idx in vectors) {\n  let metadata = {}\n  metadata[\"content\"] = texts[idx];\n  metadata[\"title\"] = {{variablesNode_658.output.title}};\n  metadata[\"description\"] = {{variablesNode_658.output.description}};\n  metadata[\"source\"] = {{variablesNode_658.output.source}};\n  metadataProps.push(metadata)\n};\n\noutput = { \"metadata\": metadataProps, \"vectors\": vectors }",
          "nodeName": "Transform Metadata"
        }
      },
      "type": "dynamicNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 910
      }
    },
    {
      "id": "vectorNode_157",
      "data": {
        "logic": [],
        "modes": {},
        "nodeId": "vectorNode",
        "schema": {
          "message": "string",
          "recordsIndexed": "string",
          "duplicateRecordsDeleted": "string"
        },
        "values": {
          "id": "vectorNode_157",
          "limit": 20,
          "action": "index",
          "filters": "",
          "nodeName": "Index",
          "vectorDB": "TestDB",
          "primaryKeys": [
            "title"
          ],
          "vectorsField": "{{codeNode_305.output.vectors}}",
          "metadataField": "{{codeNode_305.output.metadata}}",
          "duplicateOperation": "overwrite"
        }
      },
      "type": "dynamicNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 1040
      },
      "selected": false
    },
    {
      "id": "forLoopEndNode_301",
      "data": {
        "modes": {},
        "nodeId": "forLoopEndNode",
        "schema": {
          "loopOutput": "object"
        },
        "values": {
          "nodeName": "Loop End",
          "connectedTo": "forLoopNode_370"
        }
      },
      "type": "forLoopEndNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 1170
      }
    },
    {
      "id": "graphqlResponseNode_532",
      "data": {
        "logic": [],
        "modes": {},
        "nodeId": "graphqlResponseNode",
        "schema": {},
        "values": {
          "nodeName": "API Response",
          "outputMapping": "{\n  \"output\": \"Records indexed successfully\"\n}"
        }
      },
      "type": "responseNode",
      "measured": {
        "width": 216,
        "height": 93
      },
      "position": {
        "x": 0,
        "y": 1300
      },
      "selected": false
    }
  ],
  "edges": [
    {
      "id": "triggerNode_1-firecrawlNode_785",
      "type": "defaultEdge",
      "source": "triggerNode_1",
      "target": "firecrawlNode_785",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "firecrawlNode_785-forLoopNode_370",
      "type": "defaultEdge",
      "source": "firecrawlNode_785",
      "target": "forLoopNode_370",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "forLoopNode_370-variablesNode_658",
      "data": {
        "condition": "Loop Start",
        "invisible": true
      },
      "type": "conditionEdge",
      "source": "forLoopNode_370",
      "target": "variablesNode_658",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "vectorNode_157-forLoopEndNode_301",
      "type": "defaultEdge",
      "source": "vectorNode_157",
      "target": "forLoopEndNode_301",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "variablesNode_658-chunkNode_968",
      "type": "defaultEdge",
      "source": "variablesNode_658",
      "target": "chunkNode_968",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "chunkNode_968-codeNode_794",
      "type": "defaultEdge",
      "source": "chunkNode_968",
      "target": "codeNode_794",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "codeNode_794-vectorizeNode_314",
      "type": "defaultEdge",
      "source": "codeNode_794",
      "target": "vectorizeNode_314",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "vectorizeNode_314-codeNode_305",
      "type": "defaultEdge",
      "source": "vectorizeNode_314",
      "target": "codeNode_305",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "codeNode_305-vectorNode_157",
      "type": "defaultEdge",
      "source": "codeNode_305",
      "target": "vectorNode_157",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "forLoopEndNode_301-graphqlResponseNode_532",
      "type": "defaultEdge",
      "source": "forLoopEndNode_301",
      "target": "graphqlResponseNode_532",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "forLoopNode_370-forLoopEndNode_301",
      "data": {
        "condition": "Loop",
        "invisible": false
      },
      "type": "loopEdge",
      "source": "forLoopNode_370",
      "target": "forLoopEndNode_301",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "forLoopEndNode_301-forLoopNode_370",
      "data": {
        "condition": "Loop",
        "invisible": true
      },
      "type": "loopEdge",
      "source": "forLoopEndNode_301",
      "target": "forLoopNode_370",
      "sourceHandle": "bottom",
      "targetHandle": "top"
    },
    {
      "id": "response-graphqlResponseNode_532",
      "type": "responseEdge",
      "source": "triggerNode_1",
      "target": "graphqlResponseNode_532",
      "sourceHandle": "to-response",
      "targetHandle": "from-trigger"
    }
  ],
  "status": "active",
  "created_at": "2025-11-04T07:24:17.233941+00:00"
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