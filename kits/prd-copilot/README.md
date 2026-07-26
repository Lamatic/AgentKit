# PRD Copilot Kit

An AI-powered Product Requirement Document (PRD) generator that drafts feature specs, user personas, edge cases, and visual Mermaid.js flowcharts through an interactive refinement loop.

---

## 🧭 Step-by-Step Lamatic Studio Setup

Since PRD Copilot uses Lamatic's serverless orchestration, you need to create the flow in Lamatic Studio first. Follow this guide to build the flow:

### 1. Create a New Project in Lamatic Studio
1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and sign in.
2. Click **Create Project +**.
3. Name your project (e.g. `PRD Copilot`) and complete creation.

### 2. Design the GraphQL/API Flow
Create a new blank Flow in your project and name it `prd-copilot`:

1. **Trigger Node**: 
   * Add an **API Request (GraphQL)** node.
   * Add three inputs to its schema:
     * `mode` (string): Either `"draft"` or `"refine"`.
     * `instructions` (string): The raw user idea (in draft) or the original draft PRD (in refine).
     * `answers` (string, optional): The user's answers to the questions (in refine).
2. **Condition Node**:
   * Inspect the `mode` input (`{{triggerNode_1.output.mode}}`).
   * Route to **Condition 1 (Draft)** if `mode == "draft"`.
   * Route to **Condition 2 (Refine)** if `mode == "refine"`.
3. **Draft Branch (Condition 1)**:
   * Add an **LLM Node**.
   * System Prompt:
     ```
     You are a Product Management Assistant. Based on the user's raw product idea, write a structured initial PRD outline in markdown containing:
     - Core Value Proposition
     - User Personas (Target Audience)
     - Core Features List
     - Critical Edge Cases to Consider

     Additionally, identify 3-4 key clarification questions that are absolutely vital to ask the user before you can build a final specification. Output the result in JSON format:
     {
       "prd": "markdown_outline_string",
       "questions": ["question 1", "question 2", "question 3"],
       "mermaid": ""
     }
     Ensure you return a valid JSON object. Do not add raw text comments outside the JSON.
     ```
   * User Prompt:
     ```
     Raw Idea: {{triggerNode_1.output.instructions}}
     ```
4. **Refine Branch (Condition 2)**:
   * Add an **LLM Node**.
   * System Prompt:
     ```
     You are a Senior Product Manager. Take the original PRD draft and incorporate the user's answers to the clarifying questions. Generate:
     1. A finalized, highly detailed PRD in markdown format.
     2. A Mermaid.js flowchart code representing the application's user flow.

     Output the result in JSON format:
     {
       "prd": "final_markdown_prd_string",
       "questions": [],
       "mermaid": "graph TD; ... (valid Mermaid syntax)"
     }
     Ensure you return a valid JSON object. Do not add raw text comments outside the JSON.
     ```
   * User Prompt:
     ```
     Original Draft: {{triggerNode_1.output.instructions}}
     User Answers: {{triggerNode_1.output.answers}}
     ```
5. **Finalize Output Node**:
   * Add a **Code Node** or merge the branch outputs into a single JSON structure.
6. **API Response Node**:
   * Set the GraphQL output mapping to return `{{finaliseNode.output}}` as the response `answer`.
7. Click **Deploy** in the top right corner.

---

## 🚀 How to Run Locally

Once you have deployed the flow, configure the local Next.js client to test it:

### 1. Copy Environment Variables
Navigate to the app folder and create a `.env.local` file:
```bash
cd kits/prd-copilot/apps
cp .env.example .env.local
```

### 2. Enter API Credentials
Open `.env.local` and paste your keys from Lamatic Studio:
* **`LAMATIC_API_KEY`**: Obtain from **Settings → API Keys** in Studio.
* **`LAMATIC_PROJECT_ID`**: Obtain from **Settings → Project** in Studio.
* **`LAMATIC_API_URL`**: Obtain from the Endpoint URL in **Settings → API Docs**.
* **`PRD_COPILOT_FLOW_ID`**: Open your deployed `prd-copilot` flow, click the three-dot details menu, and copy the **Flow ID**.

### 3. Install Dependencies & Boot the App
Run these commands inside `kits/prd-copilot/apps`:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start generating PRDs!
