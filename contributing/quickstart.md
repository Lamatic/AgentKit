# Contributing to AgentKit — Quickstart Guide

Welcome to **AgentKit** by [Lamatic.ai](https://lamatic.ai) — an open-source collection of ready-to-deploy AI agent projects. AgentKit contains **kits**, **bundles**, and **templates**, each serving a different level of complexity. Every project is built on top of Lamatic Flows and designed for quick deployment.

This guide helps you understand the different contribution types and points you to the right guide for your contribution.

---

## Contribution Types

| | Kit | Bundle | Template |
|---|---|---|---|
| **What it is** | Full project with a web app (Next.js) + one or more Lamatic flows | Multiple related flows packaged together | A single exported Lamatic flow |
| **Has Web App?** | Yes | No | No |
| **Complexity** | High — UI, server actions, deployment config | Medium — multiple flows with orchestration config | Low — just the flow export files |
| **Folder** | `kits/<category>/<kit-name>/` | `bundles/<bundle-name>/` | `templates/<template-name>/` |
| **Example** | [Content Generation Kit](../kits/sample/content-generation/) | [Knowledge Chatbot Bundle](../bundles/sample/chatbot/) | [Get Started Template](../templates/get-started/) |
| **Guide** | [Kit Contribution Guide](./kit-contribution.md) | [Bundle Contribution Guide](./bundle-contribution.md) | [Template Contribution Guide](./template-contribution.md) |

---

## Which Type Should I Choose?

- **I built a full Next.js app with one or more Lamatic flows** → [Contribute a Kit](./kit-contribution.md)
- **I have multiple related flows that work together (no UI needed)** → [Contribute a Bundle](./bundle-contribution.md)
- **I have a single flow export from Lamatic Studio** → [Contribute a Template](./template-contribution.md)

Not sure? Start with a **Template** — it's the simplest way to contribute. You can always upgrade it to a Bundle or Kit later.

---

## Before You Start

Every contribution type shares the same initial steps:

1. **Fork the repository** and clone it locally
2. **Build your flow(s)** in [Lamatic Studio](https://studio.lamatic.ai)
3. **Export your flow files** and note your API keys

These universal steps are covered in detail in the [main Contributing Guide](../CONTRIBUTING.md#step-1-fork-the-repository). Complete Steps 1–3 there first, then come back here to follow your type-specific guide.

---

## Type-Specific Guides

Once you've completed the initial setup, follow the guide for your contribution type:

### [Kit Contribution Guide](./kit-contribution.md)
Full walkthrough for contributing a kit — creating the folder structure, configuring your Next.js app, setting up environment variables, testing locally, deploying to Vercel, and opening a PR.

### [Bundle Contribution Guide](./bundle-contribution.md)
Full walkthrough for contributing a bundle — organizing multiple flows, writing the bundle config with step types (`any-of`, `mandatory`), and documenting your bundle.

### [Template Contribution Guide](./template-contribution.md)
Full walkthrough for contributing a template — verifying your exported flow files, enhancing the auto-generated README, and submitting your single-flow contribution.

---

## General Information

For troubleshooting, coding standards, bug reporting, and community support, see the [main Contributing Guide](../CONTRIBUTING.md#troubleshooting).
