# SQL Query Explainer

## About This Flow

This workflow accepts any SQL query and returns a **structured JSON explanation** — no database connection required. Useful for developers, data engineers, and analysts who need to quickly understand unfamiliar queries, document SQL code, or surface performance concerns before a query reaches production.

This flow includes **3 nodes**: graphqlNode → LLMNode → graphqlResponseNode.

## What It Returns

The API response contains an `explanation` field with a JSON object:

```json
{
  "summary": "Plain-English description of what the query does.",
  "dialect_hint": "PostgreSQL",
  "clauses": [
    { "clause": "SELECT", "explanation": "Retrieves user ID, name, and order count." }
  ],
  "performance_concerns": ["LEFT JOIN on large table without index on user_id."],
  "optimisation_suggestions": ["Add index on orders.user_id."],
  "example_output_description": "Up to 20 rows with user ID, name, order count sorted descending."
}
```

## Example Input

```json
{
  "query": "SELECT u.id, u.name, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' GROUP BY u.id, u.name HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 20;"
}
```

## Use Cases

- **Code Review** — Auto-annotate SQL changes with plain-English descriptions and performance flags.
- **Developer Onboarding** — Help new engineers understand existing queries without DBA review.
- **SQL Education** — Build learning tools that explain queries clause by clause.
- **Data Documentation** — Generate consistent documentation for complex analytical queries.
- **Pre-Production Checks** — Surface SQL anti-patterns before queries run.

## Prerequisites

- A Lamatic.ai account ([lamatic.ai](https://lamatic.ai))
- An LLM provider connected in your Lamatic workspace

## Usage

1. Import this template into your Lamatic workspace
2. Connect your LLM provider credentials
3. Deploy the flow
4. Send a POST request with a `query` field containing your SQL

## Tags

Developer Tools, Generative, Analytics, SQL

---
*Author: Saad Mohammad | saadmd723@gmail.com*
