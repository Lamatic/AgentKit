# Founder Lens - Analyze
Generates an investor-style startup research brief from a raw idea, then persists the resulting analysis so the wider Founder Lens system can support later retrieval and chat.

## Purpose
This flow is the research and synthesis engine for Founder Lens. It takes a single startup idea and turns it into a structured due-diligence workflow: the idea is decomposed into targeted research questions, those questions are used to drive parallel web searches, and the results are synthesized into a coherent Founder Brief. Its job is to replace the founder’s manual browsing across market reports, startup databases, forums, review sites, and postmortems with a repeatable, machine-driven analysis pass.

The outcome is a structured `brief` plus the parsed `decomposition` used to generate the research plan. That outcome matters because it becomes the canonical evidence base for the rest of the kit. The brief is not only returned to the caller in real time, but also converted into memory facts, embedded, indexed in a vector database, and stored in Lamatic memory so the system can answer follow-up questions without rerunning the entire research pipeline.

Within the broader multi-flow architecture, this is the entry-point analysis flow. In the overall plan-retrieve-synthesize chain, it handles plan creation and evidence gathering first, then synthesis and persistence second. The sibling `Chat` flow depends on this one having already produced and stored a brief; `Analyze` creates the durable context, while `Chat` later retrieves and reasons over it.

## When To Use
- Use when a user submits a new startup idea and needs a first-pass viability analysis grounded in current public web data.
- Use when the system needs to create a fresh Founder Brief for a previously unseen `idea`.
- Use when downstream conversational workflows need a stored semantic representation of the analysis in a vector database and Lamatic memory.
- Use when a founder wants a broad investor-style scan across market size, funding signals, competitors, failed startups, customer pain, monetization, and defensibility.
- Use when the request is to initialize a new research session identified by `userId` and `sessionId`.

## When Not To Use
- Do not use when the user is asking follow-up questions about an analysis that has already been generated; route to the sibling chat or retrieval flow instead.
- Do not use when `idea` is missing, empty, or not a plain language startup concept.
- Do not use when `userId` or `sessionId` is unavailable and the analysis must be persisted or later retrieved by session.
- Do not use when external search access is unavailable, since the flow depends on live Exa.ai lookups for its evidence base.
- Do not use when the user needs deterministic internal lookup only from existing stored briefs; this flow is for fresh analysis, not pure retrieval.
- Do not use when vector storage or memory persistence is intentionally disabled and the caller only wants lightweight ad hoc reasoning; this flow is designed to persist outputs as part of its normal contract.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `idea` | `string` | Yes | The startup concept to analyze, expressed as a short natural-language description. |
| `userId` | `string` | Yes | The user identifier used to associate stored analysis artifacts and memory with a specific user. |
| `sessionId` | `string` | Yes | The session identifier used to scope this analysis run and support later retrieval and chat. |

The trigger expects a JSON payload shaped like `{"idea":"string","userId":"string","sessionId":"string"}`. The flow assumes `idea` contains enough semantic detail for an LLM to deconstruct into multiple research angles. No explicit max length or language validation is encoded in the flow file, but the prompts and search queries assume a concise, human-readable startup idea in natural language. `userId` and `sessionId` should be stable identifiers rather than display labels, because they are used as primary keys and persistence anchors downstream.

## Outputs
| Field | Type | Description |
|---|---|---|
| `brief` | `string` | The final synthesized Founder Brief generated from all research phases and the contrarian pass. |
| `decomposition` | `string` | The full parsed idea decomposition used to drive the research query plan. |

The API response is a simple object with two top-level string fields. `brief` is long-form generated prose, likely structured according to the synthesis prompt rather than as strict JSON. `decomposition` is also returned as a string representation of the full deconstruction output rather than as a nested object, even though internal nodes break it into fields such as `q0` through `q7`, `category`, `assumptions`, `targetCustomer`, and `adjacentMarkets`. Because both fields are LLM- and script-derived, completeness depends on successful search and synthesis across all upstream nodes.

## Dependencies
### Upstream Flows
- None. This is the entry-point flow for the Founder Lens pipeline.
- It is invoked directly by an API-triggered `graphqlNode` and does not require another Lamatic flow to populate its trigger fields first.

### Downstream Flows
- `Founder Lens - Chat` consumes the analysis artifacts persisted by this flow rather than its immediate API response alone.
- The downstream chat experience depends on this flow having produced and stored the Founder Brief associated with the current `userId` and `sessionId`.
- The most important outputs for downstream use are:
  - `brief` — used indirectly after it is converted to facts, embedded, and indexed for retrieval.
  - Session-scoped persisted memory and vector records — created internally from the brief for later RAG and conversational context.

