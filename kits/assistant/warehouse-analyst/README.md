<div align="center">

# 🏭 Warehouse Analyst AI

**Stop writing SQL. Start asking questions.**


*Your warehouse data, but make it conversational.*

</div>

***

## 🤔 Ever had this problem?

Your warehouse manager walks up and asks *"Hey, how many products are low on stock right now?"*

And you go: open pgAdmin → remember the table name → write `SELECT COUNT(*) FROM inventory WHERE quantity < reorder_level` → wait → read raw numbers → translate to human → respond.

**That's 4 unnecessary steps.** Warehouse Analyst AI cuts it to one: **just ask.**

***

## ✨ What is this?

A natural language chatbot that connects directly to your PostgreSQL warehouse database and answers questions in plain English. No SQL knowledge required. No dashboards to learn. No BI tools to configure.

Just type *"Which warehouse has the most stock?"* and get a real answer from your live data. Instantly.

Built with **Next.js** on the frontend and **Lamatic.ai** handling the AI orchestration magic in the middle.

***

## 🚀 Features

- 💬 **Natural Language to SQL** — Ask anything about your warehouse in plain English
- 🔄 **Conversation Memory** — Follow-up questions work! *"How many are there?"* after *"Show low stock items"* just works
- 🏪 **Multi-table Intelligence** — Handles JOINs across products, inventory, orders, suppliers, warehouses automatically
- ⚡ **Live Data** — Queries your actual database in real-time, not cached snapshots
- 🔌 **Plug Any DB** — Works with any PostgreSQL database schema, not just warehouses
- 🛡️ **Read-Only Safe** — AI is instructed to only run SELECT queries. Your data is safe
- 🔁 **Auto Retry** — Handles AI overload (503/429) with automatic retries and graceful errors
- 🎛️ **Custom DB Connection** — Connect your own database from the settings panel without touching code
- 📊 **Live Stats Panel** — At-a-glance KPIs: total products, stock, warehouses, pending orders
- 🌙 **Dark Mode UI** — Because we're developers and we have standards

