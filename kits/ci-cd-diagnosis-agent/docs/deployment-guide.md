# 🚀 Production Deployment Guide

This guide covers deploying the **AgentKit CI/CD Diagnosis Agent** to **Vercel** or **Docker**.

---

## Option 1: Vercel Monorepo Deployment (Recommended)

### 1. Import Repository on Vercel
1. Connect your GitHub account to [Vercel](https://vercel.com).
2. Select the `AgentKit` repository.

### 2. Configure Monorepo Root Directory
> [!IMPORTANT]
> Because the Next.js app is located in a subdirectory, you MUST configure the Root Directory.

- **Root Directory**: `kits/ci-cd-diagnosis-agent/apps`
- **Framework Preset**: `Next.js`

### 3. Environment Variables
In the Vercel Project Settings, add:

```env
LAMATIC_API_URL=https://pawansorganization931-soc2readinessauditor578.lamatic.dev
LAMATIC_API_KEY=your_lamatic_api_key

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=32_character_random_secret_string
```

### 4. Deploy
Click **Deploy**. Vercel will build the Next.js 16 app and deploy serverless functions.

---

## Option 2: Docker Container Deployment

### 1. Dockerfile
Create `Dockerfile` in `kits/ci-cd-diagnosis-agent/apps`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Build & Run Container
```bash
docker build -t cicd-diagnosis-agent .
docker run -p 3000:3000 --env-file .env.local cicd-diagnosis-agent
```
