# AI E-Commerce Cart Recovery Agent

## Overview

AI E-Commerce Cart Recovery Agent is a Lamatic AgentKit kit designed to help e-commerce businesses recover abandoned shopping carts using retrieval-augmented generation (RAG).

The kit combines customer and cart context with business knowledge stored in a vector index. Relevant product information, store policies, approved offers, FAQs, and other recovery-related information can be indexed from supported data sources and retrieved by the Cart Recovery flow when generating responses.

The kit supports eight indexation flows:

- Google Drive
- Google Sheets
- Microsoft OneDrive
- Microsoft SharePoint
- Amazon S3
- Postgres
- Scraping Indexation
- Crawling Indexation

After the selected source has been indexed, the `cart-recovery` flow retrieves relevant information and uses it together with the customer's cart context to generate a personalized recovery response.

The agent is designed to:

- Analyze abandoned-cart context.
- Estimate customer purchase intent.
- Generate personalized cart-recovery messages.
- Retrieve relevant product, policy, and store information.
- Recommend discounts only when approved offer and eligibility information permits them.
- Avoid inventing coupons, promotions, or store policies.
- Suggest an appropriate next recovery action.

---

## Purpose

The purpose of this kit is to help e-commerce businesses convert abandoned shopping carts into completed purchases through AI-assisted cart recovery.

The system uses a two-stage architecture.

### Stage 1: Knowledge Indexation

One supported data source is selected and processed through its corresponding indexation flow.

The selected flow extracts source information, converts the content into retrieval-friendly chunks or records, generates embeddings, constructs metadata, and stores the resulting vectors in the configured vector index.

### Stage 2: Cart Recovery

The `cart-recovery` flow receives customer interaction and cart context through the Chat Widget.

The RAG node searches the configured vector database for relevant indexed business information and combines the retrieved context with the cart-recovery prompt to generate an appropriate response.

This architecture allows store-specific knowledge to remain separate from the runtime recovery logic while enabling the recovery agent to generate responses grounded in indexed information.

---

## Architecture

The kit follows the general pipeline:

Data Source
↓
Extract / Read Content
↓
Chunk or Normalize Content
↓
Generate Embeddings
↓
Create Metadata
↓
Vector Index
↓
Cart Recovery RAG
↓
Personalized Recovery Response

The indexation flows prepare information for retrieval.

The `cart-recovery` flow performs the runtime retrieve-and-generate stage.

---

## Flows

### Crawling Indexation

#### Trigger

The Crawling Indexation flow is invoked through an API request using the configured GraphQL trigger.

The flow accepts website crawl information and uses Firecrawl to discover and retrieve pages within the configured crawl scope.

#### What it does

1. `API Request` receives the crawl request.
2. `Firecrawl` retrieves website pages.
3. `Loop` processes discovered pages.
4. `Loop End` aggregates processing results.
5. `Variables` prepares source metadata.
6. `Chunking` divides page content into retrieval-friendly chunks.
7. `Extract Chunks` converts chunk objects into text for embedding.
8. `Vectorize` generates embeddings.
9. `Transform Metadata` constructs metadata for each chunk.
10. `Index` stores vectors and metadata in the vector database.
11. `API Response` returns the flow result.

#### When to use

Use this flow when relevant e-commerce knowledge is distributed across linked website pages and automated page discovery is required.

Examples include:

- Product documentation
- Store help centers
- Shipping information
- Return policies
- Product information pages
- Customer support documentation

#### Output

The flow populates or updates the vector index with website-derived content that can later be retrieved by `flows/cart-recovery.ts`.

#### Dependencies

- Firecrawl configuration
- Embedding model
- Vector database
- Lamatic project configuration

---

### GDrive

#### Trigger

The GDrive flow uses the Google Drive connector to retrieve documents from a configured Drive source.

#### What it does

1. `Google Drive` retrieves configured documents.
2. `Chunking` divides extracted document text.
3. `Extract Chunked Text` prepares text for vectorization.
4. `Get Vectors` generates embeddings.
5. `Transform Metadata` creates metadata associated with each chunk.
6. `Index to DB` stores vectors and metadata in the configured index.
7. Supporting nodes aggregate processing results.
8. `Variables` prepares source information used by the flow.

#### When to use

Use GDrive when product information, store policies, recovery documentation, FAQs, or other business information is maintained in Google Drive.

