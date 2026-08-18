/*
 * # Repo Interview Prep
 * A single-flow Lamatic template that converts any public GitHub repository into a complete,
 * code-specific interview preparation brief — including a verbal pitch, tailored follow-up
 * questions with suggested answers, concepts to review, red flags in the code, and strengths
 * to highlight.
 *
 * ## Purpose
 * Candidates routinely fail to articulate their own projects under interview pressure. They built
 * the thing, but produce vague answers when a senior engineer probes the architecture, specific
 * trade-offs, or weak points. This flow reads the actual repository content via Firecrawl and
 * instructs an LLM to generate a deeply technical, evidence-based prep brief — not boilerplate
 * advice, but questions and answers grounded in what is actually in the code.
 *
 * The outcome is a structured JSON object (`prep_brief`) that a candidate can use to rehearse
 * answers, identify knowledge gaps, and walk into an interview confident about their own work.
 * The JSON structure is intentional: each field can be consumed independently by a UI, exported
 * as a PDF, or processed by a downstream flow in a broader interview preparation pipeline.
 *
 * Within the wider AgentKit ecosystem, this flow is designed to be the data-generation layer
 * of a candidate prep system. It can be combined with the `multi-round-interview-orchestrator`
 * bundle to create a stateful, multi-session preparation pipeline.
 *
 * ## When To Use
 * - Use when a candidate has a public GitHub repository they intend to discuss in an interview.
 * - Use when the target role and/or job description is known — providing these significantly
 *   improves the relevance of generated follow-up questions.
 * - Use as the first step in a broader interview preparation workflow, with downstream flows
 *   consuming the structured `prep_brief` JSON for flashcard generation, quiz flows, or scoring.
 * - Use when the repository has a README — Firecrawl extracts the most value from repos with
 *   documented project descriptions, architecture notes, and tech stack references.
 *
 * ## When Not To Use
 * - Do not use with private repositories — Firecrawl cannot scrape pages that require GitHub
 *   authentication. The candidate must make the repo public before running this flow.
 * - Do not use when the repository is empty or contains only placeholder files — the LLM will
 *   have no code signal and will produce generic advice instead of tailored questions.
 * - Do not use when the caller expects real-time streaming output — this flow is synchronous
 *   and returns the full JSON brief only after all nodes complete.
 * - Do not use as a replacement for actually understanding the code — the brief is a preparation
 *   aid, not a substitute for the candidate knowing their own project.
 *
 * ## Inputs
 * | Field             | Type     | Required | Description                                                    |
 * |---|---|---|---|
 * | `github_repo_url` | `string` | Yes      | Full GitHub URL: `https://github.com/owner/repo`               |
 * | `target_role`     | `string` | No       | Role the candidate is interviewing for, e.g. `SWE Intern`      |
 * | `jd_text`         | `string` | No       | Full job description text — improves question relevance         |
 * | `github_token`    | `string` | No       | GitHub PAT — not required for public repos; future-proofing     |
 *
 * ## Outputs
 * | Field          | Type     | Description                                                                        |
 * |---|---|---|
 * | `prep_brief`   | `string` | JSON string — full interview brief (pitch, questions, concepts, red flags)         |
 * | `architecture` | `string` | JSON string — Mermaid diagram, data flow summary, and design trade-offs            |
 * | `grill_me`     | `string` | JSON string — 5 aggressive technical questions with defensive strategies           |
 * | `production`   | `string` | JSON string — production-readiness verdict, critical gaps, and quick-win fixes     |
 *
 * Each field is a raw JSON string that must be parsed by the caller. The Next.js frontend
 * uses `jsonrepair` as a fallback to handle truncated or slightly malformed LLM output.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow.
 *
 * ### Downstream Flows
 * - Can feed into `multi-round-interview-orchestrator` — pass `prep_brief` as the seed
 *   context for stateful interview simulation sessions.
 *
 * ### External Services
 * - **Firecrawl** — scrapes the GitHub repository page and returns cleaned markdown content
 *   including the README, file listing, and project description — required via Firecrawl credential
 * - **LLM Provider** (`LLMNode_936`) — generates the structured prep brief from scraped content
 *   — required via the configured `generativeModelName` model and credential
 * - **GitHub** — the target repository host; must be publicly accessible — no credential required
 *   for public repos
 *
 * ### Environment Variables
 * - `LAMATIC_API_URL` — base URL for Lamatic API access — used by callers invoking this flow
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier — used by callers invoking this flow
 * - `LAMATIC_API_KEY` — API credential for Lamatic authentication — used by callers
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode_1`) receives a POST payload containing `github_repo_url` and
 *    optional context fields (`target_role`, `jd_text`, `github_token`). This is the sole
 *    entry point for the flow and validates the request schema before execution proceeds.
 *
 * 2. `Code Node` (`codeNode_864`) parses the `github_repo_url` into its constituent parts
 *    (`owner`, `repo`) using string operations and constructs the canonical GitHub page URL
 *    (`repo_page_url`). This is pure synchronous logic — no network calls. Its only job is
 *    to produce a clean, well-formed URL for the downstream Firecrawl scraper.
 *
 * 3. `Firecrawl` (`firecrawlNode_808`) receives `repo_page_url` and runs a synchronous single-
 *    page scrape with `onlyMainContent: true`. It returns the repository page as cleaned markdown
 *    (`markdown` output field), stripping navigation, sidebars, and GitHub UI chrome. The result
 *    typically includes the README, file tree listing, repository description, topics, and language
 *    badge — all the signals the LLM needs to generate accurate, code-grounded questions.
 *
 * 4. `Generate Text` (`LLMNode_936`) receives the scraped markdown and the optional role/JD
 *    context. The system prompt instructs the model to act as a technical interview coach and
 *    return only raw JSON. The user prompt injects the scraped content and requests exactly 15
 *    follow-up questions, minimum 5 concepts to review, and all identifiable red flags. The node
 *    returns the prep brief as a raw JSON string in `generatedResponse`.
 *
 * 5. `API Response` (`responseNode_triggerNode_1`) maps `LLMNode_936.output.generatedResponse`
 *    to `prep_brief` and returns the JSON to the caller.
 *
 * ## Error Scenarios
 * | Symptom                                      | Likely Cause                                           | Recommended Fix                                                           |
 * |---|---|---|
 * | Output describes an "empty repository"        | Firecrawl credential missing/invalid or repo is private | Verify Firecrawl credential in Studio; ensure the repo is public          |
 * | Code node parse error on execution            | `github_repo_url` is malformed or missing              | Ensure URL follows exact format: `https://github.com/owner/repo`          |
 * | `prep_brief` is not valid JSON               | LLM prefixed JSON with explanation text                | Switch to a stronger model (`gemini-1.5-pro`, `gpt-4o`) or tighten prompt |
 * | Questions are too generic, not code-specific  | README is minimal or `target_role` not provided        | Add `target_role` and `jd_text`; ensure repo has a meaningful README      |
 * | Firecrawl returns empty markdown              | GitHub rate-limited the scrape or page failed to load  | Retry the request; Firecrawl free tier has 500 pages/month limit          |
 * | Flow invocation fails before execution        | `LAMATIC_API_KEY` or `LAMATIC_PROJECT_ID` is wrong     | Verify Lamatic credentials in the calling environment                     |
 *
 * ## Notes
 * - The LLM is explicitly instructed to base output only on scraped content — it should not
 *   invent technologies or fabricate performance metrics. Hallucination risk is low for repos
 *   with detailed READMEs but higher for sparse repos with minimal documentation.
 * - Firecrawl's `onlyMainContent: true` flag is critical — without it, GitHub's navigation
 *   chrome and sidebar noise pollutes the context window and degrades output quality.
 * - The `waitFor: 2000` setting in the Firecrawl node gives GitHub's JavaScript time to
 *   render before content is captured, reducing the risk of empty scrape results.
 * - The `prep_brief` output is a raw JSON string, not a parsed object — callers must
 *   `JSON.parse()` the value before processing individual fields downstream.
 * - The flow is designed to be extended: add a second Firecrawl node targeting
 *   `raw.githubusercontent.com/{owner}/{repo}/main/package.json` to pull dependency files
 *   directly for even more precise tech stack detection.
 */



