# Why This Code

## A Problem
I've personally faced an issue on various occasions where I'd be working on a codebase and would come across a function or a class, and I would question - 'why?'. Generally, this question arises either during codebase onboarding or during the deprecation/refactoring phase. This would follow an often messy exploration of commits, PRs, issues, and the codebase to figure out the real 'why'.

## Why This Code - the flow

A Lamatic AgentKit kit that explains the *why* part of a function or a class."Why This Code" would crawl Git blame, historical pull requests, linked tracker issues, docstrings, and cross-file invocations to synthesize the structural intent and origin narrative of any function or class definition.

### The Lamatic Flow

The Lamatic Flow consists of the following steps:
- **Git Permalink Parser**: Takes a GitHub URL pointing to a function or class definition.
- **Reference Resolution**: Validates the URL, extracts info from it such as user, repo, language, etc.
- **Git & Issue Crawling**: Gathers commit history, linked PRs, and tracker discussions.
- **Usage Scanning**: Maps external file imports and invocation patterns across the repo.
- **Intent Synthesis**: Generates architectural purpose and origin narrative. AI resides here for the inference.

### Limitations

This is an MVP. Consequently, there are many limitations and edge cases it may not be able to handle. I want to account for the few I have introduced with a why:
1. It offers only GitHub URL support. The parser, the APIs I leverage - everything is built around GitHub. This means it is useless for projects on other git hosting services. But since GitHub is widely used, I believe this is a fair tradeoff.
2. Only two language choices are offered: TypeScript/JavaScript and Python. Internally, based on the file extension, I load a language profile containing language-specific quirks (such as import statements). For an MVP, I decided to scope this project to the stated languages only. But it can be extended.
3. Ideally, I want it to return the whole narrative of why it was introduced. That is why I included reading issues as well. If the target repo uses some other project management software (like Jira), we may not be able to read them. This is possible through integration and can be considered in a future scope.

## The Web App

I have hosted a Next application that users can use to try out the flow. It must be noted that I would really like to further generalize this flow outside of a Next App. This means that it needs to be integrated with wider applications that aim at codebase exploration.


## Why This Code - Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| A free [Google AI Studio API key](https://aistudio.google.com/app/apikey) | For Gemini LLM inference in the Lamatic flow |
| A [GitHub Personal Access Token](https://github.com/settings/tokens) | For GitHub REST & GraphQL API calls |
| A free [Lamatic account](https://lamatic.ai) | To host and execute the flow |

### Setup

#### 1. Deploy the flow on Lamatic

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai) and create a project.
2. Add a Gemini credential (Settings → Integrations → Google Gemini → paste your Google AI Studio API key).
3. Add your GitHub credential (`GITHUB_TOKEN` secret in project settings).
4. Create a flow named `why-this-code` matching `flows/why-this-code.ts`.
5. Upload or reference the scripts in `scripts/`, system/user prompts in `prompts/`, and model configs in `model-configs/`.
6. Deploy the flow and copy its Workflow ID.

#### 2. Configure and run the web app

Create `apps/.env.local` (or edit `apps/.env`) with your deployment credentials:

| Variable | Description / Source |
|---|---|
| `LAMATIC_API_URL` | Lamatic Studio → Settings → API Keys → API URL |
| `LAMATIC_PROJECT_ID` | Lamatic Studio → Settings → API Keys → Project ID |
| `LAMATIC_API_KEY` | Lamatic Studio → Settings → API Keys → API Key |
| `WHY_THIS_CODE` | Lamatic Studio → `why-this-code` flow → Details → Workflow ID |

```bash
cd apps
cp .env.example .env.local
# Fill in LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY, WHY_THIS_CODE in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste a supported GitHub permalink (e.g. `https://github.com/owner/repo/blob/main/src/service.ts#L10`).

#### 3. Deploy on Vercel (optional)

Deploy the `apps` directory to Vercel and configure the 4 environment variables above (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, `WHY_THIS_CODE`).

#### 4. Example

Sample Input: [sample_input.json](./sample_input.json)
Sample Output: [sample_output.json](./sample_output.json)
Note: Raw context provided to the LLM for inference is available in the `aiResponse.context` field in the sample output.

### Project structure

```text
kits/why-this-code/
├── lamatic.config.ts          # kit metadata + flow configuration
├── agent.md                   # agent identity + capability doc
├── README.md                  # this file
├── flows/
│   └── why-this-code.ts       # exported flow definition from Lamatic Studio
├── scripts/                   # code node scripts executed by the flow
│   ├── why-this-code_code-node-360_code.ts  # reference resolution & validation
│   ├── why-this-code_code-node-325_code.ts  # history tracing
│   ├── why-this-code_code-node-561_code.ts  # discussion crawling
│   ├── why-this-code_code-node-616_code.ts  # codebase search & usage mapping
│   └── why-this-code_code-node-508_code.ts  # context trimming
├── prompts/                   # system & user prompts for the LLM node
├── constitutions/
│   └── default.md             # base constitution & instructions
└── apps/
 ├── app/                   # Next.js App Router
 ├── actions/orchestrate.ts # typed server action for flow execution
 ├── lib/lamatic-client.ts  # Lamatic SDK / client wrapper
 └── .env
```

## Future Scope

1. Currently, it is just a static workflow - nodes running in a fixed sequence and the LLM is called once, in the end, with all the required context. This was a deliberate choice. But I believe it would be even more impactful if turned into a full Agentic Flow. This means that the current nodes would be provided to the LLM as tools. This would mean a total revision of the whole flow into a modular design, which I would be more than happy to do. But a static workflow was a deliberate choice since Gemini's free tier makes an agentic version infeasible. 

2. I want to extend it to other code hosting services like BitBucket, GitLab, etc. This would just mean including more parsers and more APIs. But this would require me to understand the Lamatic platform even more. 

3. As I have explained in the limitations, currently it only supports 2 languages. I want to expand this further. One immediate way is to extend the language profile to other languages as well. Another and more impactful way is mentioned in 1. We can delegate this whole responsibility to an LLM with guardrails. This means even more impactful results.


## Credits

Built by **Shubham Thakur** for Lamatic AgentKit.