#### Dependencies

- Google Drive connector
- Embedding model
- Vector database
- Lamatic project configuration

---

### GSheet

#### Trigger

The GSheet flow retrieves structured information from Google Sheets using the configured Google Sheets connector.

#### What it does

1. `Google Sheets` retrieves spreadsheet data.
2. `Row Chunking` converts rows into retrieval-ready text chunks.
3. `Vectorise` generates embeddings for the resulting content.
4. `Transform Metadata` creates corresponding metadata.
5. `Index to DB` writes vectors and metadata to the configured index.
6. Supporting nodes aggregate processing results.
7. `Variables` prepares source information.

#### When to use

Use GSheet when e-commerce information is maintained in structured spreadsheet form.

Examples include:

- Product catalogs
- Product attributes
- FAQ tables
- Store information
- Approved promotion information
- Support data

#### Dependencies

- Google Sheets connector
- Embedding model
- Vector database
- Lamatic project configuration

---

### Onedrive

#### Trigger

The Onedrive flow retrieves files through the Microsoft OneDrive Business connector.

#### What it does

1. `Onedrive Business` retrieves configured files.
2. `Chunking` splits extracted text.
3. `Get Chunks` prepares the chunks.
4. `Vectorize` generates embeddings.
5. `Transform Metadata` constructs metadata.
6. `Index` stores vectors and metadata.
7. Supporting nodes aggregate results.
8. `Variables` prepares flow metadata.

#### When to use

Use this flow when business or product knowledge required by the cart-recovery agent is stored in Microsoft OneDrive.

#### Dependencies

- Microsoft OneDrive connection
- Embedding model
- Vector database
- Lamatic project configuration

---

### Postgres

#### Trigger

The Postgres flow reads structured records using the configured Postgres connector.

#### What it does

1. `Postgres` retrieves configured records.
2. `Row Chunking` converts records into retrieval-friendly text and splits oversized content when required.
3. `Vectorise` generates embeddings.
4. `Transform Metadata` creates metadata corresponding to the vectorized content.
5. `Index to DB` stores vectors and metadata in the configured vector index.
6. Supporting nodes aggregate processing results.
7. `Variables` prepares source information.

#### When to use

Use Postgres when cart-recovery knowledge exists in database records.

Examples include:

- Product information
- Catalog records
- Support knowledge
- Store information
- Approved offer information
- Structured policy records

#### Dependencies

- Postgres connection
- Embedding model
- Vector database
- Lamatic project configuration

---

### S3

#### Trigger

The S3 flow retrieves configured objects through the Amazon S3 connector.

#### What it does

1. `S3` retrieves configured objects.
2. Supporting nodes manage object processing.
3. `Extract from File` extracts content from supported files.
4. `Extract Text` obtains text suitable for processing.
5. `Chunking` divides text into retrieval-friendly chunks.
6. `Get Chunks` prepares chunk content.
7. `Vectorize` generates embeddings.
8. `Transform Metadata` creates metadata.
9. `Index` stores vectors and metadata.
10. `Variables` prepares source information.

#### When to use

Use S3 when business information is stored in an object-storage repository.

Examples include:

- Product documents
- Store documentation
- Policy files
- Catalog exports
- Support documents

#### Dependencies

- AWS S3 connection
- Supported file extraction configuration
- Embedding model
- Vector database
- Lamatic project configuration

---

### Scraping Indexation

#### Trigger

The Scraping Indexation flow accepts an explicit set of URLs through its API trigger.

Unlike crawling, scraping is intended for known pages that should be individually retrieved and indexed.

#### What it does

1. `API Request` receives the URL input.
2. `Firecrawl` retrieves content from the supplied pages.
3. `Loop` processes scraped results.
4. `Loop End` aggregates results.
5. `Variables` prepares source metadata.
6. `Chunking` splits page content.
7. `Extract Chunks` prepares chunk text.
8. `Vectorize` generates embeddings.
9. `Transform Metadata` creates metadata for each chunk.
10. `Index` stores vectors and metadata.
11. `API Response` returns the result.

#### When to use

Use Scraping Indexation when specific pages need to be indexed without automatically discovering additional linked pages.

Examples include:

- Selected product pages
- Store policy pages
- Promotion documentation
- Shipping pages
- FAQ pages

