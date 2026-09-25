# Debrief — Interview Feedback Summarizer

An AI-powered interview feedback summarizer built with [Lamatic.ai](https://lamatic.ai). Paste messy, unstructured notes across interview rounds and get a structured summary (strengths, gaps, action items) via a single LLM extraction flow with server-side schema validation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdebrief%2Fapps&env=SUMMARIZE_FEEDBACK,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20credentials%20and%20flow%20ID%20required%20for%20Debrief&envLink=https://lamatic.ai/docs)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

**Pre: Build in Lamatic**
1. Sign in at https://studio.lamatic.ai
2. Create a project (or reuse one)
3. Click **+ New Flow** → Build from blank canvas → Create flow named `summarize-feedback`
4. Add nodes: **API Request** (trigger, field `feedback: string`) → **LLM Node** (`Extract`) → **API Response** (map `result` to `{{LLMNode_1.output.generatedResponse}}`)
5. Set LLM prompts to `prompts/summarize-feedback_extract_system.md` and `prompts/summarize-feedback_extract_user.md`, model config `model-configs/summarize-feedback_extract.ts` (temperature 0.2)
6. Deploy the flow and copy the Flow ID + Project credentials from **Settings → API Keys**

**Post: Wire into this repo**
1. Create `apps/.env.local` from `apps/.env.example` and fill values
2. Install and run locally:
   ```bash
   cd kits/debrief/apps
   npm install
   npm run dev
   # open http://localhost:3000
   ```
3. Deploy (Vercel recommended): Import your fork, set Root Directory to `kits/debrief/apps`, add same env vars, deploy

---

## Setup

### Required Keys and Config

| Item | Purpose | Where to Get It |
|---|---|---|
| `SUMMARIZE_FEEDBACK` | Flow ID for `summarize-feedback` | Lamatic Studio → Deployed flow → Details → Flow ID |
| `LAMATIC_API_URL` | Lamatic API endpoint | Settings → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Project scoping | Settings → Project → Project ID |
| `LAMATIC_API_KEY` | Auth for flow execution | Settings → API Keys → Copy |

### Environment Variables

Create `apps/.env.local`:

```bash
SUMMARIZE_FEEDBACK="your-flow-id"
LAMATIC_API_URL="https://your-project.lamatic.ai/api/v1/..."
LAMATIC_PROJECT_ID="your-project-id"
LAMATIC_API_KEY="your-api-key"
```

If these are unset, the app runs in **local fallback mode** (keyword-based mock that still enforces the JSON schema) so you can test UI without deploying.

### Install & Run

```bash
cd kits/debrief/apps
npm install
npm run dev
# Open http://localhost:3000
```

---

## Input Format

- **One textarea** by default, free text, any length, no format requirement. Accepts:
  - Bullet fragments (`- strong system design`)
  - Slack pastes (`[Slack] @interviewer: candidate was collaborative...`)
  - Prose paragraphs
  - Mixed-round blobs pasted together
- **+ Add another round** button: appends a labeled textarea (`Round 2`, `Round 3`, ...). On submit, rounds are tagged and joined as:
  ```
  Round 1:
  <notes for round 1>

  Round 2:
  <notes for round 2>
  ```
  This tagged string is sent once to the `summarize-feedback` flow under `feedback`. Extraction runs once over the combined tagged input.

No routing beyond the single page. No auth screens. No file upload, no OCR, no audio.

---

## Output Schema

Validated **server-side** with Zod (fails loudly on malformed output, not silent). Mirrors PRD §5.2:

```json
{
  "summary": "string — 1-2 sentence overall summary",
  "strengths": ["string", "..."],
  "gaps": ["string", "..."],
  "action_items": ["string", "..."]
}
```

- `summary`: required, non-empty string
- `strengths`, `gaps`, `action_items`: arrays of strings (may be empty if no signal, never null)
- No confidence scores or fabricated precision — empty arrays preferred over hallucination

Rendered as:

- One-line summary at top (highlighted card)
- Three lists: **Strengths / Gaps / Action Items**
- Expandable Raw JSON + Copy JSON

---

## Repo Structure

```
kits/debrief/
├── lamatic.config.ts              # kit metadata (type: kit, step summarize-feedback)
├── agent.md                       # agent identity + flow docs
├── README.md                      # this file
├── constitutions/default.md       # guardrails
├── flows/summarize-feedback.ts    # Lamatic flow (trigger → LLM → response)
├── prompts/                       # externalized prompts (@referenced by flow)
│   ├── summarize-feedback_extract_system.md
│   └── summarize-feedback_extract_user.md
├── model-configs/
│   └── summarize-feedback_extract.ts
└── apps/                          # Next.js app (single page)
    ├── app/page.tsx               # textarea + Add round + result view
    ├── app/layout.tsx, globals.css
    ├── actions/orchestrate.ts     # server action + Zod schema enforcement
    ├── lib/lamatic-client.ts
    ├── lib/utils.ts
    ├── orchestrate.js             # Lamatic client config (flows + api)
    ├── .env.example
    └── package.json
```

---

## Future Work (Explicitly Deferred — Not Built)

These are documented per PRD §9 but **not implemented** in v1 per Non-goals (§3):

- **OCR support** for handwritten/photo notes — would add a second integration surface and failure mode; deferred pending signal that photo input is requested.
- **Voice memo transcription** — same reasoning as OCR; explicit non-goal.
- **Optional persistence** for tracking feedback across a full loop — stateless is faster to ship and lower review risk; can be added as an opt-in store later.

If you need these, open a discussion in the PR — do not extend scope without confirming the PRD non-goals check (§3).

---

## Contributing

We welcome contributions! Open an issue or PR labeled `agentkit-challenge`. Ensure your PR title starts with `feat: Add debrief kit`.

---

## License

MIT — see [LICENSE](../../LICENSE).
