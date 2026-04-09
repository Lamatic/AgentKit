# LocalBoost AI – Lead Intelligence
A flow that turns a local business website into structured lead intelligence and outreach-ready copy, serving as the entry-point research and analysis stage in the wider LocalBoost sales automation pipeline.

## Purpose
This flow is responsible for converting a small set of lead inputs into a machine-readable business assessment based on real website content. It solves the otherwise manual task of visiting a prospect’s site, identifying what the business offers, spotting obvious conversion or positioning gaps, and drafting a relevant outreach angle. Instead of returning unstructured notes, it produces a consistent JSON response that can be consumed directly by operators, CRMs, outreach tools, or downstream automation.

The outcome is a structured lead brief containing a business summary, supporting evidence, detected problems, growth opportunities, quick wins, an offer angle, a personalized outreach message, and a lead score with rationale. This matters because the broader agent system is designed to standardize the research phase of outbound work: callers can invoke one endpoint and receive a deterministic payload suitable for enrichment, prioritization, and message generation without manual interpretation.

Within the wider chain, this flow sits at the boundary between data acquisition and synthesis. It is the primary entry-point flow for this kit: it accepts business identifiers through an API request, retrieves current public website content through Firecrawl, then uses an Instructor-style LLM step to synthesize that content into validated structured output. In a larger lead-generation stack, it is typically invoked by a CRM enrichment job, outbound workflow, or internal sales tool, and its output feeds later systems that decide who to contact and what to send.

## When To Use
- Use when you have a local business website and need fast, structured lead research based on the business’s real public web presence.
- Use when an outbound sales, agency prospecting, or CRM enrichment workflow needs machine-readable insights rather than freeform prose.
- Use when you want a personalized outreach draft grounded in the target business’s actual site content.
- Use when a calling system can provide at least a valid `website` URL and expects a synchronous API response.
- Use when you need a lightweight website-only analysis step before sequencing, prioritization, or lead scoring downstream.
- Use when no internal knowledge base exists for the target business and current public website data is the primary source of truth.

## When Not To Use
- Do not use when no `website` is available; this flow depends on scraping a public website and has no alternate retrieval path.
- Do not use when the target analysis requires private, authenticated, or non-public data sources.
- Do not use when you need multi-source enrichment from Instagram, Google Maps, CRM history, or other external systems; this flow currently analyzes website content only.
- Do not use when you need batch processing of many leads in one invocation; the configured flow is single-request, single-site oriented.
- Do not use when the input is raw text, a document upload, or a company profile without a crawlable URL.
- Do not use when another system has already produced a verified lead brief and you only need downstream delivery, sequencing, or CRM write-back.
- Do not use when the website is known to block crawlers or requires JavaScript-heavy authenticated navigation beyond a simple scrape.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `business_name` | string | No | Display name of the business being analyzed. Used as context for the LLM prompt layer described in the kit documentation, even though the scrape itself is driven by the website URL. |
| `website` | string | Yes | Public website URL to scrape and analyze. This is the operationally critical input because `Firecrawl` reads directly from `{{triggerNode_1.output.website}}`. |
| `instagram` | string | No | Instagram URL or handle for contextual business identity. Present in the documented trigger shape, but not consumed directly by the visible node configuration in this flow source. |
| `location` | string | No | Location context for the business. Documented in the README input shape, but not referenced directly by the visible node wiring in this flow source. |

The main validation assumption is that `website` must be a valid, publicly reachable URL. The flow is tolerant of missing optional context fields, but the quality of generated analysis may improve when `business_name` is supplied. The flow is designed for local-business context, and the README indicates that the outreach message is generated in Portuguese, so callers should expect language behavior aligned with the configured prompts rather than with the trigger language alone.

## Outputs
| Field | Type | Description |
|---|---|---|
| `business_summary` | string | Concise summary of what the business appears to do, based on the scraped website content. |
| `evidence` | array of string | Supporting observations or signals extracted from the site that justify the analysis. |
| `detected_problems` | array of string | Likely issues in positioning, trust, conversion, messaging, or site clarity inferred from the website. |
| `growth_opportunities` | array of string | Areas where the business could improve acquisition, conversion, or digital presence. |
| `quick_wins` | array of string | Practical, near-term improvements that could be implemented quickly. |
| `offer_angle` | string | Suggested commercial angle for approaching the business with a relevant service offer. |
| `personalized_outreach` | string | Outreach message tailored to the business and grounded in the website analysis. |
| `lead_score` | string | Overall lead potential score, expected to align with values such as `High`, `Medium`, or `Low`. |
| `reason_for_score` | string | Explanation for why the lead received its assigned score. |

The response is a single structured JSON object returned synchronously by the API response node. Most fields are prose strings, while `evidence`, `detected_problems`, `growth_opportunities`, and `quick_wins` are lists of strings. Completeness depends on what the website exposes publicly and what the scrape retrieves successfully; sparse or low-quality sites may lead to thinner evidence and more tentative conclusions.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow. No other Lamatic flow must run before it.
- The invoking system must provide the trigger payload directly, especially `website`, which the `Firecrawl` node consumes.
- In broader orchestration terms described by the parent agent, this flow is typically called by a sales workflow, CRM enrichment job, or internal tool rather than by another flow in the same kit.