#### Output

The flow populates the vector index with scraped content that can later be retrieved by `flows/cart-recovery.ts`.

#### Dependencies

- Firecrawl connection
- Embedding model
- Vector database
- Lamatic project configuration

---

### Sharepoint

#### Trigger

The Sharepoint flow retrieves documents using the Microsoft SharePoint Business connector.

#### What it does

1. `Sharepoint Business` retrieves configured documents.
2. `Chunking` splits document text.
3. `Get Chunks` prepares the chunks.
4. `Vectorize` generates embeddings.
5. `Transform Metadata` creates metadata.
6. `Index` writes vectors and metadata to the configured vector index.
7. Supporting nodes aggregate processing results.
8. `Variables` prepares source information.

#### When to use

Use SharePoint when product, policy, support, or business knowledge is maintained in Microsoft SharePoint document libraries.

#### Dependencies

- Microsoft SharePoint connection
- Embedding model
- Vector database
- Lamatic project configuration

---

### Cart Recovery

#### Trigger

The Cart Recovery flow is invoked through the `Chat Widget` (`chatTriggerNode`).

It serves as the runtime conversational component of the kit.

The flow receives the customer message and the cart-recovery context exposed by the configured input/trigger contract.

#### What it does

1. `Chat Widget` (`chatTriggerNode`) receives the customer interaction.
2. `RAG` (`RAGNode`) converts the query into a retrieval request and searches the configured vector database.
3. Relevant indexed business information is retrieved.
4. The RAG node generates a response using:
   - `cart-recovery-system.md` for assistant behavior, grounding requirements, cart-recovery rules, and discount restrictions.
   - `cart-recovery-user.md` for the customer message and supported cart-recovery context.
5. `Chat Response` (`chatResponseNode`) returns the generated response to the user.

#### When to use

Use the Cart Recovery flow when a customer has abandoned a shopping cart or needs assistance deciding whether to complete a purchase.

The flow can use retrieved information such as:

- Product information
- Store policies
- Shipping information
- Return information
- Approved offers
- Relevant business documentation

The model must not invent promotions, coupons, or eligibility rules that are not provided through approved data.

#### Output

The Cart Recovery flow can produce:

- Personalized recovery message
- Purchase-intent assessment
- Discount suggestion when permitted by approved offer data
- Recommended next action

#### Dependencies

- Vector database populated by one of the supported indexation flows
- Embedding model configured for RAG
- Generative model configured for RAG
- `cart-recovery-system.md`
- `cart-recovery-user.md`
- Chat Widget trigger configuration

---

## Flow Interaction

The kit follows a two-stage pipeline.

### 1. Indexation

Exactly one supported data-source/indexation flow can be selected to populate the configured vector index.

The supported flows are:

- `gdrive`
- `gsheet`
- `onedrive`
- `sharepoint`
- `postgres`
- `s3`
- `scraping-indexation`
- `crawling-indexation`

These flows transform source content into text chunks or records, generate embeddings, create metadata, and write the resulting data into the vector index.

### 2. Cart Recovery

The `cart-recovery` flow queries the same vector index at runtime.

The RAG node combines:

- Customer interaction
- Cart context supplied by the flow
- Retrieved business knowledge
- Cart-recovery system instructions

to generate a grounded recovery response.

The separation between indexation and runtime recovery allows business knowledge to be updated independently from the conversational agent.

---

## Retrieval-Augmented Generation

The `cart-recovery` flow uses retrieval-augmented generation instead of relying only on the generative model's internal knowledge.

The runtime process is:

1. Receive customer and cart context.
2. Construct a retrieval query.
3. Generate an embedding for the query.
4. Search the configured vector database.
5. Retrieve relevant indexed content.
6. Provide retrieved context to the generative model.
7. Generate a cart-recovery response grounded in available information.
8. Return the response through the Chat Widget.

This allows the agent to use business-specific information without embedding that information directly into the prompt.

---

## Prompt Configuration

The kit contains two prompts for the Cart Recovery flow.

### `prompts/cart-recovery-system.md`

Defines the assistant's behavior and cart-recovery rules.

The system prompt should ensure that the agent:

- Helps recover abandoned carts.
- Uses available context when generating responses.
- Avoids unsupported claims.
- Avoids aggressive or manipulative messaging.
- Does not invent discounts or coupon codes.
- Uses only supplied and approved offer information when suggesting discounts.

