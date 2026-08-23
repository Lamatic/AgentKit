# Impact Radius Reviewer

A PR diff shows what **changed**. It does not show what **breaks** — the
callers, the subclasses that override a changed method, the tests that cover
it. Reviewers miss these. So do AI review agents, because they only see the
diff.

Impact Radius Reviewer takes a `diffcontext compile --json` payload (run by
the user locally or in CI) plus the PR diff, and produces a reviewer brief
with three sections: **What will break**, **Test coverage**, and **BLIND
SPOTS**. The third section is the whole point — it discloses, in the brief
itself, both what the retriever dropped for budget and what static analysis
structurally cannot see (dynamic dispatch, cross-subsystem coupling). Of 177
existing AgentKit kits, none report what they could not see.

---

## Problem

`diffcontext` (on PyPI, `pip install diffcontext`) compiles a Python repo's
call graph into the impact set of a change: the changed symbol, its direct
callers/dependents, 2-hop structural symbols, any overriding subclasses, and
the tests that surface. That is exactly the context a reviewer needs but a
raw diff does not provide.

But the compiled payload is large and machine-oriented. Reviewers don't read
JSON. And even the best retrieval has blind spots — symbols dropped for the
token budget, and entire categories of risk (dynamic dispatch, plugin hooks,
`getattr`-based calls, config-flag coupling) that static analysis
**structurally** cannot see. A reviewer brief that hides those blind spots is
worse than one that names them.

## Approach

One Lamatic flow (`impact-review`) with two nodes after the trigger:

1. **Code node — Parse DiffContext JSON.** Parses the `diffcontext compile
   --json` payload into a compact impact summary: changed symbol(s), the
   impact set split by role (impacted callers/dependents vs. 2-hop
   structural), covering tests surfaced, the top dropped symbols by score,
   and the static-analysis caveat line diffcontext writes into its own meta
   header. The flow does **no** retrieval of its own — the user already ran
   diffcontext; a serverless flow cannot read the user's filesystem anyway.
2. **LLM node — Generate Brief.** A single system prompt enforces exactly
   three sections, in order, and nothing else:
   - **1. What will break** — concrete break risk for each changed symbol,
     citing the caller's symbol id and why (return-type / parameter / shape
     changes), plus any overriding subclass in the impact set.
   - **2. Test coverage** — covering tests that surfaced, changed symbols
     with no covering test, and dropped candidate tests the reviewer should
     run.
   - **3. BLIND SPOTS** — (a) symbols dropped for budget, naming the
     highest-risk ones; (b) what static analysis structurally cannot see
     (dynamic dispatch, plugin/entry-point hooks, `getattr`/registries,
     cross-subsystem conceptual coupling).

The prompt forbids inventing symbols not present in the provided data.

### Why `--cutoff gap`

`diffcontext compile` defaults to `topk` (top-20 symbols per changed symbol):
mean precision <0.1 — mostly supporting context, not things that break. A
reviewer will not read 20 items and the kit looks noisy. This kit documents
and uses `--cutoff gap`, which cuts at the largest relative score drop and
yields 6–9 symbols at ~4× precision, costing ~30% recall. "What will break"
stays short and precise; everything that did not fit lands in the BLIND
SPOTS dropped manifest, where it belongs in a brief that discloses what it
missed. See TRADEOFFS.

## Result

A real run against a clone of `pytest-dev/pluggy`. The change: make
`HookCaller.get_hookimpls` return an immutable `tuple` instead of a mutable
`list[HookImpl]` copy (a real, breaking signature change).

The DiffContext JSON was captured with the **exact** command this kit
recommends:

```bash
diffcontext index . --include testing
diffcontext compile --ref HEAD --repo . --include testing --cutoff gap --json
```

That produced a 2-symbol impact set (the changed method + 1 caller) and a
403-symbol dropped manifest — a ~96% context reduction. The code node +
LLM node then ran against `glm-5.2` (a reasoning model) via its chat
completions API. Below is the **actual stdout**, unedited:

