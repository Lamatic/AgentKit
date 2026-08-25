# Incident Response Agent

A lightweight AI incident-response advisory template for **Lamatic.ai AgentKit**. This template provides a straightforward workflow (`API Request → Generate Text → API Response`) to assist on-call engineers by answering incident-related questions, explaining errors, and offering initial triage suggestions in real-time.

## Project Overview
- **Name**: Incident Response Agent
- **Contribution Type**: Lamatic AgentKit Template (`template`)
- **Execution Mode**: Real-time API trigger to LLM text generation

## Prerequisites
- [Lamatic.ai](https://lamatic.ai/) account and access to Lamatic Studio / CLI
- Valid OpenRouter provider credential configured in Lamatic Studio
- Node.js 18+ (if utilizing local AgentKit tooling)

## Template Structure
```text
kits/incident-response-agent/
├── constitutions/
│   └── default.md          # Safety, privacy, and behavior constitution
├── flows/
│   └── chilly-apartment.ts # Main flow definition with API Trigger, LLM node, and Response node
├── model-configs/
│   └── chilly-apartment_llmnode-645_generative-model-name.ts # Model provider & config
├── prompts/
│   ├── chilly-apartment_llmnode-645_system_0.md              # System persona prompt
│   └── chilly-apartment_llmnode-645_user_1.md                # Dynamic user prompt template
├── .gitignore
├── agent.md                # Agent overview and architecture specification
├── lamatic.config.ts       # AgentKit manifest and step configuration
└── README.md               # Kit documentation
```

## Setup and Import Instructions
1. **Copy/Import the Kit**:
   Place the `incident-response-agent` folder inside your Lamatic AgentKit repository under `kits/incident-response-agent/` (or import via Lamatic CLI / Studio).
2. **Configure Model Credentials**:
   - In Lamatic Studio, ensure your OpenRouter credential is created and mapped to the model node configured in `model-configs/chilly-apartment_llmnode-645_generative-model-name.ts`.
3. **Deploy or Run Locally**:
   - Deploy the flow through Lamatic Studio or run with the Lamatic CLI runner.

## How to Use and Test
You can test the flow directly using Lamatic Studio's test runner or by sending an API request:

### Example Input Payload
```json
{
  "sampleInput": "High memory usage detected on pod worker-pool-7f9b8c. Memory utilization is at 96% and increasing."
}
```

### Expected Output
A real-time JSON response containing the model's triage suggestions, diagnostic recommendations, and actionable steps.

## Expected Input and Output Schema
- **Input**:
  ```json
  {
    "sampleInput": "string"
  }
  ```
- **Output**: JSON payload returned with `Content-Type: application/json` containing the generated incident analysis response text.

## Limitations & Scope
- **Advisory Only**: Generates plain-text suggestions and explanations based on user input; it does not perform automated incident classification, live infrastructure monitoring, automated root-cause analysis, or command/script execution.
- **No External Integrations**: Operates without connections to cloud providers, ticketing systems, observability platforms, or databases.
- **Stateless**: Each request is evaluated independently without persisting cross-request state or conversation history.
- **Provider Dependent**: Generation speed and availability depend on the configured OpenRouter model endpoint.
