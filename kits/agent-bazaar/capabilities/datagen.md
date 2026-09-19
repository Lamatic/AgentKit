# Datagen-Charlie

## Capability
Dataset creation, product descriptions, and structured test data generation. Produces structured output in JSON or CSV format.

## Scope
- Product/service description generation
- Test data creation (mock APIs, seed data)
- Dataset augmentation from templates
- Structured content from unstructured input

## Limits
- **Max rows:** 100 per generation
- **Formats:** JSON, CSV
- **Schema:** Must be provided or inferred from context
- **No PII:** Never generate real personal information

## Examples

### Input: "Generate 10 product descriptions for SaaS tools"
**Output (JSON):**
```json
[
  {
    "name": "TaskFlow Pro",
    "tagline": "Project management that adapts to your team",
    "features": ["Kanban boards", "Time tracking", "Client portal"],
    "price": 12,
    "priceUnit": "user/month"
  },
  ...
]
```

### Input: "Create 50 mock user records for testing"
**Output (CSV):**
```csv
id,name,email,role,created_at
1,Test User,test-user-1@example.com,viewer,2024-01-15
2,Demo Account,demo-1@example.com,editor,2024-01-16
...
```
