# Decision Log

Running log of meaningful architectural decisions, one entry per decision. This is interview
prep material — every entry here should be explainable without notes.

### Fork Lamatic/AgentKit instead of a standalone repo
- **What**: Built this kit inside a fork of `Lamatic/AgentKit` (`kits/zaid-booking-agent/`)
  from the start, rather than a standalone repo copied in later.
- **Why**: A real PR into AgentKit has to land in `kits/<name>/` inside a fork of that repo
  anyway (per its `CONTRIBUTING.md`). Starting there avoids a rework step right before
  submission and means the repo structure is correct from commit one.
- **Alternative considered**: Standalone repo now, copy into a fork right before opening the PR.
- **Tradeoff**: Slightly more setup up front (forking, upstream remote) in exchange for zero
  structural rework later and a repo that always matches the real contribution conventions.

### Next.js app orchestrates the agent handoff (not flow-to-flow chaining)
- **What**: The Next.js demo app calls Intake, then Scheduling, then Confirmation in sequence,
  holding the shared `session` object and passing it forward as each flow's input. Flows do not
  call each other directly.
- **Why**: Lamatic flows are stateless per-invocation — nothing on the Lamatic side holds the
  session object across three separate flow calls unless something owns that job. Putting that
  in the app also means each flow can be built and tested in Lamatic Studio in complete
  isolation, which matters when building one agent at a time and understanding each one fully
  before moving to the next.
- **Alternative considered**: Each flow's response node invokes the next flow's API trigger
  directly, so the flows themselves form the chain (closer to a literal reading of the
  "Agent 1 → Agent 2 → Agent 3" diagram).
- **Tradeoff**: The app-orchestrated version is less "purely agent-to-agent" and puts more logic
  in the app layer, but it's dramatically easier to test each flow independently and doesn't
  require every downstream flow to already be deployed before you can test an upstream one.

### Mock availability lives inline in a Lamatic codeNode, not an external API
- **What**: The Scheduling Agent's "check availability" step is a `codeNode` with the mock slot
  data embedded (via `scripts/mock-availability.js`), rather than an `apiNode` calling out to a
  Next.js API route.
- **Why**: Lamatic Studio flows execute in Lamatic's cloud and cannot reach a local
  `localhost` server. An external-API mock store would require deploying the Next.js app before
  the Scheduling flow could even be built/tested in Studio — unnecessary friction for an MVP
  that's explicitly trying to avoid OAuth/deployment complexity under time pressure.
- **Alternative considered**: External Next.js API route serving the mock JSON store, deployed
  early (e.g. to Vercel) so Lamatic Studio can call it as a real API/tool node.
- **Tradeoff**: The codeNode approach means the mock data and the Next.js app's own concept of
  "the booking log" are two separate places for now (the codeNode doesn't persist writes back to
  the app). Swapping to a real Google Calendar API later means turning the `codeNode` into an
  `apiNode` — same position in the flow, same interface, so this doesn't require a rewrite when
  the stretch goal is tackled.

### Extraction schema uses empty string "", not null, for missing fields
- **What**: The Intake Agent's Extraction node (Instructor/Generate JSON) has every field typed
  `string` with `required` only set on `service_type`. The system prompt tells the model to
  return `""` for anything not stated, never the word "null" or a placeholder token.
- **Why**: First build attempt had the prompt say "return null" while the Zod-JSON schema typed
  every field as a plain `string`. Since the schema has no true nullable type, the model can't
  emit real JSON `null` for a `string` field — it improvised sentinel text instead (`"<UNKNOWN>"`
  for the required field, the literal string `"null"` for optional ones). That silently broke
  the Condition node's `!= ""` check, which had no way to detect either sentinel value.
- **Alternative considered**: Match the condition to whatever sentinel the model tends to use
  ("<UNKNOWN>", "null", etc.).
- **Tradeoff**: Rewriting the prompt to demand a real empty string is more restrictive on the
  model but removes the ambiguity entirely — `!= ""` is now a reliable, single check. Costs
  nothing extra since the fields were always going to be strings.

### Response merges both Condition branches via undefined-as-falsy, not a shared merge node
- **What**: The Intake Agent has two terminal `codeNode`s before the response — `Prepare
  Clarification` on the "incomplete" branch (sets `needs_clarification: true` + a question) and
  `Prepare Success Response` on the "complete" branch (sets `needs_clarification: false` +
  the full `request` object). The API Response node's output mapping pulls
  `needs_clarification`/`clarifying_question` from `Prepare Clarification`'s output and `request`
  from `Prepare Success Response`'s output — one field per source node, not per branch.
- **Why**: Lamatic has no way to reference "whichever branch actually ran" generically — the
  Condition node itself only exposes `sampleOutput: string`, not a reusable boolean. Tested
  empirically: referencing a `codeNode` that didn't execute on a given run resolves to an empty
  value (falsy) rather than erroring. That means picking one canonical source node per field
  works correctly on both branches without needing a dedicated merge step, because "didn't run"
  and "explicitly false/empty" collapse to the same observable result downstream.
- **Alternative considered**: A single `codeNode` placed after the branches reconverge that
  re-derives the same condition and builds the whole response object in one place (avoids
  relying on undefined-as-falsy, but duplicates the Condition node's logic).
- **Tradeoff**: Relies on unverified-but-empirically-confirmed platform behavior (unexecuted node
  → falsy reference) rather than an explicit merge. Documented here specifically so this
  assumption gets re-checked if a future Lamatic Studio update changes that behavior.

<!-- Add new entries below in this format as decisions are made:

### [Decision]
- What:
- Why:
- Alternative considered:
- Tradeoff:

-->
