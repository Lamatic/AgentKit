# SQL Query Generator

An AI-powered agent that converts natural language questions into optimized SQL queries. Paste your database schema, ask a question in plain English, and get production-ready SQL with explanations, confidence scores, and assumption tracking.

## What It Does

- Takes a database schema (CREATE TABLE statements) and a plain English question
- Generates an optimized, read-only SQL SELECT query
- Returns a structured response with the query, explanation, tables used, assumptions, and confidence level
- Only generates SELECT statements — never INSERT, UPDATE, DELETE, DROP, or ALTER
- Produces standard SQL compatible with PostgreSQL, MySQL, and SQLite

## Problem It Solves

Writing SQL queries from scratch takes time, especially for complex joins, aggregations, and subqueries. This tool lets developers, analysts, and data teams quickly get a working query by describing what they need in plain English. It's also useful for learning SQL — the explanation and assumptions help users understand the query logic.

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Lamatic.ai](https://lamatic.ai) account with a deployed SQL query generation flow
- A configured LLM provider (e.g., Anthropic, OpenAI, Google) in Lamatic Studio

## Setup

### 1. Clone and navigate

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/sql-query-generator/apps
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in your values:

```
SQL_QUERY_GENERATOR_FLOW_ID = "your-flow-id"
LAMATIC_API_URL = "https://your-org.lamatic.dev"
LAMATIC_PROJECT_ID = "your-project-id"
LAMATIC_API_KEY = "sk-your-api-key"
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste your database schema (CREATE TABLE statements) in the schema field
2. Type your question in plain English
3. Click "Generate SQL"
4. View the generated query, copy it, and read the explanation

You can also click "Load sample" to try it with example data.

## Deploy to Vercel

1. Push to your fork
2. Import the repo on [Vercel](https://vercel.com)
3. Set root directory to `kits/sql-query-generator/apps`
4. Add environment variables
5. Deploy

## Flow Architecture

```
API Request → Generate Text (LLM) → API Response
```

The flow uses a single LLM node with a carefully crafted system prompt that:
- Enforces read-only query generation
- Requires structured JSON output
- Handles ambiguous questions gracefully
- Tracks assumptions and confidence

## Environment Variables

| Variable | Description |
|---|---|
| `SQL_QUERY_GENERATOR_FLOW_ID` | The deployed Lamatic flow ID |
| `LAMATIC_API_URL` | Your Lamatic API endpoint URL |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID |
| `LAMATIC_API_KEY` | Your Lamatic secret API key |

## Author

**Aakriti** — [pandey.aakriti1@gmail.com](mailto:pandey.aakriti1@gmail.com)
