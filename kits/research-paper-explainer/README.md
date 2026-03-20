# 📚 Research Paper Explainer & Quiz Agent

> A Next.js kit built on [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) that takes any research paper abstract or full text, explains it at your chosen comprehension level, and generates an interactive multiple-choice quiz to test understanding.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mortarion002/AgentKit/tree/main/apps/research-paper-explainer)

---

## 🧠 Problem Statement

Reading academic research papers is hard. Dense jargon, complex methodologies, and assumed domain knowledge make papers inaccessible to students, curious learners, and even professionals stepping outside their niche.

**PaperLens** solves this with two AI-powered agents:
1. **Explainer Agent** — Breaks down a paper into plain language at high-school, undergraduate, or expert level, structured around: Core Problem → Methodology → Key Findings → Real-World Impact.
2. **Quiz Agent** — Generates a custom multiple-choice quiz from the paper to reinforce learning and test comprehension.

---

## ✨ Features

- 📄 Paste any research paper abstract or full text
- 🎓 Choose explanation level: Simple / Intermediate / Expert
- 🧩 Generate 3–10 quiz questions with answer feedback & explanations
- 📊 Live score tracking after quiz submission
- ⚡ Two independent Lamatic Flows (explain + quiz)
- 🎨 Clean, distraction-free editorial UI

---

## 🗂 Folder Structure

```
research-paper-explainer/
├── app/
│   ├── page.tsx              # Main UI (input + output panels)
│   ├── layout.tsx            # Root layout with fonts
│   ├── globals.css           # Design system & animations
│   └── api/
│       ├── explain/route.ts  # Calls the Lamatic explain flow
│       └── quiz/route.ts     # Calls the Lamatic quiz flow
├── lamatic-config.json       # Flow definitions for Lamatic Studio
├── .env.example              # Required environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

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

1. Sign up at [lamatic.ai](https://lamatic.ai) and create a new project
2. In Lamatic Studio, create **two flows** using the definitions in `lamatic-config.json`:
   - **Explain Flow** — accepts `paperContent` + `level`, returns a markdown explanation
   - **Quiz Flow** — accepts `paperContent` + `numQuestions`, returns a JSON quiz
3. Deploy both flows and copy their endpoint URLs

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_project_id
EXPLAIN_FLOW_URL=https://your-project.lamatic.app/api/explain
QUIZ_FLOW_URL=https://your-project.lamatic.app/api/quiz
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

```bash
npm run build
vercel --prod
```

Or use the one-click deploy button at the top of this README.

---

## 🔧 Lamatic Flow Configuration

The `lamatic-config.json` defines both flows. Key configuration:

| Flow | Input Fields | Output |
|---|---|---|
| `explain-flow` | `paperContent`, `level` | Markdown explanation string |
| `quiz-flow` | `paperContent`, `numQuestions` | JSON: `{ questions: [...] }` |

**Quiz JSON shape expected from Lamatic:**

```json
{
  "questions": [
    {
      "question": "What problem does this paper solve?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": 0,
      "explanation": "The paper focuses on..."
    }
  ]
}
```

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| AI Agent | Lamatic Flow (GPT-4o-mini via Lamatic Studio) |
| Markdown Rendering | `react-markdown` + `remark-gfm` |
| Deployment | Vercel |

---

## 🤝 Contributing

Found a bug or want to improve this kit? Open an issue or PR on the [AgentKit repository](https://github.com/Lamatic/AgentKit).

---

## 📄 License

MIT — Built by [Aman Kumar](https://github.com/Mortarion002) as part of the Lamatic AgentKit community.
