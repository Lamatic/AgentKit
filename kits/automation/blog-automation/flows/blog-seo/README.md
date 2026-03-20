# SEO Optimization Flow

This flow optimizes a blog post draft for search engines using target keywords.

## Flow Structure

```
[API Request] → [SEO Optimize Content (LLM)] → [API Response]
```

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `draft` | string | Yes | The blog post draft to optimize |
| `keywords` | string | Yes | Target keywords for SEO optimization |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `generatedResponse` | string | The SEO-optimized blog post in Markdown |

## Usage

1. Import this flow into Lamatic Studio
2. Configure your preferred LLM model
3. Publish the flow
4. Copy the Flow ID to your `.env` file as `AUTOMATION_BLOG_SEO`

## Example Request

```json
{
  "draft": "This is my blog post about AI...",
  "keywords": "AI, machine learning, automation"
}
```
