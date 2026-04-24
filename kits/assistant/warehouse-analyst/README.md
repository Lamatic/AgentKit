<div align="center">

# 🏭 Warehouse Analyst AI

<img src="./public/home.png" alt="">

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?&logo=next.js&logoColor=white" alt=""/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?&logo=typescript&logoColor=white" alt=""/>
  <img src="https://img.shields.io/badge/PostgreSQL-336791?&logo=postgresql&logoColor=white" alt=""/>
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?&logo=supabase&logoColor=white" alt=""/>
  <img src="https://img.shields.io/badge/Lamatic.ai-0f766e?" alt=""/>
  <img src="https://img.shields.io/badge/Gemini_Flash-4285F4?&logo=google&logoColor=white" alt=""/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38bdf8?&logo=tailwind-css&logoColor=white" alt=""/>
  <img src="https://img.shields.io/badge/ShadCN_UI-black?" alt=""/>
  <img src="https://img.shields.io/badge/Built_in-1_Day-ff6b6b?" alt=""/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?" alt=""/>
</p>

**Ask your warehouse data anything. In plain English. Get real answers.**

</div>

---

## The Problem 🤔

Non-technical warehouse staff ask simple questions every day:

> *"How many products are low on stock?"*  
> *"Is order ORD-2025-001 dispatched yet?"*  
> *"Which warehouse has the most inventory?"*

Getting these answers requires SQL knowledge, database access, and time. Most people have none of those. So they ask a
developer. Who has better things to do.

**This fixes that.**

---

## ✅ The Solution

A chat interface that converts plain English into SQL, runs it on your live database, and returns a human-readable
answer. Instantly.

```txt
You:  how many products are low on stock?
Bot:  34 products are currently below their reorder level.

You:  list them
Bot:  Here are all low stock items:
      1. Nike Air Max 90 — 3 units
      2. Adidas Ultraboost — 1 unit
      3. Puma RS-X — 5 units
```

Zero SQL. Zero training. Zero nonsense.

---

## 🧠 The Approach

```txt
User Question
     ↓
Next.js API Route
     ↓
Fetch live DB schema (CREATE TABLE format)
     ↓
Send { question + schema + chat history } → Lamatic Flow
     ↓
Gemini Flash generates a safe SELECT query + response template
     ↓
Query runs on PostgreSQL
     ↓
Template filled with real data → English answer returned
```

**Why this architecture?**

- Schema is fetched dynamically → works with **any** database, any structure
- Chat history (last 4 messages) is included → follow-up questions work naturally
- Fixed SQL aliases (`value`, `subject`, `detail`) → template replacement never breaks
- Lamatic handles AI orchestration → swap models without touching code

---

## 📊 The Result

| Without this              | With this                  |
|---------------------------|----------------------------|
| Open pgAdmin              | Open the chat              |
| Write SQL                 | Type your question         |
| Read raw data             | Get a plain English answer |
| Repeat for every question | Follow up naturally        |

---

## ⚖️ Tradeoffs & Assumptions

| Decision                       | Reason                                                                                                                                             |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Read-only SQL only**         | Safety — AI cannot modify your data, ever                                                                                                          |
| **Supabase pooling URL**       | Currently set up with Supabase connection pooling. Works with any PostgreSQL DB with a pooling URL. Other SQL databases need minor reconfiguration |
| **Schema fetched per request** | Always fresh — no stale cache issues                                                                                                               |
| **Mocked user object**         | Auth is mocked with a static user object. Replace with a real `users` DB table with the same shape to make it production-ready                     |
| **Last 4 messages as context** | Enough for meaningful follow-ups, cheap on tokens                                                                                                  |
| **Gemini Flash over Pro**      | Faster responses, better instruction following, far fewer rate limits                                                                              |

---

## ✨ Features

<p>
  <img src="https://img.shields.io/badge/Plain_English_Queries-4CAF50?" />
  <img src="https://img.shields.io/badge/Conversation_Memory-2196F3?" />
  <img src="https://img.shields.io/badge/Any_PostgreSQL_DB-9C27B0?" />
  <img src="https://img.shields.io/badge/Read--Only_Safe-F44336?" />
  <img src="https://img.shields.io/badge/Live_Data-FF9800?" />
  <img src="https://img.shields.io/badge/Auto_Retry_on_503-607D8B?" />
  <img src="https://img.shields.io/badge/Custom_DB_from_UI-00BCD4?" />
  <img src="https://img.shields.io/badge/Live_Stats_Panel-8BC34A?" />
  <img src="https://img.shields.io/badge/Dark_Mode-212121?" />
  <img src="https://img.shields.io/badge/Easy to use and configure-ff6b6b?" />
</p>

---

## 🔧 Prerequisites

<p>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/npm-9+-CB3837?&logo=npm&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Lamatic.ai-free_account-0f766e?" />
  <img src="https://img.shields.io/badge/Supabase-free_tier_ok-3FCF8E?&logo=supabase&logoColor=white" />
</p>

---

## ⚡ Setup — 4 Steps, ~10 Minutes

### Step 1 — Clone & Install

```bash
git clone [URL-OF-THE-PROJECT]
cd [CLONED-FOLDER]
npm install
```

### Step 2 — Environment Variables

```bash
cp .env.example .env.local
```

```env
# Lamatic.ai → Settings → API Keys
LAMATIC_API_KEY=your_api_key_here

# Lamatic → Settings → API Docs → Endpoint
LAMATIC_ENDPOINT=https://your-project.lamatic.ai/api/flows

# Your deployed flow ID
LAMATIC_FLOW_ID=your_flow_id_here

# Supabase pooling URL (or any PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Step 3 — Lamatic Flow

You can find the exported Lamatic Flow in the flows/warehouse-analyst directory. </br>
Use the flow, set the credentials.

Setup the details of flow to environment variables.

The flow is ready to use now.

### Step 4 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 💬 Try These

```txt
how many products do we have?
which warehouse has the most stock?
show all pending orders
how many items are low on stock?
what is the status of order ORD-2025-001?
list all suppliers
what is the total inventory value?
```

---

## 🐛 Troubleshooting

### `503 — model experiencing high demand`

**Expected:** AI responds normally  
**Actual:** Error after timeout

**Cause:** Gemini Pro rate limits.

**Fix:** Switch to `gemini-2.0-flash`. The app already retries 3 times.

---

### `Could not connect to database`

**Expected:** Schema fetched, query runs  
**Actual:** 500 error

**Cause:** Wrong `DATABASE_URL` or wrong Supabase URL type.

**Fix:** Use the **Supabase pooling connection URL**, not the direct one.

```txt
postgresql://username:password@host:5432/database_name
```

---

## 🧪 Bug Report Template

When reporting issues, include:

### Steps to reproduce

1. What you asked or clicked
2. What happened
3. How to trigger it again

### Expected vs. actual behavior

- **Expected:** what should happen
- **Actual:** what happened instead

### Environment

```bash
node --version
npm --version
```

Also mention:

- OS: macOS / Windows / Ubuntu
- Browser: Chrome / Edge / Firefox

### Relevant logs or screenshots

- Paste terminal logs from `npm run dev`
- Paste browser console errors
- Add screenshots if UI breaks

---

## 🔮 Next Improvements

- Replace mocked user object with a real `users` table
- Add auth
- Support MySQL and other SQL databases with minor reconfiguration
- Save per-user DB connections
- Store query history

---

<div align="center">

Built in **1 day** for the **Lamatic AgentKit Challenge**

*If this saved you from writing SQL, give it a ⭐*

</div>