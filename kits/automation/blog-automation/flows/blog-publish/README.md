# CMS Publishing Flow

This flow publishes the optimized blog post to WordPress or another CMS.

## Flow Structure

```
[API Request] → [Publish to WordPress (API)] → [API Response]
```

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | The title of the blog post |
| `content` | string | Yes | The blog post content to publish |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The URL of the published blog post |
| `status` | string | The publish status (publish, draft) |
| `id` | number | The ID of the published post |

## Usage

1. Import this flow into Lamatic Studio
2. Configure your WordPress credentials:
   - Update the API URL with your WordPress site
   - Add your WordPress Bearer token in the Authorization header
3. Publish the flow
4. Copy the Flow ID to your `.env` file as `AUTOMATION_BLOG_PUBLISH`

## WordPress Setup

1. Go to your WordPress Admin → Users → Application Passwords
2. Generate a new application password
3. Use the format: `Bearer YOUR_PASSWORD` in the Authorization header

## Example Request

```json
{
  "title": "My Amazing Blog Post",
  "content": "This is the content of my blog post..."
}
```