### Downstream Flows
- No downstream Lamatic flows are defined in the provided sources.
- In practice, external systems may consume `business_summary`, `detected_problems`, `growth_opportunities`, `offer_angle`, `personalized_outreach`, `lead_score`, and `reason_for_score` for CRM enrichment, prioritization, email drafting, or sequencing.

### External Services
- Firecrawl — scrapes the public business website and extracts the main page content used as evidence for analysis — requires a configured Firecrawl credential on node `firecrawlNode_439`
- Instructor-compatible text generation model — produces validated structured JSON from scraped content and prompts — requires a model provider credential through `generativeModelName` on node `InstructorLLMNode_168`
- GraphQL/API runtime — receives the incoming request and returns the structured response — managed by the Lamatic execution environment for `triggerNode_1` and `responseNode_triggerNode_1`

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Provider-specific secrets may still be required behind the configured Firecrawl credential and selected LLM model, but they are abstracted through Lamatic credentials rather than referenced here by explicit variable name.

## Node Walkthrough
1. `API Request` (`graphqlNode` trigger) receives the inbound API call and establishes the flow input context. In this flow, the critical field is `website`, with additional business context such as `business_name`, `instagram`, and `location` potentially available to prompts or the caller’s surrounding system.

2. `Firecrawl` (`firecrawlNode`) performs a synchronous single-page scrape against `{{triggerNode_1.output.website}}`. It is configured for `syncSingleScrape`, waits briefly before extraction, uses `onlyMainContent: true`, and does not crawl subpages or subdomains. In practical terms, this means the flow analyzes the main website page content rather than building a deep site-wide profile.

3. `Generate JSON` (`InstructorLLMNode`) takes the scraped website content from the previous step and runs a prompt-driven structured extraction/generation pass. It uses referenced system and user prompts plus a declared JSON schema to force the model into returning the exact lead-intelligence shape required by the flow: summary, evidence lists, problems, opportunities, quick wins, outreach angle, outreach message, and scoring fields.

4. `API Response` (`graphqlResponseNode`) maps each field from `InstructorLLMNode_168.output` into the final JSON response body and returns it with `content-type` set to `application/json`. No additional transformation occurs at this stage; it is a direct packaging of the validated model output for the caller.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails before scraping starts | Missing or invalid Firecrawl credential on `firecrawlNode_439` | Configure or reselect the Firecrawl credential in the flow deployment environment and verify the account has access. |
| Response is empty or analysis is weak | `website` is invalid, unreachable, blocked, or contains very little crawlable main content | Validate the URL, confirm the site is public, and test whether the homepage returns meaningful content without authentication. |
| Flow returns model or validation errors | No LLM model configured in `generativeModelName`, provider credentials are invalid, or the selected model cannot satisfy the Instructor-style JSON response | Select a compatible text generation model, confirm provider credentials, and ensure the model supports structured generation reliably. |
| Output fields are missing or malformed | The scraped content was too sparse, the prompt-model combination produced incomplete JSON, or downstream mapping received null values | Retry with a stronger compatible model, improve prompt context if editable, and ensure the target website contains enough descriptive business information. |
| Caller receives poor personalization | Optional fields like `business_name` were omitted, or the site does not expose enough detail to personalize outreach confidently | Supply richer trigger context and prefer websites with identifiable services, offers, and location cues. |
| Flow cannot be used in a chain that expects prior enrichment | An orchestrator assumed an upstream flow had already normalized or enriched the lead, but this flow is actually the entry-point | Route raw lead data directly into this flow first, then chain its outputs into later CRM or outreach systems. |
| Request times out or returns scrape failure | Target site is slow, blocks scraping, or exceeds the scrape timeout behavior | Retry against a stable URL, reduce reliance on problematic domains, or adjust operational expectations for sites with anti-bot protections. |
| `instagram` or `location` appear to have no effect | Those fields are documented as inputs but are not visibly wired into node configuration in the provided source | Treat them as optional context only unless prompt or model-config files explicitly incorporate them in deployment. |

## Notes
- The implemented scrape path is homepage-centric. Although the README describes broader website signal extraction, the node configuration uses synchronous single-page scraping with no subpage crawl, so results reflect what is discoverable from the supplied page rather than the entire site.
- The flow relies heavily on prompt files and a model-config reference that are not expanded in the source snippet. Those referenced assets may further shape language, tone, and how optional trigger fields are used.
- `lead_score` is typed as a plain string in the schema, even though the README suggests values like `High`, `Medium`, or `Low`. Callers should not hard-code strict enum validation unless they control the prompts and model behavior.
- Because the flow returns a synchronous response, it is best suited to low-latency enrichment of individual leads rather than large-scale batch prospecting.
- The response node directly exposes model output fields without post-processing. If stricter guarantees are required for downstream systems, add validation or normalization outside this flow or in a future revision.