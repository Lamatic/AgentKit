# 🎯 AI Interview Coach — Lamatic AgentKit

> Get a **fully personalized interview prep kit** in seconds. Paste your target role,
> company, and background — and get tailored technical questions, behavioral Q&A,
> company insights, and a 30-60-90 day plan.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit/tree/main/kits/assistant/interview-coach)

---

## 🧩 What Problem Does This Solve?

As a student and developer who went through campus placements and interviews myself,
I noticed a gap: generic interview prep tools give the same questions to everyone.
They don't care whether you're applying as a fresher to a startup or a mid-level
engineer at Google.

**AI Interview Coach** solves this by:
- Tailoring questions to your **specific role + company + background**
- Giving STAR-method answer frameworks based on your actual experience
- Sharing company-specific culture and tech stack insights
- Providing a realistic 30-60-90 day onboarding plan if you get hired

---

## ✨ Features

| Feature | Description |
|---|---|
| 💻 Technical Questions | 8-10 role-specific questions based on your target company |
| 🧠 Behavioral Questions | 5-6 behavioral Qs + what the interviewer is actually testing |
| 💡 Answer Tips | STAR-method frameworks tailored to your background |
| 🏢 Company Insights | Culture, values, tech stack, and what they look for |
| 🗓️ 30-60-90 Day Plan | Personalized onboarding roadmap if you land the job |

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, TypeScript
- **AI Orchestration:** Lamatic Studio (LLM Flow)
- **Deployment:** Vercel

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+
- [Lamatic.ai](https://lamatic.ai) account (free)
- [Vercel](https://vercel.com) account (for deployment)

### Step 1 — Set Up the Lamatic Flow

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and sign in
2. Create a new Project → Create a new Flow
3. Add an **API Trigger** node with these inputs:
   - `jobRole` (string)
   - `company` (string)
   - `background` (string)
   - `experienceLevel` (string)
4. Add an **LLM Node** — copy the prompts from `flows/interview-coach/FLOW_SETUP.md`
5. Add an **API Response** node connected to the LLM output
6. Click **Deploy** and wait for green status
7. Copy the **Flow ID** from the three-dot menu

### Step 2 — Get Your API Keys

Navigate to **Settings** in Lamatic Studio:

| Variable | Where to find it |
|---|---|
| `LAMATIC_API_KEY` | Settings → API Keys → Copy |
| `LAMATIC_PROJECT_ID` | Settings → Project → Project ID |
| `LAMATIC_API_URL` | Settings → API Docs → Endpoint |
| `INTERVIEW_COACH_FLOW_ID` | Flow Editor → three-dot menu → Copy Flow ID |

### Step 3 — Run Locally

```bash
# Clone the AgentKit repo
git clone https://github.com/YOUR-USERNAME/AgentKit.git
cd AgentKit/kits/assistant/interview-coach

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Step 4 — Deploy to Vercel

1. Push your branch to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set **Root Directory** to `kits/assistant/interview-coach`
4. Add all environment variables from your `.env` file
5. Click **Deploy**

---

## 🧪 Example Usage

**Input:**
- Role: `Frontend Developer`
- Company: `Lamatic.ai`
- Level: `Fresher`
- Background: `B.Tech IT, 1 year React + Node.js, built MediQueue (healthcare app), GSSoC Top 50 Rank 32, Oracle AI certified`

**Output includes:**
- Technical questions on React, TypeScript, REST APIs, system design basics
- Behavioral questions around teamwork, open source contributions
- Tips: How to frame GSSoC experience using STAR method
- Company insight: Lamatic values AI-native thinking and open source culture
- 90-day plan: week 1 codebase exploration → week 4 first PR → day 60 owning a feature

---

## 📁 Folder Structure

```
interview-coach/
├── actions/
│   └── orchestrate.ts      # Server action — calls Lamatic flow
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── InterviewCoach.tsx  # Full UI with tabs
├── flows/
│   └── interview-coach/
│       ├── meta.json
│       ├── inputs.json
│       └── FLOW_SETUP.md   # Copy-paste prompts for Lamatic Studio
├── lib/
│   └── lamatic-client.ts   # Lamatic API wrapper
├── .env.example
├── config.json
└── README.md
```

---

## 🤝 Author

Built by **Piyush Kumar Singh** for the Lamatic AgentKit Challenge.

- GitHub: [@piyushkumar0707](https://github.com/piyushkumar0707)
- Portfolio: [piyush-singh.dev](https://piyush-singh.dev)

---

## 📄 License

MIT — feel free to use and extend.
