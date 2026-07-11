# RCAgent - Root Cause Analysis (RCA) Kit by Lamatic.ai

RCAgent is a specialized AI-powered Root Cause Analysis and software debugging pipeline built using [Lamatic.ai](https://lamatic.ai) flows and a Next.js frontend app. 

It divides incident analysis into three cooperative stages:
1. **Planner Agent:** Formulates a step-by-step diagnostic checklist based on logs and alerts.
2. **Analyzer Agent:** Correlates the plan checklist against code diffs, logs, and environments.
3. **Synthesizer Agent:** Generates a structured markdown SRE Postmortem report detailing remediation and prevention items.

---

## 🔑 Setup & Installation

Before running this project, you must configure the flows in Lamatic Studio, deploy them, and map the credentials into this app.

### 1. Build & Deployed Flows in Lamatic Studio
1. Sign up/in at [studio.lamatic.ai](https://studio.lamatic.ai).
2. Create a project and deploy three flows:
   - **Planner Flow:** Triggered via GraphQL with schema inputs `incidentTitle`, `alertDetails`, and `logsOrSymptoms`. Returns `steps`.
   - **Analyzer Flow:** Triggered via GraphQL with schema inputs `steps`, `gitDiff`, and `configSettings`. Returns `research`.
   - **Synthesizer Flow:** Triggered via GraphQL with schema inputs `incidentTitle` and `research`. Returns `postmortem`.

### 2. Configure Environment Variables
Create a `.env.local` file inside the `apps/` directory and configure the environment:
```bash
# Lamatic Credentials
LAMATIC_API_KEY="your-lamatic-api-key"
LAMATIC_PROJECT_ID="your-lamatic-project-id"
LAMATIC_API_URL="https://api.studio.lamatic.ai/v1"

# Deployed Flow IDs
RC_PLANNER_FLOW_ID="your-planner-flow-id"
RC_ANALYZER_FLOW_ID="your-analyzer-flow-id"
RC_SYNTHESIZER_FLOW_ID="your-synthesizer-flow-id"
```
*(If no env variables are set, the app will execute in mockup demo mode with static mock steps).*

### 3. Run Locally
```bash
cd apps
npm install
npm run dev
```
Open `http://localhost:3000` to access the RCAgent incident room dashboard.
