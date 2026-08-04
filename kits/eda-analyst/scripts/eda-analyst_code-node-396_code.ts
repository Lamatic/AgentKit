// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const profile = {{codeNode_458.output.profile}};
const findings = {{codeNode_706.output.findings}};
const changelog = {{codeNode_458.output.changelog}};
const validation = {{codeNode_458.output.validation}};

function buildDashboard(profile, findings, changelog, validation) {
  const dataset = (profile && profile.dataset) || {};
  const columns = (profile && profile.columns) || [];
  findings = findings || []; validation = validation || {};
  const cl = Array.isArray(changelog) ? changelog : [];
  const esc = function (s) { return String(s === undefined || s === null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); };
  const okFindings = [];
  for (let i = 0; i < findings.length; i++) { const f = findings[i]; if (!f.chart) { okFindings.push(f); continue; }
    const ch = f.chart; let ok = true;
    if (ch.type === "scatter") ok = ch.points && ch.points.length > 0;
    else { const d = ch.data || []; ok = d.length > 0 && d.every(function (v) { return typeof v === "number" && isFinite(v); }); }
    if (ok) okFindings.push(f); }
  findings = okFindings;
  const specs = [];
  for (let i = 0; i < findings.length; i++) { const f = findings[i], ch = f.chart, id = "chart_" + i; if (!ch) continue;
    if (ch.type === "scatter") specs.push({ id: id, kind: "scatter", xLabel: ch.x, yLabel: ch.y, points: ch.points || [] });
    else if (ch.type === "pie") specs.push({ id: id, kind: "pie", labels: ch.labels || [], data: ch.data || [] });
    else specs.push({ id: id, kind: "bar", labels: ch.labels || [], data: ch.data || [] }); }
  const tiles = [
    { label: "Rows", value: dataset.rowCount != null ? dataset.rowCount : "—" },
    { label: "Columns", value: dataset.columnCount != null ? dataset.columnCount : "—" },
    { label: "Missing", value: (dataset.missingPct != null ? dataset.missingPct : 0) + "%" },
    { label: "Analyses", value: findings.length } ];
  const passed = validation.passed !== false;
  let h = "";
  h += '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
  h += "<title>" + esc(dataset.filename ? dataset.filename + " — EDA" : "EDA Dashboard") + "</title>";
  h += '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></scr' + 'ipt>';
  h += "<style>*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.5}" +
    ".wrap{max-width:1100px;margin:0 auto;padding:32px 20px}h1{font-size:1.6rem;margin:0 0 6px}.sub{color:#94a3b8;margin:0 0 16px}" +
    ".banner{border-radius:8px;padding:10px 14px;margin:0 0 22px;font-size:.9rem;font-weight:600}.ok{background:rgba(34,197,94,.15);border:1px solid #22c55e;color:#4ade80}.bad{background:rgba(220,38,38,.15);border:1px solid #dc2626;color:#f87171}" +
    ".tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:28px}.tile{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px}.tile .v{font-size:1.7rem;font-weight:700}.tile .l{color:#94a3b8;font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}" +
    ".section{margin:28px 0}.section h2{font-size:1.1rem;border-bottom:1px solid #334155;padding-bottom:8px}" +
    ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px}.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px}.card h3{margin:0 0 10px;font-size:.98rem}.card .sum{font-size:.9rem;margin:10px 0 4px}.card .why{color:#94a3b8;font-size:.8rem;border-top:1px solid #334155;padding-top:8px;margin-top:10px}" +
    "table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #334155}th{color:#94a3b8;font-weight:600}.chip{font-size:.72rem;padding:2px 7px;border-radius:6px;background:#334155}.tag{font-size:.7rem;padding:1px 6px;border-radius:5px;background:#334155;text-transform:uppercase}" +
    "@media(prefers-color-scheme:light){body{background:#f8fafc;color:#0f172a}.tile,.card{background:#fff;border-color:#e2e8f0}.tile .l,.sub,.card .why,th{color:#64748b}.chip,.tag{background:#e2e8f0}}</style></head><body><div class='wrap'>";
  h += "<h1>" + esc(dataset.filename ? dataset.filename + " — Exploratory Analysis" : "Exploratory Data Analysis") + "</h1>";
  h += "<p class='sub'>Autonomous EDA agent — sanitize → analyze → visualize.</p>";
  h += "<div class='banner " + (passed ? "ok" : "bad") + "'>" + (passed ? "✓ Data cleaned and validated" : "⚠ Cleaning reverted by validation gate") + (validation.issues && validation.issues.length ? " — " + esc(validation.issues.join(" ")) : "") + "</div>";
  h += "<div class='tiles'>";
  for (let i = 0; i < tiles.length; i++) h += "<div class='tile'><div class='v'>" + esc(tiles[i].value) + "</div><div class='l'>" + esc(tiles[i].label) + "</div></div>";
  h += "</div>";
  if (cl.length) { h += "<div class='section'><h2>Cleaning Log</h2><table><thead><tr><th>Target</th><th>Action</th><th>Detail</th><th>Reason</th></tr></thead><tbody>";
    for (let i = 0; i < cl.length; i++) h += "<tr><td>" + esc(cl[i].target) + "</td><td><span class='tag'>" + esc(cl[i].action) + "</span></td><td>" + esc(cl[i].detail) + "</td><td>" + esc(cl[i].reason) + "</td></tr>";
    h += "</tbody></table></div>"; }
  h += "<div class='section'><h2>Findings</h2><div class='grid'>";
  let sIdx = 0;
  for (let i = 0; i < findings.length; i++) { const f = findings[i]; if (!f.chart) continue;
    h += "<div class='card'><h3>" + esc(f.title) + "</h3><canvas id='" + specs[sIdx].id + "' height='240'></canvas><div class='sum'>" + esc(f.summary) + "</div>";
    if (f.reason) h += "<div class='why'>" + esc(f.reason) + "</div>"; h += "</div>"; sIdx++; }
  h += "</div></div>";
  const noChart = findings.filter(function (f) { return !f.chart; });
  if (noChart.length) { h += "<div class='section'><h2>Data-Quality Notes</h2>";
    for (let i = 0; i < noChart.length; i++) { h += "<div class='card'><h3>" + esc(noChart[i].title) + "</h3><div class='sum'>" + esc(noChart[i].summary) + "</div>"; if (noChart[i].reason) h += "<div class='why'>" + esc(noChart[i].reason) + "</div>"; h += "</div>"; }
    h += "</div>"; }
  h += "<div class='section'><h2>Column Profile</h2><table><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Distinct</th><th>Stats</th></tr></thead><tbody>";
  for (let i = 0; i < columns.length; i++) { const c = columns[i]; let stat = "";
    if (c.stats) stat = "min " + c.stats.min + " · mean " + c.stats.mean + " · max " + c.stats.max + (c.stats.outliers ? " · " + c.stats.outliers + " outliers" : "");
    else if (c.topValues && c.topValues.length) stat = "top: " + c.topValues[0].value + " (" + c.topValues[0].count + ")";
    h += "<tr><td>" + esc(c.name) + (c.isLikelyId ? " <span class='chip'>id</span>" : "") + "</td><td><span class='chip'>" + esc(c.type) + "</span></td><td>" + esc(c.missingPct) + "%</td><td>" + esc(c.cardinality) + "</td><td>" + esc(stat) + "</td></tr>"; }
  h += "</tbody></table></div>";
  // Serialize safely for embedding inside an inline <script>: escape "<" (so a
  // CSV-controlled value can't emit </script>) and the JS line separators U+2028/U+2029.
  const specsJson = JSON.stringify(specs).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  h += "<script>var SPECS=" + specsJson + ";var PAL=['#38bdf8','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6','#22d3ee'];";
  h += "SPECS.forEach(function(s){var el=document.getElementById(s.id);if(!el)return;var cfg;" +
    "if(s.kind==='scatter'){cfg={type:'scatter',data:{datasets:[{data:s.points,backgroundColor:'#38bdf8'}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{title:{display:true,text:s.xLabel,color:'#94a3b8'},ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.15)'}},y:{title:{display:true,text:s.yLabel,color:'#94a3b8'},ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.15)'}}}}};}" +
    "else if(s.kind==='pie'){cfg={type:'doughnut',data:{labels:s.labels,datasets:[{data:s.data,backgroundColor:PAL}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8'}}}}};}" +
    "else{cfg={type:'bar',data:{labels:s.labels,datasets:[{data:s.data,backgroundColor:'#38bdf8',borderRadius:4}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.15)'}},y:{ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.15)'}}}}};}" +
    "new Chart(el,cfg);});</scr" + "ipt></div></body></html>";
  return { dashboardHtml: h, chartCount: specs.length };
}
output = buildDashboard(profile, findings, changelog, validation);