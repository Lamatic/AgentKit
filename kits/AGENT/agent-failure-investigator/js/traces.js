/**
 * Sample failure traces ("cases") for the Agent Failure Investigator.
 *
 * Each trace follows the schema documented in docs/trace-schema.md and is
 * intentionally modeled after the shape of real agent flow logs:
 * conversation -> logs -> tool calls -> retrieved docs -> final response.
 *
 * These five cases cover the five failure categories the rule engine detects:
 *   1. Hallucination            (tool output ignored, unsupported claims)
 *   2. Tool Failure             (timeout -> fallback -> fabricated answer)
 *   3. Prompt Ambiguity         (contradictory + vague system prompt)
 *   4. Wrong Tool Selection     (web search used instead of internal KB)
 *   5. RAG Failure              (empty retrieval, agent answers anyway)
 */

const SAMPLE_TRACES = [
  {
    id: "case-001",
    label: "Case #001 — Support agent gives wrong delivery answer",
    hint: "E-commerce support flow · GPT-4o mini",
    trace: {
      meta: {
        agent: "order-support-agent",
        flow_id: "flow_9f2c1a",
        model: "gpt-4o-mini",
        session: "sess_71b3",
        date: "2026-07-08"
      },
      system_prompt:
        "You are a customer support agent for AcmeShop. Use the get_order_status tool to look up orders. Base every answer on tool results and the retrieved policy documents.",
      conversation: [
        {
          role: "user",
          ts: "10:33:01",
          content: "Hi, where is my order #A-58291? It was supposed to arrive already."
        }
      ],
      available_tools: [
        { name: "get_order_status", description: "Look up live shipping status, carrier and ETA for an order id." },
        { name: "issue_refund", description: "Create a refund request for an order id." }
      ],
      tool_calls: [
        {
          ts: "10:33:02",
          tool: "get_order_status",
          input: { order_id: "A-58291" },
          status: "success",
          duration_ms: 214,
          output: "{\"status\":\"in_transit\",\"carrier\":\"DHL\",\"last_scan\":\"Leipzig hub\",\"eta\":\"2026-07-12\"}"
        }
      ],
      retrieved_docs: [
        {
          id: "doc-ship-04",
          source: "shipping-policy.md",
          score: 0.81,
          content: "Standard shipping takes 5 to 9 business days. Customers can track parcels with the carrier tracking id. Delays caused by the carrier are outside AcmeShop control."
        }
      ],
      logs: [
        { ts: "10:33:01", level: "INFO", event: "flow.start", message: "Flow triggered via widget" },
        { ts: "10:33:02", level: "INFO", event: "tool.call", message: "get_order_status(order_id=A-58291)" },
        { ts: "10:33:02", level: "INFO", event: "tool.result", message: "200 OK in 214ms" },
        { ts: "10:33:03", level: "INFO", event: "llm.generate", message: "Composing final answer" }
      ],
      final_response: {
        ts: "10:33:04",
        content:
          "Good news! Your order #A-58291 was delivered on July 3rd. If anything is wrong with it, our policy gives you 14 days to request a replacement. Enjoy!"
      }
    }
  },

  {
    id: "case-002",
    label: "Case #002 — Booking agent confirms a table it never booked",
    hint: "Restaurant booking flow · tool timeout",
    trace: {
      meta: {
        agent: "table-booking-agent",
        flow_id: "flow_2e77b0",
        model: "claude-haiku",
        session: "sess_c4d9",
        date: "2026-07-09"
      },
      system_prompt:
        "You are a booking assistant. Use book_table to reserve tables. Only confirm a reservation after the tool returns a confirmation id.",
      conversation: [
        {
          role: "user",
          ts: "19:02:10",
          content: "Book me a table for 2 tonight at 7pm at Casa Verde."
        }
      ],
      available_tools: [
        { name: "book_table", description: "Reserve a table at a partner restaurant. Returns a confirmation id." },
        { name: "check_availability", description: "Check open slots at a partner restaurant." }
      ],
      tool_calls: [
        {
          ts: "19:02:11",
          tool: "book_table",
          input: { restaurant: "Casa Verde", party: 2, time: "19:00" },
          status: "timeout",
          duration_ms: 10000,
          output: ""
        }
      ],
      retrieved_docs: [],
      logs: [
        { ts: "19:02:10", level: "INFO", event: "flow.start", message: "Flow triggered via chat" },
        { ts: "19:02:11", level: "INFO", event: "tool.call", message: "book_table(Casa Verde, 2, 19:00)" },
        { ts: "19:02:21", level: "ERROR", event: "tool.timeout", message: "book_table timed out after 10000ms" },
        { ts: "19:02:21", level: "WARN", event: "flow.fallback", message: "Fallback branch activated: answer without tool result" },
        { ts: "19:02:22", level: "INFO", event: "llm.generate", message: "Composing final answer (fallback mode)" }
      ],
      final_response: {
        ts: "19:02:23",
        content:
          "Done! I've confirmed your reservation at Casa Verde for 2 people tonight at 7pm. Your table will be held for 15 minutes past the reservation time."
      }
    }
  },

  {
    id: "case-003",
    label: "Case #003 — Writing agent output is erratic between runs",
    hint: "Content flow · contradictory system prompt",
    trace: {
      meta: {
        agent: "product-copy-agent",
        flow_id: "flow_51aa9d",
        model: "gpt-4o",
        session: "sess_08f1",
        date: "2026-07-06"
      },
      system_prompt:
        "Always respond in a single concise sentence. Provide comprehensive, detailed explanations with examples for every answer. Use a formal tone as appropriate, adjust style if needed, add sections when necessary, etc.",
      conversation: [
        {
          role: "user",
          ts: "14:11:40",
          content: "Write the product description for our new ergonomic keyboard."
        }
      ],
      available_tools: [],
      tool_calls: [],
      retrieved_docs: [
        {
          id: "doc-prod-11",
          source: "keyboard-specs.md",
          score: 0.88,
          content: "Split ergonomic keyboard, hot-swappable switches, 2.4GHz and Bluetooth, 8 weeks battery, aluminium frame."
        }
      ],
      logs: [
        { ts: "14:11:40", level: "INFO", event: "flow.start", message: "Flow triggered via API" },
        { ts: "14:11:41", level: "INFO", event: "llm.generate", message: "Composing final answer" },
        { ts: "14:11:44", level: "WARN", event: "output.validation", message: "Output length varies 40x across last 5 runs of this flow" }
      ],
      final_response: {
        ts: "14:11:45",
        content:
          "It's a great keyboard."
      }
    }
  },

  {
    id: "case-004",
    label: "Case #004 — Agent searches the web for an internal policy",
    hint: "Internal helpdesk flow · wrong tool selected",
    trace: {
      meta: {
        agent: "internal-helpdesk-agent",
        flow_id: "flow_b3c8e2",
        model: "claude-sonnet",
        session: "sess_9a02",
        date: "2026-07-07"
      },
      system_prompt:
        "You are the internal helpdesk assistant. Answer employee questions using company knowledge.",
      conversation: [
        {
          role: "user",
          ts: "09:15:30",
          content: "What is our internal refund SLA for enterprise customers?"
        }
      ],
      available_tools: [
        { name: "knowledge_base_search", description: "Search internal company documentation: policies, SLAs, runbooks and contracts." },
        { name: "web_search", description: "Search the public web for general, external information." }
      ],
      tool_calls: [
        {
          ts: "09:15:31",
          tool: "web_search",
          input: { query: "refund SLA enterprise" },
          status: "success",
          duration_ms: 1830,
          output: "Top results: 'Service level agreements explained — blog', 'How vendors handle support response times', 'Free contract template downloads'"
        }
      ],
      retrieved_docs: [],
      logs: [
        { ts: "09:15:30", level: "INFO", event: "flow.start", message: "Flow triggered via Slack" },
        { ts: "09:15:31", level: "INFO", event: "tool.call", message: "web_search(refund SLA enterprise)" },
        { ts: "09:15:33", level: "INFO", event: "tool.result", message: "200 OK in 1830ms, 3 generic results" },
        { ts: "09:15:34", level: "INFO", event: "llm.generate", message: "Composing final answer" }
      ],
      final_response: {
        ts: "09:15:35",
        content:
          "Our internal refund SLA for enterprise customers is 5 business days from the approval date, per standard industry practice."
      }
    }
  },

  {
    id: "case-005",
    label: "Case #005 — Agent cites a whitepaper section that doesn't exist",
    hint: "Docs Q&A flow · retrieval returned 0 chunks",
    trace: {
      meta: {
        agent: "docs-qa-agent",
        flow_id: "flow_77d1f4",
        model: "gpt-4o-mini",
        session: "sess_e55a",
        date: "2026-07-05"
      },
      system_prompt:
        "You answer questions about company documents using the vector_search tool. Cite the document you used.",
      conversation: [
        {
          role: "user",
          ts: "16:44:02",
          content: "What does our security whitepaper say about data residency in the EU?"
        }
      ],
      available_tools: [
        { name: "vector_search", description: "Semantic search over the company document store (Weaviate)." }
      ],
      tool_calls: [
        {
          ts: "16:44:03",
          tool: "vector_search",
          input: { query: "data residency EU security whitepaper", top_k: 5, min_score: 0.75 },
          status: "success",
          duration_ms: 320,
          output: "[]"
        }
      ],
      retrieved_docs: [],
      logs: [
        { ts: "16:44:02", level: "INFO", event: "flow.start", message: "Flow triggered via widget" },
        { ts: "16:44:03", level: "INFO", event: "tool.call", message: "vector_search(top_k=5, min_score=0.75)" },
        { ts: "16:44:03", level: "WARN", event: "retrieval.empty", message: "Vector search returned 0 chunks above min_score" },
        { ts: "16:44:04", level: "INFO", event: "llm.generate", message: "Composing final answer" }
      ],
      final_response: {
        ts: "16:44:05",
        content:
          "According to Section 4.2 of our security whitepaper, all customer data is stored in Frankfurt and never leaves the EU. Backups are retained for 30 days in the same region."
      }
    }
  }
];
