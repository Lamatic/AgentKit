# Agent Kit Embedded Chat by Lamatic.ai
<p align="center">
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmFmdXh4aHB3bXZidmg1dDM1azhtY2xheTl6ZnUzbHdsYXo1OXVvcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6hnrR2Vk2PLByiWKbL/giphy.gif"/>
</p>

<p align="center">
  <a href="https://agent-kit-embedded-search.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Embedded Search** is an AI-powered document/website search system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to index PDFs and webpages, then provides an interactive search widget where users can search across their data in seconds.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/embed/search&env=LAMATIC_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=Lamatic%20API%20key%20and%20Vercel%20Blob%20token%20are%20required.&envLink=https://lamatic.ai/docs/keys#required-api-keys)

---

## 🔑 Setup

### Required Keys and Config

You'll need three things to run this project locally:  

1. **Lamatic API Key** → get it from your [Lamatic account](https://lamatic.ai).  
2. **Vercel Blob Token** → for document file storage (auto-configured when deployed to Vercel).  
3. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines the indexation and chat flows).  
   ⚠️ Note: The `lamatic-config.json` in this repo is just a **dummy example**.  
   Replace it with your own exported config from Lamatic Studio.

| Item                    | Purpose                                      | Where to Get It                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic API Key         | Authentication for Lamatic AI APIs           | [lamatic.ai](https://lamatic.ai)                |
| Blob Read/Write Token   | Document file storage                        | Auto-configured on Vercel                       |
| Lamatic Config          | Defines your indexation and chat workflows   | From your Lamatic Studio Agent Kit Project      |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
LAMATIC_API_KEY=your_lamatic_key

# Vercel Blob (auto-configured on Vercel)
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
/lamatic-config.json       # Lamatic flow configuration
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).