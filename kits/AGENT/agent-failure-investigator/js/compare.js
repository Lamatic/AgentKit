function diffInvestigations(traceA, traceB) {
  const a = runInvestigation(traceA);
  const b = runInvestigation(traceB);

  const sumLatency = t => (t.tool_calls || []).reduce((acc, tc) => acc + (tc.duration_ms || 0), 0);
  const countBroken = t => (t.tool_calls || []).filter(tc => tc.status !== "success").length;

  const idsA = new Set(a.fired.map(f => f.rule.id));
  const idsB = new Set(b.fired.map(f => f.rule.id));

  return {
    a, b,
    resolvedRules: a.fired.filter(f => !idsB.has(f.rule.id)),
    introducedRules: b.fired.filter(f => !idsA.has(f.rule.id)),
    persistingRules: a.fired.filter(f => idsB.has(f.rule.id)),
    metrics: [
      metricRow("Failure category",
        a.primary ? CATEGORIES[a.primary].label : "None",
        b.primary ? CATEGORIES[b.primary].label : "None",
        a.primary && !b.primary ? "better" : !a.primary && b.primary ? "worse" : a.primary === b.primary ? "same" : "changed"),
      metricRow("Confidence", a.confidence + "%", b.confidence + "%",
        b.confidence < a.confidence ? "better" : b.confidence > a.confidence ? "worse" : "same"),
      metricRow("Rules fired", a.fired.length, b.fired.length,
        b.fired.length < a.fired.length ? "better" : b.fired.length > a.fired.length ? "worse" : "same"),
      metricRow("Tool errors", countBroken(traceA), countBroken(traceB),
        countBroken(traceB) < countBroken(traceA) ? "better" : countBroken(traceB) > countBroken(traceA) ? "worse" : "same"),
      metricRow("Total tool latency", sumLatency(traceA) + "ms", sumLatency(traceB) + "ms",
        sumLatency(traceB) < sumLatency(traceA) ? "better" : sumLatency(traceB) > sumLatency(traceA) ? "worse" : "same")
    ]
  };
}

const metricRow = (name, before, after, verdict) => ({ name, before, after, verdict });

function renderComparison(hostId, diff) {
  const host = document.getElementById(hostId);
  const badge = v => v === "better" ? `<span class="cmp-badge cmp-better">▼ Improved</span>`
    : v === "worse" ? `<span class="cmp-badge cmp-worse">▲ Regressed</span>`
    : v === "changed" ? `<span class="cmp-badge cmp-changed">Changed</span>`
    : `<span class="cmp-badge cmp-same">Unchanged</span>`;

  const ruleList = (items, css, verb) => items.length
    ? items.map(f => `<div class="cmp-rule ${css}"><span class="rule-chip small">${f.rule.id}</span> ${verb} — ${escapeHtml(f.rule.title)}</div>`).join("")
    : `<div class="cmp-rule muted">none</div>`;

  host.innerHTML = `
    <table class="cmp-table">
      <tr><th>Metric</th><th>Trace A (before)</th><th>Trace B (after)</th><th>Verdict</th></tr>
      ${diff.metrics.map(m => `<tr><td>${m.name}</td><td>${m.before}</td><td>${m.after}</td><td>${badge(m.verdict)}</td></tr>`).join("")}
    </table>
    <div class="cmp-cols">
      <div><div class="field-title">Resolved in B</div>${ruleList(diff.resolvedRules, "cmp-solved", "Solved")}</div>
      <div><div class="field-title">Still firing</div>${ruleList(diff.persistingRules, "cmp-open", "Open")}</div>
      <div><div class="field-title">New in B</div>${ruleList(diff.introducedRules, "cmp-new", "Introduced")}</div>
    </div>`;
}

if (typeof module !== "undefined") module.exports = { diffInvestigations };
