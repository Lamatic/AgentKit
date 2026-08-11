# News Digest — Agent Identity

## Purpose

This agent is a scheduled news curator. It has no chat interface and takes no direct user input at runtime — it wakes up once a day, gathers news from a fixed set of sources, decides what's worth reading, and emails a digest. Its job is to replace "checking five sites for news" with "reading one email."

## What it is not

- Not a chat assistant. There's no conversational surface; the only output is the daily email.
- Not a general-purpose search or Q&A tool. It only reports on the sources and topic configured in the Variable Node.
- Not multi-user. It's built for a single recipient. See "Scope decisions" below for why.

## Flow

**`news-digest`** — the only flow in this template.

1. **Cron Trigger** — fires daily at 8:00 AM UTC
2. **Variable Node** — holds the two pieces of runtime config: `topic` and `top_n`. This is the flow's only "settings panel."
3. **Firecrawl (Sync Batch Scrape)** — scrapes all configured source URLs in a single batched call
4. **Generate Text (extraction/dedup)** — reads raw scraped markdown, filters to genuine articles matching `topic`, strips page noise (nav, ads, sponsored content, cookie banners, etc.), and removes duplicate coverage of the same story across sources. Outputs a clean JSON array.
5. **Generate Text (ranking/summarization)** — takes the JSON array, selects and ranks the top `top_n` stories by significance, and writes a 2-sentence summary for each. Outputs structured JSON (title, summary, url) — no HTML at this stage.
6. **Code Node (sanitization)** — parses the ranked JSON and deterministically builds the final HTML digest: every title and summary is HTML-escaped, and every URL is checked against an `http(s)://` allowlist before being inserted as a link. This step exists because article data originates from scraped, untrusted web content, and an LLM instructed to "output HTML" can't be relied on to consistently escape or validate that content — deterministic code can.
7. **Gmail** — sends the sanitized HTML digest to the configured recipient.

## Why two Generate Text nodes instead of one

Extraction and formatting are different tasks with different failure modes. Extraction needs to reason about what counts as a genuine article versus page clutter, and about which stories are duplicates. Formatting needs to produce clean, consistent structure for an email client. Asking one prompt to do both tends to shortchange whichever task the model attends to less. Splitting them keeps each prompt focused and makes failures easier to isolate — if the digest looks wrong, it's straightforward to tell whether the problem is in what got selected or in how it was written up.

## Scope decisions

**Single-user, not multi-tenant, by design.** This agent is built to deliver to one recipient. A single Variable Node holding a static topic string keeps the flow simple, has no failure mode around cross-user data integrity, and is easy for a reviewer to verify end-to-end. If multi-user support is ever needed, the natural extension point is a per-user config table read at the start of the flow instead of a static Variable Node, with steps 3–6 wrapped in a loop over rows — but that's outside the scope of this submission.

## Guardrails

See `constitutions/default.md` for the base identity and safety rules this agent inherits (no fabricated information, no PII logging beyond what's explicitly needed, professional tone). In addition, specific to this flow:

- The extraction step is instructed to return only genuine articles and explicitly excludes ad/navigation/sponsored content — this is both a content-quality measure and a basic safety measure against summarizing or amplifying promotional content as if it were news.
- The ranking step is explicitly instructed not to invent facts and to preserve original source URLs, so every claim in the digest is traceable back to its source.
- The Code Node sanitization step (see Flow, step 6) is a deliberate guardrail against untrusted scraped content reaching the outbound email unescaped. HTML construction is intentionally kept out of the LLM's hands — the model returns data, not markup, and the Code Node is what turns that data into HTML, consistently escaping and validating it every run.
