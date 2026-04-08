# Flows

## firecrawl-webhook
This flow fetches pages from a crawler API, extracts only the page contents, and prepares to index them in a vector database, effectively indexing all the pages.
**Nodes:** Webhook → Condition → Code → Vectorize → Index