```markdown
## 1. What will break

**`./src/pluggy/_hooks.py:HookCaller._remove_plugin`** is the only caller in the impact set. However, its visible code accesses `self._hookimpls` directly (list comprehension + slice assignment) and does **not** call `get_hookimpls()`. The return-type change (`list[HookImpl]` → `tuple[HookImpl, ...]`) therefore does not break this caller based on the visible code.

The metadata for `get_hookimpls` lists 16 additional callers that are **not in context**: `HookCaller.__repr__`, `HookCaller._add_hookimpl`, `HookCaller._verify_all_args_are_provided`, `HookCaller.is_historic`, `HookCaller.set_specification`, `HookCaller.__call__`, `HookCaller.call_historic`, `HookCaller.call_extra`, and more. Any of these that mutate the returned list (`.append()`, `.sort()`, `.insert()`, `+=`), compare with `== [...]`, or rely on list-specific identity/mutability will break. Their implementations are not visible, so specific break risk cannot be confirmed.

**`./src/pluggy/_hooks.py:_SubsetHookCaller._hookimpls`** appears in the dropped manifest, indicating a subclass of `HookCaller` with its own `_hookimpls` member. If `_SubsetHookCaller` inherits `get_hookimpls` without overriding it, `tuple(self._hookimpls)` will be called on the subclass's data. If that subclass's `_hookimpls` is not a plain list (e.g., a property returning a filtered view), the tuple conversion behavior may differ from the old `.copy()`.

## 2. Test coverage

- **Covering tests surfaced in the impact set:** none.
- **Changed symbol with no covering test:** `./src/pluggy/_hooks.py:HookCaller.get_hookimpls`.
- **Dropped candidate tests:** The modules `./testing/test_hookcaller.py` (65 symbols), `./testing/test_invocations.py` (21 symbols), and `./testing/test_pluginmanager.py` (69 symbols) are listed as known modules but were entirely dropped for budget. The reviewer should run these test suites, as `test_hookcaller.py` in particular is the most likely to exercise `get_hookimpls` and assert on its return type.

## 3. BLIND SPOTS

**(a) Dropped for budget:** 403 symbols were dropped. Highest-risk dropped symbols relevant to this change:
- `./src/pluggy/_hooks.py:HookCaller.__call__` — main hook invocation path; likely iterates or indexes hookimpls.
- `./src/pluggy/_hooks.py:HookCaller._add_hookimpl` — registration path; may reorder or inspect the returned list.
- `./src/pluggy/_hooks.py:_SubsetHookCaller._hookimpls` — subclass data member; determines what `tuple()` is called on if `get_hookimpls` is inherited.
- `./src/pluggy/_hooks.py:HookCaller.call_historic` — may iterate or index results.
- `./src/pluggy/_hooks.py:HookCaller.call_extra` — may iterate or index results.
- `./src/pluggy/_hooks.py:HookCaller.set_specification` — may inspect existing hookimpls.
- `./src/pluggy/_hooks.py:HookCaller._verify_all_args_are_provided` — may iterate hookimpls.
- `./src/pluggy/_hooks.py:HookCaller.__repr__` — may format hookimpls as a list.

**(b) What static analysis structurally CANNOT see:**
- **Dynamic dispatch:** `self.get_hookimpls()` called from a subclass or external caller may resolve to an override not in the graph. `_SubsetHookCaller` is a known subclass; any other subclass registered via plugin/entry-point hooks is invisible.
- **External callers outside `pluggy`:** `get_hookimpls` is a public method; downstream packages (e.g., `pytest`, `tox`) may call it and rely on `list` return semantics (mutation, `== [...]` comparison, `isinstance(x, list)`). No call edge from external packages appears in this graph.
- **Cross-subsystem coupling:** Any code that checks `isinstance(result, list)` or passes the result to a function expecting `Sequence` vs `list` has no call edge the graph can follow.
- **Indirection:** Calls through `getattr(hookcaller, "get_hookimpls")`, registries, or DI containers are not resolved by the call graph.
```

