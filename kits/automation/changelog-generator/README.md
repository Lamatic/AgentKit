# 📋 Changelog Generator — AgentKit

An AI-powered kit that generates professional, well-structured changelogs from GitHub repository information. Paste a repo URL and date range — get a complete changelog in seconds.

![Changelog Generator](./public/preview.png)

## ✨ What It Does

- Takes a **GitHub repository URL** and a **date range** as input
- Generates a structured changelog with sections:
  - 📋 Summary (plain English for non-technical stakeholders)
  - 🚀 New Features
  - 🐛 Bug Fixes
  - 🔧 Improvements
  - ⚠️ Breaking Changes
  - 📦 Dependencies
- **One-click copy** of the full markdown output
- Powered by **Groq LLaMA** via Lamatic Flows

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit/tree/main/kits/automation/changelog-generator)

## 📦 Prerequisites

- Node.js 18+
- A [Lamatic.ai](https://lamatic.ai) account
- A [Groq](https://console.groq.com) API key (free)

## ⚙️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/automation/changelog-generator
npm install
```

### 2. Set Up Lamatic Flow

1. Sign in to [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a new project → "Changelog Generator"
3. Create a new Flow with:
   - **Trigger node** with inputs: `repo_url`, `date_from`, `date_to` (all String)
   - **Generate Text node** using Groq `llama-3.3-70b-versatile` with the prompt from `flows/changelog-flow/README.md`
4. Deploy the flow
5. Note your **Flow ID**, **API Key**, **Project ID**, and **API URL**

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
LAMATIC_FLOW_ID="your-flow-id"
LAMATIC_PROJECT_ENDPOINT="your-api-endpoint"
LAMATIC_PROJECT_ID="your-project-id"
LAMATIC_PROJECT_API_KEY="your-api-key"
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy to Vercel

1. Push your fork to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your fork
3. Set **Root Directory** to `kits/automation/changelog-generator`
4. Add all 4 environment variables
5. Click Deploy

## 📁 Project Structure

```
changelog-generator/
├── app/
│   └── page.tsx          # Main UI
├── actions/
│   └── orchestrate.ts    # Lamatic Flow API call
├── flows/
│   └── changelog-flow/   # Exported Lamatic flow files
├── .env.example          # Environment variables template
├── config.json           # Kit metadata
└── README.md
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.