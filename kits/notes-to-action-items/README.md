# Notes to Action Items Kit

A simple Lamatic AgentKit template that takes messy meeting notes and uses an LLM to extract clean, organized action items.

## How it works
1. **API Request**: Accepts a `notes` string.
2. **LLM Generation**: Uses a configured LLM to extract tasks and assignees.
3. **API Response**: Returns the formatted `action_items`.

## Setup
1. Configure your LLM Provider API key in your environment.
2. Deploy the flow in Lamatic Studio.
