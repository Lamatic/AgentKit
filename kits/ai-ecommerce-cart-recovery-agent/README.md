# AI E-Commerce Cart Recovery Agent

## About This Kit

AI E-Commerce Cart Recovery Agent is a Lamatic AgentKit kit designed to help e-commerce businesses recover abandoned shopping carts using Retrieval-Augmented Generation (RAG).

The kit combines customer and cart information with indexed business knowledge to generate personalized recovery responses. Business content such as product information, FAQs, shipping policies, return policies, and approved promotional offers can be indexed into a vector database and retrieved during response generation.

The runtime flow analyzes the available customer and cart context, estimates purchase intent, generates an appropriate recovery response, and recommends approved offers only when eligibility requirements are satisfied.

---

## Workflow

```
Customer Cart / Chat Input
        ↓
Cart Recovery RAG Flow
        ↓
Retrieve Relevant Business Knowledge
        ↓
Generate Personalized Recovery Response
```

---

## Supported Data Sources

This kit includes eight indexation flows:

1. Google Drive
2. Google Sheets
3. Microsoft OneDrive
4. PostgreSQL
5. Amazon S3
6. Microsoft SharePoint
7. Web Crawling
8. Web Scraping

These flows extract business knowledge, split content into chunks, generate vector embeddings, transform metadata, and index everything into the configured vector database.

---

## Cart Recovery Flow

Main runtime flow:

`flows/cart-recovery.ts`

This flow:

- Receives customer chat and cart context
- Retrieves relevant indexed business knowledge using RAG
- Generates personalized cart recovery responses
- Returns grounded responses through the chat widget

The flow uses:

- `prompts/cart-recovery-system.md` — Defines system behavior and response rules.
- `prompts/cart-recovery-user.md` — Supplies customer and cart context.
- `model-configs/cart-recovery.ts` — Contains retrieval and model configuration.
- `triggers/widgets/cart-recovery-chat-widget.ts` — Configures the chat widget trigger.
- `constitutions/default.md` — Provides shared behavioral instructions.

---

## Project Structure

```
kits/
└── ai-ecommerce-cart-recovery-agent/
    ├── flows/
    ├── scripts/
    ├── prompts/
    ├── model-configs/
    ├── constitutions/
    ├── triggers/
    ├── README.md
    ├── agent.md
    ├── lamatic.config.ts
    └── .env.example
```

---

## Setup

1. Import the kit into your Lamatic workspace.
2. Select one of the supported indexation flows.
3. Configure the required source credentials.
4. Configure the destination vector database.
5. Run an indexation flow to populate the vector store.
6. Configure the embedding and generative models.
7. Configure the Cart Recovery Chat Widget.
8. Test the complete retrieval workflow before deployment.

---

## Usage

1. Index business knowledge using one of the supported data-source flows.
2. Configure the vector database.
3. Configure the embedding and chat models.
4. Deploy the `cart-recovery` flow.
5. Users can now interact with the chat widget to receive AI-powered cart recovery assistance.

---

## Example Use Case

A customer abandons a shopping cart before completing checkout.

The AI Cart Recovery Agent can:

- Analyze available customer and cart context.
- Retrieve relevant product and business information.
- Estimate purchase intent.
- Generate a personalized recovery message.
- Recommend approved promotional offers when available.
- Encourage checkout using non-aggressive messaging.

The agent never invents coupon codes, discounts, pricing, or promotional eligibility.

---

## Security & Privacy

- Never commit API keys or secrets.
- Keep `.env.example` limited to placeholder values.
- Store credentials using Lamatic integrations.
- Avoid exposing customer information unnecessarily.
- Recommend discounts only when approved offer information is supplied.
- Never generate fictitious coupons or promotions.

---

## Development Checklist

Before submitting changes:

- Verify the kit structure follows AgentKit guidelines.
- Ensure all referenced files exist.
- Remove test webhooks and debug logging.
- Verify metadata and vectors remain aligned.
- Confirm documentation matches the implementation.

---

## Contributing

1. Create a feature branch.
2. Make changes only within this kit.
3. Validate locally.
4. Commit and push your changes.
5. Update the existing Pull Request.
6. Resolve all GitHub Actions and CodeRabbit comments before requesting review.

---

## Support

For assistance:

- Review the relevant flow configuration.
- Check Lamatic documentation.
- Review `agent.md` for architecture details.

---

## Tags

AI, E-Commerce, Cart Recovery, RAG, AgentKit, Automation

---

*AI E-Commerce Cart Recovery Agent for Lamatic AgentKit*