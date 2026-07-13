export const meta = {
  "name": "WebRevive AI Orchestrator",
  "description": "12-agent autonomous website audit and cold outreach generator. Takes a URL and produces SEO audit, performance analysis, UI/UX review, competitor research, conversion audit, redesign suggestions, copywriting, cold email, LinkedIn outreach, and a business proposal — all in one structured JSON response.",
  "tags": ["website-audit", "seo", "cold-outreach", "sales", "lead-generation", "ai-agents"],
  "testInput": {
    "url": "https://stripe.com",
    "businessName": "Stripe",
    "industry": "SaaS / Tech",
    "targetService": "Website Redesign",
    "pageSpeedData": "{\"performanceScore\": 72, \"fcp\": \"1.8s\", \"lcp\": \"3.2s\", \"cls\": \"0.05\", \"tbt\": \"180ms\"}"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

export const inputs = {};

export const references = {
  "prompts": {
    "webrevive_orchestrator_system": "@prompts/webrevive-orchestrator_system.md"
  }
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 }
  },
  {
    "id": "LLMNode_1",
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/webrevive-orchestrator_system.md"
          },
          {
            "role": "user",
            "content": "Analyze this website and return the complete JSON audit report.\n\nURL: {{triggerNode_1.output.url}}\nBusiness Name: {{triggerNode_1.output.businessName}}\nIndustry: {{triggerNode_1.output.industry}}\nTarget Service: {{triggerNode_1.output.targetService}}\nReal PageSpeed Data: {{triggerNode_1.output.pageSpeedData}}\n\nReturn ONLY the JSON object. No preamble, no markdown code fences."
          }
        ],
        "nodeName": "WebRevive 12-Agent Orchestrator",
        "maxTokens": 8000
      }
    },
    "type": "dynamicNode",
    "position": { "x": 0, "y": 150 }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
