<div id="top"></div>

<p align="center">
  <img width="100%" alt="lamatic cover" src="https://github.com/Lamatic/.github/raw/main/linkein-cover.jpg" />
</p>

<p align="center">
  <a href="https://lamatic.ai">
    <picture>
      <!-- Dark mode: keep existing white SVG -->
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.prod.website-files.com/65ef2805bd1160e6402b86cd/6620e093fe2e54612a3f5843_Logo%20white.svg">
      <!-- Light mode: use the black PNG you found -->
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/Lamatic/AgentKit/raw/main/templates/agentic/reasoning/public/lamatic-logo.png">
      <!-- Fallback -->
      <img width="300" alt="Lamatic.ai" src="https://cdn.prod.website-files.com/65ef2805bd1160e6402b86cd/6620e093fe2e54612a3f5843_Logo%20white.svg">
    </picture>
  </a>
</p>

<h2 align="center">Stack to Build Agentic SaaS → 10x faster</h2>
  <br/>
  <h3 align="center">Opensource SDK ♦️ Collaborative Studio ♦️ Serverless Deployment</h3>
<p align="center"><a href="https://lamatic.ai/" >Website</a> | <a href="https://lamatic.ai/docs">Docs</a>| <a href="https://lamatic.ai/docs/slack">Join Slack community</a>
</p>
</p>

<p align="center">
<a href="https://lamatic.ai/docs/slack"><img src="https://img.shields.io/badge/Slack-Join%20Us-4A154B?logo=slack&logoColor=white" alt="Join lamatic.ai Slack"></a>
<a href="https://github.com/Lamatic/AgentKit/stargazers">
  <img src="https://img.shields.io/github/stars/Lamatic/AgentKit?logo=github" alt="GitHub Stars" />
</a>
<a href="https://github.com/Lamatic/AgentKit/network/members">
  <img src="https://img.shields.io/github/forks/Lamatic/AgentKit?logo=github" alt="GitHub Forks" />
</a>
<a href="https://github.com/Lamatic/AgentKit/actions">
  <img src="https://img.shields.io/github/actions/workflow/status/Lamatic/AgentKit/ci.yml?branch=main" alt="CI/CD Status" />
</a>

<br/>

## ✨ About AgentKit

Deploy intelligent AI agents in minutes with enterprise-grade security, scalable architecture, and seamless integrations. Power everything from customer support to workflow automation with the future of agent-powered business.[11]

***
AgentKit Types

| AgentKit Type   | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| **Automation**  | Automate complex business processes with robust and flexible agent workflows |
| **Assistant**   | Create context-aware helpers for users, customers, and team members         |
| **Embed**       | Seamlessly integrate AI agents into apps, websites, and workflows           |
| **Agentic**     | Advanced self-directed, reasoning agents for goal-driven operations         |

***

## 🏛️ Architecture Overview

- **Agent Engine**: Multi-agent system enabling advanced reasoning and planning
- **Templates & Kits**: Pre-designed packs for popular use-cases and enterprise workflows
- **Lamatic Core**: Central orchestration of all agentic, automation, and integration flows
- **Security Layer**: End-to-end bank-grade encryption, compliance-ready
- **Integrations Hub**: 1-click integrations with your stack (REST, Zapier, Webhooks, etc.)

```
+------------------+             +------------------+          +-------------------+
|  Web/API Client  | - GraphQL-> |     Lamatic      |  <-----> | Integrations/Apps |
+------------------+             +------------------+          +-------------------+
        ^                                 ^       
    Frontend                      Agent Microservice
```

***

## 🚀 Steps to Deploy

1. **Clone the Repo**
   ```sh
   git clone https://github.com/Lamatic/AgentKit.git
   cd AgentKit
   ```

2. **Select Your AgentKit**
   - Browse `/templates` for available kits.
   - Example:
     ```sh
     cd templates/agentic/reasoning
     ```

3. **Configure Integrations**
   - Enter API keys, endpoints, and credentials in `.env` or `/config`. The setup and configurations for the integration will be defined in that repo itself in it's ReadME.

4. **Deploy**
   - Run the agent locally with : 
     ```sh
     npm run deploy
     ```

5. **Monitor & Scale**
   - Dashboard live at `studio.lamatic.ai`
   - Scale or update agents with a single Click.

***

## 🗂️ Index of AgentKits

| Kit Name        | Capabilities                 | Path                  |
|-----------------|-----------------------------|-----------------------|
| Automation      | Workflow & process automation| `/templates/automation`|
| Assistant       | Task and user assistance     | `/templates/assistant`|
| Embed           | Embedded agent in apps/sites | `/templates/embed`    |
| Agentic         | Reasoning, planning, exec    | `/templates/agentic`  |


### 📦 Available Kits

Explore ready-to-deploy agent templates built on Lamatic’s AgentKit framework.  
Each kit includes configuration instructions, environment variables/lamatic-config.json, and a 1-click Vercel deploy button.

#### 🧠 Agentic Kits

> Self-directed agents designed for advanced reasoning, planning, and goal-oriented execution.

| Kit Name | Description | Live Demo | Deploy | Path |
|-----------|--------------|--------------|--------------|------|
| **Reasoning Agent** | A Next.js starter kit for goal-driven reasoning agents using Lamatic Flows. | [![Live Demo](https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge)](https://agent-kit-reasoning.vercel.app) | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/agentic/reasoning&env=LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20key%20is%20required.&envLink=https://github.com/Lamatic/agent-kit-reasoning#required-api-keys) | [`/templates/agentic/reasoning`](./templates/agentic/reasoning) |

> 💡 Each kit folder includes its own README with specific setup steps, required keys, and example Lamatic flows.

<!--
### ⚙️ Automation Kits
(Coming soon)
| Kit Name | Description | Path |
|-----------|--------------|------|

### 💬 Assistant Kits
(Coming soon)
| Kit Name | Description | Path |
|-----------|--------------|------|

### 🌐 Embed Kits
(Coming soon)
| Kit Name | Description | Path |
|-----------|--------------|------|
-->

***

## 📚 Documentation & Resources

- [AgentKit Overview](https://lamatic.ai/templates/agentkits)
- [Lamatic Guides](https://lamatic.ai/guides)
- [API Reference](https://lamatic.ai/api)
- [Community Support](https://github.com/Lamatic/AgentKit/discussions)

***

## 🤝 Contributing

We welcome your ideas and improvements! See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started.

***

## ⭐ Related Links

- [Lamatic.ai](https://lamatic.ai)
- [Lamatic University](https://lamatic.ai/university)
- [Case Studies](https://lamatic.ai/case-studies)

***

Powerful, scalable agentic automations for the modern enterprise — with security, speed, and service at the core.
