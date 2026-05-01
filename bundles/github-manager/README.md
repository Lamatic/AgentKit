# 🚀 Lamatic.ai GitHub Automation Bundle

This repository contains the **Lamatic.ai GitHub Automation Bundle**, a workflow system designed to bridge the gap between static documentation and active repository management.

It enables:
- 📚 Continuous documentation ingestion for LLM context
- ⚡ Instant GitHub issue triaging and labeling

---

## 🧠 System Overview

The system operates through two primary workflows:

### 1. Documentation Scraper & Vectorizer (Contextual Ingestion)

This pipeline converts unstructured documentation into machine-readable knowledge.

#### 🔹 Extraction
- Targets specified documentation URLs
- Filters out non-essential HTML (e.g., navbars, footers)
- Extracts only core technical content

#### 🔹 Chunking & Processing
- Splits large documents into smaller semantic chunks
- Improves retrieval accuracy and prevents context loss

#### 🔹 Vectorization
- Uses embedding models (e.g., `text-embedding-3-small`)
- Converts text chunks into high-dimensional vectors

#### 🔹 Ingestion
- Stores vectors in a Vector Database:
  - Lamatic Managed Storage
  - Pinecone
  - Milvus
- Enables semantic search for contextual understanding

---

### 2. GitHub Issue Classifier (Automated Triage)

Automates real-time issue classification and labeling.

#### 🔹 Webhook Trigger
- Fires on every new GitHub issue (`new_issue`)
- Captures title, body, and metadata

#### 🔹 Contextual Analysis
- Sends issue content to an LLM
- Optionally retrieves relevant documentation context

#### 🔹 Labeling Logic
- Assigns labels based on intent:
  - `bug`
  - `feature-request`
  - `enhancement`
  - `wontfix`

#### 🔹 Action
- Applies labels via GitHub API using a POST request

---

## ⚙️ Setup & Installation

### ✅ Prerequisites

- Lamatic.ai account
- GitHub Personal Access Token (PAT) with `repo` scope
- Documentation URL to ingest

---

### 🔧 Configuration Steps

#### 1. Deploy the Scraper

- Set `DOCS_URL` in the Scraper Node
- Configure Vector Database destination
- Run initial crawl to populate vector storage

---

#### 2. Configure the Classifier

- Add `GITHUB_TOKEN` as a secret
- Define classification rules in LLM prompt:

---

#### 3. Connect GitHub Webhook

In your GitHub repository:

- Go to: `Settings > Webhooks > Add Webhook`
- **Payload URL**: Provided by Lamatic Trigger Node
- **Content Type**: `application/json`
- **Events**: Select `Issues`

---

## 🚀 Usage

### 🔄 Manual Sync

To refresh the LLM knowledge base:

1. Trigger the Scraper Workflow from Lamatic Dashboard
2. System will:
 - Re-scrape documentation
 - Re-vectorize content
 - Upsert into Vector DB

---

### 🤖 Automated Labeling

Once configured, the system runs automatically:

**Example Flow:**

1. User creates an issue:
2. Webhook triggers Lamatic
3. Classifier analyzes issue
4. Labels applied:
- `bug`
- `high-priority`

---

## 🛠 Troubleshooting

### ❗ Empty Vectors
- Verify scraper CSS selectors target main content correctly

### ⚠️ API Limits
- Ensure GitHub PAT is not rate-limited for high-volume repos

### 🤖 Misclassification
- Adjust LLM temperature
- Improve prompt with better examples

---

## 💡 Optional Enhancement

Want to extend this setup?

You can define a custom **JSON schema** for GitHub API labeling requests to improve consistency and validation.

---

## 📌 Summary

This bundle enables a **self-updating, intelligent GitHub workflow** by combining:

- Documentation-aware LLMs
- Semantic search via vector databases
- Real-time issue classification

---
