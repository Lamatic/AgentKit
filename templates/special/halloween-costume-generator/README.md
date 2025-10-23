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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/special/halloween-costume-generator&env=LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20key%20is%20required.&envLink=https://lamatic.ai/docs/keys#required-api-keys)
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

## 🔑 Setup

## Required Keys and Config

You'll need the following to run this project locally:

1. **Lamatic API Key** → get it from your [Lamatic account](https://lamatic.ai)
2. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines the image generation flow)
   ⚠️ Note: The `lamatic-config.json` in this repo contains the Halloween costume generation workflow.

| Item                    | Purpose                                      | Where to Get It                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic API Key         | Authentication for Lamatic AI APIs           | [lamatic.ai](https://lamatic.ai)                |
| Lamatic Config          | Defines your costume generation flow         | From your Lamatic Studio Agent Kit Project      |

### 1. Environment Variables

Create `.env` with:

```bash
# Lamatic
LAMATIC_API_KEY=your_lamatic_key

```

### 2. Config File

The [`lamatic-config.json`](./lamatic-config.json) file contains the Halloween costume generation workflow configuration. This defines:
- Image generation flow with workflowId: `42dafbda-3b5e-421f-aeac-29f3156febeb`
- Input schema: `image` (base64) and `theme` (string)
- Output: Multiple costume variations (image, img1-img7)

You can customize this by exporting your own workflow from Lamatic Studio.

### 3. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```
### 4. Deploy Instructions (Vercel)

Click the “Deploy with Vercel” button.

Fill in LAMATIC_API_KEY (required).

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
/lamatic-config.json       # Lamatic flow configuration
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).

---