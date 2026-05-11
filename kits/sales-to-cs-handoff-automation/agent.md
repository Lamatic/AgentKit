# Sales-to-CS Handoff-Automation

**Overview & Purpose:**
An AI-powered onboarding orchestration kit that automates the Sales → Customer Success handoff the moment a deal closes. It takes raw deal data and generates four role-specific operational outputs in parallel while detecting risks.

**Flow Description:**
1. Validation & Structuring: Validates payload completeness.
2. Deal Intelligence: Extracts complexity, onboarding tier, risks, technical requirements, and generates a promise audit.
3. Routing: Routes to enterprise or standard paths.
4. Output Generation: Four parallel nodes generate CS Handoff Brief, Engineering Brief, Customer Kickoff Email, and Management Summary.

**Guardrails:**
A validation gate stops bad data before it enters the pipeline. If critical info is missing, it returns an escalation report and halts downstream execution.

**Integration Reference:**
Built with Next.js, Lamatic.ai orchestration, Groq Llama 3.3 70B Versatile, and GraphQL APIs.
