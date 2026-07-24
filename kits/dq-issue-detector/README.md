# Data Quality Issue Detector Kit

## 1. The Problem
Before analyzing data or training machine learning models, cleaning raw data is always the first and most critical step. Identifying null/missing values, duplicates, out-of-range numerical fields, formatting syntax problems (e.g. invalid emails or dates), and status casing inconsistencies is usually done manually with custom Python/Pandas scripts. This can be time-consuming, repetitive, and inaccessible to non-technical users who just want a quick audit of their files.

## 2. The Approach
We built an AI-powered data quality audit agent using Next.js and the Lamatic API.
- **Workflow:** The user loads or pastes a dataset (CSV) and provides optional instructions (e.g. "Focus on validating emails and ignore columns without names").
- **Agent Action:** The LLM-backed agent scans the dataset row-by-row, identifying anomalies, missing information, schema mismatches, and duplicated records.
- **Interactive UI:** The Next.js frontend previews the CSV as an interactive table, triggers the Server Action to invoke the Lamatic flow, and renders the detailed audit report side-by-side using markdown.

## 3. The Result
An instantly usable web tool to run automated health checks on dataset CSVs. Teams receive a clear, prioritized checklist of data clean-up items, complete with column-specific summaries, issues categorized by severity (High, Medium, Low), and actionable cleaning steps to feed into their ETL scripts.

---

## AgentKit Collection (1 flow)

This AgentKit contains 1 flow:
- **Data Quality Agent** (`flows/data-quality-agent.ts`)

---

## Prerequisites
*   **Node.js** (v18 or higher recommended)
*   **npm** or **pnpm** package manager
*   A valid **Lamatic API Key**, **Project ID**, and **API URL/Endpoint**

---

## Setup Instructions

1. **Initialize the App Directory**
   ```bash
   cd apps
   npm install
   ```

2. **Configure Environment Variables**
   Create a local env file:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your Lamatic credentials:
   ```env
   LAMATIC_API_KEY=your_api_key_here
   LAMATIC_PROJECT_ID=your_project_id_here
   LAMATIC_ENDPOINT=https://your-endpoint.lamatic.dev
   DATA_QUALITY_AGENT=your_deployed_flow_id_here
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

---

## Programmatic Usage Example

The Next.js frontend calls the Lamatic flow via Next.js Server Actions:

```typescript
import { analyzeDatasetQuality } from "@/actions/orchestrate";

const checkData = async () => {
  const csvContent = `id,name,email,age
1,John Doe,john@example.com,28
2,Jane Smith,,thirty-four
1,John Doe,john@example.com,28`;

  const result = await analyzeDatasetQuality(csvContent, "Check for schema issues and duplicates.");

  if (result.success) {
    console.log("Analysis Report:", result.data);
  }
};
```
