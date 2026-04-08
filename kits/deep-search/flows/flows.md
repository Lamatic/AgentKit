# Flows

Customized agentic deep research across both internal and external data sources.

## agentic-reasoning-data-source
This flow searches the indexed data source and returns the most relevant references
**Nodes:** API Request → Generate JSON → Loop → Vector Search → Loop End → Collate Results → API Response

## agentic-reasoning-final
This flow generates the final answer based on previous two steps
**Nodes:** API Request → Generate Text → API Response

## agentic-reasoning-generate-steps
This flow generates steps / actions to be performed as part of Agentic Reasoning
**Nodes:** API Request → Generate Text → API Response

## agentic-reasoning-search-web
This flow searches the internet as part of Agentic Reasoning
**Nodes:** API Request → Generate JSON → Loop → Loop End → Web Search → Collate Research → API Response

## crawling-indexation
Crawling Indexation
**Nodes:** API Request → Firecrawl → Loop → Loop End → Variables → Chunking → Extract Chunks → Vectorize → Transform Metadata → Index → API Response

## gdrive
Google Drive Indexation
**Nodes:** Google Drive → chunking → Extract Chunked Text → Get Vectors → Transform Metadata → Index to DB → Variables

## gsheet
GSheet Indexation
**Nodes:** Google Sheets → Vectorise → Transform Metadata → Index to DB → Row Chunking → Variables

## onedrive
Onedrive
**Nodes:** Onedrive Business → Chunking → Get Chunks → Vectorize → Transform Metadata → Index → Variables

## postgres
Postgres Indexation
**Nodes:** Postgres → Vectorise → Transform Metadata → Index to DB → Row Chunking → Variables

## s3
S3 Indexation
**Nodes:** S3 → Extract from File → Extract Text → Chunking → Get Chunks → Vectorize → Transform Metadata → Index → Variables

## scraping-indexation
Scraping Indexation
**Nodes:** API Request → Firecrawl → Loop → Loop End → Variables → Chunking → Extract Chunks → Vectorize → Transform Metadata → Index → API Response

## sharepoint
Sharepoint Indexation
**Nodes:** Sharepoint Business → Chunking → Get Chunks → Vectorize → Transform Metadata → Index → Variables

