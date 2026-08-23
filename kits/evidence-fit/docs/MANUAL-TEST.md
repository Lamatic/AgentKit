# Manually Testing EvidenceFit

This is a hands-on walkthrough: you run real commands, click real buttons, and check the
actual output against the exact values below. It exists to answer one question — "does
EvidenceFit, as checked out right now, actually do what the docs claim?" — by
demonstration, not by reading source.

It is **not** the how-to guide and **not** the pitch. For task-oriented "how do I run
this / bring my own document / wire up the deployed path," see
[`../USAGE.md`](../USAGE.md). For what EvidenceFit is, why source-span preservation
matters, and the full metric/verdict definitions, see [`../README.md`](../README.md).
This document assumes you've skimmed both and just want to verify the thing works.

Budget about 25–30 minutes: roughly 5 for Part A, 5 for Part B, 10–15 for Part C, and 5
for Part D — plus a few extra minutes the first time for `npm install`. Every expected
value quoted below (test counts, metric numbers, on-screen strings, error messages) was
observed in an actual run of the code in this kit. If your output differs, that is a real
signal, not a formatting quirk — see the Results template at the end for how to record it.

---

## 1. Setup

- **Node.js 20.9 or later** and npm — check with `node -v`. (See `apps/package.json`'s
  `engines` field.)
- No Lamatic account, API key, or vector database is needed for anything in this
  document. Everything here exercises the **local mode** path only — see Part E.

```bash
cd kits/evidence-fit/apps
npm install
```

Every command below is run from `kits/evidence-fit/apps` unless stated otherwise.

---

## 2. Part A — automated gates

Run these four commands, in order. **If any of them fail, stop here** — the rest of this
document assumes a clean baseline, and a UI walkthrough on top of a red test suite or a
broken build isn't telling you anything meaningful.

- [ ] **Tests**

  ```bash
  npm test
  ```

  Expected, at the end of the output:

  ```
  # tests 147
  # pass 147
  # fail 0
  ```

- [ ] **Type check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: **no output at all.** `tsc` prints nothing and exits 0 when there are zero
  type errors — a silent, clean return is the pass condition here, not a missing command.

- [ ] **Lint**

  ```bash
  npm run lint
  ```

  Expected: exits 0, zero problems reported.

- [ ] **Production build**

  ```bash
  npm run build
  ```

  Expected: the output includes `✓ Compiled successfully`.

---

## 3. Part B — the UI walkthrough

```bash
npm run dev
```

Open `http://localhost:3000`.

1. Click **Load sample contract experiment**.
2. Click **Compare strategies**.

Before checking numbers, get the counting straight: the demo loads **five** acceptance
cases (`renewal-notice`, `suspension-trigger`, `liability-cap`, `termination-convenience`,
`governing-law`) carrying **six** required evidence spans — `liability-cap` alone carries
two quotes (the carve-out clause and the cap statement). Every "5/6" and "6/6" figure
below counts **spans**, not cases. If you catch yourself thinking "but there are only 5
cases, why is the denominator 6" — that's why.

### 3.1 Checklist

- [ ] **Mode notice** reads, verbatim: "Local deterministic run — Lamatic not
  configured." — followed by an explanation that the per-question ranking "is a
  deliberate upper bound isolating the chunking question — it is not a claim about
  semantic retrieval quality."
- [ ] **Verdict banner** reads **"SHIP — with clause-aware chunking"**, with subtitle
  "This configuration can return complete evidence for every required question." and a
  line reading "Recommended configuration: clause-aware chunking."
- [ ] **Baseline card** — "Baseline — fixed-width chunking": verdict badge `BLOCK`,
  Chunks `4`, Boundary-severed spans `1`, Span integrity `5/6 (83%)`, Coverage@k
  `814/814 (100%)`, Complete-evidence recall@k `5/5 (100%)`.
- [ ] **Candidate card** — "Candidate — clause-aware chunking": verdict badge `SHIP`,
  Chunks `4`, Boundary-severed spans `0`, Span integrity `6/6 (100%)`, Coverage@k
  `814/814 (100%)`, Complete-evidence recall@k `5/5 (100%)`.
- [ ] **Per-question table** — five rows, one per case. All five cases show `Required:
  Yes`. Four of the five show baseline first-complete-rank `1` and candidate rank `1`.
  The exception — the one row that matters — is `liability-cap`: baseline rank `2`,
  candidate rank `1`.
- [ ] **Boundary inspection** section appears, titled "Boundary inspection — baseline
  fixed-width chunking", showing case `liability-cap`, "Characters 802–1156 of the
  document", with the required evidence highlighted and red `chunk boundary` markers
  rendered inside the highlighted span. (No corresponding clause-aware section appears —
  the candidate severed nothing, and the inspector only renders when a strategy severed
  at least one span.)

