# Agent Kit Embedded search by Lamatic.ai
<p align="center">
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmFmdXh4aHB3bXZidmg1dDM1azhtY2xheTl6ZnUzbHdsYXo1OXVvcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6hnrR2Vk2PLByiWKbL/giphy.gif"/>
</p>

<p align="center">
  <a href="https://agent-kit-embedded-search.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Embedded Search** is an AI-powered document/website search system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to index PDFs and webpages, then provides an interactive search widget where users can search across their data in seconds.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/embed/search&env=LAMATIC_CONFIG_EMBEDDED_SEARCH&envDescription=Your%20Lamatic%20Config%Embedded%20Search%20key%20is%20required.&envLink=https://lamatic.ai/templates/agentkits/embed/agent-kit-embed-search)

---


## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://app.lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow”  
4. Choose “Build from Use Cases” and select the kit closest to your needs  
5. Configure providers/tools/inputs as prompted  
6. Deploy the flow in Lamatic and verify it runs  
7. Export the lamatic-config.json from your deployed flow

Post: Wire into this repo
1. Place lamatic-config.json in the path this repo expects (commonly ./lamatic-config.json; if different, follow this README’s instructions)  
2. Create a .env file and set:
   - LAMATIC_API_KEY=your_lamatic_key
   - Any other provider keys your flow requires (e.g., OPENAI_API_KEY, ANTHROPIC_API_KEY)
3. Install and run locally:
   - npm install
   - npm run dev
4. Deploy (Vercel recommended):
   - Import your repo, set the project’s Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- If this repo contains a lamatic-config.json, it’s a placeholder. Replace it with your exported config.  
- Coming soon: single-click export and “Connect Git” in Lamatic to push config directly to your repo.

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://app.lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow”  
4. Choose “Build from Kits" and select the 'Embedded Chat' agent kit.  
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain LAMATIC_CONFIG_EMBEDDED_CHAT key
7. Copy the LAMATIC_CONFIG_EMBEDDED_CHAT from your studio

Post: Wire into this repo
1. Create a .env file and set:
   - LAMATIC_CONFIG_EMBEDDED_CHAT=your_lamatic_config_embedded_chat_key
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
| Lamatic Config Embedded Chat Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |
| Blob Read/Write Token   | Resume file storage                          | [Vercel Blob Quickstart](https://vercel.com/docs/storage/vercel-blob/quickstart)                    |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
LAMATIC_CONFIG_EMBEDDED_CHAT=your_lamatic_config_embedded_chat

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

Fill in LAMATIC_CONFIG_EMBEDDED_CHAT (required).

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
 ├── page.tsx              # Main upload/indexation UI
 ├── search
 │   └── page.tsx          # Search interface with documents
 └── api
     ├── index             # PDF indexation endpoint
     ├── index-webpages    # Webpage indexation endpoint
     ├── delete            # PDF deletion endpoint
     ├── delete-resource   # Resource deletion endpoint
     └── check-workflow-status  # Async workflow polling
/lib
 └── lamatic-client.ts     # Lamatic SDK client
/public
 └── images
     ├── lamatic-logo.png  # Lamatic branding
     └── *.png             # Data source icons
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).