/*
 * # Agentic Reasoning
 * A final-answer synthesis flow that turns a user query plus accumulated research into a single response, serving as the synthesis stage of the wider Deep Research pipeline.
 *
 * ## Purpose
 * This flow is responsible for the last step of the reasoning workflow: converting previously gathered evidence into a usable answer for the caller. It does not search, crawl, retrieve, or plan. Instead, it takes the original user request and the collected `research` context from earlier stages, then asks a text-generation model to produce the final answer.
 *
 * The outcome is a single `answer` string returned through the flow's API response. That output matters because it is the user-facing artifact of the overall pipeline: planning and retrieval are only useful if they culminate in a coherent, grounded response. In operational terms, this flow is where accumulated evidence becomes a concise recommendation, explanation, summary, or action-oriented reply.
 *
 * Within the broader Deep Research architecture, this flow sits at the end of the plan-retrieve-synthesize chain. Upstream flows generate reasoning steps and gather evidence from the public web and/or internal indexed sources. This flow consumes those prepared artifacts and synthesizes them into the final answer delivered back to the invoking UI or service.
 *
 * ## When To Use
 * - Use after upstream planning and retrieval have already run and produced a `research` collection for the current user query.
 * - Use when the caller needs a single natural-language answer rather than intermediate steps, raw search results, or retrieved documents.
 * - Use when web-search or internal-data-source evidence has been assembled and must be combined into one grounded response.
 * - Use when the invoking application wants the final user-visible response in a Deep Research run.
 * - Use when the user asks an open-ended question that benefits from synthesis across multiple research items rather than direct lookup from one source.
 *
 * ## When Not To Use
 * - Do not use as the first step of a research run; use the step-generation flow first when no plan or retrieval has happened yet.
 * - Do not use when the system still needs to collect evidence from the web; use the web-search retrieval flow instead.
 * - Do not use when the system still needs to retrieve from internal indexed sources; use the data-source retrieval flow instead.
 * - Do not use when the caller wants raw search hits, citations-only output, or step-by-step execution artifacts rather than a final answer.
 * - Do not use if the required upstream `research` input has not been assembled yet.
 * - Do not use if the request payload is missing the user `query`, because the model needs the original question to frame the final synthesis.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `query` | `string` | Yes | The original user question that the final answer must address. |
 * | `research` | `array` | Yes | The accumulated research artifacts from upstream retrieval steps, typically including web or data-source results such as titles, links, snippets, dates, sitelinks, and related metadata. |
 * | `generativeModelName` | `model` | Yes | The text-generation model selection used by the `Generate Text` node to produce the final answer. This is configured as a private runtime/model input rather than a user-facing content field. |
 *
 * Below the table, note that the flow assumes `query` is a natural-language prompt and `research` is already curated into a machine-readable list of evidence objects. The exact schema of each research item is flexible, but the flow expects meaningful textual fields to be present so the model can synthesize them. No explicit length or language validation is defined in the flow source, so callers should avoid extremely large payloads and should pass clean, relevant research context.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` | The final model-generated answer synthesized from the input `query` and provided `research`. |
 *
 * The response format is a simple object containing one prose field, `answer`. The flow does not return intermediate reasoning steps, raw citations as a separate structured field, or diagnostic metadata. Completeness depends on the quality and sufficiency of the upstream `research` payload and the selected model's ability to synthesize that material.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `agentic-reasoning-generate-steps` — typically runs earlier in the broader pipeline to expand the user `query` into a plan for downstream retrieval. This flow does not directly consume its output field in the TypeScript source, but it is part of the normal orchestration path that leads to evidence collection.
 * - `agentic-reasoning-search-web` — supplies public-web research results that may populate the `research` input consumed here.
 * - `agentic-reasoning-data-source` — supplies internal indexed retrieval results that may also populate the `research` input consumed here.
 * - Orchestrating application or service layer — is responsible for invoking those upstream flows, gathering their outputs, and passing the assembled `query` and `research` payload into this flow.
 *
 * This is not a standalone discovery flow. It is a synthesis-stage flow that depends on prior evidence gathering, even though that dependency is enforced by orchestration rather than by explicit in-flow branching logic.
 *
 * ### Downstream Flows
 * - No Lamatic sibling flow is shown as consuming this flow's output directly.
 * - The primary downstream consumer is the invoking UI or service, which reads `answer` and presents it to the end user or uses it as the terminal artifact of a research session.
 *
 * ### External Services
 * - Lamatic GraphQL/API trigger-response runtime — receives the request and returns the final payload — required project/API credentials in the host environment
 * - Configured text-generation model via Lamatic `LLMNode` — generates the final synthesized answer from prompts plus `query` and `research` — requires a valid model selection provided through `generativeModelName`
 * - Prompt assets in the Lamatic project — provide the shared system instruction and this flow's user synthesis instruction — no separate runtime credential, but they must exist in the deployed project
 *
 * ### Environment Variables
 * - `AGENTIC_REASONING_FINAL` — Flow ID used by the surrounding application to invoke this deployed flow — used outside the flow itself by the caller/orchestrator
 * - `LAMATIC_API_URL` — Base URL for Lamatic API access when invoking the flow — used by the caller/orchestrator, not an individual node inside the flow definition
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated invocation — used by the caller/orchestrator, not an individual node inside the flow definition
 * - `LAMATIC_API_KEY` — Credential for calling Lamatic-hosted flows — used by the caller/orchestrator, not an individual node inside the flow definition
 *
 * The flow source itself does not reference environment variables directly inside node configs. Runtime access is mediated by Lamatic deployment and by the external application that calls this flow.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the inbound flow invocation. In this flow, that request is expected to carry the original `query` and the assembled `research` array produced by earlier stages of the Deep Research process.
 * 2. `Generate Text` (`LLMNode`) takes the incoming request data and runs the final synthesis prompt stack. It uses the shared system prompt in `generate_text_system` plus the flow-specific user prompt `agentic_reasoning_final_generate_text_user`, along with the configured `generativeModelName`, to convert the user question and research evidence into one final generated response.
 * 3. `API Response` (`graphqlResponseNode`) returns the output to the caller. Its output mapping exposes `LLMNode_168.output.generatedResponse` as the single response field `answer`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before generation starts | Lamatic API credentials or project configuration are missing or invalid in the calling application | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`, and confirm the deployed flow ID in `AGENTIC_REASONING_FINAL` is correct. |
 * | The flow returns a weak, generic, or incomplete `answer` | Upstream `research` was sparse, irrelevant, duplicated, or not aligned to the current `query` | Re-run upstream retrieval with a better plan or cleaner evidence set, then invoke this flow again with higher-quality research artifacts. |
 * | The model produces an answer unrelated to the user request | `query` was malformed, empty, or mismatched with the supplied `research` payload | Ensure the original user question is passed exactly and that the `research` array corresponds to that same query. |
 * | Invocation succeeds but the answer is empty or low quality | The selected `generativeModelName` is unavailable, misconfigured, or unsuitable for synthesis | Confirm the configured model is valid in Lamatic, available to the project, and appropriate for text generation. |
 * | The flow cannot produce a grounded answer | Upstream retrieval flows did not run, or their outputs were not assembled into `research` before invocation | Execute the retrieval stage first and pass the resulting evidence into this flow. |
 * | Response shape is missing expected content besides `answer` | Caller expects structured citations, steps, or metadata that this flow does not return | Update the caller to consume only `answer`, or extend the flow if richer structured output is required. |
 * | Generation errors occur intermittently | Runtime model/provider instability or oversized input context | Retry with the same payload, reduce the size of `research`, or choose a model with larger context capacity. |
 *
 * ## Notes
 * - This flow is intentionally narrow: it performs synthesis only and delegates planning and retrieval to sibling flows.
 * - The flow has no explicit conditional branches, tool calls, retries, or fallback logic. Execution is strictly linear from request to generation to response.
 * - Prompt behavior is split across a shared system prompt and a flow-specific user prompt, so changes to final-answer style or grounding behavior may come from either prompt asset rather than from the node wiring alone.
 * - The `research` payload can include heterogeneous result objects. Because the flow relies on prompt-driven synthesis rather than schema enforcement, consistency and relevance of upstream evidence strongly affect output quality.
 * - The `API Response` node maps only one field. If future consumers need citations, confidence, or structured sections, the response mapping and likely the prompt design will need to be expanded.
 */

