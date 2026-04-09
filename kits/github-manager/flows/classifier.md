# GitHub Manager
A webhook-driven GitHub issue triage flow that classifies incoming issues, optionally grounds a response in indexed documentation, and applies GitHub labels/comments as part of the wider repository automation system.

## Purpose
This flow is responsible for handling newly received GitHub issue data and turning it into an automated triage action. It accepts a webhook payload containing issue metadata, uses an LLM to classify the issue, and then routes execution to one of two outcomes: a direct `bug` label for non-documentation issues, or a documentation-aware branch that retrieves relevant indexed context, generates a reply, applies a `documentation` label, and posts a comment back to the issue.

The outcome matters because it converts raw GitHub events into repository actions that are both faster and more consistent than manual triage. For issues that appear documentation-related, the flow enriches the response with context from the documentation vector index before acting. For everything else, it still produces a deterministic action by applying a label, ensuring that the repository receives immediate structured triage.

Within the broader agent pipeline, this flow is the runtime execution path that sits after documentation ingestion. The parent kit uses a separate ingestion flow to scrape, chunk, embed, and index repository documentation. This flow then consumes that vectorized knowledge base at triage time, making it the action layer in a retrieve-and-act chain: webhook event arrives, initial classification happens, retrieval is used only when needed, and the resulting GitHub API actions close the loop.

## When To Use
- Use when a GitHub webhook delivers a new issue event and the payload includes `title`, `body`, `issue_number`, and `repo_full_name`.
- Use when the repository has already indexed documentation in a configured vector database and documentation-related issues should receive grounded replies.
- Use when you want automatic GitHub labeling without requiring a human maintainer to inspect every incoming issue.
- Use when issue triage should distinguish documentation-oriented requests from other issue types and take different actions accordingly.
- Use when the calling system can provide a valid `GITHUB_TOKEN` secret for write access to issue labels and comments.

## When Not To Use
- Do not use when the incoming event is not a GitHub issue payload or does not expose the required trigger fields in the expected flat shape.
- Do not use when documentation ingestion has not yet populated the configured vector database and you expect grounded documentation responses.
- Do not use when the system only needs to ingest or refresh documentation; that is handled by the separate scraper/vectorizer flow.
- Do not use when the repository token lacks permission to write issue labels or comments, unless you are prepared for downstream API failures.
- Do not use when you need fine-grained multi-label classification such as `feature-request`, `enhancement`, or `wontfix`; this specific flow as implemented only branches between a documentation path and a fallback `bug` label path.
- Do not use when the issue data is nested in raw GitHub webhook structure without prior mapping to the trigger schema fields this flow expects.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `body` | `string` | Yes | The GitHub issue body text used for classification and, on the documentation branch, for semantic search and response generation. |
| `title` | `string` | Yes | The GitHub issue title used alongside the body for classification and vector search query construction. |
| `issue_number` | `number` | Yes | The GitHub issue number used to build GitHub API endpoints for labeling and commenting. |
| `repo_full_name` | `string` | Yes | The full repository identifier in `owner/repo` form, used to target the correct GitHub issue via API calls. |

The trigger assumes the payload is already normalized to these top-level fields. `repo_full_name` must match GitHub repository path format, and `issue_number` must be a numeric issue identifier valid in that repository. The flow does not show any explicit sanitization or schema coercion beyond the trigger schema, so malformed strings, empty text, or mismatched repository identifiers can propagate into search and API steps.

## Outputs
| Field | Type | Description |
|---|---|---|
| `apiNode_342.response` | `object` | GitHub API response from applying the fallback `bug` label when the issue is not routed to the documentation branch. |
| `apiNode_451.response` | `object` | GitHub API response from applying the `documentation` label on the documentation branch. |
| `apiNode_453.response` | `object` | GitHub API response from posting the generated documentation-oriented comment to the issue. |

