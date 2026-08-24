Competitor name: {{triggerNode_1.output.competitorName}}
Source URL: {{triggerNode_1.output.url}}

Scraped page content (Markdown):
"""
{{firecrawlNode_658.output.markdown}}
"""

Return JSON in exactly this schema:

{
"competitorName": "string",
"url": "string",
"currency": "string",
"plans": [
{
"name": "string",
"price": "string",
"billingPeriod": "string",
"features": ["string"]
}
],
"notableFeatures": ["string"],
"freeTrial": "string",
"extractionNotes": "string"
}