// Flow: agentic-reasoning-final

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning",
  "description": "This flow generates the final answer based on previous two steps",
  "tags": [],
  "testInput": {
    "query": "Help me pack for my trip to Jaipur next week",
    "research": [
      {
        "link": "https://weather.com/en-TT/weather/tenday/l/Jaipur+Rajasthan+India?canonicalCityId=12747bac0e2fedce60691a1bcbbb0c1a",
        "title": "10-day weather forecast for Jaipur, Rajasthan, India",
        "snippet": "10-Day Weather-Jaipur, Rajasthan, India. As of 22:47 IST. Tonight. --/24°. 5%. Night. 24°. 5%. WNW 10 km/h. Partly cloudy. Hazy. Low 24°C. Winds light and ...",
        "position": 1
      },
      {
        "link": "https://www.timeanddate.com/weather/india/jaipur/ext",
        "title": "Jaipur, Rajasthan, India 14 day weather forecast - Time and Date",
        "snippet": "2 Week Extended Forecast in Jaipur, Rajasthan, India ; Sep 18, 93 / 76 °F · Showers late. Overcast. 97 °F · 3 mph ; Sep 19, 94 / 75 °F · Showers late. Broken clouds.",
        "position": 2,
        "sitelinks": [
          {
            "link": "https://www.timeanddate.com/weather/india/jaipur/hourly",
            "title": "Hour-by-Hour Forecast"
          },
          {
            "link": "https://www.timeanddate.com/weather/india/jaipur/historic",
            "title": "Yesterday/Past Weather"
          },
          {
            "link": "https://www.timeanddate.com/weather/india/jaipur/climate",
            "title": "Climate (Averages)"
          },
          {
            "link": "https://www.timeanddate.com/astronomy/india/jaipur",
            "title": "Sun & Moon"
          }
        ]
      },
      {
        "link": "https://weather.com/en-TT/weather/tenday/l/Jaipur+Rajasthan+India?canonicalCityId=ca31043a3bdd21b58bf82a149a2eff6c919e9b3017e52e314ec279efa4a0d2c6",
        "title": "10-Day Weather-Jaipur, Rajasthan, India",
        "snippet": "10-Day Weather-Jaipur, Rajasthan, India ; Tonight · 2% · 2% · 8 · Partly cloudy. Low 25°C. Winds light and variable. ; Wed 17 · 7% · 6% · 9 · Partly cloudy. Low 25°C.",
        "position": 3
      },
      {
        "link": "https://www.wunderground.com/forecast/in/jaipur",
        "title": "Jaipur, India 10-Day Weather Forecast",
        "snippet": "Jaipur, Rajasthan, India 10-Day Weather Forecaststar_ratehome ; Sep 21. New Moon ; Sep 29. Waxing Gibbous ; Oct 7. Full Moon ; Oct 13. Waning Half Last Qtr.",
        "position": 4
      },
      {
        "link": "https://www.bbc.com/weather/1269515",
        "title": "Jaipur - BBC Weather",
        "snippet": "A clear sky and light windsSunny and a gentle breezeSunny and a gentle breezeSunny and a gentle breezeSunny and a gentle breezeSunny and a gentle ...",
        "position": 5
      },
      {
        "link": "https://jaipurculture.com/what-to-wear-jaipur/pack-jaipur-month-season/",
        "title": "Essential packing guide for Jaipur by season and month",
        "snippet": "✨ Warm Clothing: Pack items such as jackets, sweaters, and scarves to keep warm during evenings. · Light, Breathable Clothing: Opt for cotton shirts, pants, ...",
        "position": 1
      },
      {
        "date": "Apr 10, 2025",
        "link": "https://awaywiththesteiners.com/what-to-wear-in-india-and-clothes-to-pack/",
        "title": "What To Wear In India As A Respectful Traveller What To Pack.",
        "snippet": "There isn't officially a dress code for what to wear in India as a tourist. However, modest clothing is appreciated. It's physically comfortable for travel.",
        "position": 2
      },
      {
        "link": "https://jaipurculture.com/what-to-wear-jaipur/jaipur-packing-guide/",
        "title": "What to pack in Jaipur: a month-by-month guide - Jaipur Culture",
        "snippet": "Opt for loose-fitting clothes such as flowy dresses, skirts, and shorts. Remember, even though it's hot, Jaipur's cultural etiquette recommends modest attire— ...",
        "position": 3,
        "sitelinks": [
          {
            "link": "https://jaipurculture.com/what-to-wear-jaipur/jaipur-packing-guide/#:~:text=Packing%20for%20Jaipur%3A%20Navigating%20January%20Weather",
            "title": "Packing For Jaipur..."
          },
          {
            "link": "https://jaipurculture.com/what-to-wear-jaipur/jaipur-packing-guide/#:~:text=Monsoon%20Months%20in%20Jaipur%3A%20Packing%20for%20a%20Rainy%20Visit",
            "title": "Monsoon Months In Jaipur..."
          },
          {
            "link": "https://jaipurculture.com/what-to-wear-jaipur/jaipur-packing-guide/#:~:text=Essential%20Packing%20List%20for%20December%20in%20Jaipur",
            "title": "Essential Packing List For..."
          }
        ],
        "attributes": {
          "Missing": "code | Show results with:code"
        }
      },
      {
        "date": "Jul 2, 2025",
        "link": "https://www.gadventures.com/blog/india-packing-list/",
        "title": "India packing list: adventure essentials",
        "snippet": "Go for loose pants or maxi skirts paired with short- or long-sleeved tops. Dressing modestly is key, so leave any revealing outfits at home. A ...",
        "position": 4,
        "sitelinks": [
          {
            "link": "https://www.gadventures.com/blog/india-packing-list/#:~:text=India%20packing%20list%3A%20adventure%20essentials",
            "title": "India Packing List..."
          },
          {
            "link": "https://www.gadventures.com/blog/india-packing-list/#:~:text=What%20to%20wear%20in%20India",
            "title": "What To Wear In India"
          },
          {
            "link": "https://www.gadventures.com/blog/india-packing-list/#:~:text=Indian%20cultural%20wear",
            "title": "Indian Cultural Wear"
          }
        ]
      },
      {
        "link": "https://hippie-inheels.com/how-to-dress-in-india/",
        "title": "How to Dress in India: the Ultimate Dos and Donts - Hippie In Heels",
        "snippet": "I' d like to give some advice as an Indian :) If you're in doubt as to what to wear, a loose kurta or long top and jeans is perfectly fine. You can wear a shawl ...",
        "position": 5,
        "sitelinks": [
          {
            "link": "https://hippie-inheels.com/how-to-dress-in-india/#:~:text=Wear%20your%20yoga%20pants%20out%20in%20public%20unless%20you%20are%20wearing%20a%20long%20shirt%20to%20cover%20your%20bum.",
            "title": "Wear Your Yoga Pants Out In..."
          },
          {
            "link": "https://hippie-inheels.com/how-to-dress-in-india/#:~:text=Wear%20jeans.",
            "title": "Wear Jeans"
          },
          {
            "link": "https://hippie-inheels.com/how-to-dress-in-india/#:~:text=Pin%20%60%60How%20to%20Dress%20in%20India%27%27%20for%20Later%21",
            "title": "Pin ``how To Dress In..."
          }
        ]
      },
      {
        "link": "https://travel.state.gov/en/international-travel/travel-advisories/india.html",
        "title": "India Travel Advisory | Travel.State.gov",
        "snippet": "Reconsider travel to this area due to terrorism and violence. Ethnic insurgent groups occasionally commit acts of violence in parts of the northeast. These ...",
        "position": 1
      },
      {
        "link": "https://in.usembassy.gov/u-s-citizen-services/security-and-travel-information/",
        "title": "Alerts and Messages - U.S. Embassy & Consulates in India",
        "snippet": "Travel Advisory: India – Level 2: Exercise Increased Caution (18 June, 2025) ... Visit the State Department's Office of American Citizens Services and Crisis ...",
        "position": 2
      },
      {
        "link": "https://www.topindianholidays.com/india-travel-advisory-safety-guide",
        "title": "India Travel Advisory 2025 – Is It Safe to Visit India Now?",
        "snippet": "No restrictions on visiting Delhi, Agra, Jaipur, Kerala, Goa, or other popular destinations; The advisory mentions Northeast India and Kashmir as areas where ...",
        "position": 3
      },
      {
        "link": "https://in.usembassy.gov/news-events/",
        "title": "News & Events - U.S. Embassy & Consulates in India",
        "snippet": "Travel Advisory: Level 2 - Exercise Increased Caution...Read More. Custom AQI ... Citizens in India. Event: U.S. citizens who reside or travel in India ...",
        "position": 4,
        "attributes": {
          "Missing": "safety | Show results with:safety"
        }
      },
      {
        "link": "https://www.eventbrite.com/d/india--jaipur/events/",
        "title": "Jaipur, India Events, Calendar & Tickets | Eventbrite",
        "snippet": "Events near Jaipur ; An Action-Packed Scavenger Hunt! - Jaipur Jamboree Journey. Tomorrow • 8:00 AM + 214 more. 4502, Malve Nagar, J.D.A. Market, Kanwar Nagar, ...",
        "position": 5
      }
    ]
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_168": [
    {
      "mode": "chat",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model to generate text based on the prompt.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "generate_text_system": "@prompts/generate-text-system.md",
    "agentic_reasoning_final_generate_text_user": "@prompts/agentic-reasoning-final_generate-text_user.md"
  },
  "modelConfigs": {
    "agentic_reasoning_final_generate_text": "@model-configs/agentic-reasoning-final_generate-text.ts"
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
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_168",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-text-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-reasoning-final_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/agentic-reasoning-final_generate-text.ts",
        "messages": "@model-configs/agentic-reasoning-final_generate-text.ts",
        "attachments": "@model-configs/agentic-reasoning-final_generate-text.ts",
        "generativeModelName": "@model-configs/agentic-reasoning-final_generate-text.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "retries": "0",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_168.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_168",
    "source": "triggerNode_1",
    "target": "LLMNode_168",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_168-responseNode_triggerNode_1",
    "source": "LLMNode_168",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
