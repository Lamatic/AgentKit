# EvidenceFit Studio config seeds

Optional YAML seeds for Lamatic Studio's **Config** tab:

- `evidence-fit-index.yaml`
- `evidence-fit-evaluate.yaml`

**These do not build either flow.** They are a head start that places the plain nodes
(trigger, code, response) and their stable scalar bindings, so there is less to drop on
the canvas by hand. The canonical build path is the visual editor —
[`../STUDIO-STEPS.md`](../STUDIO-STEPS.md) start to finish, with
[`../STUDIO-BUILD.md`](../STUDIO-BUILD.md) as the field-level reference. Using these
seeds is entirely optional; skipping them costs only time.

Two limits, both explained in
[`STUDIO-BUILD.md`](../STUDIO-BUILD.md#partial-accelerator-seed-the-graph-from-the-config-tab-yaml):

1. **Pickers can't come from YAML.** Every model, credential and vector-database field
   stores a `credentialId` UUID Studio mints server-side. Applying the YAML leaves those
   fields blank by design (`embeddingModelName: {}`) — set each one in its node panel.
2. **Loop connections need more than a `needs` entry.** The builder observed Studio
   stripping `needs: [forLoopNode_2]` from the first Search node. The Loop docs show
   an outgoing `connections` list with `condition: Loop Start` and
   `type: conditionEdge`; see the candidate patch in
   [`../STUDIO-BUILD.md`](../STUDIO-BUILD.md#loop-to-body-connection-documented-yaml-awaiting-studio-verification).
   Its direct connection to Search still needs Studio verification. Drawing that
   edge on the canvas is the confirmed workaround. Condition and Search YAML
   translations remain incompletely verified; inspect the resulting graph.

Attach credentials and the vector database to the Studio project *before* applying a
seed, so the pickers have something to offer.

## Index flow

1. Create a blank flow named `evidence-fit-index`.
2. Paste `evidence-fit-index.yaml` into the Config tab and apply it.
3. On the canvas, open **Prepare Chunks** and replace the stub with the **built** body for
   `../../scripts/evidence-fit-index_prepare-chunks.ts` — the `.ts` file is the readable
   source, not the paste buffer (code nodes run plain JavaScript and cap at 10,000
   characters; see [`../STUDIO-BUILD.md`](../STUDIO-BUILD.md) gotcha #5).
4. In **Vectorize**, select an OpenAI embedding model. Record the exact model selected.
5. In **Index**, select the `EvidenceFit` vector store even if the YAML already displays
   that name.
6. Test Vectorize and confirm the array binding is
   `{{vectorizeNode_3.output.vectors}}`; adjust only if Studio exposes a different output
   path.

## Evaluate flow

1. Create a blank flow named `evidence-fit-evaluate`.
2. Paste `evidence-fit-evaluate.yaml` into the Config tab and apply it.
3. Check whether Studio paired `forLoopNode_2` with `forLoopEndNode_6` and placed both
   Search nodes plus **Combine Search Results** inside the loop boundary. Per limit 2
   above, expect that it may not. If the pair does not render, delete only the
   loop-related nodes and draw the Loop visually; keep the same node ids in every
   binding, or update the bindings to the ids Studio mints.
4. In both Search nodes, select the `EvidenceFit` vector store and the exact embedding
   model selected in the Index flow.
5. Open **Metrics** and replace the stub with the **built** body for
   `../../scripts/evidence-fit-evaluate_metrics.ts` (same reason as step 3 — the `.ts`
   source is ~39,000 characters against a 10,000-character cap).
6. In that pasted script, replace:

   ```ts
   let searchOut = {{searchNode_1.output}};
   ```

   with:

   ```ts
   let searchOut = {{forLoopEndNode_6.output.accumulated.results}};
   ```

   The trigger line already targets `triggerNode_1` and needs no change.
7. In **Explain Verdict**, select the connected OpenAI provider and choose
   `gpt-4o-mini` (or another available inexpensive chat model).
8. Test the loop before deploying. Its accumulated `results` array must contain exactly
   one entry per acceptance case, and every entry must contain hits from both strategy
   searches.

Do not enter credential ids or API keys into these YAML files. Studio stores those
private references when the node pickers are used.