***

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| UI | ShadCN UI + Tailwind CSS |
| AI Orchestration | [Lamatic.ai](https://lamatic.ai) |
| LLM | Gemini 2.0 Flash (via Lamatic) |
| Database | PostgreSQL (via `pg` Pool) |
| Deployment | Vercel |

***

## 📸 How it looks

> Ask a question → get a real answer from your database. That's it.

```
You:  how many products do we have?
Bot:  There are 248 products in the database.

You:  which ones are low on stock?
Bot:  34 products are currently below their reorder level.

You:  list them
Bot:  Here are all the low stock items:
      1. Nike Air Max 90 — 3 units
      2. Adidas Ultraboost — 1 unit
      3. Puma RS-X — 5 units
      ...
```

***

## ⚙️ Prerequisites

Before you start, make sure you have:

- [Node.js](https://nodejs.org) **18+**
- [npm](https://npmjs.com) **9+**
- A [Lamatic.ai](https://lamatic.ai) account (free)
- A PostgreSQL database (with some data in it)
- A Gemini API key (or any LLM connected in Lamatic)

***

## 🏗️ Lamatic Flow Setup

This app uses Lamatic as the AI brain. Set it up once and forget it.

### 1. Create a Flow in Lamatic Studio

Go to [studio.lamatic.ai](https://studio.lamatic.ai) → New Flow → Add these 3 nodes:

```
API Request → Generate Text → API Response
```

### 2. Configure the Generate Text node

- **Model:** `gemini-2.0-flash`
- **Temperature:** `0`
- **System Prompt:** *(paste the system prompt from below)*
- **User Prompt:**
```
CONVERSATION HISTORY:
{{nodes.apiRequest.output.context}}

SCHEMA:
{{nodes.apiRequest.output.schema}}

QUESTION:
{{nodes.apiRequest.output.question}}

Return raw JSON only. Use only "value", "subject", "detail" as SQL aliases.
```

### 3. System Prompt

<details>
<summary>Click to expand the full system prompt</summary>

```
YOU ARE A SQL GENERATOR FOR A WAREHOUSE DATABASE.

YOUR ONLY JOB: Read the schema. Read the question. Return JSON with a SQL query.

ALIAS RULES — ALWAYS USE THESE EXACT ALIAS NAMES IN YOUR SQL:
- If the result is a COUNT or SUM or any number → alias it as "value"
- If the result is a name, title, or main subject → alias it as "subject"
- If the result is extra info (status, city, price, date) → alias it as "detail"

OUTPUT FORMAT — RETURN EXACTLY THIS JSON, NOTHING ELSE:
{"sql":"YOUR_SQL_HERE","template":"TEMPLATE_STRING","errorMessage":"Friendly no-results message"}

TEMPLATE RULES:
- Use {value}, {subject}, {detail} as placeholders in the template string
- Write the template as a natural English sentence

EXAMPLES:
Question: how many products do we have?
{"sql":"SELECT COUNT(*) as value FROM products","template":"There are {value} products in the database.","errorMessage":"No products found."}

Question: what is the status of order ORD-2025-001?
{"sql":"SELECT status as detail FROM orders WHERE order_number = 'ORD-2025-001'","template":"Order ORD-2025-001 is currently {detail}.","errorMessage":"Order not found."}

Question: which warehouse has the most stock?
{"sql":"SELECT w.name as subject, SUM(i.quantity) as value FROM inventory i JOIN warehouses w ON i.warehouse_id = w.id GROUP BY w.name ORDER BY value DESC LIMIT 1","template":"{subject} has the most stock with {value} units.","errorMessage":"No stock data found."}

ONLY return null SQL if the question has ZERO relation to the database schema:
{"sql":null,"template":null,"errorMessage":"That's outside my area! I only know about this database. Try asking about products, orders, or stock levels."}

FINAL CHECKLIST:
[ ] Used only "value", "subject", "detail" as aliases?
[ ] Template only uses {value}, {subject}, {detail}?
[ ] Output is pure raw JSON with no markdown or backticks?
[ ] Only SELECT queries?
```

</details>

### 4. Deploy the flow and copy your Flow ID

***

## 📦 Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR-USERNAME/warehouse-analyst-ai.git
cd warehouse-analyst-ai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see below)

# 4. Run it
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start asking questions 🎉

***

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
# Lamatic.ai Configuration
LAMATIC_API_KEY=your_lamatic_api_key_here
LAMATIC_ENDPOINT=https://your-project.lamatic.ai/api/flows
LAMATIC_FLOW_ID=your_flow_id_here

# PostgreSQL Database
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

| Variable | Where to find it |
|----------|-----------------|
| `LAMATIC_API_KEY` | Lamatic Studio → Settings → API Keys |
| `LAMATIC_ENDPOINT` | Lamatic Studio → Settings → API Docs → Endpoint |
| `LAMATIC_FLOW_ID` | Your flow URL or Flow Details panel |
| `DATABASE_URL` | Your PostgreSQL connection string |

> **Pro tip:** Users can also enter a custom database URL directly from the settings icon in the app — no code changes needed.

***

## 💬 Example Questions to Try

Once running, try asking:

```
How many products do we have?
Which warehouse has the most stock?
Show me all pending orders
How many items are low on stock?
What is the status of order ORD-2025-001?
List all product categories
Which supplier has the most products?
What's the total inventory value?
```

***

## 🏛️ Architecture

```
User Question
     │
     ▼
Next.js Frontend (page.tsx)
     │  POST /api/chat { question, context, connectionUrl? }
     ▼
API Route (route.ts)
     ├── 1. Connect to PostgreSQL
     ├── 2. Fetch schema (CREATE TABLE format)
     ├── 3. Call Lamatic with { question, schema, context }
     │         └── Lamatic → Gemini Flash → JSON { sql, template, errorMessage }
     ├── 4. Run the SQL query
     └── 5. Fill template with real values → return answer
```

***

## 📁 Project Structure

```
warehouse-analyst-ai/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Main AI + DB logic
│   │   └── stats/route.ts      # Stats panel data
│   └── page.tsx                # Main chat UI
├── components/
│   ├── chat/
│   │   ├── ChatArea.tsx        # Message bubbles
│   │   └── ChatInput.tsx       # Input bar
│   ├── layout/
│   │   ├── AppSidebar.tsx      # Sidebar + DB settings
│   │   └── TopBar.tsx          # Header
│   └── stats/
│       └── StatsPanel.tsx      # KPI cards
├── lib/
│   └── lamatic-client.ts       # Lamatic SDK wrapper
├── .env.example
└── README.md
```

***

## 🤝 Contributing

Part of the [Lamatic AgentKit Challenge](https://github.com/Lamatic/AgentKit). PRs welcome!

***

## 📄 License

MIT — do whatever you want with it.

***

<div align="center">

Built with ☕ and way too many debugging sessions for the **Lamatic AgentKit Challenge**

*If this saved you from writing SQL at 2am, consider giving it a ⭐*

</div>