export default {
  name: "API Security Fuzzer",
  description: "An agentic toolkit that takes an OpenAPI specification and generates comprehensive security test payloads (SQLi, XSS, boundary tests) for all endpoints, and actively tests them.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["agentic", "security", "fuzzer", "api"],
  steps: [
    {
        "id": "openapi-payload-generator",
        "type": "mandatory",
        "envKey": "OPENAPI_PAYLOAD_GENERATOR"
    },
    {
        "id": "openapi-result-analyzer",
        "type": "mandatory",
        "envKey": "OPENAPI_RESULT_ANALYZER"
    }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/openapi-security-fuzzer"
  },
};
