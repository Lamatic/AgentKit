# AI E-Commerce Cart Recovery Agent

## About This Kit

AI E-Commerce Cart Recovery Agent is a Lamatic AgentKit kit designed to help e-commerce businesses recover abandoned shopping carts using AI and retrieval-augmented generation (RAG).

The agent combines customer and cart context with indexed business knowledge to generate relevant and personalized cart-recovery responses. Business information such as product details, store policies, FAQs, and approved promotional offers can be indexed into a vector database and retrieved when generating a response.

The cart-recovery flow can analyze the available customer and cart context, estimate purchase intent, generate an appropriate recovery message, and recommend an approved offer when the supplied eligibility information allows it.

## Workflow

Customer Cart / Chat Input
â†“
Cart Recovery RAG Flow
â†“
Retrieve Relevant Business Knowledge
â†“
Generate Personalized Recovery Response

## Supported Data Sources

The kit includes eight source-specific indexation flows:

1. Google Drive
2. Google Sheets
3. Microsoft OneDrive
4. PostgreSQL
5. Amazon S3
6. SharePoint
7. Web Crawling
8. Web Scraping

These flows prepare content for retrieval by extracting source data, transforming or chunking it where required, generating vector embeddings, and indexing the resulting content and metadata into the configured vector database.

## Cart Recovery Flow

The main runtime flow is:

`flows/cart-recovery.ts`

It receives the cart-recovery request, retrieves relevant indexed knowledge using the configured RAG node, and generates the response using the cart-recovery prompts.

The flow uses:

- `prompts/cart-recovery-system.md` â€” defines the agent's cart-recovery behavior and response rules.
- `prompts/cart-recovery-user.md` â€” supplies the user and cart context required for the recovery request.
- `model-configs/cart-recovery.ts` â€” contains the RAG model and retrieval configuration.
- `triggers/widgets/cart-recovery-chat-widget.ts` â€” configures the chat widget trigger.
- `constitutions/default.md` â€” contains shared behavioral instructions for the kit.

## Project Structure

The kit contains:

- `flows/` â€” cart recovery and source-specific indexation flows.
- `scripts/` â€” extraction, chunking, and metadata transformation scripts used by the indexation flows.
- `prompts/` â€” system and user prompts for cart recovery.
- `model-configs/` â€” model and retrieval configuration.
- `triggers/widgets/` â€” chat widget configuration.
- `constitutions/` â€” shared agent instructions.
- `lamatic.config.ts` â€” kit configuration and flow selection metadata.
- `agent.md` â€” detailed architecture and usage documentation.
- `.env.example` â€” placeholder environment configuration.

## Setup

1. Import or configure the kit in your Lamatic workspace.
2. Select one of the supported data-source indexation flows.
3. Configure the required source credentials and private inputs.
4. Configure the destination vector database.
5. Run the selected indexation flow to populate the vector store.
6. Configure the embedding and generative models required by the cart-recovery flow.
7. Configure the Cart Recovery chat widget.
8. Test the complete retrieval and response workflow before deployment.

## Usage

First run the appropriate indexation flow for the business knowledge source.

For example, product documentation or store information may be indexed from Google Drive, Google Sheets, S3, PostgreSQL, SharePoint, OneDrive, or web content.

After the content has been indexed, use the `cart-recovery` flow as the runtime conversational layer.

The flow retrieves relevant business knowledge from the configured vector database and uses it together with the supplied cart context to generate a personalized recovery response.

## Example Use Case

A customer adds products to a shopping cart but does not complete checkout.

The Cart Recovery Agent can use the supplied cart context and indexed business knowledge to:

- Understand the available cart and customer context.
- Retrieve relevant product or store information.
- Estimate the customer's purchase intent.
- Generate a personalized recovery message.
- Use promotional offers only when approved offer and eligibility information is supplied.
- Recommend an appropriate next action.

The agent should not invent coupon codes, discounts, or promotional eligibility that were not provided by the configured business data.

## Security and Privacy

- Do not commit API keys, passwords, access tokens, or other credentials.
- Store credentials using the appropriate Lamatic integrations or environment configuration.
- `.env.example` must contain placeholder values only.
- Avoid sending customer information to unnecessary external services.
- Do not include unnecessary personally identifiable information in model prompts.
- Promotional recommendations should use only supplied and approved offer information.

## Development

Before submitting changes, verify that the kit structure and configuration follow the AgentKit contribution requirements.

Check that:

- The cart-recovery flow matches the `cart-recovery` step configured in `lamatic.config.ts`.
- All referenced prompt, model-config, trigger, script, and flow files exist.
- No test webhooks, private URLs, credentials, or debug logging remain.
- Indexation flows preserve vector and metadata alignment.
- Documentation describes the files and behavior actually included in this kit.

## Contributing

This kit is part of the Lamatic AgentKit ecosystem.

When contributing improvements:

1. Make changes on a dedicated branch.
2. Keep the contribution limited to this kit.
3. Validate the project locally.
4. Commit and push the changes to your fork.
5. Update the existing pull request.
6. Address GitHub Actions and CodeRabbit review comments before requesting another review.

## Support

For questions or issues:

- Review the relevant flow and integration configuration.
- Check the Lamatic documentation.
- Review `agent.md` for detailed architecture and flow information.

## Tags

AI, E-Commerce, Cart Recovery, RAG, AgentKit, Automation

---

*AI E-Commerce Cart Recovery Agent for Lamatic AgentKit*
