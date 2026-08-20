# Agent Kit OpenAPI Security Fuzzer by Lamatic.ai

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWc1bWd5eXV5OHhpYmNlYzNweDBwZXlxeHRtcXhjMGJtbWNxYnBhZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiafcf2p0yow/giphy.gif" alt="Security Automation Demo" width="600" />
</p>

**Agent Kit OpenAPI Security Fuzzer** is an AI-powered automated security engineer built with [Lamatic.ai](https://lamatic.ai). It analyzes API contracts (OpenAPI specifications) to generate malicious, edge-case, and malformed JSON test payloads for every endpoint, executes them, and then intelligently analyzes the results to detect vulnerabilities like BOLA, IDOR, business logic flaws, and injection vectors.

---

## 🏛️ Architecture Overview

The system is built around a modern Next.js frontend and two core Lamatic.ai intelligent flows:

1. **`openapi-payload-generator`**: An orchestration flow that parses your OpenAPI schema and utilizes multiple specialized AI sub-agents (e.g., Auth Hacker, IDOR Hacker, Injection Hacker) to generate a diverse suite of adversarial payloads.
  2. **`openapi-result-analyzer`**: A supervisor flow that evaluates the HTTP execution results, eliminates false positives, and generates a structured, actionable security report.
3. **Frontend Dashboard**: A Next.js-powered user interface built with Shadcn UI and Tailwind CSS to initiate scans and review the resulting security findings.

> [!NOTE]
> **Architectural Note on JSON Payloads:** To bypass strict schema validation limitations present in models like GPT-4o and Claude Sonnet (which frequently reject `additionalProperties: true`), the Lamatic flows are designed to output `payload` and `headers` as **Stringified JSON**. The Next.js frontend automatically intercepts and parses these strings back into valid JSON objects before downloading them as Postman collections or raw JSON.

---

## 🚀 Getting Started

Follow these instructions to set up the Lamatic flows in your cloud environment and connect them to your local repository.

### Step 1: Import & Rebuild Flows in Lamatic Studio

This repository comes with pre-configured Lamatic flows. You need to import them into your Lamatic workspace:

1. Sign in or sign up at [Lamatic.ai](https://lamatic.ai).
2. Create a new project.
3. From the dashboard, navigate to **Flows** and select **Import Flow**.
4. Import the `openapi-payload-generator.ts` file located in `kits/openapi-security-fuzzer/flows/` of this repository.
5. Deploy the imported flow.
6. Repeat the process to import and deploy `openapi-result-analyzer.ts`.

### Step 2: Configure Environment Variables

Navigate to the `apps/` directory and copy the example environment file:
```bash
cd apps
cp .env.example .env.local
```

Open `.env.local` and populate it with your specific keys. Here is exactly where to find each value inside the **Lamatic Studio**:

| Variable | Description | Where to find it in Lamatic Studio |
| :--- | :--- | :--- |
| `LAMATIC_PROJECT_ID` | Your unique Project ID | **Project Settings** > General |
| `LAMATIC_API_KEY` | Authentication Key | **Settings** > **API Keys** > Generate New Key |
| `LAMATIC_API_URL` | Base API Endpoint | Found in your API Keys / Credentials page |
| `OPENAPI_PAYLOAD_GENERATOR` | Flow ID for the Payload Generator | Go to the deployed Payload Generator Flow > **Deployments** or **Settings** to copy the Flow ID. |
| `OPENAPI_RESULT_ANALYZER` | Flow ID for the Result Analyzer | Go to the deployed Result Analyzer Flow > **Deployments** or **Settings** to copy the Flow ID. |

Your `.env.local` should look like this:
```env
OPENAPI_PAYLOAD_GENERATOR="<your-generator-flow-id>"
OPENAPI_RESULT_ANALYZER="<your-analyzer-flow-id>"
LAMATIC_API_URL="https://api.lamatic.ai/v1"
LAMATIC_PROJECT_ID="<your-project-id>"
LAMATIC_API_KEY="<your-secret-api-key>"
```

### Step 3: Run the Dashboard Locally

With your environment variables set, start the Next.js development server:

```bash
# Ensure you are inside the /apps directory
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🎯 Testing with a Mock API Target

If you don't have a vulnerable API to test your payloads against, we have included a Python FastAPI mock server setup guide. This mock server contains deliberate vulnerabilities (BOLA, IDOR, Missing Auth) across 5 financial endpoints, perfectly aligned to be caught by the Fuzzer.

1. Ensure you have Python installed.
2. Follow the [FastAPI Mock Target setup guide (local docs)](./docs/fastapi_mock_target.md).
3. Start the server on port `8000`:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
4. Point the Fuzzer to `http://localhost:8000/api/v1` with header `Bearer user_1_token`.

---

## 📂 Repository Structure

```text
/apps                      # Next.js Frontend App
  ├── /app                 # App router & pages
  ├── /components          # Shadcn UI components
  ├── /lib                 # Utilities and Lamatic client
  └── /actions             # Server actions for orchestration
/flows                     # Lamatic Flow Definitions (Import these!)
  ├── openapi-payload-generator.ts
  └── openapi-result-analyzer.ts
/model-configs             # Model configurations
/prompts                   # System and user prompts for nodes
/constitutions             # Agent safety and behavior rules
lamatic.config.ts          # Core kit configuration
```

---

## 🤝 Contributing
We welcome contributions! Open an issue or PR in this repo to suggest features, fix bugs, or improve the security analysis flows.

---

## 📜 License
MIT License – see [LICENSE](../../LICENSE).
