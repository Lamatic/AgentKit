# Deployment Guide

This repo is a collection of individual kits, not one root application. The Docker and CI setup in this repo is designed to build one kit at a time by pointing at a kit directory that already contains a `package.json`.

## Build a Kit Image

From the repo root:

```bash
docker build \
  --build-arg KIT_PATH=kits/agentic/code-review \
  -t agentkit-code-review .
```

Change `KIT_PATH` to any runnable kit, for example:

- `kits/agentic/code-review`
- `kits/automation/blog-automation`
- `kits/embed/chat`

## Run a Kit Container

Pass the environment file for the selected kit at runtime:

```bash
docker run --rm \
  -p 3000:3000 \
  --env-file kits/agentic/code-review/.env \
  agentkit-code-review
```

## Run with Docker Compose

`docker-compose.yml` lets you switch kits without editing the file:

```bash
KIT_PATH=kits/agentic/code-review \
KIT_ENV_FILE=kits/agentic/code-review/.env \
docker compose up --build
```

The same pattern works for any other runnable kit in the repo.

## CI Behavior

`.github/workflows/ci.yml` does 2 things:

1. Detects which kits changed in the current push or pull request.
2. Runs `npm ci`, `npm run lint`, and `npm run build` for each changed kit that has a `package.json`.

It also validates the generic Dockerfile by building the first changed kit, or `kits/agentic/code-review` when no changed kit can be inferred.

## Limits

- Templates and flow-only bundles do not produce runnable Docker images from this root Dockerfile.
- Each kit still needs its own Lamatic environment variables.
- Docker validation could not be executed locally in this environment because Docker is not installed here.
