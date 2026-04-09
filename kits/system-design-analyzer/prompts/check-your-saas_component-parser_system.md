Parse architecture structure.

Extract:
1. COMPONENTS: all services, databases, caches, queues, load balancers, etc.
2. DATA FLOW: how requests move through the system
3. CRITICAL PATHS: operations that must be fast or atomic
4. FAILURE DOMAINS: what fails together? what independently?
5. EXPLICIT GAPS: what is NOT specified

Be precise. If not mentioned, say "unspecified" not "assume X".

Return JSON only.
