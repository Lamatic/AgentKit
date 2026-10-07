export default {
  "name": "api-integration-assistant",
  "description": "An API Developer Relations assistant that uses RAG to answer queries with precise code snippets.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "R Sai Dheeraj",
    "email": "16saidheeraj@gmail.com"
  },
  "tags": ["api", "rag", "assistant"],
  "steps": [
    {
      "id": "api-integration-assistant",
      "type": "mandatory",
      "envKey": "LAMATIC_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit%2Ftree%2Fmain%2Fkits%2Fapi-integration-assistant%2Fapps&env=LAMATIC_API_KEY,LAMATIC_API_URL,LAMATIC_FLOW_ID,LAMATIC_PROJECT_ID&root-directory=kits/api-integration-assistant/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/api-integration-assistant"
  }
};
