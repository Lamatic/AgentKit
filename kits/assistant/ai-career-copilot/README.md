# 🚀 AI Career Copilot

An AI-powered career assistant that analyzes resumes and provides personalized career guidance including skill analysis, job recommendations, learning roadmaps, project suggestions, and interview preparation.

---
## 🚀 Live Demo

🔗 https://ai-career-copilot-green.vercel.app/

## ✨ Features

* 🎯 **Skill Analysis** – Extract and analyze skills from resumes
* 📊 **Readiness Score** – Evaluate how job-ready you are
* 💼 **Role Suggestions** – Get suitable job roles
* 🗺️ **Learning Roadmap** – Step-by-step improvement plan
* 🚀 **Project Ideas** – Build real-world portfolio projects
* 💬 **Interview Questions** – Practice with tailored questions

---

## 🛠 Tech Stack

* **Frontend:** Next.js, React, Tailwind CSS
* **Backend:** Lamatic AI Flow (GraphQL API)
* **API Communication:** Axios

---

## 📦 Prerequisites

* Node.js 18+
* npm
* Lamatic Account
* Deployed Lamatic Flow

---

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/assistant/ai-career-copilot
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

4. **Add your Lamatic credentials in `.env`**

```env
LAMATIC_API_KEY=YOUR_API_KEY
LAMATIC_PROJECT_ID=YOUR_PROJECT_ID
LAMATIC_API_URL=YOUR_API_URL
AGENTIC_GENERATE_CONTENT=YOUR_FLOW_ID
```

5. **Run the project**

```bash
npm run dev
```

---

## 🧪 Usage

1. Enter your **resume text**
2. Select your **target domain** (e.g., Web Development)
3. Click **Analyze**
4. Get:

   * Skills
   * Missing skills
   * Roles
   * Roadmap
   * Projects
   * Interview questions

---

## 📂 Project Structure

```
ai-career-copilot/
├── app/                # Next.js pages
├── components/         # UI components
├── actions/            # Server actions
├── lib/                # Lamatic API client
├── flows/              # Exported Lamatic flow
├── .env.example        # Environment template
├── config.json         # Kit configuration
└── README.md
```

---

## 🔗 Lamatic Flow

* **Flow ID:** `66c98d92-70da-4eec-82b0-af4f01be9cd5`
* **Type:** Synchronous GraphQL Workflow

---

## 🌐 Deployment

You can deploy using Vercel:

* Set root directory:

```
kits/assistant/ai-career-copilot
```

* Add environment variables in Vercel dashboard

---

## 📌 Example Input

**Resume:**

```
I know JavaScript, React, and basic Node.js
```

**Domain:**

```
Web Development
```

---

## 📈 Output Includes

* Skills & Missing Skills
* Career Roles
* Readiness Score
* Learning Roadmap
* Suggested Projects
* Interview Questions

---

## 🤝 Contribution

This project is built as part of a Lamatic AgentKit contribution.

---

## 👨‍💻 Author

**Durvankur Joshi**

---

## ⭐ If you like this project, give it a star!
