// Code node: Load_Runbooks (investigate)
// Supplies the runbook corpus as grounding context for the diagnosis step.
//
// The demo corpus is small (8 entries), so it is passed to the LLM directly rather
// than retrieved from a vector store — right-sized for the size of the data, and it
// keeps the flow self-contained (no vector DB to provision or index). To investigate
// with your own runbooks, replace the RUNBOOKS string below (or adapt this node to
// fetch them from your source of truth). The canonical copy lives in
// assets/demo/runbooks.md.

const RUNBOOKS = `
RB-01 API latency spike / p99 elevated — Symptoms: p99 > 800ms, elevated not failing. Causes: DB pool saturation; slow query from a recent migration; N+1 from a new endpoint. First checks: DB pool graph; slow-query log; correlate with most recent deploy. Mitigation: raise pool; roll back suspect deploy; add missing index.

RB-02 Elevated 5xx on checkout — Symptoms: checkout-service 500s, error rate > 2%. Causes: a dependency (payments, inventory) down/timing out; bad config/flag change; unhandled exception on a new path. First checks: which dependency's errors rose first; recent config/flag flips; exception traces. Mitigation: disable offending flag; fail open to cached inventory; roll back config.

RB-03 Database connection pool exhaustion — Symptoms: "too many connections" / "pool timeout"; requests queue then time out. Causes: traffic surge; connection leak; pool size reduced by a config change; long transactions holding connections. First checks: active vs max connections; slowest transactions; recent pool-size or transaction changes. Mitigation: raise max_connections; restart leaking service; roll back the shrinking config.

RB-04 Cache stampede after deploy — Symptoms: latency and DB load spike right after a deploy, then recover. Causes: deploy flushed the cache and all requests miss to the DB; a cache key format changed. First checks: cache hit-rate around deploy time; whether the deploy changed a key or serializer. Mitigation: warm the cache; add single-flight/coalescing; stagger rollout.

RB-05 Payment provider degradation — Symptoms: checkout succeeds internally but payment confirmation slow/failing; timeouts calling the external provider. Causes: third-party provider degraded; expired credential; egress issue. First checks: provider status page; provider-call error rate/latency; credential expiry; internal services otherwise healthy. Mitigation: enable retry-with-backoff; queue payments for async confirmation; page the provider.

RB-06 Feature-flag / config rollout gone wrong — Symptoms: behaviour change with no code deploy; errors/latency starting exactly at a config/flag change. Causes: flag at 100% instead of canary; malformed config; flag assumes a not-ready dependency. First checks: flag/config audit log; change timestamp vs incident start; who/what changed it. Mitigation: revert flag; re-roll as a small canary.

RB-07 Memory leak / OOM restarts — Symptoms: pods restarting on OOM; sawtooth memory; latency spikes near restarts. Causes: unbounded in-memory cache/buffer introduced recently; leak in a hot path; reduced memory limits from a manifest change. First checks: memory graph slope; OOM/restart events; recent caching/limit changes. Mitigation: raise limits (stopgap); roll back the change; add a bound/TTL.

RB-08 Upstream DNS / networking blip — Symptoms: intermittent failures across multiple unrelated services at once. Causes: DNS failures; mesh/network change; cloud provider incident. First checks: whether failures span unrelated services (points away from app code); recent mesh/network changes; provider status. Mitigation: flush DNS / restart sidecars; roll back the mesh change; track the provider incident.
`.trim();

output = { runbooks: RUNBOOKS };
