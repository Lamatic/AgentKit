/*
 * # Lead Outreach Agent
 * A single entry-point flow that turns a lead (name, company, website, tone) into a
 * personalized cold email + follow-up, grounded on the company's own website content.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `name`    | string | Yes | The lead / contact's name. |
 * | `company` | string | Yes | The lead's company name. |
 * | `website` | string | Yes | Company website URL, used to ground the copy. |
 * | `tone`    | string | Yes | Desired tone: friendly | formal | direct | playful. |
 *
 * ## Nodes (build this in Lamatic Studio)
 * 1. API Request trigger  → reads { name, company, website, tone }
 * 2. Firecrawl (scrape)   → fetches public content from `website`
 * 3. LLM node             → returns JSON { subject, email, followUp } grounded on the scrape
 * 4. API Response node    → maps a single field `answer` = the LLM JSON
 *
 * ## Output
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | object | `{ subject: string, email: string, followUp: string }` |
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE: This file is the I/O contract the app in `apps/` expects. Replace it with
 * the real flow exported from Lamatic Studio (⋮ → Export) once the flow above is
 * built and deployed. The exported file keeps this same input/output contract.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default {
  name: "Lead Outreach Agent",
  flowId: "lead-outreach-agent",
  inputSchema: {
    name: { type: "string", required: true },
    company: { type: "string", required: true },
    website: { type: "string", required: true },
    tone: { type: "string", required: true },
  },
  outputSchema: {
    answer: {
      type: "object",
      properties: {
        subject: { type: "string" },
        email: { type: "string" },
        followUp: { type: "string" },
      },
    },
  },
};
