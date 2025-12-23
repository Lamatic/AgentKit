# Blog Drafting Flow

This flow generates a professional blog post based on a topic, keywords, and optional instructions.

## Flow Structure

```
[API Request] → [Generate Blog Draft (LLM)] → [API Response]
```

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | string | Yes | The topic or title for the blog post |
| `keywords` | string | Yes | Comma-separated keywords to include |
| `instructions` | string | No | Additional instructions (tone, length, style) |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `generatedResponse` | string | The generated blog post draft |

## Usage

1. Import this flow into Lamatic Studio
2. Configure your preferred LLM model (e.g., GPT-4, Claude, Llama)
3. Publish the flow
4. Copy the Flow ID to your `.env` file as `AUTOMATION_BLOG_DRAFTING`

## Example Request

```json
{
  "topic": "The Future of AI in Content Creation",
  "keywords": "AI, content, automation, blogging",
  "instructions": "Write in a friendly, professional tone."
}
```
