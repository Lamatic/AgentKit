# Contributing to Lamatic AgentKit

Thank you for your interest in improving AgentKit! This guide explains exactly how to build a Lamatic project, export it, integrate it into the repo, and submit a high‑quality PR. It includes the Lamatic “pre” flow (build in Lamatic) and the repo “post” flow (template, run, deploy, PR).

## Table of Contents
- [Overview (TL;DR)](#overview-tldr)
- [Prerequisites](#prerequisites)
- [Lamatic-First Workflow (Required)](#lamatic-first-workflow-required)
  - [1) Sign in or Sign up](#1-sign-in-or-sign-up)
  - [2) Create a Project](#2-create-a-project)
  - [3) Create a New Flow](#3-create-a-new-flow)
  - [4) Build from Use Cases (Find Our Kits)](#4-build-from-use-cases-find-our-kits)
  - [5) Configure and Deploy](#5-configure-and-deploy)
  - [6) Export lamatic-config.json](#6-export-lamatic-configjson)
  - [7) Future: Single-Click Export / Connect Git](#7-future-single-click-export--connect-git)
- [Prepare Your Contribution in This Repo](#prepare-your-contribution-in-this-repo)
  - [Fork and Clone](#fork-and-clone)
  - [Template Folder Structure](#template-folder-structure)
  - [Scaffold from Sample](#scaffold-from-sample)
  - [Add lamatic-config.json](#add-lamatic-configjson)
  - [Environment Variables](#environment-variables)
  - [Document Your Kit](#document-your-kit)
  - [Minimum Files Checklist](#minimum-files-checklist)
- [Run Locally](#run-locally)
- [Deploy to Vercel](#deploy-to-vercel)
- [Open a Pull Request](#open-a-pull-request)
  - [PR Checklist](#pr-checklist)
- [How to Contribute (General)](#how-to-contribute-general)
- [Coding Guidelines](#coding-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features & Improvements](#suggesting-features--improvements)
- [Documentation Updates](#documentation-updates)
- [Code of Conduct](#code-of-conduct)
- [Community & Support](#community--support)
- [Attribution](#attribution)

---

## Overview (TL;DR)

1) Build and deploy your flow in Lamatic:
   - Sign in → Create Project → + New Flow → Build from Kits → select a kit → configure → Deploy.
   - Export/Copy the LAMATIC_CONFIG_<kit> key
   - In some cases, you would export the lamatic-config.json from your deployed flow (will be defined in the kit)

2) Prepare your repo contribution:
   - Fork this repo.
   - Create a new template under `templates/<category>/<unique-agentkit-name>/`.
   - Add LAMATIC_CONFIG_<kit> key key as an env variable
   - For specified kits (such as browser assistants), place `lamatic-config.json` in your root folder.
   - Add `.env.example` (no secrets) and a README with setup instructions.

3) Run and deploy:
   - `npm install` and `npm run dev` inside your template folder.
   - Deploy to Vercel (set root directory to your template folder and add env vars).

4) Open a PR with a clear description and the checklist below.

---

## Prerequisites

- Lamatic account: https://lamatic.ai
- Node.js 18+ and npm
- Git and GitHub account
- Optional: Vercel account (for previews and easy deploys)

---

## Lamatic-First Workflow (Required)

All contributions start by building and deploying the flow in Lamatic. This ensures your kit is reproducible and provides a valid `LAMATIC_CONFIG_<KIT>` key or `lamatic-config.json`.

### 1) Sign in or Sign up
- Go to https://lamatic.ai and sign in or create an account.

### 2) Create a Project
- If you don’t have one, create a new project.
- You’ll land in your user dashboard for that project.

### 3) Create a New Flow
- Click “New Flow” on the left sidebar

### 4) Build from Kits (Find Our Kits)
- Choose “Build from Kits”.
- Browse and select the kit that matches your use case (our curated kits are listed here).
- Follow the on-screen steps to set up inputs, tools, providers, etc.
- Complete the setup to deploy the kit on Lamatic Studio

### 5) Export your key or lamatic-config.json
- At the end of your setup, you would receive a `LAMATIC_CONFIG_<KIT>` key or `lamatic-config.json`, which you have to download/copy.
- You will add this key/file into your template folder in your forked repo.

### 7) Future: Single-Click Export / Connect Git
- Coming soon: a single-click export that downloads all files, or “Connect Git” to export directly to your repository/path.
- We will update this document once those features are available.

---

## Prepare Your Contribution in This Repo

### Fork and Clone
1) Fork the repository on GitHub.
2) Clone your fork locally:
   ```bash
   git clone <your-fork-url>
   cd AgentKit
   ```

### Template Folder Structure
Create your contribution under `templates/` to keep kits organized:
```
templates/<category>/<unique-agentkit-name>/
```

Examples for `<category>`: agentic,assistant,automation,embed

### Scaffold from Sample
Copy the sample Next.js template as a starting point:
```bash
cp -R templates/sample templates/<category>/<unique-agentkit-name>
```
Then update `package.json` name/description and any metadata as needed.

### Add key to environment or `lamatic-config.json` to project
- Add your `LAMATIC_CONFIG_<KIT>` key to the `.env` file
- If it is an lamatic-config.json based kit, place the exported file from Lamatic here:
   ```
   templates/<category>/<unique-agentkit-name>/lamatic-config.json
   ```

Make sure this config corresponds to the deployed version of your flow.

### Environment Variables
- In your template folder, add an `.env.example` file containing all required variables:
  ```
  # Example Keys
  LAMATIC_CONFIG_<KIT>=your_lamatic_config_kit_key
  BLOB_READ_WRITE_TOKEN=your_blob_token
  # ...
  ```
- Do not commit real secrets. Contributors will copy this to `.env` locally and set values in Vercel for deployments.

### Document Your Kit
Create or update `README.md` in your template folder with:
- What this AgentKit does and the use case it solves
- Required environment variables
- Setup instructions (local + deploy)
- Usage examples
- Screenshots/GIFs (optional but helpful)

### Minimum Files Checklist
Inside `templates/<category>/<unique-agentkit-name>/` you should have:
- `README.md`
- `package.json`
- `.env.example` (no secrets)
- Source files as applicable:
  - `app/` (UI routes/pages)
  - `actions/` (orchestrations, server/client actions)
  - `lib/` (Lamatic wrappers/helpers)
  - `public/` (assets if needed)
  - `next.config.js`, `tsconfig.json`, etc.
- OPTIONAL : `lamatic-config.json` (if required, exported from Lamatic)

---

## Run Locally

From your template folder:
```bash
cd templates/<category>/<unique-agentkit-name>
npm install
cp .env.example .env
# Edit .env to include your real keys, e.g.:
#   LAMATIC_CONFIG_<KIT>=...
npm run dev
```

Visit http://localhost:3000 and verify your AgentKit works end-to-end against your deployed Lamatic flow.

---

## Deploy to Vercel

1) Push your branch to your fork on GitHub.
2) In Vercel, create a new project from your GitHub repo.
3) Set the “Root Directory” to:
   ```
   templates/<category>/<unique-agentkit-name>
   ```
4) Add environment variables in the Vercel dashboard (the same keys as in your `.env`), e.g.:
   - `  LAMATIC_CONFIG_<KIT>`
   - Any additional provider keys your kit requires
5) Deploy and confirm your live URL works.

---

## Open a Pull Request

Once your template runs locally and deploys successfully:

1) Create a feature branch:
   ```bash
   git checkout -b feat/<kit-name>
   ```
2) Commit your changes with clear messages.
3) Open a PR against the main repository.

Include in your PR description:
- What the kit does and the problem it solves
- Any prerequisites/providers required
- Steps to run locally
- Optional: link to a live Vercel preview
- Optional: link or ID to your Lamatic flow (if appropriate)

### PR Checklist
Copy this checklist into your PR and check items off:
- [ ] `.env` includes all required keys (no secrets committed)
- [ ] OPTIONAL : `lamatic-config.json` included and valid for the deployed kit
- [ ] Template `README.md` documents setup, env vars, and usage
- [ ] Runs locally with `npm run dev`
- [ ] Deployed preview (Vercel) with env vars set
- [ ] Follows template structure and coding guidelines

---

## How to Contribute (General)

- Star the repo to support the project.
- Open issues for bugs, suggestions, or questions.
- Fork the repo and submit a pull request to propose changes.
- Improve documentation, write tutorials, or share use cases.

---

## Coding Guidelines

- Write clear, maintainable, and well-documented code.
- Follow style and patterns used in `templates/sample`.
- Prefer TypeScript where possible.
- Keep external dependencies minimal and document them.
- Add or update tests where relevant.
- Keep pull requests focused and minimal.
- Never commit secrets; use `.env` and `.env.example`.

---

## Reporting Bugs

Before filing an issue, search open and closed issues to avoid duplicates.

When reporting a bug, include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment info (Node.js version, OS)
- Relevant logs or screenshots (if available)

---

## Suggesting Features & Improvements

- Ensure similar requests don’t already exist.
- Describe the use case and expected impact clearly.
- Provide example workflows or interface ideas if possible.
- If available, link to a Lamatic prototype or draft `lamatic-config.json`.
- If possible, an example of how it should work or your inspiration for this request

---

## Documentation Updates

- Help us keep docs up to date.
- Update usage examples, configuration details, or architecture notes as needed.
- Contributions to guides, tutorials, and case studies are welcome.

---

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep this community welcoming and inclusive.

---

## Community & Support

- GitHub Discussions: https://github.com/Lamatic/AgentKit/discussions

---

## Attribution

Adapted from best practices recommended by the open-source community. See awesome lists at [github.com/mntnr/awesome-contributing](https://github.com/mntnr/awesome-contributing).

---

We appreciate your efforts to improve Lamatic AgentKit!
