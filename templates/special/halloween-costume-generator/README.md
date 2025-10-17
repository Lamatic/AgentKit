# Agent-Kit-Halloween-Costume-Generator by Lamatic.ai

<p align="center">
  <a href="https://agent-kit-halloween-costume-generator.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent-Kit-Halloween-Costume-Generator** is an AI-powered Halloween costume generator built with [Lamatic.ai](https://lamatic.ai). It uses a multi-agent workflow to transform your photos into spooky Halloween costumes through an intuitive Next.js interface with image generation capabilities.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/special/halloween-costume-generator&env=LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20key%20is%20required.&envLink=https://lamatic.ai/docs/keys#required-api-keys)
---

## 🔑 Setup

## Required Keys and Config

You'll need the following to run this project locally:

1. **Lamatic API Key** → get it from your [Lamatic account](https://lamatic.ai)
2. **Blob Token** → automatically provided when deploying to Vercel, or create one in your Vercel dashboard or locally
3. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines the image generation flow)
   ⚠️ Note: The `lamatic-config.json` in this repo contains the Halloween costume generation workflow.

| Item                    | Purpose                                      | Where to Get It                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic API Key         | Authentication for Lamatic AI APIs           | [lamatic.ai](https://lamatic.ai)                |
| Blob Token       | Image storage and retrieval                  | Blob Token   |
| Lamatic Config          | Defines your costume generation flow         | From your Lamatic Studio Agent Kit Project      |

### 1. Environment Variables

Create `.env` with:

```bash
# Lamatic
LAMATIC_API_KEY=your_lamatic_key

# Vercel Blob (for image storage)
BLOB_READ_WRITE_TOKEN=your_blob_token
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

---

## 📂 Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
 └── upload-images.ts      # Blob storage upload handler
/app
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