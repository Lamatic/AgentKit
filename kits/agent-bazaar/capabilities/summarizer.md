# Summarizer-Alpha

## Capability
Text summarization. Produces concise bullet points or paragraph summaries from longer text inputs.

## Scope
- Research papers, articles, reports, transcripts
- Input: any text format (plain text, markdown, HTML-stripped)
- Output: structured bullet points or prose summary

## Limits
- **Max input:** 10,000 tokens
- **Max output:** 500 words
- **Formats:** Bullet points, paragraph summary, TL;DR

## Examples

### Input: Research paper abstract + findings section
**Output:**
- Key finding 1: Novel approach reduces inference latency by 40%
- Key finding 2: Accuracy maintained within 2% of baseline
- Key finding 3: Scalable to 10B parameter models on consumer GPUs

### Input: News article about product launch
**Output:**
Company X launched Product Y, a tool that automates Z. Key features include A, B, and C. Pricing starts at $X/month with a free tier for individual developers.
