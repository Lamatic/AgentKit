# Agent Kit OpenAPI Security Fuzzer by Lamatic.ai

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWc1bWd5eXV5OHhpYmNlYzNweDBwZXlxeHRtcXhjMGJtbWNxYnBhZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiafcf2p0yow/giphy.gif" alt="Demo" />
</p>

<p align="center">
  <a href="https://openapi-security-fuzzer.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit OpenAPI Security Fuzzer** is an AI-powered automated security engineer built with [Lamatic.ai](https://lamatic.ai). It analyzes API contracts (OpenAPI specifications) to generate malicious, edge-case, and malformed JSON test payloads for every endpoint, executes them, and then intelligently analyzes the results to detect vulnerabilities like BOLA, IDOR, and injection flaws.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/openapi-security-fuzzer/apps)

---

## 🏛️ Architecture Overview

- **`openapi-payload-generator`**: Evaluates the OpenAPI schema and generates a suite of intelligent, context-aware adversarial payloads.
- **`openapi-result-analyzer`**: Processes the execution results to identify security flaws based on observed behaviors, HTTP status codes, and error traces.
- **Frontend Dashboard**: A Next.js-powered user interface built with Shadcn UI and Tailwind CSS to orchestrate scans and review security reports.

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

### Pre: Build in Lamatic
1. Sign in or sign up at [https://lamatic.ai](https://lamatic.ai)
2. Create a project (if you don’t have one yet)
3. Click “+ New Flow” and select "Templates"
4. Select the **OpenAPI Security Fuzzer** agent kit
5. Configure the Instructor LLM models and generative prompts as prompted
6. Deploy the kit in Lamatic and obtain your `.env` keys
7. Copy the keys from your studio

### Post: Wire into this repo
1. Navigate to the `apps/` directory.
2. Copy `.env.example` to `.env.local` and set the keys.
3. Install and run locally:
   ```bash
   npm install
   npm run dev
   ```
4. Deploy (Vercel recommended):
   - Import your repo, set the project’s Root Directory to `kits/openapi-security-fuzzer/apps`
   - Add env vars in Vercel (same as your `.env.local`)
   - Deploy and test your live URL

---

## 🔑 Setup & Required Keys

You’ll need these things to run this project locally:

| Item | Purpose | Where to Get It |
| --- | --- | --- |
| `.env` Keys | Authentication for Lamatic AI APIs and Orchestration | [lamatic.ai](https://lamatic.ai) |

### 1. Environment Variables
Create `.env.local` inside the `apps/` directory with:
```bash
# Lamatic
OPENAPI_PAYLOAD_GENERATOR="OPENAPI_PAYLOAD_GENERATOR Flow ID"
OPENAPI_RESULT_ANALYZER="OPENAPI_RESULT_ANALYZER Flow ID"
LAMATIC_API_URL="LAMATIC_API_URL"
LAMATIC_PROJECT_ID="LAMATIC_PROJECT_ID"
LAMATIC_API_KEY="LAMATIC_API_KEY"
```

### 2. Run Locally
```bash
cd apps
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📂 Repo Structure
```text
/apps                      # Next.js Frontend App
  ├── /app                 # App router & pages
  ├── /components          # Shadcn UI components
  ├── /lib                 # Utilities and Lamatic client
  └── /actions             # Server actions for orchestration
/flows                     # Lamatic Flow Definitions
  ├── openapi-payload-generator.ts
  └── openapi-result-analyzer.ts
/model-configs             # Model configurations
/prompts                   # System and user prompts for nodes
/constitutions             # Agent safety and behavior rules
lamatic.config.ts          # Core kit configuration
```

---

## 🤝 Contributing
We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License
MIT License – see [LICENSE](../../LICENSE).
