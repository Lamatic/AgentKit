# 📚 Research Paper Explainer & Quiz Agent

> A Next.js kit built on [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) that takes any research paper abstract or full text, explains it at your chosen comprehension level, and generates an interactive multiple-choice quiz to test understanding.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mortarion002/AgentKit/tree/main/kits/research-paper-explainer&root-directory=kits/research-paper-explainer&env=LAMATIC_PROJECT_ENDPOINT,LAMATIC_PROJECT_ID,LAMATIC_PROJECT_API_KEY,LAMATIC_FLOW_ID,QUIZ_FLOW_ID&envDescription=Lamatic%20API%20credentials%20and%20flow%20IDs&envLink=https://studio.lamatic.ai)

---

## 🧠 Problem Statement

Reading academic research papers is hard. Dense jargon, complex methodologies, and assumed domain knowledge make papers inaccessible to students, curious learners, and even professionals stepping outside their niche.

**PaperLens** solves this with two AI-powered Lamatic flows:
1. **Explainer Flow** — Breaks down any research paper into plain language at three levels: Simple (high school), Intermediate (undergraduate), or Expert. Structured around: Core Problem → Methodology → Key Findings → Real-World Impact.
2. **Quiz Flow** — Generates a custom multiple-choice quiz from the paper to reinforce learning and test comprehension, complete with explanations for each answer.

---

## ✨ Features

- 📄 Paste any research paper abstract or full text
- 🎓 Choose explanation level: Simple / Intermediate / Expert
- 🧩 Generate 3–10 quiz questions with answer feedback & explanations
- 📊 Live score tracking after quiz submission
- ⚡ Two independent Lamatic Flows (explain + quiz)
- 🎨 Clean, distraction-free editorial UI built with Next.js + Tailwind

---

## 🗂 Folder Structure

```
kits/research-paper-explainer/
├── actions/
│   └── orchestrate.ts        # Lamatic flow orchestration (explain + quiz)
├── app/
│   ├── page.tsx              # Main UI (input + output panels)
│   ├── layout.tsx            # Root layout with fonts
│   ├── globals.css           # Design system & animations
│   └── api/
│       ├── explain/route.ts  # API route → explain flow
│       └── quiz/route.ts     # API route → quiz flow
├── lib/
│   └── lamatic-client.ts     # Lamatic SDK client
├── flows/
│   ├── explain-flow/         # Exported explain flow from Lamatic Studio
│   └── quiz-flow/            # Exported quiz flow from Lamatic Studio
├── .env.example              # Environment variables template
├── config.json               # Kit metadata
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Lamatic Account | [lamatic.ai](https://lamatic.ai) |

### 1. Clone the Repository

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/research-paper-explainer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Lamatic Flows

1. Sign up at [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a new project
3. Create two flows using the exported configs in the `flows/` folder:

#### Explain Flow
- **Trigger:** API Request
- **Schema:** `{ "paperContent": "string", "level": "string" }`
- **LLM Node:** Generate Text with system prompt for structured explanation
- **Output:** `{ "generatedResponse": "{{LLMNode.output.generatedResponse}}" }`

#### Quiz Flow
- **Trigger:** API Request
- **Schema:** `{ "paperContent": "string", "numQuestions": "string" }`
- **LLM Node:** Generate Text returning JSON quiz format
- **Output:** `{ "generatedResponse": "{{LLMNode.output.generatedResponse}}" }`

4. Deploy both flows and copy their Flow IDs

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
LAMATIC_PROJECT_ENDPOINT=https://your-project.lamatic.dev/graphql
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_PROJECT_API_KEY=your-api-key
LAMATIC_FLOW_ID=your-explain-flow-id
QUIZ_FLOW_ID=your-quiz-flow-id
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

### Option 1 — One-click deploy
Click the **Deploy with Vercel** button at the top of this README.

### Option 2 — Manual deploy

```bash
# Push to GitHub first
git add .
git commit -m "feat: add research-paper-explainer kit"
git push origin main
```

Then in Vercel:
1. Import your repository
2. Set **Root Directory** to `kits/research-paper-explainer`
3. Add all environment variables from your `.env`
4. Click **Deploy**

---

## 🔑 Environment Variables

| Variable | Description | Where to Find |
|---|---|---|
| `LAMATIC_PROJECT_ENDPOINT` | Your Lamatic GraphQL endpoint | Studio → Setup Guide → App Frameworks |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID | Studio → Setup Guide → App Frameworks |
| `LAMATIC_PROJECT_API_KEY` | Your Lamatic API key | Studio → Get API Key |
| `LAMATIC_FLOW_ID` | Explain flow ID | Studio → Flow → Setup Guide |
| `QUIZ_FLOW_ID` | Quiz flow ID | Studio → Flow → Setup Guide |

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| AI Orchestration | Lamatic SDK (`lamatic` npm package) |
| LLM | Gemini 2.5 Flash via Lamatic Studio |
| Markdown Rendering | `react-markdown` + `remark-gfm` |
| Deployment | Vercel |

---

## 📖 How It Works

```
User pastes paper text
        ↓
Next.js app calls Lamatic flow via SDK
        ↓
Lamatic passes text to Gemini 2.5 Flash
        ↓
AI generates explanation or quiz JSON
        ↓
Response polled via checkStatus()
        ↓
Result displayed in the UI
```

---

## 🤝 Contributing

Found a bug or want to improve this kit? Open an issue or PR on the [AgentKit repository](https://github.com/Lamatic/AgentKit).

---

## 📄 License

MIT — Built by [Aman Kumar](https://github.com/Mortarion002) as part of the Lamatic AgentKit community.