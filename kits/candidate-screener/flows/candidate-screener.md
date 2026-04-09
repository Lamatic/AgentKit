# Candidate Screener
A synchronous screening flow that evaluates a candidate’s GitHub profile against role requirements, generates a decision email, and serves as the entry-point execution path for the wider Candidate Screener agent.

## Purpose
This flow is responsible for automating the first-pass evaluation of a technical candidate using public GitHub profile content. It accepts an API request, scrapes the candidate URL provided at trigger time, classifies the candidate as either `Selected` or `Rejected`, and then generates a personalized email aligned to that outcome. The flow removes a large amount of manual recruiter review by converting raw GitHub content into an immediate screening decision.

The outcome of this flow is twofold: an operational decision signal and a communication artifact. Internally, it determines a final status through the classifier branch. Externally, it sends an email payload to a downstream webhook and returns a compact API response containing the candidate email and status. This matters because the broader hiring pipeline needs a machine-consumable result for orchestration while also needing human-facing candidate communication that can be delivered with minimal manual work.

Within the broader agent system, this is the primary and only flow described for the kit, so it functions as the entry-point and end-to-end execution path. In plan-retrieve-synthesize terms, the `API Request` node captures the screening task, the `Scraper` node performs retrieval from the provided GitHub URL, the `Classifier` node produces the decision, and the `Generate Text` plus downstream `API` call synthesize and dispatch the candidate-facing message. There is no separate preprocessing or postprocessing flow in this kit; the full screening cycle happens in one request/response transaction.

## When To Use
- Use when an ATS, recruiting portal, internal HR tool, or custom backend needs a synchronous screening decision for a candidate based on a GitHub profile or repository page.
- Use when the caller can provide a public `url` that the scraper can access and an `email` address that should receive the generated decision message.
- Use when the goal is to classify a candidate into a binary outcome of `Selected` or `Rejected` and automatically produce corresponding candidate communication.
- Use when you want a single API-triggered flow that both evaluates the candidate and invokes an external webhook to send or process the generated email content.
- Use when GitHub-based evidence is sufficient for the screening step and no separate internal knowledge base or multi-flow orchestration is required.

## When Not To Use
- Do not use when the candidate has no accessible public GitHub or web URL to scrape.
- Do not use when the caller cannot provide a valid recipient `email`, since both decision branches post email content to an external webhook.
- Do not use when screening must consider private repositories, internal HR records, or proprietary assessment data that this flow does not fetch.
- Do not use when you need a nuanced multi-class recommendation, ranking across candidates, or interview scheduling logic; this flow only branches to `Selected` or `Rejected`.
- Do not use when asynchronous batch processing is required; this flow is configured for a realtime API response pattern.
- Do not use when another system already generated the decision and only email delivery is needed; this flow always performs scraping and classification before generation.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | Public URL passed to the `Scraper` node. In practice this should be the candidate’s GitHub profile, repository page, or another web page containing the evidence to screen. |
| `email` | `string` | Yes | Recipient email address forwarded to the downstream email webhook and echoed in the API response. |

Although the exported `inputs` object is empty, the trigger mapping makes it clear that the flow expects `triggerNode_1.output.url` and `triggerNode_1.output.email` to be present in the incoming request payload. The `url` should be publicly reachable by the scraper, and the `email` should be in a valid address format because it is sent unchanged to the external webhook. The flow source does not define explicit schema validation, length limits, or normalization logic, so callers should validate inputs before invocation.

## Outputs
| Field | Type | Description |
|---|---|---|
| `email` | `string` | The same recipient email supplied at trigger time, returned for correlation and downstream auditing. |
| `status` | `string` | The classifier result, returned as `Selected` or `Rejected`. |

The API response is a small structured object, not a long-form report. It does not return the scraped content, the model reasoning, or the generated email body. The email text is produced internally and sent to an external webhook, while the synchronous response only exposes the final status and recipient email.

## Dependencies
### Upstream Flows
- None. This is the entry-point and standalone execution flow for the Candidate Screener kit.
- The caller must still provide the trigger data this flow depends on, specifically `url` and `email`, but no prior Lamatic flow is required to produce them.

### Downstream Flows
- No downstream Lamatic flows are declared.
- An external webhook receives the generated email payload after either generation branch completes. It consumes:
  - `email` from `triggerNode_1.output.email`
  - generated email content from `LLMNode_366.output.generatedResponse` on the `Selected` branch or `LLMNode_490.output.generatedResponse` on the `Rejected` branch

### External Services
- Firecrawl scraper service — fetches and extracts the main content from the candidate URL for evaluation — required credential `FIRECRAWL_API_KEY`
- Configured LLM from `@model-configs/candidate-screener_generate-text.ts` — generates candidate-facing email content for both decision branches — credential depends on the model provider defined in the referenced model config
- Lamatic classifier model runtime — assigns the scraped candidate data to either `Selected` or `Rejected` using the referenced system prompt — credential depends on the workspace model setup because no explicit model is hardcoded in the flow file
- External webhook at `dhruvlamatic.app.n8n.cloud` — receives `email` and generated `content` for downstream handling such as email delivery — no credential configured in the node itself

