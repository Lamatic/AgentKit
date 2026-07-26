# Know Thy Person

Paste the **email** and **name** of whoever you're about to meet — optionally their
**company or personal website** — and get a one-page, **fully-sourced** dossier: who they
are, what they're into *outside work*, and warm talking points. Every claim links to a real
source; anything it can't verify is shown as "couldn't confirm" instead of invented.

> `person_context` accepts any link. A **company or personal site gets crawled** for real
> detail; a **LinkedIn/X profile isn't readable** (anti-bot walls) but still helps the agent
> find and confirm the right person among same-name results.

Built as a [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) **kit** (one Lamatic
flow + a Next.js app).

## Why it's different
Every existing research kit here is company-centric. This one researches the **individual
human** and leads with the **non-work / rapport** angle — and it's built to **never
fabricate** facts about a real person (the worst failure mode of person research). Only
sourced claims are ever rendered.

## How it works
```
email + name + person_context?
        │  (API Request)
        ▼
 [1 Resolve]     gemini-2.5-flash  → company/domain/search seeds from the email + name
 [2 Serper]                        → live public-presence web search
 [3 Firecrawl]                     → crawls the most relevant public pages for source content
 [4 Synthesize]  gemini-2.5-flash  → structured dossier JSON, each item carrying a source_url
        │  (API Response)
        ▼
 answer = dossier JSON
```

Sourcing is enforced end-to-end: the Synthesize node only emits claims with a `source_url`,
and the app's normalizer **drops any talking-point or outside-work item without a source**
before rendering — so the UI never shows an unsourced claim.

### Output schema (`answer`)
```json
{
  "identity": { "name": "", "role": null, "company": null, "location": null, "sources": [] },
  "summary": "",
  "outside_work": [{ "note": "", "source_url": "" }],
  "talking_points": [{ "point": "", "why_it_works": "", "source_url": "" }],
  "couldnt_confirm": [],
  "sources": [],
  "confidence": "high | medium | low"
}
```
> The app accepts either `snake_case` or `camelCase` field spellings from the flow and
> canonicalizes to the shape above.

## Run locally
```bash
cd kits/know-thy-person/apps
cp .env.example .env.local   # fill in real values from Lamatic Studio
npm install --legacy-peer-deps
npm run dev                  # http://localhost:3000
```
Run the tests with `npm run test` and a production build with `npm run build`.

> `--legacy-peer-deps` is needed because one transitive UI dependency (`vaul`) still
> declares a React 18 peer range while this app is on React 19.

### Environment
| Var | Where |
|---|---|
| `KNOW_THY_PERSON` | deployed flow ID (Studio → Flow → Details) |
| `LAMATIC_API_URL` / `LAMATIC_PROJECT_ID` / `LAMATIC_API_KEY` | Studio → Settings → API Keys |

The **OpenRouter key** (for `gemini-2.5-flash`) and the **Serper** / **Firecrawl** keys are
configured in **Lamatic Studio**, not in this app.

## Honest limitations
- **LinkedIn and X are not scraped directly** (anti-bot walls). We rely on live web search
  + crawling of open pages, which often surfaces those facts indirectly.
- **Works best with a company email** (so the domain resolves to an org) or a **crawlable
  personal/company site**. Generic providers (gmail, outlook, …) resolve to no company —
  by design, not a guess.
- **Data-broker / people-search sites are blacklisted** as sources.
- Results are only as good as a person's public footprint. For **low-footprint people** the
  agent correctly returns little and says so — that's the point, not a bug.
- Public information only. This is meeting prep, not surveillance.