// -- Meta --
export const meta = {
  "name": "Repo Interview Prep",
  "description": "Paste a GitHub repo URL and get a complete, code-specific interview prep brief — 2-min pitch, 15 tailored follow-up questions with answers, concepts to review, red flags, and strengths to highlight.",
  "tags": ["interview", "career", "github", "code-analysis", "project-prep"],
  "testInput": {
    "github_repo_url": "https://github.com/your-username/your-repo",
    "target_role": "SWE Intern",
    "jd_text": "",
    "github_token": ""
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/repo-interview-prep",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ganesh Bamalwa",
    "email": "ganeshbamalwa89@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "firecrawlNode_808": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    },
    {
      "name": "urls",
      "label": "URLs",
      "type": "monacoText"
    }
  ],
  "LLMNode_936": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_Arch": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_Grill": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_Prod": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "repo_interview_prep_llmnode_936_system_0": "@prompts/repo-interview-prep_llmnode-936_system_0.md",
    "repo_interview_prep_llmnode_936_user_1": "@prompts/repo-interview-prep_llmnode-936_user_1.md",
    "system_interview": "@prompts/system_interview.md",
    "user_architecture": "@prompts/user_architecture.md",
    "user_grill": "@prompts/user_grill.md",
    "user_prod": "@prompts/user_prod.md"
  },
  "modelConfigs": {
    "repo_interview_prep_llmnode_936_generative_model_name": "@model-configs/repo-interview-prep_llmnode-936_generative-model-name.ts"
  },
  "scripts": {
    "repo_interview_prep_code_node_864_code": "@scripts/repo-interview-prep_code-node-864_code.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"github_repo_url\": \"string\",\n  \"target_role\": \"string\",\n  \"jd_text\": \"string\",\n  \"github_token\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_864",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/repo-interview-prep_code-node-864_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "firecrawlNode_808",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "firecrawlNode",
      "modes": {
        "webhook": "list"
      },
      "values": {
        "id": "firecrawlNode_808",
        "url": "{{codeNode_864.output.repo_page_url}}",
        "mode": "syncSingleScrape",
        "urls": "",
        "delay": 0,
        "limit": 10,
        "model": "spark-1-mini",
        "mobile": false,
        "prompt": "",
        "search": "",
        "timeout": 30000,
        "waitFor": 2000,
        "webhook": "",
        "nodeName": "Firecrawl",
        "agentUrls": "",
        "agentJobId": "",
        "crawlDepth": 1,
        "crawlLimit": 10,
        "maxCredits": "",
        "agentSchema": "",
        "credentials": "firecrawl",
        "excludePath": [],
        "excludeTags": [],
        "includePath": [],
        "includeTags": [],
        "sitemapOnly": false,
        "crawlSubPages": false,
        "ignoreSitemap": false,
        "webhookEvents": [
          "completed",
          "failed",
          "page",
          "started"
        ],
        "changeTracking": false,
        "webhookHeaders": "",
        "onlyMainContent": true,
        "webhookMetadata": "",
        "includeSubdomains": false,
        "maxDiscoveryDepth": 1,
        "allowBackwardLinks": false,
        "allowExternalLinks": false,
        "skipTlsVerification": false,
        "ignoreQueryParameters": true,
        "strictConstrainToURLs": false
      }
    }
  },
  {
    "id": "LLMNode_936",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/repo-interview-prep_llmnode-936_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/repo-interview-prep_llmnode-936_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/repo-interview-prep_llmnode-936_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_Arch",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "sys_arch", "role": "system", "content": "@prompts/system_interview.md" },
          { "id": "user_arch", "role": "user", "content": "@prompts/user_architecture.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Architecture Analysis",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/repo-interview-prep_llmnode-936_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_Grill",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "sys_grill", "role": "system", "content": "@prompts/system_interview.md" },
          { "id": "user_grill", "role": "user", "content": "@prompts/user_grill.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Grill Me Simulation",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/repo-interview-prep_llmnode-936_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_Prod",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "sys_prod", "role": "system", "content": "@prompts/system_interview.md" },
          { "id": "user_prod", "role": "user", "content": "@prompts/user_prod.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Prod Readiness",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/repo-interview-prep_llmnode-936_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"prep_brief\": \"{{LLMNode_936.output.generatedResponse}}\",\n  \"architecture\": \"{{LLMNode_Arch.output.generatedResponse}}\",\n  \"grill_me\": \"{{LLMNode_Grill.output.generatedResponse}}\",\n  \"production\": \"{{LLMNode_Prod.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_864-572",
    "source": "triggerNode_1",
    "target": "codeNode_864",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_936-LLMNode_Arch",
    "source": "LLMNode_936",
    "target": "LLMNode_Arch",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_Arch-LLMNode_Grill",
    "source": "LLMNode_Arch",
    "target": "LLMNode_Grill",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_Grill-LLMNode_Prod",
    "source": "LLMNode_Grill",
    "target": "LLMNode_Prod",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_Prod-responseNode_triggerNode_1",
    "source": "LLMNode_Prod",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_864-firecrawlNode_808",
    "source": "codeNode_864",
    "target": "firecrawlNode_808",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_808-LLMNode_936",
    "source": "firecrawlNode_808",
    "target": "LLMNode_936",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
