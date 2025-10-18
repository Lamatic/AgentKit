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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/automation/hiring&env=LAMATIC_API_KEY&envDescription=Lamatic%20API%20key%20is%20required.&envLink=https://lamatic.ai/docs/keys#required-api-keys)

---

## 🔑 Setup

### Required Keys and Config

You'll need three things to run this project locally:  

1. **Lamatic API Key** → get it from your [Lamatic account](https://lamatic.ai).  
2. Vercel Blob Token – Required for resume file storage. Each deployment needs its own Blob token. You can generate it from your Vercel project after the first deploy (see instructions below).
3. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines the hiring analysis flow).  
   ⚠️ Note: The `lamatic-config.json` in this repo is just a **dummy example**.  
   Replace it with your own exported config from Lamatic Studio.

| Item                    | Purpose                                      | Where to Get It                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic API Key         | Authentication for Lamatic AI APIs           | [lamatic.ai](https://lamatic.ai)                |
| Blob Read/Write Token   | Resume file storage                          | [Vercel Blob Quickstart](https://vercel.com/docs/storage/vercel-blob/quickstart)                    |
| Lamatic Config          | Defines your hiring analysis workflow        | From your Lamatic Studio Agent Kit Project      |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
LAMATIC_API_KEY=your_lamatic_key

# Vercel Blob (configured on Vercel)
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### 2. Config File

Copy your project payload into [`lamatic-config.json`](./lamatic-config.json) in the repo root.  
(Export this directly from your Lamatic Studio project and paste it into the file.)

### 3. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy Instructions (Vercel)

Click the “Deploy with Vercel” button.

Fill in LAMATIC_API_KEY (required).

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
/lamatic-config.json       # Lamatic flow configuration
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
