# Agent-Kit-Halloween-Costume-Generator by Lamatic.ai

<p align="center">
   <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDM0bjQ5aW1xNHplYTJrZ3BwMWs3Z2wxNWJub2xmbmdnaGltZ2FkYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tF2OS6dTUfSrvGPqEO/giphy.gif" alt="Demo" />
</p>


<p align="center">
  <a href="https://agent-kit-halloween-costume-generator.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent-Kit-Halloween-Costume-Generator** is an AI-powered Halloween costume generator built with [Lamatic.ai](https://lamatic.ai). It uses a multi-agent workflow to transform your photos into spooky Halloween costumes through an intuitive Next.js interface with image generation capabilities.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/special/halloween-costume-generator&env=LAMATIC_CONFIG_HALLOWEEN&envDescription=Your%20Lamatic%20Config%20Halloween%20key%20is%20required.&envLink=https://lamatic.ai/templates/agentkits/misc/agent-kit-halloween-costume-generator)
---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://app.lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow”  
4. Choose “Build from Kits" and select the 'Halloween' agent kit
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain LAMATIC_CONFIG_HALLOWEEN key
7. Copy the LAMATIC_CONFIG_HALLOWEEN from your studio

Post: Wire into this repo
1. Create a .env file and set:
   - LAMATIC_CONFIG_HALLOWEEN=your_lamatic_config_halloween_key
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

1. **LAMATIC_CONFIG_HALLOWEEN** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.


| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic Config Halloween Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |


### 1. Environment Variables
Create `.env` with:
```bash
# Lamatic
LAMATIC_CONFIG_HALLOWEEN=your_lamatic_config_halloween
```

### 3. Install & Run
```bash
npm run deploy
# Open http://localhost:3000
```

---

## 📂 Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
 └── upload-images.ts      # Blob storage upload handler
/app
 ├── api                   # API Folder
  ├── upload-image/route.ts             # Upload User Image
  ├── upload-to-catbox/route.ts         # Upload Lamatic Images
 ├── page.tsx              # Home page with hero section
 ├── upload/page.tsx       # Image upload interface
 ├── themes/page.tsx       # Theme selection page
 ├── create/page.tsx       # Processing and generation
 ├── images/page.tsx       # Results display with share/download
 └── products/page.tsx     # Product recommendations
/components
 └── header.tsx            # App header with navigation
/lib
 └── lamatic-client.ts     # Lamatic API client
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).

---