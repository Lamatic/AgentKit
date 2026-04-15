/*
 * # Blog Writer Agent
 * A flow that turns a user-provided topic and tone into a web-grounded blog post, serving as the entry-point content generation pipeline in this kit.
 *
 * ## Purpose
 * This flow is responsible for automating the full blog creation sub-task from a simple request: find relevant public information on a topic, extract usable source material, draft a blog post, and refine it into the requested tone. It addresses the common gap between user intent and publishable content by combining retrieval steps with multi-stage LLM writing inside a supervisor-controlled agent loop.
 *
 * The outcome is a single blog response returned through the API as prose. That output matters because it is the end product the wider system is designed to produce: a coherent, informative article grounded in an externally discovered source rather than a purely synthetic draft. In operational terms, this flow collapses research, drafting, and editing into one invocation that external callers can integrate directly.
 *
 * In the broader plan-retrieve-synthesize chain, this flow acts as both the entry point and the execution engine. It begins with an external GraphQL request, performs the retrieval phase through web search and scraping, then moves into synthesis through a writer and editor sequence coordinated by the `Supervisor` agent. The parent agent context indicates this kit is a single-flow pipeline, so this flow is not just one step in a larger chain within the kit; it is the canonical chain itself.
 *
 * ## When To Use
 * - Use when a caller wants a complete blog post generated from a plain-language `topic` and a desired `tone`.
 * - Use when the request requires current or public web information rather than relying on a private knowledge base or internal document store.
 * - Use when you want one API call to handle source discovery, source extraction, drafting, and tone alignment.
 * - Use when an external application needs a direct content-generation endpoint that returns finished prose rather than intermediate research artifacts.
 * - Use when no separate research flow or editorial flow has been configured and you want the built-in end-to-end pipeline.
 *
 * ## When Not To Use
 * - Do not use when the input is missing a meaningful `topic`, since the web search step depends on it.
 * - Do not use when a tone-specific rewrite is unnecessary and you only need raw source extraction or research notes.
 * - Do not use when your deployment requires citations, multi-source synthesis, or strict fact verification beyond a single selected source unless you extend the flow.
 * - Do not use when required credentials for search or scraping are unavailable, because the retrieval stage will fail before writing can be grounded.
 * - Do not use when the content must be generated exclusively from internal enterprise data; this flow is wired for open web retrieval.
 * - Do not use when a sibling or custom flow is intended for short-form copy, social posts, or non-blog formats.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `topic` | `string` | Yes | The subject the flow should research and write about. This value is passed into the web search query and informs the writing stages. |
 * | `tone` | `string` | Yes | The desired writing style or voice for the final edited blog output. This is used by the editorial stage to shape the final response. |
 *
 * The trigger schema is not explicitly declared in `inputs`, but the flow wiring and parent agent context show that `topic` and `tone` are expected at runtime. The flow assumes `topic` is specific enough to yield useful search results and `tone` is a plain-language style instruction such as professional, conversational, technical, or friendly. No explicit max length, language restriction, or enum validation is encoded in the flow, so validation should be enforced by the caller if stronger guarantees are needed.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `blog` | `string` | The final blog text returned by the supervisor loop as `finalResponse` and exposed through the API response node. |
 *
 * The response is a single prose string, not a structured object containing sections, citations, metadata, or source URLs. Its completeness depends on the success of the search, extraction, writing, and editing stages, and on the supervisor reaching a satisfactory final response within its iteration limit. If the model produces a shorter-than-expected result or the research context is weak, the `blog` field may still be present but less complete than intended.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow within the kit. It is invoked directly by an external caller through a GraphQL API request and does not depend on any prior Lamatic flow having run.
 *
 * The only upstream requirement is that the invoking application supplies the runtime request fields this flow expects:
 * - `topic` — consumed by `Web Search` via `triggerNode_1.output.topic`
 * - `tone` — referenced by the editorial prompting path according to the parent agent context
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are defined in this kit. This flow returns its final content directly to the caller through `API Response`.
 *
 * In deployment, downstream consumers are typically external systems rather than Lamatic flows, for example:
 * - web applications that display the generated article
 * - orchestration systems that chain the returned `blog` into publishing, review, or storage workflows
 * - CMS integrations that save the returned prose as a draft
 *
 * ### External Services
 * - Serper Google Search API — used to search the public web for relevant results for the requested `topic` — required credential: `SERPER_API_KEY`
 * - Firecrawl — used to scrape the selected webpage and extract main content for grounding the blog draft — required credential: `FIRECRAWL_API_KEY`
 * - Configured generative model from `@model-configs/blog-writer-agent_generate-text.ts` — used by both `Generate Text` nodes for drafting and editorial rewriting — required model configuration managed through the referenced model config
 *
 * ### Environment Variables
 * - `SERPER_API_KEY` — authenticates the web search request — used by `Web Search`
 * - `FIRECRAWL_API_KEY` — authenticates webpage scraping and extraction — used by `Scraper`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`)
 *    - This is the trigger for the flow. It receives the incoming request from an external caller in realtime mode.
 *    - Although the exported `inputs` object is empty, the rest of the flow clearly expects at least `topic` and `tone` to be present in the trigger output.
 *    - Once the request arrives, control passes immediately into the supervisor loop.
 *
 * 2. `Supervisor` (`agentNode`)
 *    - This node orchestrates the multi-agent process rather than generating the final blog in one pass.
 *    - It is configured with three logical agents: `Researcher`, `Writer`, and `Editor`.
 *    - Based on its supervisor prompt and current loop state, it routes execution to one of three branches: research, writing, or editing.
 *    - The supervisor can iterate up to `5` times, using the `Agent Loop End` node to receive results from each branch and decide the next action or finalize the response.
 *
 * 3. `Web Search` (`webSearchNode`) when the supervisor selects `Researcher`
 *    - This node searches the public web using the value of `triggerNode_1.output.topic` as the query.
 *    - It requests up to `5` results from the Serper-backed search endpoint.
 *    - The purpose here is not to gather many sources for synthesis but to create a candidate set from which the flow can choose the most relevant page to scrape.
 *
 * 4. `Extract Link` (`codeNode`)
 *    - This code step processes the search results returned by `Web Search`.
 *    - Its job is to extract the link the flow should scrape next, most likely selecting the best or first relevant URL from the result set.
 *    - The output of this node is used directly as the `url` input to the scraper.
 *
 * 5. `Scraper` (`scraperNode`)
 *    - This node fetches and extracts content from the selected webpage using Firecrawl.
 *    - It is configured to focus on `onlyMainContent`, which helps reduce noise such as navigation, ads, and template chrome.
 *    - The scrape is grounded on the URL emitted by `Extract Link`, giving the flow source material for the subsequent writing stage.
 *
 * 6. `Extract Final Content` (`codeNode`)
 *    - This code step transforms the scraper output into the research payload the supervisor can use.
 *    - In practice, it likely strips wrapper fields and isolates the text content that should be handed back as the `Researcher` branch result.
 *    - Its output is sent to `Agent Loop End`, making the scraped research available to the supervisor for the next decision.
 *
 * 7. `Agent Loop End` (`agentLoopEndNode`) after research
 *    - This node closes the research branch iteration and returns the extracted source content to the supervisor.
 *    - The supervisor can then decide to move from retrieval into drafting, using the newly available research context.
 *
 * 8. `Generate Text` (`LLMNode`) when the supervisor selects `Writer`
 *    - This is the drafting stage.
 *    - It uses the shared prompt assets and model configuration referenced in `@model-configs/blog-writer-agent_generate-text.ts`.
 *    - According to the team schema on the supervisor, this branch expects `research` as input, meaning the supervisor should pass the scraped source material into the writer.
 *    - The node produces an initial blog write-up based on the available research and the prompt instructions.
 *
 * 9. `Agent Loop End` (`agentLoopEndNode`) after writing
 *    - This node returns the generated draft to the supervisor.
 *    - The supervisor can inspect the result, determine whether editing is needed, and route execution to the `Editor` branch.
 *
 * 10. `Generate Text` (`LLMNode`) when the supervisor selects `Editor`
 *     - This is the editorial refinement stage.
 *     - The supervisor schema indicates this branch expects `writeup` as input, meaning it receives the writer’s draft for revision.
 *     - The parent agent context notes that the editing prompt references `triggerNode_1.output.tone`, so this stage is where the requested tone is applied most explicitly.
 *     - The result should be a cleaner, tone-aligned final blog suitable for return to the caller.
 *
 * 11. `Agent Loop End` (`agentLoopEndNode`) after editing or finalization
 *     - This node receives the editor output and passes it back to the supervisor.
 *     - If the supervisor decides the content is complete, it emits a `finalResponse` rather than starting another iteration.
 *     - The loop is bounded by a maximum of `5` iterations, which prevents open-ended agent cycling.
 *
 * 12. `API Response` (`graphqlResponseNode`)
 *     - This node maps the supervisor loop’s `finalResponse` to the outward API field `blog`.
 *     - The response contract is simple: the caller receives one text field containing the finished blog content.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Search step fails immediately | Missing or invalid `SERPER_API_KEY` | Set a valid `SERPER_API_KEY` in the environment or workspace secret store and verify the `Web Search` node can authenticate. |
 * | Scraper step fails or returns no content | Missing or invalid `FIRECRAWL_API_KEY`, blocked URL, or an unsupported page structure | Set a valid `FIRECRAWL_API_KEY`, test the selected URL manually, and consider changing the source-selection logic or scraper settings if pages are dynamic or inaccessible. |
 * | The flow returns a weak or generic blog | `topic` is too broad, search results were poor, or the selected page had thin content | Provide a more specific `topic`, improve the link extraction logic, or extend the flow to evaluate multiple sources rather than relying on one selected page. |
 * | The final tone does not match the request | Missing, vague, or poorly phrased `tone` input; editorial prompt may not have enough guidance | Ensure `tone` is supplied and descriptive, and refine the editor prompt if stronger stylistic control is required. |
 * | No useful results from `Web Search` | Malformed `topic`, niche topic with low public coverage, or external search service issues | Validate that `topic` is a non-empty string, retry with a clearer query, and confirm the search provider is reachable. |
 * | The flow loops without producing a strong final answer | Supervisor cannot converge within `5` iterations or branch outputs are insufficiently structured | Tighten the supervisor and branch prompts, ensure research and draft payloads are clearly passed, and increase observability on loop state during testing. |
 * | API response contains an empty or missing `blog` value | The supervisor did not emit `finalResponse`, or an earlier branch failed silently | Inspect branch outputs at `Agent Loop End`, verify the supervisor is configured to finalize explicitly, and add stronger error handling around empty intermediate outputs. |
 * | Invocation fails because expected fields are absent | Caller did not send `topic` and/or `tone`, even though the flow relies on them | Enforce request validation in the invoking application or define an explicit trigger schema so required fields are checked before execution. |
 * | Chained execution from another system produces poor results | Upstream caller did not supply the same conceptual inputs this flow expects | Ensure the invoking system maps its own fields into `topic` and `tone` before calling this flow. |
 *
 * ## Notes
 * - The flow metadata describes a single-source strategy: search for the most relevant source, scrape it, then write from that material. This keeps the pipeline simple but can limit factual coverage and balance.
 * - Both drafting and editing stages use the same referenced model configuration asset, which simplifies maintenance but may couple the behavior of the two stages more tightly than desired.
 * - The supervisor is configured with duplicate references to the same system prompt. That may be intentional or accidental, but it is worth reviewing if agent behavior seems repetitive or overconstrained.
 * - The trigger schema is effectively implicit. Even though the flow uses `topic` and `tone`, those fields are not formally declared in `inputs`, so external validation is especially important.
 * - The response returns only the final blog text. If your application needs provenance, selected source URL, or intermediate research for auditing, you will need to extend the output mapping.
 */

