# Bug to Test Case Generator

## About This Flow

This workflow automatically translates unstructured bug reports or Jira issues into structured test cases, regression steps, and automated test templates. It takes bug details (title, description, reproduction steps, and environment) and utilizes an LLM to generate a comprehensive testing plan.

This flow includes **3 nodes** working together to process data efficiently.

## Flow Components

This workflow includes the following node types:
- `graphqlNode` (API Request trigger)
- `LLMNode` (Generate Test Case)
- `graphqlResponseNode` (API Response)

## Files Included

- **lamatic.config.ts** - Kit configuration and metadata.
- **agent.md** - Agent identity, capability, and guardrails documentation.
- **constitutions/default.md** - Default AI guidelines and safety constraints.
- **flows/bug-to-test-case-generator.ts** - Complete flow structure with nodes and connections.
- **prompts/** - System and User prompts for test case generation.
- **model-configs/** - LLM model config file.

## Usage

1. Import this template into your Lamatic workspace.
2. Configure your LLM provider credentials in Lamatic Studio.
3. Test the flow with sample bug descriptions.
4. Deploy and integrate the API endpoint into your issue tracking system (like Jira or GitHub Issues).

## Support

For questions or issues with this flow:
- Review the node documentation for specific integrations.
- Check the Lamatic documentation at [docs.lamatic.ai](https://docs.lamatic.ai).
- Join the Lamatic community Slack.
