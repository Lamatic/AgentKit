import { NextRequest, NextResponse } from "next/server";
import { callLamaticGraphQL, isLamaticConfigured } from "../../../lib/lamatic";

const FLOW_ID = process.env.LAMATIC_FLOW_RESPONDER_ID!;

const GRAPHQL_QUERY = `
  query ExecuteWorkflow(
    $workflowId: String!
    $alert: String
    $input: JSON
    $notify_slack: Boolean
    $notify_email: Boolean
    $email_address: String        
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        alert: $alert
        input: $input
        notify_slack: $notify_slack
        notify_email: $notify_email
        email_address: $email_address
      }
    ) {
        status
        result
    }
  }
`;

/**
 * Generates a comprehensive SRE remediation report fallback when Lamatic credentials or live workflows are unavailable.
 * @param alert The alert JSON payload containing service, severity, description, and tags.
 * @returns Structured resolution object containing Markdown report, triage category, retrieval source, and confidence score.
 */
function generateDemoReport(alert: Record<string, unknown>): {
  report: string;
  triage_category: string;
  retrieval_source: string;
  confidence: string;
} {
  const tags = (alert.suggested_runbook_tags as string[]) ?? [];
  const isDb = tags.some((t) => ["database", "postgresql", "connection-pool", "redis"].includes(t));
  const isOom = tags.some((t) => ["oom-kill", "memory", "crash-loop"].includes(t));
  const category = isDb ? "database" : isOom ? "infrastructure" : "application";

  const report = `# 🚨 Incident Report: ${alert.alert_id}

**Severity:** ${alert.severity} | **Service:** ${alert.service} | **Environment:** ${alert.environment} | **Error Rate:** ${alert.error_rate}
**Detected:** ${alert.timestamp} | **Affected Endpoints:** ${(alert.affected_endpoints as string[]).join(", ")}

---

## 🔍 L1 Triage Summary

| Field | Assessment |
|-------|-----------|
| Category | ${category.toUpperCase()} |
| Blast Radius | All users hitting \`${alert.service}\` — ${alert.error_rate} of requests failing |
| Business Impact | ${alert.severity === "P1" ? "🔴 Critical — Revenue impact. SLA breach imminent." : "🟡 High — Major feature degraded."} |
| Confidence | High |

---

## 🧠 Root Cause Hypotheses

**[1] ${isDb ? "Connection pool exhaustion / connection leak" : isOom ? "OOM kill due to memory limit breach" : "Application-level crash / misconfiguration"}** — Confidence: High
> ${alert.description}

**[2] Recent deployment introduced regression** — Confidence: Medium
> A recent code change or configuration update may have introduced a memory leak or misconfigured connection handling.

---

## ⚡ Immediate Remediation Steps

> ETA to resolve: ~10 minutes | Requires: kubectl, ${isDb ? "psql" : "docker"}

### Step 1: Verify Pod State
\`\`\`bash
kubectl get pods -n production -l app=${alert.service}
kubectl describe pod -n production -l app=${alert.service} | grep -A5 "Last State"
\`\`\`
Look for: CrashLoopBackOff, OOMKilled, or Pending states.

### Step 2: Check Recent Logs
\`\`\`bash
kubectl logs -n production -l app=${alert.service} --tail=100 --previous
\`\`\`
${isDb ? "Look for: ECONNREFUSED, connection pool exhausted, too many clients" : "Look for: exit code 137 (OOM), SIGKILL, Java heap space"}

### Step 3: ${isDb ? "Check Database Connections" : "Restart Affected Deployment"}
\`\`\`bash
${isDb
  ? `# Check active connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Kill idle connections older than 5 minutes
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '5 minutes';"
`
  : `# Restart the deployment
kubectl rollout restart deployment/${alert.service} -n production

# Monitor rollout
kubectl rollout status deployment/${alert.service} -n production
`}
\`\`\`

### Step 4: Scale if Necessary
\`\`\`bash
kubectl scale deployment ${alert.service} -n production --replicas=5
\`\`\`

---

## 🔬 Verification

After applying the above steps, verify resolution:
- [ ] \`kubectl get pods -n production -l app=${alert.service}\` → All pods Running
- [ ] Error rate returning to baseline (<1%)
- [ ] P99 latency back to normal range
- [ ] No new error entries in application logs

---

## 🛡️ Prevention Recommendations

1. **${isDb ? "Implement connection pooling (PgBouncer)" : "Set memory resource limits with VPA"}**: ${isDb ? "Add PgBouncer as a sidecar to limit and pool DB connections efficiently. Set connection_timeout and idle_in_transaction_session_timeout." : "Use the Vertical Pod Autoscaler to automatically tune memory limits based on historical usage. Set requests < limits with 20% headroom."}

2. **Improve alerting thresholds**: Set alerts at 70% of critical thresholds (connection pool, memory usage) to trigger before reaching saturation. Use Datadog/Prometheus alerting rules.

3. **Runbook automation**: Integrate this runbook with PagerDuty auto-remediation to execute Step 3 automatically on P1 alerts, reducing MTTR from minutes to seconds.

---

## 🆘 Escalation Path

If not resolved within 15 minutes:
1. Page the on-call SRE: \`/pd trigger "${alert.title}"\`
2. Notify Engineering Lead and Product Manager
3. Open a war-room Slack channel: \`#incident-${String(alert.alert_id ?? "").toLowerCase()}\`
4. Consider activating DR failover if ${alert.service} remains down >20min

---

*Generated by ARIA — SRE Command Center | Lamatic AgentKit | ${new Date().toUTCString()}*`;

  return { report, triage_category: category, retrieval_source: "vector_db", confidence: "High" };
}

