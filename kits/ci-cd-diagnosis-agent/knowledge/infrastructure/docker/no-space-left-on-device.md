---
id: docker-no-space-left
title: Docker Build Fails — No Space Left on Device
domain: infrastructure
technology: docker
severity: high
keywords: no space left on device, ENOSPC, disk full, docker build, layer, runner storage
last_updated: 2025-01-01
---

## Problem Overview
GitHub Actions runners have a fixed disk size (~14 GB free). Large Docker builds, multiple image layers, or cached artifacts can exhaust this space, causing builds to fail mid-way.

## Typical Error Messages
```text
no space left on device
error: failed to solve: failed to read dockerfile: error from sender: open /path/to/file: no space left on device
ENOSPC: no space left on device, write
Error response from daemon: no space left on device
```

## Root Causes
1. **Large Docker Image Layers:** Base images like `node:20` are several GBs. Combined with build artifacts, the runner disk fills up.
2. **Docker Build Cache Accumulation:** Multiple builds on a self-hosted runner accumulate image cache without pruning.
3. **Large `node_modules` Copied into Image:** Not using a `.dockerignore` file copies the entire local `node_modules` into the build context.

## Diagnosis Steps
- Run `df -h` in an early step to see available disk space.
- Check if the error occurs during a `COPY` or `RUN` step in the Dockerfile.
- Check if a `.dockerignore` file exists in the repo root.

## Recommended Fixes

### Fix 1: Free disk space before the build
```yaml
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet /usr/local/lib/android /opt/ghc
    docker image prune -af
    df -h
```

### Fix 2: Add a `.dockerignore` file
```text
# .dockerignore
node_modules
.next
.git
*.log
dist
```

### Fix 3: Use multi-stage builds to reduce final image size
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
RUN npm install --production
CMD ["npm", "start"]
```

## Verification Steps
- Add `df -h` as the final step of the workflow to monitor disk usage.
- Confirm the build completes without `ENOSPC`.

## References
- [GitHub Docs: Optimising disk space on hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
- [Docker Docs: .dockerignore](https://docs.docker.com/engine/reference/builder/#dockerignore-file)
