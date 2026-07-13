# Demo Runbooks

A small, self-contained runbook corpus for the Incident Copilot demo. The failure
modes deliberately overlap (several mention latency, 5xx, or the checkout path) so
retrieval and ranking are non-trivial — the correct hypothesis is not a keyword match.

Replace this file with your own runbooks to investigate real incidents. Each `##`
section is treated as one retrievable runbook entry.

---

## RB-01 — API latency spike / p99 elevated
**Symptoms:** p99 latency > 800ms on `api-gateway`, elevated but not failing.
**Common causes:** downstream database connection pool saturation; a slow query
introduced by a recent migration; N+1 queries from a new endpoint.
**First checks:** DB pool utilization dashboard; slow-query log; correlate with the
most recent deploy to `api-gateway` or `orders-service`.
**Mitigation:** raise pool size temporarily; roll back the suspect deploy; add the
missing index if a slow query is confirmed.

## RB-02 — Elevated 5xx on checkout
**Symptoms:** `checkout-service` returning 500s, error rate > 2%.
**Common causes:** a dependency (`payments-service`, `inventory-service`) is down or
timing out; a bad config/feature-flag change; an unhandled exception from a new code path.
**First checks:** which dependency's error rate rose first; recent config or flag flips;
exception traces in the checkout logs.
**Mitigation:** disable the offending feature flag; fail open to a cached inventory
count if inventory is the culprit; roll back the config change.

## RB-03 — Database connection pool exhaustion
**Symptoms:** "too many connections" / "pool timeout" errors; requests queue then time out.
**Common causes:** a traffic surge; a connection leak from code that doesn't release
connections; pool size reduced by a recent config change; long-running transactions
holding connections.
**First checks:** active vs. max connections; slowest transactions; any recent change
to pool size or transaction boundaries.
**Mitigation:** raise `max_connections`; restart the leaking service to reclaim
connections; roll back the config change that shrank the pool.

## RB-04 — Cache stampede after deploy
**Symptoms:** latency and DB load spike immediately after a deploy, then recover.
**Common causes:** a deploy flushed the cache and every request now misses to the DB
simultaneously; a cache key format changed, invalidating all existing entries.
**First checks:** cache hit-rate graph around the deploy time; whether the deploy
changed a cache key or serializer.
**Mitigation:** warm the cache; add request coalescing / single-flight; stagger the
rollout next time.

## RB-05 — Payment provider degradation
**Symptoms:** checkout succeeds internally but payment confirmation is slow or failing;
elevated timeouts calling the external payment provider.
**Common causes:** the third-party payment provider is degraded; expired API credential;
a network egress issue to the provider.
**First checks:** provider status page; provider-call error rate and latency; credential
expiry; whether internal services are otherwise healthy.
**Mitigation:** enable the retry-with-backoff path; queue payments for async
confirmation; page the provider if their status page is green but calls fail.

## RB-06 — Feature-flag / config rollout gone wrong
**Symptoms:** a sudden behaviour change with no code deploy; errors or latency starting
exactly at a config/flag change timestamp.
**Common causes:** a flag enabled for 100% instead of a canary; a malformed config value;
a flag that assumes a dependency that isn't ready.
**First checks:** the flag/config audit log; the exact change timestamp vs. incident
start; who/what changed it.
**Mitigation:** revert the flag to its prior state; re-roll as a small canary.

## RB-07 — Memory leak / OOM restarts
**Symptoms:** pods restarting on OOM; sawtooth memory graph; latency spikes around restarts.
**Common causes:** an unbounded in-memory cache or buffer introduced recently; a leak in
a hot code path; reduced memory limits from a recent manifest change.
**First checks:** memory graph slope; restart/OOM events; recent changes to caching,
buffering, or resource limits.
**Mitigation:** raise memory limits as a stopgap; roll back the change that introduced
the growth; add a bound/TTL to the cache.

## RB-08 — Upstream DNS / networking blip
**Symptoms:** intermittent failures across multiple unrelated services at once.
**Common causes:** DNS resolution failures; a networking / service-mesh change; cloud
provider networking incident.
**First checks:** whether failures span unrelated services (points away from app code);
recent mesh/network config changes; cloud provider status.
**Mitigation:** flush DNS / restart affected sidecars; roll back the mesh change; wait
out and track the provider incident.
