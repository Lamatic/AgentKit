# Agent Kit Sheets by Lamatic.ai

<p align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmc5NmFnd2NuNDEzcmRiMmltcjFqdGdtbmRiYWUzdTI3NmRuNXZiZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/iTvwJK5Tema4GtJXwt/giphy.gif" alt="Demo" />
</p>

<p align="center">
  <a href="https://agent-kit-sheets.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>


**Agent Kit Sheets** is an AI-powered spreadsheet application built with [Lamatic.ai](https://lamatic.ai). It combines the familiar spreadsheet interface with intelligent AI workflows to transform, analyze, categorize, and summarize your data through a modern Next.js interface.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/embed/sheets&env=EMBEDDED_SHEETS,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Sheets%20keys%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/embed/agent-kit-embed-sheets)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow” and select "Templates" 
4. Select the 'Sheets' agent kit
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain your .env keys
7. Copy the keys from your studio

Post: Wire into this repo
1. Create a .env file and set the keys
2. Install and run locally:
   - npm install
   - npm run dev
3. Deploy (Vercel recommended):
   - Import your repo, set the project’s Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- Coming soon: single-click export and “Connect Git” in Lamatic to push config directly to your repo.

---

## 🔑 Setup
## Required Keys and Config

You’ll need one thing to run this project locally:  

1. **.env Keys** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.


| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| .env Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |

### 1. Environment Variables

Create `.env` with:

```
# Lamatic
EMBEDDED_SHEETS = "EMBEDDED_SHEETS Flow ID"
LAMATIC_API_URL = "LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "LAMATIC_PROJECT_ID"
LAMATIC_API_KEY = "LAMATIC_API_KEY"

# Spreadsheet Limits (defaults shown)
## Use 'inf' or '0' for unlimited in any of the above variables
NEXT_PUBLIC_MAX_ROWS=5
NEXT_PUBLIC_MAX_COLS=3
NEXT_PUBLIC_MAX_SHEETS=1
NEXT_PUBLIC_POLLING_INTERVAL=10
```

### 2. Install & Run

```
npm install
npm run dev
# Open http://localhost:3000
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut                  | Action                    |
| ------------------------- | ------------------------- |
| `Cmd/Ctrl + Shift + R`    | Add new row               |
| `Cmd/Ctrl + Shift + C`    | Add new column            |
| `Cmd/Ctrl + Shift + N`    | Create new sheet          |

---

## 📂 Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
/app
 ├── page.tsx              # Main spreadsheet interface
 └── api
     └── webhook
         └── ai-result     # Webhook for AI processing results
/components
 ├── spreadsheet-grid.tsx  # Main grid component with resizable columns
 ├── editable-cell.tsx     # Cell editing logic
 ├── markdown-cell.tsx     # Markdown rendering in cells
 ├── add-column-panel.tsx  # Column creation popover
 ├── add-column-dialog.tsx # AI column configuration dialog
 ├── edit-column-dialog.tsx # Column editing dialog
 ├── csv-upload-dialog.tsx # CSV import interface
 ├── sheet-tabs.tsx        # Sheet navigation tabs
 ├── workbook-header.tsx   # Application header
 └── ui/                   # shadcn/ui components
/lib
 ├── store.ts              # Zustand state management
 ├── types.ts              # TypeScript type definitions
 ├── lamatic-client.ts     # Lamatic SDK client
 └── utils.ts              # Utility functions
/flows
  └── ...                  # Lamatic Flows
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](../../../LICENSE).