### 3.2 Why the liability-cap rank matters more than any other number on this page

Every other case is rank 1 under both strategies — chunking didn't change anything for
them. `liability-cap` is the one case where it did, and it is the entire product
demonstrated in one row.

Under the fixed-width baseline, the cap statement — "neither party's aggregate liability
... during the twelve (12) months immediately preceding the event giving rise to the
claim" — straddles the seam between chunk `[450, 950)` and chunk `[900, 1400)`. No single
baseline chunk contains it, so it's boundary-severed (`boundarySeveredCount = 1`) and,
even though local mode's oracle ranking can still find it split across two chunks, it
takes **two** chunks (rank 2) to reconstruct the complete answer — and in a real deployed
system, "split across two chunks" means the retriever has to return both of exactly the
right chunks, in the right order, before a generator can even see the whole clause.

Under clause-aware chunking, the same clause survives intact inside one chunk. It's not
severed, and it's recovered at rank **1** — a single chunk contains the complete answer.

That's the entire pitch of this kit, not just a description of it: the retriever never
got a chance to fail here, because the evidence was already whole or already broken
*before* retrieval ran. Nothing about ranking, embeddings, or reranking changed between
these two rows — only the chunk boundary did.

### 3.3 Optional — confirm the numbers are computed, not hard-coded

Save the following as `apps/verify-happy-path.ts`:

```ts
import { compareStrategies } from "./lib/evidence/core.ts";
import { SAMPLE_EXPERIMENT } from "./lib/fixtures/sample-contract.ts";

const result = compareStrategies({
  documentId: SAMPLE_EXPERIMENT.documentId,
  documentText: SAMPLE_EXPERIMENT.documentText,
  cases: SAMPLE_EXPERIMENT.cases,
  topK: SAMPLE_EXPERIMENT.topK,
});

if (!result.ok) {
  console.error("resolution failed", result.issues);
  process.exit(1);
}

const { baseline, candidate, recommended, verdict } = result.comparison;
const line = (label: string, r: typeof baseline) =>
  `${label} severed=${r.boundarySeveredCount} integrity=${r.spanIntegrityRate.numerator}/${r.spanIntegrityRate.denominator} chunks=${r.chunkCount} verdict=${r.verdict}`;

console.log(line("baseline ", baseline));
console.log(line("candidate", candidate));
console.log(`recommended=${recommended} overall=${verdict}`);
for (const c of baseline.cases) {
  console.log(`  ${c.caseId.padEnd(24)} rank=${c.firstCompleteEvidenceRank} severed=${c.severedSpans.length}`);
}
```

Then, from `kits/evidence-fit/apps`:

```bash
npx tsx verify-happy-path.ts
```

Expected output (case order matches `SAMPLE_EXPERIMENT.cases`):

```
baseline  severed=1 integrity=5/6 chunks=4 verdict=BLOCK
candidate severed=0 integrity=6/6 chunks=4 verdict=SHIP
recommended=clause-aware overall=SHIP
  renewal-notice           rank=1 severed=0
  suspension-trigger       rank=1 severed=0
  liability-cap            rank=2 severed=1
  termination-convenience  rank=1 severed=0
  governing-law            rank=1 severed=0
```

These are the same numbers the browser rendered in section 3.1, computed by calling the
engine directly — nothing in `apps/lib/evidence/core.ts` is aware the UI exists. Delete
`verify-happy-path.ts` afterward; it's a scratch file, not part of the kit.

---

## 4. Part C — deliberately breaking it

The point of this part is to confirm EvidenceFit fails the way it claims to fail. Reload
a clean demo (**Load sample contract experiment**) before each scenario below — edits
from one scenario should not bleed into the next.

An important framing before you start: when an evidence quote can't be resolved, the app
does **not** compute a verdict at all — there is no `Comparison` to render, so no verdict
banner appears. What you see instead is an error panel. This is intentional and matches
the rule in README.md §5 (`BLOCK if ... any input/alignment is invalid`): an experiment
whose own inputs can't be trusted is never scored as if retrieval had failed. The UI's
version of that rule is stricter still — it doesn't even attempt to render a degraded
result; it stops and tells you the input is the problem.

### 4.1 `quote_not_found`

In the case editor, replace any evidence quote's text with:

```
arbitration in Singapore
```

