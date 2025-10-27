# Agent Kit Hiring Automation by Lamatic.ai

<p align="center">
  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGFzbnM2YjV0c2c4OTJtMmhtYjZmYWNyNWZkaG91Y2x6OTR1dzRiYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3aM9X2uZyHXrXVWgDI/giphy.gif" alt="Demo" />
</p>

<p align="center">
  <a href="https://agent-kit-hiring.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Hiring Automation** is an AI-powered candidate evaluation system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to analyze resumes, match candidates to job requirements, and provide detailed hiring recommendations through a modern Next.js interface.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/automation/hiring&env=LAMATIC_CONFIG_HIRING,BLOB_READ_WRITE_TOKEN&envDescription=Your%20Lamatic%20Config%20Hiring%20key%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/automation/agent-kit-hiring)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://app.lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow”  
4. Choose “Build from Kits" and select the 'Hiring' agent kit.  
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain LAMATIC_CONFIG_HIRING key
7. Copy the LAMATIC_CONFIG_HIRING from your studio

Post: Wire into this repo
1. Create a .env file and set:
   - LAMATIC_CONFIG_HIRING=your_lamatic_config_hiring_key
3. Install and run locally:
   - npm install
   - npm run dev
4. Deploy (Vercel recommended):
   - Import your repo, set the project’s Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- Coming soon: single-click export and “Connect Git” in Lamatic to push config directly to your repo.

---

## 🔑 Setup
## Required Keys and Config

You’ll need two things to run this project locally:  

1. **LAMATIC_CONFIG_HIRING** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.
2. Vercel Blob Token – Required for resume file storage. Each deployment needs its own Blob token. You can generate it from your Vercel project after the first deploy (see instructions below).


| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic Config Hiring Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |
| Blob Read/Write Token   | Resume file storage                          | [Vercel Blob Quickstart](https://vercel.com/docs/storage/vercel-blob/quickstart)                    |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
LAMATIC_CONFIG_HIRING=your_lamatic_config_hiring

# Vercel Blob (configured on Vercel)
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### 2. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Deploy Instructions (Vercel)

Click the “Deploy with Vercel” button.

Fill in LAMATIC_CONFIG_HIRING (required).

For BLOB_READ_WRITE_TOKEN, you can use a placeholder to let the first deploy succeed.

After deployment, generate your own Blob token:

```bash
vercel storage blob token create
```

Add/Replace it in Vercel Dashboard → Environment Variables → BLOB_READ_WRITE_TOKEN and redeploy.
---

## 📂 Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
/app
 ├── page.tsx              # Main hiring form UI
 └── api
     └── upload-resume     # Resume upload endpoint
/lib
 ├── lamatic-client.ts     # Lamatic SDK client
 └── jobs-data.ts          # Job categories and listings
/public
 └── images
     └── lamatic-logo.png  # Lamatic branding
/package.json              # Dependencies & scripts
```

---

## 🎯 How It Works

1. **Select a Job** - Browse job categories and select a position
2. **Fill Application** - Enter candidate details (name, email) and upload resume
3. **AI Analysis** - Lamatic SDK processes the application through your configured workflow
4. **Get Results** - View detailed evaluation with:
   - Overall match score (0-10)
   - Key strengths
   - Areas for improvement
   - Hiring recommendation (Recommended/Rejected)

---

## 🔧 Customization

### Adding Jobs

Edit [`lib/jobs-data.ts`](./lib/jobs-data.ts) to add or modify job categories and listings:

```typescript
export const jobsData: JobCategory[] = [
  {
    id: "engineering",
    name: "Engineering",
    jobs: [
      {
        id: "senior-frontend",
        title: "Senior Frontend Developer",
        category: "Engineering",
        description: "Build amazing user experiences...",
        requirements: ["5+ years React", "TypeScript expert"],
        location: "Remote",
        type: "Full-time"
      }
    ]
  }
]
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).
