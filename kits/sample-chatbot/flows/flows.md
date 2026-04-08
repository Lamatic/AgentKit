# Flows

A chat bundle that combines data source indexing with a knowledge chatbot interface.

## data-source (pick 1)

| Flow | Description |
|---|---|
| gdrive | Google Drive Indexation |
| gsheet | GSheet Indexation |
| onedrive | Onedrive |
| postgres | Postgres Indexation |
| s3 | S3 Indexation |
| scraping-indexation | Scraping Indexation |
| sharepoint | Sharepoint Indexation |
| crawling-indexation | Crawling Indexation |

## knowledge-chatbot (mandatory)
Contextual api to answer queries with knowledge from Content
**Nodes:** Chat Widget → RAG → Chat Response
**Requires:** data-source