The flow terminates after one of two action branches completes. In practice, the API response is a structured JSON object from GitHub rather than a single normalized business object. On the fallback branch, only the `bug` labeling response will exist. On the documentation branch, the final observable effects are two sequential GitHub writes: first a `documentation` label, then a comment containing LLM-generated text. Because the flow does not define an explicit response-shaping node, consumers should expect branch-dependent output completeness.

## Dependencies
### Upstream Flows
- This is an entry-point runtime flow for the GitHub Manager kit and is invoked directly by a webhook trigger.
- It depends operationally on the separate documentation ingestion flow having run beforehand if the documentation branch is expected to work well. That upstream flow must have scraped, chunked, embedded, and stored repository documentation in the configured vector database.
- From that upstream ingestion process, this flow indirectly depends on the existence of searchable documentation embeddings in the vector store consumed by `searchNode_852`.

### Downstream Flows
- No downstream Lamatic flow is explicitly connected in the provided definition.
- The practical downstream consumers are external systems and maintainers observing GitHub side effects: applied labels and posted comments.

### External Services
- Generative LLM for `LLMNode_400` — performs initial issue classification — required model credential via the selected `generativeModelName` configuration.
- Vector database for `searchNode_852` — retrieves semantically relevant documentation chunks — required vector DB connection configured in `vectorDB`.
- Embedding model for `searchNode_852` — embeds the constructed issue query for semantic retrieval — required model credential via `embeddingModelName`.
- Generative LLM for `LLMNode_972` — generates the issue comment using retrieved documentation context and prompt templates — required model credential via the selected `generativeModelName` configuration.
- GitHub REST API for `apiNode_451` — applies the `documentation` label — required `GITHUB_TOKEN` secret.
- GitHub REST API for `apiNode_453` — posts a comment to the issue — required `GITHUB_TOKEN` secret.
- GitHub REST API for `apiNode_342` — applies the `bug` label on the fallback branch — required `GITHUB_TOKEN` secret.

### Environment Variables
- `GITHUB_TOKEN` — GitHub personal access token used to authorize issue label and comment writes — used by `apiNode_451`, `apiNode_453`, and `apiNode_342`.

## Node Walkthrough
1. `Webhook` (`triggerNode`) receives the incoming issue payload. It requires four fields: `body`, `title`, `issue_number`, and `repo_full_name`. These values become the working inputs for classification, retrieval, and all later GitHub API calls.

2. `Generate Text` (`LLMNode_400`) performs the initial LLM reasoning step. It uses the system prompt reference `@prompts/classifier_generate-text_system.md` and the configured chat model from `@model-configs/classifier_generate-text.ts`. This node is intended to classify the issue and determine whether it belongs to the documentation-oriented path. Although the node wiring later references `RAGNode_463.output.modelResponse`, the actual preceding classifier node in the flow is `LLMNode_400`, so implementers should treat this step as the source of routing intent.

3. `Condition` (`conditionNode_731`) routes the flow into one of two branches. Its configured positive condition checks whether a model response contains `DOCS` using a case-insensitive match. If that condition is met, execution goes to the documentation branch. Otherwise, the `Else` branch runs. There is no multi-branch execution; only one path is allowed per run.

4. `Vector Search` (`searchNode_852`) runs only on the documentation branch. It builds a semantic query by concatenating `title` and `body`, then searches the configured vector database with a `limit` of `3` and a `certainty` threshold of `0.85`. This step assumes the repository documentation has already been embedded and stored by the ingestion flow.

5. `Generate Text` (`LLMNode_972`) takes the retrieved documentation context and generates a response suitable for posting back to the GitHub issue. Unlike the first LLM node, this one uses both the system prompt `@prompts/classifier_generate-text_system.md` and the user prompt `@prompts/classifier_generate-text_user.md`, along with the configured chat model. Its output field `generatedResponse` is later inserted into the GitHub comment body.

