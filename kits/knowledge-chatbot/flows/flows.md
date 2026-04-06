# Flows

## Data Source Indexation (pick one)

| Flow | Description |
|---|---|
| gdrive | Index documents from Google Drive |
| gsheet | Index data from Google Sheets |
| onedrive | Index documents from OneDrive |
| postgres | Index records from PostgreSQL |
| s3 | Index files from AWS S3 |
| scraping-indexation | Index by web scraping |
| sharepoint | Index from SharePoint |
| crawling-indexation | Index by web crawling |

## knowledge-chatbot (mandatory)

RAG chatbot that queries the indexed knowledge base.
Prerequisite: one data source indexation flow must run first.