### `prompts/cart-recovery-user.md`

Provides the customer query and supported cart/cart-recovery context to the RAG model.

The prompt should reference only information guaranteed by the configured flow input or trigger schema.

---

## Model Configuration

The Cart Recovery flow uses:

`model-configs/cart-recovery.ts`

This configuration controls runtime RAG settings such as:

- Retrieval limit
- Memory configuration
- Message configuration
- Certainty settings
- Embedding model
- Generative model

Model selection is exposed through the flow's private configuration inputs where applicable.

---

## Guardrails

### Grounded Responses

The agent should use retrieved business knowledge and supplied cart context when generating responses.

When required information is unavailable, the agent should avoid presenting unsupported information as fact.

### Discount Safety

The agent must not invent:

- Coupon codes
- Promotion values
- Discount percentages
- Customer eligibility
- Free-shipping offers
- Expiration dates

Discounts should only be suggested when approved offer information and eligibility constraints are supplied to the model.

### Customer Information

Only information required to perform the cart-recovery task should be provided to the model.

Unnecessary personal information should not be included in prompts or runtime logs.

### Security

Credentials, API keys, connection information, and secrets must remain in the appropriate Lamatic configuration or environment settings and must not be embedded directly in source files.

### Prompt Injection

Retrieved documents and customer messages should be treated as untrusted input.

Retrieved content should provide business context rather than override the system-level behavior of the Cart Recovery Agent.

---

## Integration Reference

| Integration | Purpose |
|---|---|
| Lamatic | Agent execution and orchestration |
| Google Drive | Index documents stored in Google Drive |
| Google Sheets | Index structured spreadsheet information |
| Microsoft OneDrive | Index OneDrive documents |
| Microsoft SharePoint | Index SharePoint documents |
| Amazon S3 | Index files stored in S3 |
| Postgres | Index structured database records |
| Firecrawl | Scrape or crawl website information |
| Embedding Model | Convert content and queries into vector representations |
| Vector Database | Store embeddings and provide semantic retrieval |
| Generative Model | Generate cart-recovery responses |
| Chat Widget | Provide the customer-facing conversational interface |

---

## Environment Setup

Runtime configuration should be supplied through the environment and Lamatic project configuration rather than committed credentials.

Common environment values include:

- `LAMATIC_API_URL`
- `LAMATIC_PROJECT_ID`
- `LAMATIC_API_KEY`

Connector credentials should be configured through the appropriate Lamatic integrations.

Depending on the selected data source, this can include:

- Google OAuth for Google Drive
- Google OAuth for Google Sheets
- Microsoft authentication for OneDrive
- Microsoft authentication for SharePoint
- AWS credentials for S3
- Postgres connection configuration
- Firecrawl configuration

Do not commit real credentials, API keys, access tokens, private database connection strings, or private resource URLs.

---

## Configuration

The kit configuration is defined in:

`lamatic.config.ts`

The configuration provides the available data-source options and the mandatory runtime flow.

The intended configuration sequence is:

1. Select exactly one data source.
2. Configure and run its indexation flow.
3. Configure the required models and vector database.
4. Run the mandatory `cart-recovery` flow.

The mandatory flow ID is:

`cart-recovery`

and corresponds to:

`flows/cart-recovery.ts`

---

## Quickstart

### 1. Configure Environment

Create a local `.env` file based on `.env.example`.

Supply the required Lamatic configuration values without committing secrets to the repository.

### 2. Select a Data Source

Choose one of:

- Google Drive
- Google Sheets
- OneDrive
- SharePoint
- Postgres
- S3
- Scraping Indexation
- Crawling Indexation

### 3. Configure the Connector

Configure credentials and source information for the selected integration through Lamatic.

### 4. Run Indexation

Run the selected indexation flow.

Verify that:

- Source content is retrieved.
- Content is chunked or normalized.
- Embeddings are generated.
- Metadata remains aligned with vectors.
- Records are written to the configured vector database.

### 5. Configure Cart Recovery

Configure the `cart-recovery` flow with:

- Vector database
- Embedding model
- Generative model
- Required cart-recovery inputs

### 6. Test the Agent

Send a cart-related customer message through the Chat Widget.

Example:

`I still have these products in my cart. Can you help me decide whether I should complete the order?`

The agent should retrieve relevant business information and produce an appropriate cart-recovery response.

### 7. Verify Discount Behavior

If no approved offer information is supplied, verify that the agent does not invent a coupon or discount.

If approved offer information is supplied, verify that recommendations remain within the supplied eligibility and discount constraints.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Recovery response is generic | Relevant information was not retrieved | Verify indexation and vector database contents |
| Agent cannot find product information | Product data has not been indexed | Run the appropriate data-source flow |
| Incorrect retrieval results | Chunking or metadata is poorly configured | Review chunking and metadata transformation |
| Missing response | RAG model or vector database configuration is incomplete | Verify Cart Recovery model and database inputs |
| Firecrawl flow fails | Firecrawl configuration or target URL is invalid | Verify integration configuration and URL |
| Drive or Sheets ingestion fails | Authentication or resource configuration is invalid | Verify connector access |
| OneDrive or SharePoint ingestion fails | Microsoft connector lacks required access | Verify authentication and permissions |
| S3 ingestion fails | Object access or extraction fails | Verify AWS permissions and supported content |
| Postgres returns no content | Database/query configuration is incorrect | Verify connection and source configuration |
| Agent invents discounts | Prompt or approved-offer constraints are incomplete | Verify system prompt and offer-data contract |

---

## Files

### Flow Files

- `flows/cart-recovery.ts`
- `flows/crawling-indexation.ts`
- `flows/gdrive.ts`
- `flows/gsheet.ts`
- `flows/onedrive.ts`
- `flows/postgres.ts`
- `flows/s3.ts`
- `flows/scraping-indexation.ts`
- `flows/sharepoint.ts`

### Prompt Files

- `prompts/cart-recovery-system.md`
- `prompts/cart-recovery-user.md`

### Model Configuration

- `model-configs/cart-recovery.ts`

### Constitution

- `constitutions/default.md`

### Chat Trigger

- `triggers/widgets/cart-recovery-chat-widget.ts`

### Scripts

Supporting scripts are located under:

`scripts/`

These scripts perform operations including:

- Text extraction
- Row chunking
- Chunk extraction
- Metadata transformation
- Source-specific preprocessing

---

## Expected Cart Recovery Behavior

A successful Cart Recovery interaction should follow this pattern:

Customer message
↓
Cart Recovery flow
↓
RAG retrieval
↓
Relevant indexed product/store knowledge
↓
Cart context + retrieved context
↓
Generative model
↓
Personalized recovery response

The generated response should focus on helping the customer make an informed decision and complete the purchase when appropriate.

The agent should not pressure the customer or fabricate information to increase conversion.

---

## Expected Outputs

Depending on the configured prompt and runtime contract, the Cart Recovery Agent is intended to provide information such as:

- Recovery message
- Purchase-intent assessment
- Suggested discount when permitted
- Recommended next action

Any discount-related output must be based on approved offer information supplied to the model.

---

## Development Guidelines

When modifying this kit:

- Keep flow IDs consistent with filenames.
- Keep `cart-recovery` consistent across configuration and documentation.
- Keep prompt references consistent with actual prompt filenames.
- Do not commit real credentials.
- Do not commit private resource URLs.
- Do not commit temporary webhook endpoints.
- Keep vectors and metadata aligned during indexation.
- Use stable per-chunk identifiers when multiple chunks originate from one source.
- Remove debugging statements that could log customer or source content.
- Validate changes before committing.

---

## Repository

Canonical repository location:

`https://github.com/Lamatic/AgentKit/tree/main/kits/ai-ecommerce-cart-recovery-agent`

Kit directory:

`kits/ai-ecommerce-cart-recovery-agent`

Runtime flow:

`flows/cart-recovery.ts`

---

## Notes

- This kit contains multiple indexation flows and one Cart Recovery runtime flow.
- Exactly one data-source option should be selected for the configured indexation path.
- The runtime flow ID is `cart-recovery`.
- The Cart Recovery flow uses RAG to retrieve indexed business information.
- Product, policy, store, and approved offer information can be indexed from supported sources.
- Discounts must only be generated from supplied approved offer information and eligibility constraints.
- Secrets and private credentials must not be committed to the repository.
- The canonical repository path is `kits/ai-ecommerce-cart-recovery-agent`.
