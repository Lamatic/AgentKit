# Agentic Comparison Engine Kit by Lamatic.ai

**Agentic Comparison Engine** is a specialized AI-powered kit for deep research and comparison between two entities (products, services, companies, etc.). It uses an agentic workflow to research both entities independently, analyze their differences, and generate a structured comparison table with an expert recommendation.

## Features
- **Dual Research Pipeline**: Researches two entities simultaneously or sequentially.
- **Structured Analysis**: Automatically extracts key features and metrics for comparison.
- **Expert Verdict**: Provides a reasoning-based "Best Choice" recommendation.
- **Side-by-Side UI**: Responsive comparison dashboard with a clean data table.

## Lamatic Setup

1. Sign in or sign up at [https://lamatic.ai](https://lamatic.ai)
2. Create a new flow from the **Comparison Engine** template.
3. Obtain your `.env` keys from the Lamatic Studio.

## Required Environment Variables

Set the following in your `.env` file:

```bash
# Lamatic Project Config
LAMATIC_API_URL="your_lamatic_url"
LAMATIC_PROJECT_ID="your_project_id"
LAMATIC_API_KEY="your_api_key"

# Flow IDs
COMPARISON_RESEARCH_A="Flow ID for Researching Entity A"
COMPARISON_RESEARCH_B="Flow ID for Researching Entity B"
COMPARISON_ANALYZE="Flow ID for Analyzing Differences"
COMPARISON_VERDICT="Flow ID for Expert Verdict"
```

## Getting Started

1. Clone the repository and navigate to the kit:
   ```sh
   cd kits/agentic/comparison-engine
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```

## Repo Structure
- `/app/page.tsx`: Main comparison interface.
- `/actions/orchestrate.ts`: Server actions for orchestration.
- `/components/ComparisonTable.tsx`: Side-by-side data visualization.
- `/orchestrate.js`: Workflow process definition.
