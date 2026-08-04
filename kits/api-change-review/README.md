# API Change Review

Give it two versions of an OpenAPI spec. It tells you what breaks, for whom, and writes the migration notes and changelog entry you would otherwise write by hand.

## What you get back

- **Every change classified** — `breaking`, `potentially-breaking`, or `additive`, each with the reasoning and the concrete consumer impact.
- **A merge verdict** — `safe-to-merge`, `review-required`, `needs-major-version`, or `no-api-change`.
- **Migration notes** in markdown, written for the audience you pick.
- **A changelog entry** in Keep a Changelog style.

The audience selector ("consumer developers" vs "public release notes") changes the tone and level of detail of both documents from the same diff.

## How it works

```
Two OpenAPI specs
   │
   ├─ lib/spec-diff.ts        deterministic, runs in the app
   │     └─ change facts      kind, location, before, after, requiredNow
   │
   └─ Lamatic flow            judgment only
         ├─ severity per change + consumer impact
         ├─ merge verdict
         └─ migration notes + changelog
```

**The diff never touches the model.** Comparing two schemas is a solved, deterministic problem — running it in TypeScript makes it reproducible and testable, and it keeps whole specs out of the flow payload. What the flow receives is a list of neutral change *facts*; what it decides is the part that genuinely needs judgment.

That boundary is also why the app never hardcodes its own severity mapping. Severity is the flow's answer, and duplicating the rules in the UI would let the two drift apart.

## Quickstart

```bash
cd kits/api-change-review/apps
cp .env.example .env.local     # then fill in the four values below
npm install
npm run dev
```

Open http://localhost:3000 and press **Load example** — it fills both panes with a spec pair covering a removed endpoint, a parameter that became required, a response field whose type changed, and a narrowed enum.

### Environment

| Variable | Where to find it |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio → API Docs → Endpoint |
| `LAMATIC_API_CHANGE_REVIEW_FLOW_ID` | Flow → three-dot menu → Flow ID |

All four are server-side only. None of them are prefixed with `NEXT_PUBLIC_`, and the SDK is called exclusively from `actions/orchestrate.ts`, which is a server action.

## Deploying

Use the deploy link in `lamatic.config.ts`, or point Vercel at this repo with the root directory set to `kits/api-change-review/apps` and the four variables above set in project settings.

## Layout

```
kits/api-change-review/
├── lamatic.config.ts          project metadata
├── agent.md                   agent identity + capabilities
├── flows/api-change-review.ts the flow graph, exported from Lamatic Studio
├── constitutions/default.md   guardrails
├── prompts/                   externalized LLM prompts
├── model-configs/             externalized model settings
└── apps/
    ├── actions/orchestrate.ts the only place the SDK is called
    ├── lib/spec-diff.ts       the deterministic diff engine
    ├── lib/parse-spec.ts      YAML or JSON text -> object
    ├── lib/lamatic-client.ts  SDK client + flow ID lookup
    ├── components/            spec panes, verdict banner, change list, markdown tabs
    └── public/samples/        the example spec pair
```

## Notes on the diff engine

`lib/spec-diff.ts` is dependency-free and handles the parts of OpenAPI 3.x that actually break consumers:

- internal `$ref` resolution, including `allOf` / `oneOf` / `anyOf` composition
- request and response schemas flattened to dot-paths, so nested property changes are visible
- parameters merged across path level and operation level
- enum narrowing, format changes, deprecation, and security requirement changes

Two cases are worth knowing about, because their `kind` reads additive while the data says otherwise:

- A brand-new **required** request property arrives as `request.property.added` with `requiredNow: true` — `request.property.required.added` only fires when the property already existed.
- A brand-new **required** parameter arrives as `param.added` with `requiredNow: true`.

The flow's prompt reasons from `requiredNow` rather than the kind name for exactly this reason.

## Limitations

- OpenAPI 3.x only. Swagger 2.0 documents are not converted.
- External `$ref`s (anything not starting `#/`) are left unresolved rather than fetched.
- Schema flattening stops at depth 6, which keeps deeply recursive schemas from blowing up the payload.
- Only `2xx` response payloads are diffed for property-level changes; other status codes are tracked as added/removed only.