### External Services
- Exa.ai Search API — executes ten web research calls across different lenses such as market size, competitors, customer complaints, and business model evidence — requires an Exa API key in the request header used by each `apiNode`.
- Text generation model provider — powers `LLMNode_decompose`, `LLMNode_contrarian`, and `LLMNode_finalBrief` for idea decomposition, contrarian critique, and final synthesis — requires configured model credentials for the selected `generativeModelName` inputs.
- Embedding model provider — powers `vectorizeNode_brief` and `memoryNode_storeAnalysis` to convert brief facts into vectors for indexing and semantic memory — requires configured model credentials for the selected `embeddingModelName` inputs.
- Vector database — stores embedded analysis facts written by `IndexNode_brief` for later retrieval — requires a configured database connector selected through the `vectorDB` input.
- Lamatic Memory — stores semantic or conversational memory records via `memoryNode_storeAnalysis` — requires the memory backend configured by the referenced memory resource.

### Environment Variables
- `EXA_API_KEY` — authenticates requests to Exa search — used by all `apiNode_*` search nodes through the `x-api-key` request header.
- Model provider credentials — authenticate the selected text generation models — used by `LLMNode_decompose`, `LLMNode_contrarian`, and `LLMNode_finalBrief`.
- Embedding model provider credentials — authenticate the selected embedding models — used by `vectorizeNode_brief` and `memoryNode_storeAnalysis`.
- Vector database connection settings — connect to the chosen vector index backend — used by `IndexNode_brief`.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the inbound payload with `idea`, `userId`, and `sessionId`. This is the external invocation point for the flow and establishes the request context carried through persistence and response.

2. `Get Current Date` (`codeNode`) computes date-aware fields including `year`, `prevYear`, and `dateString`. These values allow the decomposition prompt to frame research in current time, which matters for funding trends, market timing, and recency-sensitive search formulation.

3. `Phase 0 - Idea Deconstruction` (`LLMNode`) takes the raw `idea` plus the current-date context and rewrites the concept into a more explicit research plan. It uses dedicated system and user prompts along with a referenced model configuration. The result is a generated decomposition that expresses the idea in multiple targeted analytical angles rather than one generic summary.

4. `Parse Decomposition` (`codeNode`) converts the deconstruction output into machine-usable fields. It emits `q0` through `q7` plus additional fields such as `category`, `assumptions`, `targetCustomer`, `adjacentMarkets`, and `fullDecomp`. These outputs are the bridge between free-form LLM reasoning and deterministic downstream search execution.

5. `Exa Search - Market Size` (`apiNode`) sends `q0` to Exa.ai as a deep search and retrieves up to five results with extracted text. This branch is intended to gather TAM, SAM, SOM, and broader market opportunity evidence.

6. `Exa Search - VC Trends` (`apiNode`) sends `q1` to Exa.ai as a deep search and retrieves up to five results with extracted text. This branch looks for funding activity, investor attention, and trend signals relevant to the idea space.

7. `Exa Search - Competitors` (`apiNode`) sends `q2` to Exa.ai as a deep search and retrieves up to five results with extracted text. This branch maps the active competitive landscape around the proposed startup.

8. `Exa Search - Dead Competitors` (`apiNode`) sends `q3` to Exa.ai as a deep search and retrieves up to five results with extracted text. This branch looks for shutdowns, failed startups, and postmortem-style evidence that can reveal recurring failure patterns.

9. `Exa Search - Customer Voice` (`apiNode`) sends `q4` to Exa.ai as an auto search across domains such as `reddit.com`, `g2.com`, `capterra.com`, and `news.ycombinator.com`, retrieving up to eight results. This branch emphasizes firsthand complaints, unmet needs, and pain language from communities and review platforms.

10. `Exa Search - Reviews` (`apiNode`) searches Exa using the raw `idea` plus terms like alternatives, reviews, complaints, and problems, constrained to `g2.com`, `capterra.com`, and `producthunt.com`. It retrieves up to eight results to add structured review and product comparison evidence.

11. `Exa Search - Twitter Customer Complaints` (`apiNode`) searches Exa using the raw `idea` plus negative-friction language such as complaints, frustrating, broken, worst, terrible, and switching, constrained to `twitter.com` and `x.com`. It retrieves up to ten results to capture social pain signals and spontaneous user frustration.

12. `Exa Search - Success DNA` (`apiNode`) sends `q5` plus acquisition-story language such as how a founder got first customers, constrained to domains including `indiehackers.com`, `news.ycombinator.com`, `techcrunch.com`, and `blog.ycombinator.com`. It retrieves up to five results to identify success patterns, go-to-market tactics, and breakout stories.

13. `Exa Search - Business Model` (`apiNode`) sends `q6` to Exa.ai as a deep search and retrieves up to five results with extracted text. This branch looks for pricing, monetization, and model benchmarks relevant to the category.

14. `Exa Search - Unfair Advantage` (`apiNode`) sends `q7` to Exa.ai as a deep search and retrieves up to five results with extracted text. This branch looks for defensibility, distribution advantages, and structural differentiation signals.

15. `Consolidate Research` (`codeNode`) waits for the search branches to complete and then groups the raw search results into synthesis-ready phase bundles. It emits consolidated fields including `phase1_market`, `phase2_competitive`, `phase3_customer`, `phase4_success`, `phase5_unfair`, and `phase6_bizmodel`, reducing ten raw result sets into a cleaner analytic scaffold for the final LLM stages.

