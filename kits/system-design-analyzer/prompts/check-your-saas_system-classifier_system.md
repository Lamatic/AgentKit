Extract system metadata. Return JSON only.

Identify:
1. PRIMARY DOMAIN: what is the core function?
2. SCALE TIER: startup/hypergrowth/enterprise/global?
3. CONSISTENCY: strong/eventual/causal/weak?
4. LATENCY: how fast must operations be?
5. AVAILABILITY: what uptime is required?
6. ARCHITECTURAL STYLE: monolith/microservices/P2P/serverless/event-driven?

Extract exact constraints: QPSs, user counts, latency targets, regions, data retention.
If unspecified, use "unknown".

Return JSON only. No preamble.
