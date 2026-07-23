# ScalePilot

ScalePilot is an AI-powered Software Architecture Review Assistant built with [Lamatic.ai](https://lamatic.ai). It analyzes software architectures described in natural language, identifies missing information, asks follow-up questions when needed, and generates a structured Architecture Evolution Report with actionable recommendations.

---

## How It Works

1. **Architecture Input** – The user describes their existing software architecture in plain English.
2. **Architecture Parsing** – The flow extracts important architectural details such as frontend, backend, database, infrastructure, scale, caching, and deployment strategy.
3. **Missing Information Check** – If essential details are missing, the assistant asks follow-up questions instead of making assumptions.
4. **Architecture Analysis** – Once enough context is available, the architecture is analyzed for potential bottlenecks, risks, and scalability concerns.
5. **Architecture Evolution Report** – A detailed report is generated containing observations, risks, recommendations, and suggested improvements.

---

## Setup

### 1. Deploy the Flow

Deploy the exported ScalePilot flow from Lamatic Studio and note the following values:

- Project ID
- Flow ID
- API Endpoint
- API Key

### 2. Environment Variables

Create a `.env.local` file inside the `apps` directory.

```env
LAMATIC_PROJECT_API_KEY=your_api_key
LAMATIC_PROJECT_ENDPOINT=your_graphql_endpoint
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_FLOW_ID=your_flow_id
```

### 3. Install & Run

```bash
cd apps
npm install
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

## Project Structure

```
|-- apps/                  # Next.js frontend
|-- flows/                 # Exported Lamatic flow
|-- prompts/             # Prompt definitions
|-- model-configs/         # Model configuration
|-- constitutions/         # AI constitutions
|-- lamatic.config.ts
|-- README.md
```
---

## Features

- Analyze software architectures from natural language
- Detect missing architectural information
- Ask intelligent follow-up questions
- Identify scalability bottlenecks
- Generate Architecture Evolution Reports
- Built entirely using Lamatic AgentKit

---

## Example

### Input

```
We have a React frontend, Node.js backend, PostgreSQL database, and around 5,000 users. The application becomes slow during flash sales.
```

### Output

If required information is missing, ScalePilot asks follow-up questions such as:

- Which cloud provider are you using?
- Are you using a caching layer?
- Is the application containerized?
- Are background jobs handled through a message queue?

Once sufficient information is available, it generates a complete Architecture Evolution Report.

---

## Contributing

Please refer to the main repository's `CONTRIBUTING.md` for contribution guidelines.