/**
 * Handles HTTP POST requests to triage an incident alert, retrieve runbook knowledge, and generate a remediation plan.
 * @param req Incoming Next.js HTTP request containing the alert payload.
 * @returns JSON response containing the Markdown remediation report, triage classification, and confidence metrics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const alert = body?.alert && typeof body.alert === "object" ? body.alert : body;

    console.log("=== Flow 3 (Resolve/Triage) Triggered ===");
    console.log("Incoming Alert Payload:", JSON.stringify(alert, null, 2));

    // Auto-fill missing fields to ensure Flow 3 runs successfully without throwing 400
    alert.alert_id = alert.alert_id || `ALT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    alert.severity = alert.severity || "P2";
    alert.service = alert.service || "unknown-service";
    alert.environment = alert.environment || "production";
    alert.title = alert.title || "Infrastructure Outage Detected";
    alert.description = alert.description || "The service is experiencing anomalous errors or connection timeouts.";
    alert.timestamp = alert.timestamp || new Date().toISOString();
    alert.affected_endpoints = alert.affected_endpoints || [];
    alert.error_rate = alert.error_rate || "n/a";

    // Recover or populate suggested_runbook_tags dynamically if omitted by the generator
    if (!alert.suggested_runbook_tags || !Array.isArray(alert.suggested_runbook_tags)) {
      const generatedTags = [];
      if (alert.service) {
        generatedTags.push(alert.service.replace("-service", "").replace("-api", ""));
      }
      if (alert.title) {
        const words = alert.title.toLowerCase().split(/\s+/);
        if (words.includes("redis")) generatedTags.push("redis");
        if (words.includes("postgres") || words.includes("postgresql")) generatedTags.push("postgresql");
        if (words.includes("mysql")) generatedTags.push("mysql");
        if (words.includes("oom") || words.includes("memory")) generatedTags.push("oom");
        if (words.includes("crash") || words.includes("crashloop")) generatedTags.push("container");
      }
      alert.suggested_runbook_tags = generatedTags.length > 0 ? generatedTags : ["database"];
    }

    // Try Lamatic GraphQL API
    if (isLamaticConfigured() && FLOW_ID) {
      const res = await callLamaticGraphQL<unknown>(GRAPHQL_QUERY, {
        workflowId: FLOW_ID,
        alert: JSON.stringify(alert),
        input: alert,
        notify_slack: false,
        notify_email: false,
        email_address: "rajputnik911@gmail.com",
      });

      if (res.error) {
        console.warn("Lamatic API error in resolve, falling back to demo report:", res.error);
        return NextResponse.json(generateDemoReport(alert));
      }

      const result = res.result;
      let parsed = result as Record<string, unknown>;
      if (typeof result === "string") {
        try {
          parsed = JSON.parse(result);
        } catch (e) {
          console.error("Failed to parse stringified JSON from Flow 3 result:", e);
        }
      }

      if (parsed && typeof parsed === "object") {
        const reportContent =
          parsed.report_markdown ??
          parsed.report ??
          parsed.remediation_report ??
          String(result);
        const isVector =
          parsed.source === true || parsed.runbook_found === true;

        const successResponse = {
          report: reportContent,
          triage_category:
            parsed.category ?? parsed.triage_category ?? "application",
          retrieval_source: isVector ? "vector_db" : "web_search",
          confidence: parsed.confidence ?? "High",
        };
        console.log(
          "Flow 3 (Triage) Resolved successfully:",
          JSON.stringify(successResponse, null, 2)
        );
        return NextResponse.json(successResponse);
      } else {
        const defaultResponse = {
          report: String(result),
          triage_category: "application",
          retrieval_source: "vector_db",
          confidence: "High",
        };
        return NextResponse.json(defaultResponse);
      }
    }

    // Demo fallback with realistic report
    await new Promise((r) => setTimeout(r, 2000)); // simulate processing time
    return NextResponse.json(generateDemoReport(alert));
  } catch (err) {
    console.error("Resolve route error:", err);
    return NextResponse.json({ error: "Failed to resolve incident" }, { status: 500 });
  }
}