// Flow: blog-writer-agent

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Blog Writer Agent",
  "description": "This automation generates a blog on any given topic by searching the internet for the most relevant source, then writing the blog in the user's desired tone.",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/blog-writer-agent",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "blog_writer_agent_supervisor_system": "@prompts/blog-writer-agent_supervisor_system.md",
    "blog_writer_agent_generate_text_user": "@prompts/blog-writer-agent_generate-text_user.md",
    "blog_writer_agent_generate_text_system": "@prompts/blog-writer-agent_generate-text_system.md"
  },
  "scripts": {
    "blog_writer_agent_extract_link": "@scripts/blog-writer-agent_extract-link.ts",
    "blog_writer_agent_extract_final_content": "@scripts/blog-writer-agent_extract-final-content.ts"
  },
  "modelConfigs": {
    "blog_writer_agent_generate_text": "@model-configs/blog-writer-agent_generate-text.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "agentNode_901",
    "type": "agentNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentNode",
      "values": {
        "nodeName": "Supervisor",
        "tools": [],
        "agents": [
          {
            "name": "Researcher",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {}\n}",
            "description": "This team will search the internet for the given topic and then scrape from that link"
          },
          {
            "name": "Writer",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"research\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This implies the final research fetched by the research team, which is supposed to be passed to the writing team\"\n    }\n  }\n}",
            "description": "This team will write an informative blog given the research from the research team"
          },
          {
            "name": "Editor",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"writeup\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This implies the written content generated by the writing team\"\n    }\n  }\n}",
            "description": "This team will edit the writeup given by the writing team based on the tone given by the user"
          }
        ],
        "prompts": [
          {
            "id": "2e9025c8-a909-471f-a3b0-44b6bc55fb9a",
            "role": "system",
            "content": "@prompts/blog-writer-agent_supervisor_system.md"
          },
          {
            "id": "0780d9a4-deb5-4b0b-81a2-503e770a6f4e",
            "role": "system",
            "content": "@prompts/blog-writer-agent_supervisor_system.md"
          }
        ],
        "messages": "[]",
        "stopWord": "",
        "connectedTo": "agentLoopEndNode_399",
        "maxIterations": 5,
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "agentLoopEndNode_399",
    "type": "agentLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentLoopEndNode",
      "values": {
        "nodeName": "Agent Loop End",
        "connectedTo": "agentNode_901"
      }
    }
  },
  {
    "id": "webSearchNode_683",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "nodeName": "Web Search",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{triggerNode_1.output.topic}}",
        "country": "",
        "results": "5",
        "language": "",
        "location": "",
        "dateRange": "",
        "credentials": "SERPER_API_KEY"
      }
    }
  },
  {
    "id": "LLMNode_814",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "d687c0ca-c3ff-462c-88be-6545760bc8a7",
            "role": "user",
            "content": "@prompts/blog-writer-agent_generate-text_user.md"
          },
          {
            "id": "9db3a7b8-03e0-4dc5-9072-368c98498399",
            "role": "system",
            "content": "@prompts/blog-writer-agent_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/blog-writer-agent_generate-text.ts",
        "messages": "@model-configs/blog-writer-agent_generate-text.ts",
        "generativeModelName": "@model-configs/blog-writer-agent_generate-text.ts"
      }
    }
  },
  {
    "id": "LLMNode_882",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "f1d70f1e-4e74-4efd-825b-75e93e377783",
            "role": "user",
            "content": "@prompts/blog-writer-agent_generate-text_user.md"
          },
          {
            "id": "d24c6193-cb2b-4420-98a3-527f1c249df6",
            "role": "system",
            "content": "@prompts/blog-writer-agent_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/blog-writer-agent_generate-text.ts",
        "messages": "@model-configs/blog-writer-agent_generate-text.ts",
        "generativeModelName": "@model-configs/blog-writer-agent_generate-text.ts"
      }
    }
  },
  {
    "id": "codeNode_317",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Extract Link",
        "code": "@scripts/blog-writer-agent_extract-link.ts"
      }
    }
  },
  {
    "id": "scraperNode_331",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "scraperNode",
      "values": {
        "nodeName": "Scraper",
        "url": "{{codeNode_317.output}}",
        "mobile": false,
        "waitFor": "250",
        "credentials": "FIRECRAWL_API_KEY",
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    }
  },
  {
    "id": "codeNode_604",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Extract Final Content",
        "code": "@scripts/blog-writer-agent_extract-final-content.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_937",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"blog\": \"{{agentLoopEndNode_399.output.finalResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-agentNode_901",
    "source": "triggerNode_1",
    "target": "agentNode_901",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentNode_901-webSearchNode_683",
    "source": "agentNode_901",
    "target": "webSearchNode_683",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Researcher",
      "invisible": false
    }
  },
  {
    "id": "agentNode_901-LLMNode_814",
    "source": "agentNode_901",
    "target": "LLMNode_814",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Writer",
      "invisible": false
    }
  },
  {
    "id": "agentNode_901-LLMNode_882",
    "source": "agentNode_901",
    "target": "LLMNode_882",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Editor",
      "invisible": false
    }
  },
  {
    "id": "agentNode_901-agentLoopEndNode_399",
    "source": "agentNode_901",
    "target": "agentLoopEndNode_399",
    "type": "agentLoopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Agent Loop End",
      "invisible": true
    }
  },
  {
    "id": "codeNode_604-agentLoopEndNode_399",
    "source": "codeNode_604",
    "target": "agentLoopEndNode_399",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_814-agentLoopEndNode_399",
    "source": "LLMNode_814",
    "target": "agentLoopEndNode_399",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_882-agentLoopEndNode_399",
    "source": "LLMNode_882",
    "target": "agentLoopEndNode_399",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentLoopEndNode_399-agentNode_901",
    "source": "agentLoopEndNode_399",
    "target": "agentNode_901",
    "type": "agentLoopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Agent Loop End",
      "invisible": false
    }
  },
  {
    "id": "webSearchNode_683-codeNode_317",
    "source": "webSearchNode_683",
    "target": "codeNode_317",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_317-scraperNode_331",
    "source": "codeNode_317",
    "target": "scraperNode_331",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "scraperNode_331-codeNode_604",
    "source": "scraperNode_331",
    "target": "codeNode_604",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentLoopEndNode_399-graphqlResponseNode_937",
    "source": "agentLoopEndNode_399",
    "target": "graphqlResponseNode_937",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_937",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_937",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
