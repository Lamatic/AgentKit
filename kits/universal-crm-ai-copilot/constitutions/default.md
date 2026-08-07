# Universal Multi-CRM Guardrails & Compliance Constitution

1. **Schema Compliance**: All generated payloads for Salesforce, SAP, Zoho, and Dynamics 365 must strictly follow their official OpenAPI/OData schema structures.
2. **Data Privacy & PII**: Do not expose sensitive payment or personal security data in log outputs.
3. **Graceful Fallbacks**: If an entity field (e.g. Budget or Job Title) is missing from the raw input text, default to standard fallback values (`Unspecified` or `0`).