### Environment Variables
- `FIRECRAWL_API_KEY` — credential for the scraping service used to fetch candidate page content — used by the `Scraper` node

## Node Walkthrough
1. `API Request` (`graphqlNode` trigger) receives the incoming realtime API call. This node is the flow entry point and is expected to expose at least `url` and `email` in its output so later nodes can scrape the candidate page and send the final communication.

2. `Scraper` (`scraperNode`) loads `{{triggerNode_1.output.url}}` and extracts the main page content. It is configured to use `onlyMainContent`, which means the flow is intentionally trying to reduce noise from surrounding page chrome and focus on substantive candidate evidence from the supplied GitHub page or related web page.

3. `Classifier` (`agentClassifierNode`) evaluates the scraped material and assigns one of two classes: `Selected` or `Rejected`. Its behavior is controlled by the referenced system prompt `@prompts/candidate-screener_classifier_system.md`, which is where the selection criteria and decision framing live.

4. If the classifier returns `Selected`, execution follows the first conditional branch into `Generate Text` (`LLMNode_366`). This node uses the shared generation prompt `@prompts/candidate-screener_generate-text_system.md` plus the referenced model configuration to compose a positive candidate email appropriate for an accepted screening outcome.

5. On the `Selected` branch, `API` (`apiNode_413`) sends a `POST` request to the configured webhook URL. The body contains the original trigger `email` and the generated email text from `LLMNode_366.output.generatedResponse`, allowing an external automation system to send, log, or further process the message.

6. If the classifier returns `Rejected`, execution follows the second conditional branch into the other `Generate Text` (`LLMNode_490`). This node uses the same generation prompt and model configuration but produces a rejection or feedback-oriented email based on the branch context and available state.

7. On the `Rejected` branch, `API` (`apiNode_443`) sends a `POST` request to the same webhook endpoint. Its payload contains the same trigger `email` and the generated message from `LLMNode_490.output.generatedResponse`.

8. `API Response` (`graphqlResponseNode`) returns the final synchronous response to the caller. It maps `email` from the original request and `status` from `agentClassifierNode_511.output.class`, so the caller can immediately know which branch was taken without waiting on separate polling or callback logic.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Scraper step fails before classification | Missing or invalid `FIRECRAWL_API_KEY` credential | Set a valid `FIRECRAWL_API_KEY` in the environment or workspace secrets used by the `Scraper` node. |
| Flow returns an error or unusable result when invoked | Required trigger fields such as `url` or `email` were omitted or malformed | Validate the request before invocation and ensure both `url` and `email` are present and correctly formatted. |
| Candidate is incorrectly screened or receives a low-quality result | The supplied `url` does not point to meaningful candidate evidence, or the page is sparse, private, or blocked | Provide a public GitHub profile or repository URL with accessible content. Consider preprocessing URLs on the caller side. |
| Classification cannot proceed meaningfully | Scraper returned little or no main content from the target page | Verify the target page is public, renders useful textual content, and is compatible with the scraper. Try a different candidate URL if needed. |
| Generated email is missing or webhook call fails | External webhook endpoint is unavailable, misconfigured, or rejecting the request body | Confirm the webhook URL is live, accepts `POST` requests, and can handle the `email` and `content` payload shape sent by the `API` nodes. |
| API response shows a status but no actual email was sent downstream | The flow response completed, but the external webhook handled the payload unsuccessfully after generation | Add monitoring on the webhook receiver, inspect downstream logs, and retry or harden the external delivery path. |
| Model generation or classification fails at runtime | Workspace model credentials or model configuration referenced by `@model-configs/candidate-screener_generate-text.ts` are incomplete or invalid | Verify the model provider setup in Lamatic, confirm the referenced model config is valid, and ensure the workspace has access to the required LLM. |
| Caller expects data from an earlier Lamatic stage that never ran | An integrating system assumed this flow consumes outputs from another flow, but this kit is single-flow and standalone | Invoke this flow directly with the required trigger payload instead of relying on non-existent upstream flow outputs. |

## Notes
- The flow metadata describes matching candidate skills against job requirements, but the visible TypeScript wiring only exposes `url` and `email` as trigger-bound variables. If job-description context is intended, it is likely embedded in prompt logic, hidden runtime state, or omitted from the exported source. Developers integrating this flow should verify the actual deployed request contract before relying on richer screening criteria.
- Both generation branches use the same prompt and model configuration. The differing output behavior therefore depends on branch context and available node state rather than separate prompts for acceptance and rejection.
- The synchronous API response is intentionally minimal. If callers need the generated email body, scraped evidence, or explanation details, the flow must be extended to return them explicitly.
- The webhook URL is hardcoded in both `API` nodes. For production use, consider moving this endpoint to an environment-managed configuration to avoid brittle deployments across environments.
- The `Scraper` node waits for `123` units before extraction and is configured for non-mobile rendering with `onlyMainContent` enabled. This favors concise extraction but may miss content that requires deeper interaction or client-side rendering.
- The trigger is configured with response type `realtime`, so end-to-end latency includes scraping, classification, generation, and the webhook call path before the final API response is emitted.