16. `Phase 7 - The Contrarian` (`LLMNode`) receives the consolidated research and runs a dedicated skeptical pass using its own prompts and model configuration. Its job is not to summarize everything again, but to surface the likely fatal flaw, key skepticism, or strongest investor-style objection that should temper the final brief.

17. `Final Synthesis - Founder Brief` (`LLMNode`) combines the consolidated research with the contrarian output and generates the final Founder Brief. This is the primary user-facing artifact: a structured, investor-grade narrative assembled from the full research base rather than a single search response.

18. `Brief To Memory Facts` (`codeNode`) transforms the final brief into persistence-ready fragments. It emits `factsArray`, `factsString`, and `metadataArray`, which are used to store the brief in retrieval-friendly and memory-friendly forms.

19. `Vectorize Brief` (`vectorizeNode`) converts `factsArray` into embeddings using the configured text embedding model. This produces vector representations of the brief’s atomic facts so they can be indexed and retrieved later.

20. `Pair Vectors With Metadata` (`codeNode`) combines the generated vectors with the corresponding metadata from the brief-to-facts step. This creates aligned vector-plus-metadata records suitable for writing into the vector database.

21. `Index Brief to VectorDB` (`IndexNode`) writes the vectorized fact records into the configured vector database. It uses `userId` and `sessionId` as primary keys and is configured to overwrite duplicates, ensuring a session can be reanalyzed without accumulating stale vector entries.

22. `Memory Add - Store Analysis` (`memoryNode`) stores the analysis into Lamatic memory using the referenced memory configuration. This gives the wider system semantic memory that complements the vector index, supporting later conversational retrieval and continuity.

23. `API Response` (`graphqlResponseNode`) returns the final payload to the caller. It maps `brief` from `LLMNode_finalBrief.output.generatedResponse` and `decomposition` from `codeNode_parseDecomp.output.fullDecomp`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails before any research starts | Missing or malformed trigger payload, especially absent `idea`, `userId`, or `sessionId` | Validate the request body against the expected schema before invocation and ensure all three fields are non-empty strings |
| Decomposition step returns unusable output | The selected LLM is misconfigured, unavailable, or the prompt receives an overly vague `idea` | Confirm `generativeModelName` is configured for `LLMNode_decompose` and provide a clearer startup description with customer and product intent |
| Search nodes return errors or empty objects | Missing Exa credential, invalid `x-api-key`, rate limits, or poor query quality | Set a valid `EXA_API_KEY`, verify Exa access, and inspect the generated decomposition queries for quality |
| Final brief is thin or generic | Upstream search returned sparse evidence or the original idea was too ambiguous | Improve the input idea, inspect search outputs, and consider refining decomposition or search prompts for stronger query specificity |
| Vector indexing fails | `vectorDB` is not configured, connector credentials are missing, or the embedding model is unavailable | Provide a valid vector database connection in `IndexNode_brief`, verify embedding credentials, and confirm the selected backend is reachable |
| Memory storage fails after brief generation | Memory backend or embedding configuration for `memoryNode_storeAnalysis` is invalid | Check the referenced memory resource, embedding model credentials, and any collection/session settings used by the memory node |
| Duplicate or stale retrieval results later in chat | Prior vectors were not overwritten correctly or session identifiers were reused inconsistently | Ensure `userId` and `sessionId` are stable and correct, and verify the index node’s overwrite behavior is applied as expected |
| Caller expects analysis but only gets a chat-style answer elsewhere | The wrong flow was invoked; a downstream retrieval flow was used instead of fresh analysis | Route first-time idea evaluation to `Founder Lens - Analyze` and only use the chat flow after this analysis has completed |
| No downstream chat context is available | This flow did not finish persistence steps successfully, so the brief was not stored for retrieval | Check `IndexNode_brief` and `memoryNode_storeAnalysis` execution results before invoking the chat flow |

## Notes
- The README describes this flow as part of a roughly 90-second investor-grade research pipeline, so latency is dominated by parallel web search and multiple LLM calls rather than trigger overhead.
- Although the README summarizes the research stage as nine targeted searches in one place and ten in another, the flow definition clearly contains ten Exa search nodes. Operational documentation should follow the flow source as the canonical implementation.
- The flow uses both the raw `idea` and the parsed decomposition queries. Some searches are decomposition-driven for precision, while others intentionally use the raw idea plus complaint-oriented modifiers to capture looser public discourse.
- The returned API output is intentionally minimal compared with the amount of persistence work performed internally. Most of the flow’s long-term value is in the stored vector and memory artifacts that power subsequent retrieval and chat.
- `IndexNode_brief` is configured with duplicate overwrite behavior keyed by `userId` and `sessionId`, which is useful for reruns but means repeated analyses for the same session replace earlier indexed records rather than creating a history.
- The flow file shows private runtime-configurable model inputs for the LLM and embedding nodes. In practice, deployment quality depends heavily on selecting strong text generation and embedding models before production use.