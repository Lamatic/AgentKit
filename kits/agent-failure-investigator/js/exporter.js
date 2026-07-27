function investigationToMarkdown(result, report, trace, formatLabel) {
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const cat = report.category ? report.category.label : "No failure detected";
  const lines = [];
  const push = (...xs) => lines.push(...xs);

  push(`# Investigation Report`, ``);
  push(`| | |`, `|---|---|`);
  push(`| Generated | ${stamp} UTC |`);
  push(`| Agent | ${trace.meta?.agent || "—"} |`);
  push(`| Model | ${trace.meta?.model || "—"} |`);
  push(`| Source format | ${formatLabel || "Native"} |`);
  push(`| **Failure category** | **${cat}** |`);
  push(`| Confidence | ${result.confidence}% |`, ``);

  push(`## Timeline`, ``);
  result.timeline.forEach(e => push(`- \`${e.ts || "—"}\` ${e.kind === "fail" ? "🔴" : e.kind === "warn" ? "🟡" : "🟢"} ${e.label}`));
  push(``);

  push(`## Evidence`, ``);
  const primaryEvidence = result.fired.filter(f => f.rule.category === result.primary);
  if (!primaryEvidence.length) push(`_No rule fired — the trace looks healthy._`);
  primaryEvidence.forEach(f => push(`- **[${f.rule.id}]** ${f.evidence}`));
  push(``);

  push(`## Root cause`, ``, report.rootCause || "—", ``);

  if (report.contributing?.length) {
    push(`## Contributing factors`, ``);
    report.contributing.forEach(c => push(`- ${c.category.label} (+${c.points} pts): ${c.rules.join(", ")}`));
    push(``);
  }

  push(`## Recommendations`, ``);
  (report.fixes || []).forEach(f => push(`- [${f.ruleId}] ${f.text}`));
  const remediation = typeof adviseRemediation === "function" ? adviseRemediation(result) : [];
  if (remediation.length) {
    push(``, `### Remediation playbook`, ``);
    remediation.forEach(r => push(`- **${r.tag}** — ${r.why}`));
  }
  push(``);

  push(`## Prevention`, ``);
  (report.preventive || []).forEach(p => push(`- [${p.ruleId}] ${p.text}`));
  push(``, `---`, `_Deterministic diagnosis by Agent Failure Investigator — ${result.fired.length} rule(s) fired out of ${RULES.length} in catalog._`);

  return lines.join("\n");
}

function saveMarkdownReport(result, report, trace, formatLabel) {
  const md = investigationToMarkdown(result, report, trace, formatLabel);
  const blob = new Blob([md], { type: "text/markdown" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `investigation-${(trace.meta?.flow_id || "trace").replace(/\W+/g, "-")}.md`
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function printPdfReport(result, report, trace, formatLabel) {
  const md = investigationToMarkdown(result, report, trace, formatLabel);
  const html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^\| ?(.*) ?\|$/gm, row => "<tr>" + row.slice(1, -1).split("|").map(c => `<td>${c.trim()}</td>`).join("") + "</tr>")
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, m => /---/.test(m) ? `<table>${m.replace(/<tr><td>---<\/td>.*?<\/tr>\n?/g, "")}</table>` : m)
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^---$/gm, "<hr>");

  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>Investigation Report</title><style>
    body{font-family:Georgia,serif;max-width:760px;margin:36px auto;color:#1a1a1a;line-height:1.55}
    h1{border-bottom:3px solid #1a1a1a;padding-bottom:8px}
    h2{margin-top:28px;border-bottom:1px solid #ccc;padding-bottom:4px}
    table{border-collapse:collapse;margin:12px 0}
    td{border:1px solid #ccc;padding:5px 12px;font-size:14px}
    code{background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:13px}
    li{margin:5px 0}
    @media print{body{margin:0 auto}}
  </style></head><body>${html}<script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}