Run meta: `glm-5.2`, prompt 3,442 tokens, output 4,057 tokens, `finish_reason: stop`. The brief correctly identifies that the single visible caller does not actually call the method, surfaces the `_SubsetHookCaller._hookimpls` override **from the dropped manifest**, names the three dropped test modules by file, and completes both halves of BLIND SPOTS.

> The captured output above came from `glm-5.2`. It was **not** produced by
> the small local model used only for plumbing smoke-tests — a 3B model on a
> multi-thousand-token structured-analysis prompt produces mush, and that is
> the same failure mode this kit's downstream eval already hit: the bottleneck
> is model capability, not price. See TRADEOFFS.

## TRADEOFFS

- **Python repos only.** `diffcontext` indexes Python call graphs. The kit
  does nothing useful on JS/TS/Go/Rust.
- **Requires running `diffcontext` locally first.** Serverless Lamatic flows
  cannot read the user's filesystem, so the flow does not (and cannot) index
  the repo itself. The user runs `diffcontext compile --json` locally or in
  CI and pastes the JSON. This follows the same "user brings the input"
  pattern as `pr-companion`.
- **Precision is low at default top-k, so this kit uses `--cutoff gap`.**
  Default `--top-k 20` optimises for LLM context windows and returns mostly
  supporting context, not things that break. `--cutoff gap` trades ~30% recall
  for ~4× precision and yields 6–9 symbols. A reviewer brief must be short
  enough to read, so the kit documents and uses `--cutoff gap` — expect
  supporting context, not a minimal set. The recall cost is recovered by the
  BLIND SPOTS section, which surfaces what gap dropped.
- **Static analysis cannot see dynamic dispatch or cross-subsystem coupling.**
  `self.<member>` may resolve to a subclass override at runtime that the call
  graph attaches to the base class; plugin/entry-point hooks, `getattr`/
  `__getattr__`-based calls, and calls through registries or DI containers
  have no call edge; a settings flag or string constant and the unrelated
  code that reads it have no call edge. The BLIND SPOTS section names these
  explicitly so the reviewer does not mistake "not in the brief" for "not a
  risk."
- **The brief is only as good as the model.** A small model on a structured
  multi-thousand-token prompt produces low-quality output; the captured
  sample used a reasoning-class model. Configure a capable model in the LLM
  node's model config.

## Run it locally

```bash
cd kits/impact-radius-reviewer/apps
cp .env.example .env.local   # fill in LAMATIC_* and FLOW_IMPACT_REVIEW
npm install
npm run dev
# open http://localhost:3000
```

Then, in a Python repo with a change on a branch:

```bash
pip install diffcontext
diffcontext index . --include testing        # tests/ is excluded by default
diffcontext compile --ref HEAD --repo . --include testing --cutoff gap --json > impact.json
git diff HEAD > pr.diff
```

Paste `impact.json` and `pr.diff` into the app.

## Deploy your own flow

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai)
2. Create a project and a new flow
3. Re-create the graph: API Request → Parse DiffContext JSON (code node, code
   from `scripts/impact-review_parse-diffcontext.ts`) → Generate Text (LLM
   node, prompts from `prompts/`) → API Response (output mapping to the LLM
   node's `generatedResponse`)
4. Set the trigger `advance_schema` to
   `{"diffcontext_json":"string","pr_diff":"string","credential_detected":"boolean"}`
5. Deploy, grab the Flow ID + API key + project ID + endpoint
6. Put those into `apps/.env.local` as shown in `apps/.env.example`

## What this kit does NOT do

- Does not index the repo or run `diffcontext` — the user supplies the JSON.
- Does not call the GitHub API or read the repo directly.
- Does not reimplement static analysis in TypeScript — `diffcontext` does the
  retrieval; the flow only parses and writes.
- Does not review for style, security, or general bugs — only impact radius.

## Tech

- Lamatic flow (code node + single LLM node)
- Next.js 14 (App Router) + TypeScript
- Lamatic JavaScript SDK (`lamatic`)
- `diffcontext` (PyPI) — the external retrieval tool the user runs