(This string doesn't occur anywhere in the sample document.) Click **Compare
strategies**.

- [ ] No verdict banner, no cards, no table renders.
- [ ] An error panel titled **"Evidence could not be resolved"** appears, containing:

  > Case "`<the case id you edited>`": the quote was not found in the document. Evidence
  > must be copied verbatim, including punctuation and whitespace.

### 4.2 `ambiguous_quote`

Reload the demo. In the case editor, replace any evidence quote's text with:

```
written notice
```

Click **Compare strategies**.

- [ ] Same error panel title, **"Evidence could not be resolved"**.
- [ ] The message reads:

  > Case "`<the case id you edited>`": the quote appears 3 times. Supply explicit start
  > and end offsets to disambiguate — EvidenceFit never guesses which occurrence you
  > meant.

  (The count is 3 because "written notice" occurs in the renewal clause, the suspension
  clause, and the termination-for-convenience clause of the sample document — three
  genuinely different places, which is exactly why the engine refuses to guess.)

### 4.3 `alignment_error`

This one isn't reachable through the case editor — the UI's evidence-quote fields don't
expose `start`/`end` offset inputs (see USAGE.md §4, item 2), and `alignChunks` isn't
called anywhere on the local-mode path at all (it exists for recovering offsets from
externally-produced chunk text — see README.md §3). If Part A's `npm test` passed, this
exact scenario already ran, as `apps/__tests__/align.test.ts`'s test "a chunk text that is
not unique in the remaining document returns alignment_error". To see it directly, save
this as `apps/verify-alignment-error.ts`:

```ts
import { alignChunks } from "./lib/evidence/core.ts";

const r = alignChunks("ab ab ab", ["ab", "ab"], "d", "fixed-width");
console.log(r.ok, r.ok ? null : r.issues[0].code);
```

Then run:

```bash
npx tsx verify-alignment-error.ts
```

- [ ] Expected output: `false alignment_error`

  "ab" occurs three times in "ab ab ab", so even though a naive left-to-right scan could
  resolve the two chunks to the first two occurrences, that placement is still genuinely
  ambiguous — the engine refuses to guess here for the same reason it refuses to guess on
  `ambiguous_quote` above. Delete `verify-alignment-error.ts` afterward.

### 4.4 Marking `liability-cap` not required

Reload the demo. In the case editor, find the `liability-cap` case and **uncheck
"Required for verdict"**. Click **Compare strategies**.

- [ ] The **baseline card's** verdict badge changes from `BLOCK` to `SHIP`.
- [ ] The baseline card's **Boundary-severed spans still reads `1`** — unchanged.
- [ ] The baseline's **boundary inspector still shows** the `liability-cap` span cut at
  "Characters 802–1156 of the document" — unchanged.

This is the detail worth sitting with: severance is measured and reported independent of
whether a case is required — only the *verdict* changes. `boundarySeveredCount` and the
boundary inspector describe what physically happened to the document during chunking;
`required` only controls whether that fact is allowed to gate the ship decision. Making a
case optional doesn't un-sever the evidence, it just tells EvidenceFit not to block on it.

### 4.5 Rejected input: `validateExperimentInput`

This exact scenario also isn't reachable by clicking around the running app — the app
always generates a real `experimentId` per run, and its case editor always starts with
one (empty) case rather than a genuinely empty `cases` array. It's the direct, structural
validation `runComparison` runs before anything else — the same function
`apps/__tests__/validation.test.ts` checks in Part A. Save this as
`apps/verify-validation.ts`:

```ts
import { validateExperimentInput } from "./lib/validation.ts";

const r = validateExperimentInput({
  experimentId: "",
  documentId: "",
  documentText: "",
  cases: [],
});
console.log(r.ok, r.ok ? undefined : r.errors.length);
```

Then run:

```bash
npx tsx verify-validation.ts
```

- [ ] Expected output: `false 4`

  Nothing throws — `validateExperimentInput` returns a typed result with all four
  problems collected at once (`experimentId is required.`, `documentId is required.`,
  `documentText is required.`, `At least one acceptance case is required.`), which is the
  same "report every problem, not just the first" behavior the browser's own "Fix these
  problems before running" panel relies on for any input it rejects. Delete
  `verify-validation.ts` afterward.

---

## 5. Part D — verifying the guardrails

Two structural safety properties this kit claims. Both are checkable by inspection,
without touching the running app.

### 5.1 The vendor-parity test genuinely catches drift

`apps/lib/evidence/core.ts` is vendored — copied byte-for-byte — into
`scripts/evidence-fit-index_prepare-chunks.ts` and
`scripts/evidence-fit-evaluate_metrics.ts`, each between fixed
`// ---- BEGIN VENDORED ...` / `// ---- END VENDORED ----` marker comments, because a
Lamatic code node can't resolve `import` statements. `apps/__tests__/vendor-parity.test.ts`
is supposed to fail the whole suite if either copy ever drifts from `core.ts`. Prove it:

1. Open `kits/evidence-fit/scripts/evidence-fit-index_prepare-chunks.ts`.
2. Find any line **strictly between** the `BEGIN VENDORED` and `END VENDORED` markers,
   and change one character (add a space, flip a digit — anything).
3. From `kits/evidence-fit/apps`, run `npm test`.

- [ ] The run **fails**, specifically on the test named
  `evidence-fit-index_prepare-chunks.ts vendors a byte-identical copy of core.ts`, with a
  message pointing you at the sync command.

4. Restore the file using the sync command documented in
   [`../USAGE.md`](../USAGE.md#10-editing-appslibevidencecorets) (§10, "Editing
   `apps/lib/evidence/core.ts`") — do **not** hand-fix the single character, run the
   actual sync script, since that's the real mechanism this test exists to enforce.
5. Run `npm test` again.

- [ ] All 147 tests pass again, matching Part A.

### 5.2 No credential can reach the browser

From `kits/evidence-fit/apps` (not the kit root — the kit root's own `README.md`
contains the literal string `NEXT_PUBLIC_` in a sentence *about* this guarantee, which
would otherwise show up as a false-positive match):

```bash
grep -rn "NEXT_PUBLIC" . --exclude-dir=node_modules --exclude-dir=.next
```

- [ ] Returns **nothing** — no matches, no output.

Next.js only ever exposes an environment variable to client-side/browser code when its
name is prefixed `NEXT_PUBLIC_`. Since that prefix doesn't appear anywhere in `apps/`,
`LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_URL` — read only in
`apps/lib/lamatic-client.ts`, only ever imported from the `"use server"` boundary in
`apps/actions/orchestrate.ts` — structurally cannot end up in a bundle the browser
downloads.

---

## 6. Part E — what this document does not cover

Everything above exercises **local mode only**. EvidenceFit's deployed path — real
Lamatic flows, real vector search — cannot be manually tested yet, because the two flows
(`evidence-fit-index`, `evidence-fit-evaluate`) are not exported into this repository.
They have to be built by hand in Lamatic Studio first, following
[`STUDIO-BUILD.md`](./STUDIO-BUILD.md); until that's done and both flow IDs are set in
`apps/.env.local`, there is no deployed run to check.

One consequence worth being explicit about: local mode's per-question ranking is a
deliberate **upper bound**, not a retrieval-quality measurement — it ranks chunks by raw
character overlap with the gold span instead of running a real embedding model or vector
search (see `localRank` in `apps/lib/evidence/core.ts`, and README.md §9). That is exactly
why Coverage@k reads `814/814 (100%)` for **both** strategies in Part B — that number
tells you the evidence exists somewhere in the top-k chunks under the best possible
ranker, not that a real retriever would surface it. Only a deployed run, once the flows
exist, would actually exercise retrieval quality.

---

## 7. Results template

| # | Check | Pass / Fail | Notes |
|---|---|---|---|
| A1 | `npm test` → 147/147, 0 failures | | |
| A2 | `npx tsc --noEmit` → no output | | |
| A3 | `npm run lint` → 0 problems | | |
| A4 | `npm run build` → Compiled successfully | | |
| B1 | Mode notice text matches §3.1 | | |
| B2 | Verdict banner: SHIP — with clause-aware chunking | | |
| B3 | Baseline card values match §3.1 | | |
| B4 | Candidate card values match §3.1 | | |
| B5 | Per-question table: liability-cap rank 2 (baseline) vs 1 (candidate) | | |
| B6 | Boundary inspector renders for baseline only, at chars 802–1156 | | |
| C1 | `quote_not_found` → "Evidence could not be resolved" | | |
| C2 | `ambiguous_quote` → "the quote appears 3 times" | | |
| C3 | `alignChunks` scratch script → `false alignment_error` | | |
| C4 | Unrequiring liability-cap → baseline BLOCK → SHIP, severed count unchanged | | |
| C5 | `validateExperimentInput` scratch script → `false 4` | | |
| D1 | Vendor drift makes `npm test` fail, sync restores it | | |
| D2 | `grep NEXT_PUBLIC` in `apps/` returns nothing | | |

Tester: ___________  Date: ___________  Branch / commit: ___________

Overall: ☐ All checks pass  ☐ One or more checks failed (see Notes above)

---

*See [`../README.md`](../README.md) for what EvidenceFit is and why it exists, and
[`../USAGE.md`](../USAGE.md) for the practical how-to guide this walkthrough assumes
you've already read.*
