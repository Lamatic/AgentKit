# Subscription Audit by Lamatic.ai

**Subscription Audit** is an AI-powered financial assistant built with [Lamatic.ai](https://lamatic.ai). Paste raw bank statement or transaction export text and get back a structured list of likely recurring subscriptions — each with a merchant name, amount, frequency, and a plain-language "keep or cancel" verdict.

---

## Problem

Recurring charges are easy to lose track of — a forgotten free trial that converted, a gym membership you stopped using, a duplicate streaming subscription. Manually scanning months of bank statements to catch these is tedious and error-prone. This kit automates that scan: paste your statement text in, get a clear, structured verdict on each recurring charge out.

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

**Pre: Build in Lamatic**
1. Sign in or sign up at https://lamatic.ai
2. Create a project (if you don't have one yet)
3. Click "+ New Flow" → "Create from scratch"
4. Add an API Request trigger with a `statement_text` string input
5. Add a Generate JSON node with the system/user prompts from `prompts/subscription-audit_generate-json_system.md` and `prompts/subscription-audit_generate-json_user.md`, and the schema described in `flows/subscription-audit.ts`
6. Deploy the flow and obtain your API key, Project ID, API URL, and Flow ID from the flow's Setup panel

**Post: Wire into this repo**
1. Create a `.env.local` file in `apps/` and set the keys (see below)
2. Install and run locally:
   - `cd apps`
   - `npm install`
   - `npm run dev`
3. Deploy (Vercel recommended):
   - Import your repo, set the project's Root Directory to `kits/subscription-audit/apps`
   - Add env vars in Vercel (same as your `.env.local`)
   - Deploy and test your live URL

---

## 🔑 Setup

### 1. Environment Variables

Create `.env.local` inside `apps/` with:

```bash
# Lamatic
SUBSCRIPTION_AUDIT="Your Flow ID"
LAMATIC_API_URL="Your Lamatic API URL"
LAMATIC_PROJECT_ID="Your Lamatic Project ID"
LAMATIC_API_KEY="Your Lamatic API Key"
```

### 2. Install & Run

```bash
cd apps
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📂 Repo Structure

/flows
└── subscription-audit.ts # Lamatic flow definition
/prompts
└── subscription-audit_generate-json_*.md # System/user prompts
/model-configs
└── subscription-audit_generate-json.ts # LLM model config
/constitutions
└── default.md # Guardrails
/apps
├── actions/orchestrate.ts # Lamatic workflow orchestration
├── app/page.tsx # Main audit form UI
├── components/ # UI components (shadcn/ui)
├── lib/lamatic-client.ts # Lamatic SDK client
└── package.json # Dependencies & scripts


---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](../../../LICENSE).

