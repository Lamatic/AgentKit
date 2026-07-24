// Flow: supply-chain-scan

export const meta = {
  name: "Supply Chain Scan",
  description: "Parses supplier list, fetches live news and weather via API, scores each supplier 0-100, returns a structured risk matrix.",
  tags: ["supply-chain", "risk", "agentic"],
  testInput: {
    suppliers: "name,location,lat,lng,components_supplied,tier\nApex Electronics,Shenzhen China,22.5431,114.0579,Microcontrollers,1\nPacific Textiles,Dhaka Bangladesh,23.8103,90.4125,Fabric,1",
    scan_focus: ""
  },
  githubUrl: "",
  documentationUrl: "",
  deployUrl: ""
};

export const inputs = {
  "LLMNode_parse": [
    {
      mode: "chat",
      name: "generativeModelName",
      type: "model",
      label: "Generative Model Name",
      required: true,
      isPrivate: true,
      modelType: "generator/text",
      description: "Select the model to parse supplier data.",
      typeOptions: { loadOptionsMethod: "listModels" },
      defaultValue: ""
    }
  ],
  "LLMNode_search": [
    {
      mode: "chat",
      name: "generativeModelName",
      type: "model",
      label: "Generative Model Name",
      required: true,
      isPrivate: true,
      modelType: "generator/text",
      description: "Select the model to analyze live API data and extract disruption signals.",
      typeOptions: { loadOptionsMethod: "listModels" },
      defaultValue: ""
    }
  ],
  "LLMNode_score": [
    {
      mode: "chat",
      name: "generativeModelName",
      type: "model",
      label: "Generative Model Name",
      required: true,
      isPrivate: true,
      modelType: "generator/text",
      description: "Select the model to score suppliers and build the risk matrix.",
      typeOptions: { loadOptionsMethod: "listModels" },
      defaultValue: ""
    }
  ]
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    scan_system: "@prompts/scan-system.md",
    supply_chain_scan_parse_user: "@prompts/supply-chain-scan_parse_user.md",
    supply_chain_scan_search_user: "@prompts/supply-chain-scan_search_user.md",
    supply_chain_scan_score_user: "@prompts/supply-chain-scan_score_user.md"
  },
  modelConfigs: {
    supply_chain_scan_parse: "@model-configs/supply-chain-scan_parse.ts",
    supply_chain_scan_search: "@model-configs/supply-chain-scan_search.ts",
    supply_chain_scan_score: "@model-configs/supply-chain-scan_score.ts"
  },
  scripts: {
    supply_chain_scan_build_query: "@scripts/supply-chain-scan_build-query.ts",
    supply_chain_scan_format_api_data: "@scripts/supply-chain-scan_format-api-data.ts",
    supply_chain_scan_build_output: "@scripts/supply-chain-scan_build-output.ts"
  }
};

