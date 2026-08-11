---
id: docker-exit-code-137
title: Docker Container Killed — Exit Code 137 (OOM)
domain: infrastructure
technology: docker
severity: high
keywords: exit code 137, OOM, out of memory, killed, container killed, memory limit, SIGKILL
last_updated: 2025-01-01
---

## Problem Overview
Exit code 137 means the container process was killed by the OS kernel's Out-of-Memory (OOM) killer. This occurs when the container exceeds the available memory limit.

## Typical Error Messages
```text
Killed
Exit code: 137
The process '/usr/bin/npm' failed with exit code 137
Error: Process completed with exit code 137.
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

## Root Causes
1. **Insufficient Runner Memory:** The GitHub-hosted runner (typically 7 GB RAM) is shared. A memory-intensive build (e.g., Webpack, Next.js) consumes all available RAM.
2. **No Docker Memory Limits Configured:** The container has no explicit `--memory` flag, and the host OS kills it under pressure.
3. **Node.js V8 Heap Exhaustion:** Node.js defaults to ~1.5 GB heap, which is often too small for production builds.

## Diagnosis Steps
- Run `docker stats` on a local replica to observe peak memory usage.
- Check if the step immediately before the `Killed` output is a build step.
- Look for `FATAL ERROR: Reached heap limit` earlier in the log.

## Recommended Fixes

### Fix 1: Increase Node.js heap size
**Description:** Set the `NODE_OPTIONS` environment variable to allocate more V8 heap.
```yaml
# In your GitHub Actions workflow .yml
- name: Build
  env:
    NODE_OPTIONS: "--max-old-space-size=4096"
  run: npm run build
```

### Fix 2: Add Docker memory limit
**Description:** Explicitly grant the container more memory when running Docker directly.
```bash
docker run --memory="4g" --memory-swap="4g" your-image npm run build
```

## Verification Steps
- Re-run the workflow after applying the fix.
- Confirm the step completes with exit code 0.
- Monitor with `docker stats` to ensure peak usage stays below the new limit.

## References
- [GitHub Actions: About GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
- [Node.js CLI Options: `--max-old-space-size`](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)
