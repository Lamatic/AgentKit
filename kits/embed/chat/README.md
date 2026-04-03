# Agent Kit Embedded Chat by Lamatic.ai
<p align="center">
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmFmdXh4aHB3bXZidmg1dDM1azhtY2xheTl6ZnUzbHdsYXo1OXVvcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6hnrR2Vk2PLByiWKbL/giphy.gif"/>
</p>

<p align="center">
  <a href="https://agent-kit-embedded-chat.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Embedded Chat** is an AI-powered document chat system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to index PDFs and webpages, then provides an interactive chat interface where users can ask questions about their documents through a modern Next.js interface.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/embed/chat&env=EMBEDDED_CHATBOT_PDF_INDEXATION,EMBEDDED_CHATBOT_WEBSITES_INDEXATION,EMBEDDED_CHATBOT_RESOURCE_DELETION,EMBEDDED_CHATBOT_CHATBOT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Config%Embedded%20Chat%20keys%20and%20Blob%20token%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/embed/agent-kit-embed-chat)

---


## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://lamatic.ai  
2. Create a project (if you donΓÇÖt have one yet)  
3. Click ΓÇ£+ New FlowΓÇ¥ and select "Templates" 
4. Select the 'Embed Chat' agent kit
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain your .env keys
7. Copy the keys from your studio

Post: Wire into this repo
1. Create a .env file and set the keys
2. Install and run locally:
   - npm install
   - npm run dev
3. Deploy (Vercel recommended):
   - Import your repo, set the projectΓÇÖs Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- Coming soon: single-click export and ΓÇ£Connect GitΓÇ¥ in Lamatic to push config directly to your repo.

---

## ≡ƒöæ Setup
## Required Keys and Config

YouΓÇÖll need two things to run this project locally:  

1. **.env Keys** ΓåÆ get it from your [Lamatic account](https://lamatic.ai) post kit deployment.
2. Vercel Blob Token ΓÇô Required for uploaded file storage. Each deployment needs its own Blob token. You can generate it from your Vercel project after the first deploy (see instructions below).


| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| .env Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |
| Blob Read/Write Token   | Uploaded file storage                        | [Vercel Blob Quickstart](https://vercel.com/docs/storage/vercel-blob/quickstart)                    |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
EMBEDDED_CHATBOT_PDF_INDEXATION = "EMBEDDED_CHATBOT_PDF_INDEXATION Flow ID"
EMBEDDED_CHATBOT_WEBSITES_INDEXATION = "EMBEDDED_CHATBOT_WEBSITES_INDEXATION Flow ID"
EMBEDDED_CHATBOT_RESOURCE_DELETION = "EMBEDDED_CHATBOT_RESOURCE_DELETION Flow ID"
EMBEDDED_CHATBOT_CHATBOT = "EMBEDDED_CHATBOT_CHATBOT Flow ID"
LAMATIC_API_URL = "LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "LAMATIC_PROJECT_ID"
LAMATIC_API_KEY = "LAMATIC_API_KEY"

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

Click the ΓÇ£Deploy with VercelΓÇ¥ button.

Fill in .env Keys from lamatic (required).

After deployment, generate your own Blob token:

```bash
vercel storage blob token create
```

Add/Replace it in Vercel Dashboard ΓåÆ Environment Variables ΓåÆ BLOB_READ_WRITE_TOKEN and redeploy.
---

## ≡ƒôé Repo Structure

```
/actions
 ΓööΓöÇΓöÇ orchestrate.ts        # Lamatic workflow orchestration
/app
 Γö£ΓöÇΓöÇ page.tsx              # Main upload/indexation UI
 Γö£ΓöÇΓöÇ chat
 Γöé   ΓööΓöÇΓöÇ page.tsx          # Chat interface with documents
 ΓööΓöÇΓöÇ api
     Γö£ΓöÇΓöÇ index             # PDF indexation endpoint
     Γö£ΓöÇΓöÇ index-webpages    # Webpage indexation endpoint
     Γö£ΓöÇΓöÇ delete            # PDF deletion endpoint
     Γö£ΓöÇΓöÇ delete-resource   # Resource deletion endpoint
     ΓööΓöÇΓöÇ check-workflow-status  # Async workflow polling
/lib
 ΓööΓöÇΓöÇ lamatic-client.ts     # Lamatic SDK client
/public
 ΓööΓöÇΓöÇ images
     Γö£ΓöÇΓöÇ lamatic-logo.png  # Lamatic branding
     ΓööΓöÇΓöÇ *.png             # Data source icons
/flows
  ΓööΓöÇΓöÇ ...                  # Lamatic Flows
/package.json              # Dependencies & scripts
```

---

## ≡ƒñ¥ Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## ≡ƒô£ License

MIT License ΓÇô see [LICENSE](../../../LICENSE).