export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 400, y: 0 },
    data: {
      nodeId: "graphqlNode",
      modes: {},
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: ""
      }
    }
  },
  {
    id: "LLMNode_parse",
    type: "dynamicNode",
    position: { x: 400, y: 150 },
    data: {
      nodeId: "LLMNode",
      modes: {},
      values: {
        nodeName: "Parse Suppliers",
        tools: [],
        prompts: [
          { id: "p1", role: "system", content: "@prompts/scan-system.md" },
          { id: "p2", role: "user", content: "@prompts/supply-chain-scan_parse_user.md" }
        ],
        memories: "@model-configs/supply-chain-scan_parse.ts",
        messages: "@model-configs/supply-chain-scan_parse.ts",
        attachments: "@model-configs/supply-chain-scan_parse.ts"
      }
    }
  },
  {
    id: "codeNode_buildQuery",
    type: "dynamicNode",
    position: { x: 400, y: 300 },
    data: {
      nodeId: "codeNode",
      modes: {},
      values: {
        nodeName: "Build API Queries",
        code: "@scripts/supply-chain-scan_build-query.ts"
      }
    }
  },
  {
    id: "apiNode_news",
    type: "dynamicNode",
    position: { x: 150, y: 450 },
    data: {
      nodeId: "apiNode",
      values: {
        nodeName: "Fetch News (NewsAPI)",
        url: "https://newsapi.org/v2/everything?q={{codeNode_buildQuery.output.news_query}}&sortBy=publishedAt&pageSize=10&language=en",
        method: "GET",
        headers: "{\"X-Api-Key\": \"{{triggerNode_1.output.news_api_key}}\"}",
        body: "",
        retries: "1",
        retry_delay: "0",
        convertXmlResponseToJson: false
      }
    }
  },
  {
    id: "apiNode_weather",
    type: "dynamicNode",
    position: { x: 650, y: 450 },
    data: {
      nodeId: "apiNode",
      values: {
        nodeName: "Fetch Weather (OpenWeatherMap)",
        url: "https://api.openweathermap.org/data/2.5/weather?lat={{codeNode_buildQuery.output.weather_lat}}&lon={{codeNode_buildQuery.output.weather_lon}}&appid={{triggerNode_1.output.weather_api_key}}&units=metric",
        method: "GET",
        headers: "{}",
        body: "",
        retries: "1",
        retry_delay: "0",
        convertXmlResponseToJson: false
      }
    }
  },
  {
    id: "codeNode_format",
    type: "dynamicNode",
    position: { x: 400, y: 600 },
    data: {
      nodeId: "codeNode",
      modes: {},
      values: {
        nodeName: "Format API Data",
        code: "@scripts/supply-chain-scan_format-api-data.ts"
      }
    }
  },
  {
    id: "LLMNode_search",
    type: "dynamicNode",
    position: { x: 400, y: 750 },
    data: {
      nodeId: "LLMNode",
      modes: {},
      values: {
        nodeName: "Analyze Disruptions",
        tools: [],
        prompts: [
          { id: "p3", role: "system", content: "@prompts/scan-system.md" },
          { id: "p4", role: "user", content: "@prompts/supply-chain-scan_search_user.md" }
        ],
        memories: "@model-configs/supply-chain-scan_search.ts",
        messages: "@model-configs/supply-chain-scan_search.ts",
        attachments: "@model-configs/supply-chain-scan_search.ts"
      }
    }
  },
  {
    id: "LLMNode_score",
    type: "dynamicNode",
    position: { x: 400, y: 900 },
    data: {
      nodeId: "LLMNode",
      modes: {},
      values: {
        nodeName: "Score & Synthesize",
        tools: [],
        prompts: [
          { id: "p5", role: "system", content: "@prompts/scan-system.md" },
          { id: "p6", role: "user", content: "@prompts/supply-chain-scan_score_user.md" }
        ],
        memories: "@model-configs/supply-chain-scan_score.ts",
        messages: "@model-configs/supply-chain-scan_score.ts",
        attachments: "@model-configs/supply-chain-scan_score.ts"
      }
    }
  },
  {
    id: "codeNode_output",
    type: "dynamicNode",
    position: { x: 400, y: 1050 },
    data: {
      nodeId: "codeNode",
      modes: {},
      values: {
        nodeName: "Build Output",
        code: "@scripts/supply-chain-scan_build-output.ts"
      }
    }
  },
  {
    id: "responseNode_triggerNode_1",
    type: "dynamicNode",
    position: { x: 400, y: 1200 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping: "{\n  \"risk_matrix\": \"{{codeNode_output.output.risk_matrix}}\",\n  \"high_risk_suppliers\": \"{{codeNode_output.output.high_risk_suppliers}}\",\n  \"scan_timestamp\": \"{{codeNode_output.output.scan_timestamp}}\",\n  \"summary\": \"{{codeNode_output.output.summary}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_parse",
    source: "triggerNode_1",
    target: "LLMNode_parse",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_parse-codeNode_buildQuery",
    source: "LLMNode_parse",
    target: "codeNode_buildQuery",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeNode_buildQuery-apiNode_news",
    source: "codeNode_buildQuery",
    target: "apiNode_news",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeNode_buildQuery-apiNode_weather",
    source: "codeNode_buildQuery",
    target: "apiNode_weather",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "apiNode_news-codeNode_format",
    source: "apiNode_news",
    target: "codeNode_format",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "apiNode_weather-codeNode_format",
    source: "apiNode_weather",
    target: "codeNode_format",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeNode_format-LLMNode_search",
    source: "codeNode_format",
    target: "LLMNode_search",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_search-LLMNode_score",
    source: "LLMNode_search",
    target: "LLMNode_score",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_score-codeNode_output",
    source: "LLMNode_score",
    target: "codeNode_output",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeNode_output-responseNode_triggerNode_1",
    source: "codeNode_output",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "response-responseNode_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
