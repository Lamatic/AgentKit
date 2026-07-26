import { AttackPreset, SeverityLevel } from "./types";

export const PRESET_ATTACKS: AttackPreset[] = [
  {
    id: "db-crash",
    title: "PostgreSQL Connection Pool Exhausted",
    badge: "P1",
    service: "payment-service",
    prompt:
      "Production payment-service is throwing 'FATAL: remaining connection slots are reserved for non-replication superuser roles'. Error rate spiked to 94.2% on /api/v2/checkout. Active database connections peaked at 500/500.",
  },
  {
    id: "redis-oom",
    title: "Redis Cache Eviction Storm & High Latency",
    badge: "P2",
    service: "auth-api",
    prompt:
      "auth-api latency P99 degraded from 45ms to 4,200ms. Redis cluster memory utilization at 99.8%. Eviction rate at 12,000 keys/sec causing cascading JWT validation timeouts on login endpoints.",
  },
  {
    id: "k8s-oomkill",
    title: "Kubernetes Pod CrashLoopBackOff (OOMKilled)",
    badge: "P1",
    service: "order-processor",
    prompt:
      "order-processor deployment pods are restarting every 90 seconds with exit code 137 (OOMKilled). Memory limit 2Gi exceeded during bulk invoice PDF generation job. Kafka consumer lag building up.",
  },
  {
    id: "gateway-502",
    title: "API Gateway 502 Bad Gateway Upstream Timeout",
    badge: "P2",
    service: "api-gateway",
    prompt:
      "Kong API Gateway returning 502 Bad Gateway for 35% of requests to /api/v1/search. Upstream elasticsearch-cluster keepalive sockets dropping unexpectedly under high search traffic.",
  },
  {
    id: "ssl-expiry",
    title: "Ingress TLS Certificate Expired Warning",
    badge: "P3",
    service: "ingress-nginx",
    prompt:
      "Cert-manager failed to auto-renew Let's Encrypt TLS certificate for api.internal.production.domain. Expiry countdown at 48 hours. DNS validation challenge failing due to Cloudflare API token rate limit.",
  },
  {
    id: "novel-attack",
    title: "Novel Issue (Triggers Live Web Search)",
    badge: "P2",
    service: "ebpf-tracer",
    prompt:
      "Linux kernel eBPF network observability daemon reporting 'bpf_prog_load failed: Argument list too long (errno 7)' on Ubuntu 24.04 LTS kernel 6.8.0-40-generic after recent security patch rollout.",
  },
];

export const PRESET_RUNBOOK = `# Production SRE Master Remediation Runbook
Version: 2026.07 | Author: ARIA SRE Team | Classification: Internal Operations

---

## 1. PostgreSQL Connection Pool Exhaustion (P1)
**Symptoms:** \`FATAL: remaining connection slots are reserved\`, HTTP 500 on database queries.
**Immediate Remediation:**
1. Check active connections by state:
   \`\`\`sql
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
   \`\`\`
2. Terminate idle connections older than 5 minutes:
   \`\`\`sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '5 minutes';
   \`\`\`
3. Scale PgBouncer pooler replicas:
   \`\`\`bash
   kubectl scale deployment pgbouncer -n production --replicas=6
   \`\`\`

---

## 2. Redis Cache Eviction Storm & OOM (P2)
**Symptoms:** High eviction rate, memory at 99%, increased database read load.
**Immediate Remediation:**
1. Inspect memory distribution by prefix:
   \`\`\`bash
   redis-cli --bigkeys -i 0.1
   \`\`\`
2. Temporarily adjust maxmemory policy to volatile-lru:
   \`\`\`bash
   redis-cli config set maxmemory-policy volatile-lru
   \`\`\`
3. Flush expired session keys manually if needed:
   \`\`\`bash
   redis-cli --scan --pattern "session:temp:*" | xargs -L 100 redis-cli del
   \`\`\`

---

## 3. Kubernetes Pod OOMKilled CrashLoopBackOff (P1)
**Symptoms:** Pod exit code 137, restarts > 10, memory graph hitting limit flatline.
**Immediate Remediation:**
1. Capture heap dump before termination using preStop hook or debug pod.
2. Patch deployment memory limits immediately (+50% headroom):
   \`\`\`bash
   kubectl patch deployment order-processor -n production -p '{"spec":{"template":{"spec":{"containers":[{"name":"order-processor","resources":{"limits":{"memory":"4Gi"}}}]}}}}'
   \`\`\`
3. Check for memory leak in recent deployment rollout history.
`;

export const DEFAULT_CUSTOM_RUNBOOK = `# Custom SRE Operations Runbook

## Service: payment-service
- Check connection pool metrics before restarting pods
- Ensure PgBouncer max_client_conn is set appropriately

## Service: auth-api
- Redis cluster failover requires manual confirmation if network partition detected
- Check token expiration cache TTL settings
`;

export const SEVERITY_STYLES: Record<
  SeverityLevel,
  { badge: string; text: string; glow: string }
> = {
  P1: {
    badge: "badge-p1",
    text: "text-red-400",
    glow: "glow-red",
  },
  P2: {
    badge: "badge-p2",
    text: "text-amber-400",
    glow: "glow-primary",
  },
  P3: {
    badge: "badge-p3",
    text: "text-indigo-400",
    glow: "glow-primary",
  },
  P4: {
    badge: "badge-p4",
    text: "text-emerald-400",
    glow: "glow-green",
  },
};
