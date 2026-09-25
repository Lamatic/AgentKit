# Using EvidenceFit

This is the practical, start-to-finish how-to guide. For what EvidenceFit is, why
source-span preservation matters, the metric definitions, and the verified demo numbers,
see [`README.md`](./README.md) — this document assumes you've skimmed it and just want to
run the thing.

---

## 1. Prerequisites

- **Node.js 20.9 or later** and npm (see `apps/package.json`'s `engines` field). Check
  with `node -v`.
- **A Lamatic account and project — only if you want the deployed path.** Everything in
  Sections 2–5 below runs with no Lamatic account, no API key, and no vector database.

---

## 2. Install and run locally, in under a minute

```bash
cd kits/evidence-fit/apps
npm install
npm run dev
```

Open `http://localhost:3000`. With no `LAMATIC_*` environment variables set, the app runs
entirely in **local mode**: chunking, ranking, every metric, and the verdict are all
computed in this Node process, so there is nothing else to configure before you see a
result.

---

## 3. Running the built-in sample experiment

Click **Load sample contract experiment**. This pre-fills the document field with a
1,581-character synthetic Master Services Agreement and five acceptance cases (six
required evidence spans) — see `apps/lib/fixtures/sample-contract.ts` for exactly what
it contains and why it's shaped the way it is. Click **Compare strategies**.

You should see:

- **Baseline — fixed-width chunking**: `1` boundary-severed span, span integrity `5/6`,
  verdict `BLOCK`.
- **Candidate — clause-aware chunking**: `0` boundary-severed spans, span integrity
  `6/6`, verdict `SHIP`.
- An overall verdict banner reading **SHIP — with clause-aware chunking**.

These are the exact numbers verified in README.md Section 6. If you ever see something
different after loading the sample unmodified, something in your environment or a recent
edit to the fixture broke it — see the Troubleshooting table below.

### What each number means

- **Chunks** — how many chunks that strategy produced from the document.
- **Boundary-severed spans** — the count of required evidence spans that no single chunk
  fully contains. Any positive count on a *required* case is a hard blocker: it forces
  `BLOCK` regardless of anything else, because no retrieval quality can recover evidence
  that was already cut apart before indexing.
- **Span integrity** — the fraction of required evidence spans that survived chunking
  intact, as `numerator/denominator` of spans (not acceptance cases — a single case can
  carry more than one evidence quote, so the count of spans is usually higher than the
  count of cases).
- **Coverage@k** — the fraction of a case's unique gold characters covered by the union
  of the top-k retrieved chunks, aggregated across required cases.
- **Complete-evidence recall@k** — the fraction of required cases whose complete
  evidence is present somewhere within the top-k retrieved chunks. This is the metric
  used to break a tie between two strategies that already share the same verdict — see
  Section 5 below and README.md Section 4 ("Why not Precision@k?").
- **Per-case table** — for each case, the coverage and the **first complete rank**: the
  earliest 1-based rank at which that case's complete evidence was fully recovered, or
  the literal words "not recovered" if it never was within the chunks considered. Rank 1
  and rank `k` both technically "pass," but rank 1 has far more headroom.
- **The verdict banner** — states the overall `SHIP` / `TUNE` / `BLOCK`, which strategy
  or strategies achieve it, and (when one exists) which configuration is recommended.

---

## 4. Bringing your own document and acceptance cases

Clear the demo, paste your own document text into the **Document text** field, and use
**Acceptance cases** to write down the questions your retrieval system must answer.

### Writing a good acceptance question

- Ask exactly what a downstream user would ask — "How much notice is required to cancel?"
  not "Notice clause". A vague question makes it hard to judge whether the *right* text
  was retrieved even after the engine tells you it was complete.
- One question, one case. If a single question genuinely needs two separate quotes to be
  answered completely (e.g. an obligation and its carve-out), add both as separate
  evidence quotes on the *same* case — that's exactly what the sample experiment's
  `liability-cap` case does.
- Decide whether the case is **required**. Only required cases can force `BLOCK` or
  `TUNE` — an optional case's coverage is still shown in the results table, but severed
  evidence or incomplete recall on it never changes the verdict. Uncheck "Required for
  verdict" for cases you want to track without gating the ship decision.

### The rules evidence quotes must satisfy

EvidenceFit never guesses where a quote is in the document — every quote is resolved to
a verified character range before anything else runs, and a quote that cannot be
resolved this way fails the whole experiment with an actionable, specific error rather
than a best-effort guess. A quote must satisfy exactly one of:

1. **It occurs exactly once, verbatim, in the document text.** Copy it character for
   character, including punctuation and whitespace — a quote that has been retyped,
   trimmed, or paraphrased will not be found (`quote_not_found`). A quote that occurs
   more than once is rejected as ambiguous (`ambiguous_quote`) — EvidenceFit will not
   guess which occurrence you meant.
2. **Or you supply explicit `start`/`end` character offsets**, and
   `documentText.slice(start, end)` equals the quote exactly. This is how you
   disambiguate a quote that legitimately occurs more than once. The case editor's text
   inputs don't expose offset fields directly — supply them by calling the underlying
   `runComparison` action or `compareStrategies`/`evaluateStrategy` from
   `apps/lib/evidence/core.ts` with `{ quote, start, end }` evidence objects.

Other input limits (all enforced server-side before any Lamatic call, in
`apps/lib/validation.ts`): document text up to 200,000 characters, up to 25 cases per
experiment, up to 8 quotes per case, 2,000 characters per quote, 500 characters per
question, and `topK` up to 20.

---

## 5. Reading the output

- **Boundary-severed spans / span integrity** — see Section 3. Zero severed spans on
  every required case is a precondition for `SHIP`; it is not sufficient by itself
  (coverage still has to be complete within top-k).
- **The boundary inspector** — appears automatically under each strategy whenever that
  strategy severed at least one evidence span, on *any* case, required or not. It shows
  the document text immediately around the severed span, with the evidence highlighted
  and a red marker at every chunk edge that cuts through the highlighted window — so you
  can *see* the cut instead of inferring it from a number. If a strategy severed
  nothing, its inspector section simply doesn't render.
- **What SHIP / TUNE / BLOCK should make you actually do:**
  - **SHIP** — the recommended configuration returns complete evidence for every
    required question. Safe to move forward with that configuration; nothing here blocks
    deployment.
  - **TUNE** — no required evidence was severed by a chunk boundary, but at least one
    required case's complete evidence isn't showing up within the top-k results. The
    fix is on the retrieval side, not the chunking side: raise `topK`, improve ranking,
    or add reranking — the evidence exists intact in the index, it just isn't surfacing.
  - **BLOCK** — a chunk boundary severed required evidence (or the experiment's own
    inputs couldn't be trusted — an unresolvable quote, for instance). No amount of
    retrieval tuning can fix this; the chunking configuration itself has to change. Do
    not ship this configuration for the affected document.
  - Remember the top-level verdict is always the verdict **of the recommended
    configuration** — not "the better of the two you happened to try." If you need to
    know exactly why a given strategy has the verdict it has, read that strategy's own
    card and its per-case rows, not just the banner.

---

## 6. Local mode vs. deployed mode

The app runs in exactly one of two modes per request, and it tells you which:

- **Local mode** — the mode notice reads "Local deterministic run — Lamatic not
  configured." Everything (chunking, ranking, metrics, verdict) runs in this Node
  process. You're in local mode whenever `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, or
  `LAMATIC_API_URL` is unset.
- **Deployed mode** — the mode notice reads "Deployed run — computed by Lamatic flows."
  Chunking, real vector search, every metric, and the verdict were computed inside your
  deployed Lamatic flows; this app only validates the response shape and renders it. You
  reach this mode once all five environment variables described in Section 7 are set and
  both flows are actually deployed.

**Honest caveat about local mode's ranking:** with no vector database configured, local
mode ranks chunks for each question by raw character overlap with that question's gold
evidence span (`localRank` in `apps/lib/evidence/core.ts`). That is a deliberate best
case, not a retrieval-quality result — it isolates exactly the question "did chunking
already make this evidence unrecoverable" from the separate question "is the retriever
good," by assuming the best possible retriever. Local-mode numbers tell you about your
chunking configuration. They tell you nothing about your embedding model or your
reranker. Only deployed mode, against a real vector index, measures actual retrieval.

---

## 7. Wiring up the deployed path

1. **Import both flows into your Lamatic project.** They are exported at
   [`flows/evidence-fit-index.ts`](./flows/evidence-fit-index.ts) and
   [`flows/evidence-fit-evaluate.ts`](./flows/evidence-fit-evaluate.ts), together with the
   `@reference` files they resolve. After importing, open each Vectorize, Vector Search,
   VectorDB and LLM node and set its model/credential picker by hand — those fields store
   a `credentialId` that Lamatic mints per project, so they ship blank by design and are
   the one thing an import cannot carry over.
   [`docs/STUDIO-BUILD.md`](./docs/STUDIO-BUILD.md) is the node-by-node reference, for
   that step and for rebuilding either flow from scratch.
2. **Deploy both flows** and copy each one's Flow ID from Studio's flow details panel.
3. **Set five environment variables** in `apps/.env.local` (copy `apps/.env.example` as a
   starting point):

   | Variable | Where it comes from in Studio |
   |---|---|
   | `LAMATIC_API_KEY` | Studio → Settings → API Keys |
   | `LAMATIC_PROJECT_ID` | Studio → Settings → API Keys (same page as the key) |
   | `LAMATIC_API_URL` | Studio → Settings → API Keys (your project's endpoint URL) |
   | `LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID` | Studio → the Index flow → Details panel → Flow ID |
   | `LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID` | Studio → the Evaluate flow → Details panel → Flow ID |

4. Restart `npm run dev` and re-run an experiment. The app **attempts** deployed mode as
   soon as the first three (connection) variables are set; a run only **succeeds** once
   both flow ID variables are set too. With the connection variables set but a flow ID
   missing, you get an actionable "Deployed flows are not configured" error rather than
   a silent fall-back to local mode — see the Troubleshooting table below.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `quote_not_found` validation issue | The evidence quote isn't an exact verbatim substring of the document — retyped, trimmed, or paraphrased text will not match | Copy the quote directly from the document text field, including punctuation and whitespace |
| `ambiguous_quote` validation issue | The quote occurs more than once in the document, so its intended location is genuinely ambiguous | Either make the quote longer/more specific so it occurs exactly once, or supply explicit `start`/`end` offsets (Section 4) |
| Alignment error (`alignment_error` / `chunk_offset_invariant_violation`) | A chunk's recovered or generated offsets don't reproduce its text exactly — this should not happen with unmodified vendored code | In local mode this shouldn't occur; in a deployed flow, confirm the code node scripts under `scripts/` were pasted verbatim and not hand-edited |
| "Deployed flows are not configured" upstream error | `LAMATIC_API_KEY`/`LAMATIC_PROJECT_ID`/`LAMATIC_API_URL` are set, but one or both flow ID variables are missing | Set `LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID` and `LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID` in `apps/.env.local` (Section 7) |
| A verdict looks wrong — severed evidence or poor recall on a case doesn't seem to affect the result | The case is marked **not required** ("Required for verdict" unchecked) | Only required cases can force `TUNE` or `BLOCK`. Check the box on any case you want to gate the verdict, or check the per-case table to see which cases are required |
| `runComparison` / a deployed run returns `kind: "upstream"` with a different message | The deployed flow itself failed, timed out, or its response didn't match the documented contract | Check `apps/.env.local`, confirm both flows are actually deployed (not left as drafts) in Studio, and re-check the API Response `outputMapping` against `docs/STUDIO-BUILD.md` |
| `npm run dev` floods the console with `ENOENT ... routes-manifest.json` and `Cannot find module './833.js'`, and every request 500s | `.next/` holds *production* artifacts from a previous `npm run build`, so the dev server starts on a mixed production/dev tree and cannot resolve its own chunks. `npm install` does not help — `node_modules` is fine | Stop the server, run `rm -rf .next`, then `npm run dev` again. Always clear `.next/` when switching between `build` and `dev` |
| Local demo numbers don't match README.md Section 6 | The sample document or its acceptance cases were edited in the case editor | Click **Load sample contract experiment** again to reset to the verified fixture |

---

## 9. Running the checks

From `kits/evidence-fit/apps`:

```bash
npm test         # tsx --test __tests__/*.test.ts — the full unit + regression + vendor-parity suite
npm run typecheck # tsc --noEmit
npm run lint      # eslint .
npm run build     # next build (production build + Next's own type/lint pass)
```

All four are expected to pass clean before you consider a change to this kit done.

---

## 10. Editing `apps/lib/evidence/core.ts`

`core.ts` is the single source of truth for every deterministic computation in this kit
— chunking, gold-span resolution, metrics, and the verdict rules. It is intentionally
**zero-import**: no dependency on React, Next.js, or any Lamatic SDK, so the exact same
code can run inside a plain Node process (local mode) and be pasted verbatim into a
Lamatic code node (deployed mode).

Because of that, `core.ts` is **vendored** — copied byte-for-byte — into two files under
`scripts/`, each inside a marked block:

```text
scripts/evidence-fit-index_prepare-chunks.ts
scripts/evidence-fit-evaluate_metrics.ts
```

If you edit `core.ts`, you must re-sync both vendored copies before committing. From
`kits/evidence-fit`, run:

```bash
node -e "
const fs=require('fs');
const core=fs.readFileSync('apps/lib/evidence/core.ts','utf8').trim();
const BEGIN='// ---- BEGIN VENDORED from apps/lib/evidence/core.ts — do not edit here ----';
const END='// ---- END VENDORED ----';
for (const f of ['evidence-fit-index_prepare-chunks.ts','evidence-fit-evaluate_metrics.ts']) {
  const p='scripts/'+f;
  const existing=fs.readFileSync(p,'utf8');
  const glue=existing.slice(existing.indexOf(END)+END.length);
  fs.writeFileSync(p, BEGIN+'\n'+core+'\n'+END+glue);
  console.log('synced',p);
}
"
```

This replaces everything between the `BEGIN VENDORED` / `END VENDORED` markers in both
files with the current `core.ts`, leaving each file's Studio-paste glue code (trigger
binding, output shaping — everything after `END VENDORED`) untouched. Never hand-edit
inside a vendored block directly; it will just be overwritten the next time someone runs
the sync, and in the meantime it silently drifts from `core.ts`.

`apps/__tests__/vendor-parity.test.ts` enforces this mechanically: it fails the whole
`npm test` run if either vendored block is not byte-identical to `core.ts`. There is no
way to merge a `core.ts` change without also re-syncing both copies and passing that
test.

---

*See [`README.md`](./README.md) for what EvidenceFit is, why source-span preservation
matters, full metric definitions, the deterministic verdict rules, and the verified demo
numbers.*