6. `API` (`apiNode_451`) applies the `documentation` label to the issue on GitHub. It sends a `POST` request to the issue labels endpoint built from `repo_full_name` and `issue_number`, authenticating with `Bearer {{secrets.project.GITHUB_TOKEN}}`.

7. `API` (`apiNode_453`) posts the generated comment to the same GitHub issue. The comment body is populated from `{{LLMNode_972.output.generatedResponse}}`. This creates the externally visible documentation-aware reply.

8. `API` (`apiNode_342`) is the fallback branch action when the condition does not match the documentation path. It sends a `POST` request to the issue labels endpoint and applies the `bug` label to the issue using the same GitHub token.

9. `+` (`addNode`) is the terminal merge point where either action branch ends. It does not add business logic; it simply marks the visual end of the flow after either the fallback `bug` label path or the documentation label-and-comment path completes.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| GitHub API returns `401` or `403` | `GITHUB_TOKEN` is missing, invalid, or lacks repository write scope | Add or rotate `GITHUB_TOKEN` with sufficient `repo` permissions and verify the secret is available to `apiNode_451`, `apiNode_453`, and `apiNode_342`. |
| Issue is always labeled `bug` even for documentation questions | The condition references `{{RAGNode_463.output.modelResponse}}`, but that node does not exist in this flow definition | Update the condition to reference the actual classifier node output from `LLMNode_400`, then retest the `DOCS` match logic. |
| Documentation branch runs but comment quality is poor or generic | Vector store is empty, stale, or populated with irrelevant documentation | Re-run the upstream documentation ingestion flow and verify that the correct repository docs were embedded into the configured `vectorDB`. |
| Vector search fails before comment generation | `vectorDB` or `embeddingModelName` is not configured on `searchNode_852` | Configure a valid vector database connection and embedding model, then redeploy or rerun the flow. |
| GitHub API returns `404` | `repo_full_name` or `issue_number` is malformed, or the token cannot access the target repository | Validate that the trigger payload maps the correct repository path and issue number, and confirm repository access for the token. |
| No useful classification occurs in the first LLM step | Prompt/model configuration is incomplete or the first LLM node has no user prompt content | Review `@model-configs/classifier_generate-text.ts` and the system prompt; if needed, add explicit user content or message mapping for robust classification. |
| Trigger fires but downstream nodes receive empty text | Incoming webhook payload did not normalize fields to top-level `title` and `body` values expected by the trigger schema | Add payload transformation before invocation or reconfigure the webhook integration so the trigger receives the expected field shape. |
| Documentation branch cannot retrieve relevant context after setup | Upstream ingestion flow has not been run, or it indexed a different corpus than the repository under triage | Run the ingestion flow for the correct documentation source and verify the same vector index is selected in `searchNode_852`. |
| Label application succeeds but comment posting fails | Generated comment content is malformed for JSON interpolation or GitHub API write fails on the second call | Check escaping in the generated response, inspect the `apiNode_453` request body, and retry with logging enabled. |

## Notes
- The flow metadata and visual name indicate `GitHub Manager`, but the source file comment names it `classifier`. Treat this as the issue-classification and action flow within the broader GitHub Manager kit.
- The condition node contains a likely configuration defect: it checks `RAGNode_463.output.modelResponse`, yet no node with that ID exists. This is the most important implementation caveat because it can force all traffic into the fallback branch.
- The same prompt family is reused for both LLM steps, but only the second node includes an explicit user prompt reference. That may be intentional if model config injects messages, but it is worth verifying during maintenance.
- The fallback branch applies only the `bug` label. Although the README describes richer issue categories, this concrete flow implementation does not expose those additional classifications.
- GitHub label and comment requests are configured with `retries` set to `0`, so transient network or API failures will not be retried automatically.
- The vector search uses a fixed `limit` of `3` and `certainty` of `0.85`. These defaults trade recall for precision and may need tuning if documentation coverage or chunk granularity changes.