/**
 * UI layer. No framework — a diagnostic tool should open from file://
 * with zero build step. All state lives in memory.
 */

let currentTraceId = null;
let currentTrace = null;
let lastResult = null;

let importedFormatLabel = null;

document.addEventListener("DOMContentLoaded", () => {
  renderCasePicker();
  document.getElementById("run-btn").addEventListener("click", onRun);
  document.getElementById("custom-toggle").addEventListener("click", toggleCustom);
  document.getElementById("llm-btn").addEventListener("click", onComposeWithClaude);
  document.getElementById("trace-file").addEventListener("change", onUploadTrace);
  document.getElementById("export-md").addEventListener("click", () => lastResult && saveMarkdownReport(lastResult, composeReport(lastResult, currentTrace), currentTrace, importedFormatLabel));
  document.getElementById("export-pdf").addEventListener("click", () => lastResult && printPdfReport(lastResult, composeReport(lastResult, currentTrace), currentTrace, importedFormatLabel));
  bootCompare();
});

function onUploadTrace(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let doc;
    try { doc = JSON.parse(reader.result); }
    catch { showToast("That file is not valid JSON."); return; }
    let imported;
    try { imported = importTrace(doc); }
    catch (e) { showToast(e.message); return; }
    currentTrace = imported.trace;
    currentTraceId = "upload";
    importedFormatLabel = imported.formatLabel;
    document.querySelectorAll(".case-card").forEach(c => c.classList.remove("selected"));
    document.getElementById("custom-area").classList.add("hidden");
    const pill = document.getElementById("format-pill");
    pill.textContent = "Detected: " + imported.formatLabel;
    pill.classList.remove("hidden");
    document.getElementById("run-btn").disabled = false;
    showToast(`Imported ${file.name} as a ${imported.formatLabel} trace.`);
  };
  reader.readAsText(file);
  ev.target.value = "";
}

function bootCompare() {
  const cmpTraces = { a: null, b: null };
  const fill = sel => {
    sel.innerHTML = '<option value="">— pick a case —</option>' +
      SAMPLE_TRACES.map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join("");
  };
  const selA = document.getElementById("cmp-a"), selB = document.getElementById("cmp-b");
  fill(selA); fill(selB);
  const wireUpload = (inputId, slot) => document.getElementById(inputId).addEventListener("change", ev => {
    const f = ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { cmpTraces[slot] = importTrace(JSON.parse(r.result)).trace; showToast(`Trace ${slot.toUpperCase()} loaded from file.`); }
      catch (e) { showToast(e.message || "Bad file."); }
    };
    r.readAsText(f);
    ev.target.value = "";
  });
  wireUpload("cmp-a-file", "a");
  wireUpload("cmp-b-file", "b");
  selA.addEventListener("change", () => { cmpTraces.a = pickSample(selA.value); });
  selB.addEventListener("change", () => { cmpTraces.b = pickSample(selB.value); });
  document.getElementById("cmp-run").addEventListener("click", () => {
    if (!cmpTraces.a || !cmpTraces.b) { showToast("Pick or upload both traces first."); return; }
    renderComparison("cmp-result", diffInvestigations(cmpTraces.a, cmpTraces.b));
  });
}

const pickSample = id => (SAMPLE_TRACES.find(c => c.id === id) || {}).trace || null;

/* ---------- case picker ---------- */

function renderCasePicker() {
  const wrap = document.getElementById("cases");
  wrap.innerHTML = "";
  for (const c of SAMPLE_TRACES) {
    const el = document.createElement("button");
    el.className = "case-card";
    el.dataset.id = c.id;
    el.innerHTML = `<span class="case-id">${c.id.toUpperCase()}</span>
      <span class="case-label">${escapeHtml(c.label.replace(/^Case #\d+ — /, ""))}</span>
      <span class="case-hint">${escapeHtml(c.hint)}</span>`;
    el.addEventListener("click", () => selectCase(c.id, el));
    wrap.appendChild(el);
  }
}

function selectCase(id, el) {
  document.querySelectorAll(".case-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  importedFormatLabel = null;
  document.getElementById("format-pill").classList.add("hidden");
  document.getElementById("custom-area").classList.add("hidden");
  currentTraceId = id;
  currentTrace = SAMPLE_TRACES.find(c => c.id === id).trace;
  document.getElementById("run-btn").disabled = false;
}

function toggleCustom() {
  const area = document.getElementById("custom-area");
  area.classList.toggle("hidden");
  if (!area.classList.contains("hidden")) {
    document.querySelectorAll(".case-card").forEach(c => c.classList.remove("selected"));
    currentTraceId = "custom";
    document.getElementById("run-btn").disabled = false;
  }
}

/* ---------- run ---------- */

function onRun() {
  if (currentTraceId === "custom") {
    const raw = document.getElementById("custom-json").value.trim();
    try {
      currentTrace = JSON.parse(raw);
    } catch (e) {
      showToast("Invalid JSON — check the trace and try again.");
      return;
    }
  }
  if (!currentTrace) return;

  lastResult = runInvestigation(currentTrace);
  const report = composeReport(lastResult, currentTrace);

  document.getElementById("results").classList.remove("hidden");
  paintCausalityGraph("causality-graph", currentTrace, lastResult);
  renderRemediation(lastResult);
  renderTimeline(lastResult.timeline);
  renderReport(report, lastResult);
  renderRulePanel(lastResult);
  renderTraceViewer(currentTrace);
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- ECG timeline (the signature) ---------- */

function renderTimeline(events) {
  const host = document.getElementById("timeline-svg");
  const labels = document.getElementById("timeline-labels");
  host.innerHTML = "";
  labels.innerHTML = "";
  if (!events.length) return;

  const W = Math.max(720, events.length * 150);
  const H = 120;
  const baseY = 74;
  const step = W / (events.length + 1);
  const failIdx = events.findIndex(e => e.kind === "fail");

  const colors = { info: "var(--dim)", tool: "var(--blue)", ok: "var(--green)", warn: "var(--amber)", fail: "var(--red)" };
  let path = `M 0 ${baseY}`;
  const marks = [];

  events.forEach((e, i) => {
    const x = step * (i + 1);
    const amp = e.kind === "fail" ? 44 : e.kind === "warn" ? 30 : 22;
    if (failIdx !== -1 && i > failIdx) {
      // flatline after the failure point
      path += ` L ${x} ${baseY}`;
    } else {
      path += ` L ${x - 16} ${baseY} L ${x - 8} ${baseY - amp} L ${x} ${baseY + (e.kind === "fail" ? 14 : 8)} L ${x + 8} ${baseY}`;
    }
    marks.push({ x, e, i });
  });
  path += ` L ${W} ${baseY}`;

  const failX = failIdx !== -1 ? step * (failIdx + 1) : null;

  const svg = `
  <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Failure timeline">
    <line x1="0" y1="${baseY}" x2="${W}" y2="${baseY}" stroke="var(--line)" stroke-width="1"/>
    ${failX !== null ? `
      <path d="${clipPath(path)}" fill="none" stroke="var(--green)" stroke-width="2" clip-path="url(#pre)"/>
      <defs>
        <clipPath id="pre"><rect x="0" y="0" width="${failX - 10}" height="${H}"/></clipPath>
        <clipPath id="post"><rect x="${failX - 10}" y="0" width="${W - failX + 10}" height="${H}"/></clipPath>
      </defs>
      <path d="${clipPath(path)}" fill="none" stroke="var(--red)" stroke-width="2" clip-path="url(#post)" stroke-dasharray="0"/>
    ` : `
      <path d="${clipPath(path)}" fill="none" stroke="var(--green)" stroke-width="2"/>
    `}
    ${marks.map(m => `
      <circle cx="${m.x}" cy="${baseY}" r="4" fill="${colors[m.e.kind] || "var(--dim)"}"/>
      <text x="${m.x}" y="${baseY + 26}" text-anchor="middle" class="tl-ts">${m.e.ts || ""}</text>
    `).join("")}
  </svg>`;
  host.innerHTML = svg;

  events.forEach((e) => {
    const chip = document.createElement("div");
    chip.className = `tl-chip tl-${e.kind}`;
    chip.innerHTML = `<span class="tl-chip-ts">${e.ts || ""}</span><span>${escapeHtml(e.label)}</span>`;
    labels.appendChild(chip);
    if (e !== events[events.length - 1]) {
      const arrow = document.createElement("span");
      arrow.className = "tl-arrow";
      arrow.textContent = "→";
      labels.appendChild(arrow);
    }
  });
}

function clipPath(p) { return p; }

/* ---------- report ---------- */

function renderReport(report, result) {
  const stamp = document.getElementById("stamp");
  const conf = document.getElementById("confidence");
  const confBar = document.getElementById("confidence-bar");

  if (!report.category) {
    stamp.textContent = "NO MATCH";
    stamp.style.setProperty("--stamp-color", "var(--dim)");
    conf.textContent = "—";
    confBar.style.width = "0%";
  } else {
    stamp.textContent = report.category.label.toUpperCase();
    stamp.style.setProperty("--stamp-color", report.category.color);
    conf.textContent = report.confidence + "%";
    confBar.style.width = report.confidence + "%";
    confBar.style.background = report.category.color;
  }
  document.getElementById("confidence-note").textContent =
    report.category ? `evidence-weighted · base 35 + 0.8 × ${result.primaryPoints} pts, capped at 95` : "";

  // Evidence
  const evWrap = document.getElementById("evidence");
  evWrap.innerHTML = "";
  const primaryFired = result.fired.filter(f => f.rule.category === result.primary);
  for (const f of primaryFired) {
    evWrap.appendChild(evidenceRow(f));
  }

  document.getElementById("root-cause").textContent = report.rootCause;
  document.getElementById("root-cause-mode").textContent = "rule-based narrative · offline";

  // Contributing factors
  const cf = document.getElementById("contributing");
  cf.innerHTML = "";
  if (report.contributing.length === 0) {
    cf.innerHTML = `<p class="muted">None — all fired rules point at the primary category.</p>`;
  } else {
    for (const c of report.contributing) {
      const div = document.createElement("div");
      div.className = "contrib";
      div.innerHTML = `<span class="contrib-dot" style="background:${c.category.color}"></span>
        <span class="contrib-name">${c.category.label}</span>
        <span class="contrib-pts">+${c.points} pts</span>
        <span class="contrib-rules">${c.rules.map(escapeHtml).join(" · ")}</span>`;
      cf.appendChild(div);
    }
  }

  fillActionList("fixes", report.fixes);
  fillActionList("preventive", report.preventive);
}

function renderRemediation(result) {
  const host = document.getElementById("remediation");
  host.innerHTML = "";
  const deck = adviseRemediation(result);
  if (!deck.length) { host.innerHTML = `<p class="muted">Nothing to remediate — no failure detected.</p>`; return; }
  deck.forEach(item => {
    const card = document.createElement("div");
    card.className = "remedy" + (item.secondary ? " remedy-secondary" : "");
    card.innerHTML = `<span class="remedy-tag">${escapeHtml(item.tag)}</span><span class="remedy-why">${escapeHtml(item.why)}</span>`;
    host.appendChild(card);
  });
}

function evidenceRow(f) {
  const row = document.createElement("div");
  row.className = "evidence-row";
  const links = f.refs.map(r =>
    `<button class="ref-link" data-ref="${r.type}-${r.index}">${r.type}[${r.index}]</button>`
  ).join(" ");
  row.innerHTML = `<span class="rule-chip">${f.rule.id}</span>
    <span class="evidence-text">${escapeHtml(f.evidence)}</span>
    <span class="evidence-refs">${links}</span>`;
  row.querySelectorAll(".ref-link").forEach(btn =>
    btn.addEventListener("click", () => jumpToRef(btn.dataset.ref))
  );
  return row;
}

function fillActionList(id, items) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  for (const it of items) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="rule-chip small">${it.ruleId}</span> ${escapeHtml(it.text)}`;
    el.appendChild(li);
  }
}

/* ---------- rule engine panel ---------- */

function renderRulePanel(result) {
  const wrap = document.getElementById("rule-panel");
  wrap.innerHTML = "";

  // category score bars
  const maxPts = Math.max(...Object.values(result.scores), 1);
  const bars = document.createElement("div");
  bars.className = "score-bars";
  for (const [key, pts] of Object.entries(result.scores).sort((a, b) => b[1] - a[1])) {
    const cat = CATEGORIES[key];
    const row = document.createElement("div");
    row.className = "score-row" + (key === result.primary ? " primary" : "");
    row.innerHTML = `<span class="score-name">${cat.label}</span>
      <span class="score-track"><span class="score-fill" style="width:${(pts / maxPts) * 100}%;background:${cat.color}"></span></span>
      <span class="score-pts">${pts}</span>`;
    bars.appendChild(row);
  }
  wrap.appendChild(bars);

  const title = document.createElement("div");
  title.className = "panel-subtitle";
  title.textContent = `Fired rules (${result.fired.length} of ${RULES.length} in catalog)`;
  wrap.appendChild(title);

  for (const f of result.fired) {
    const cat = CATEGORIES[f.rule.category];
    const div = document.createElement("div");
    div.className = "fired-rule";
    div.innerHTML = `<div class="fired-head">
        <span class="rule-chip" style="border-color:${cat.color};color:${cat.color}">${f.rule.id}</span>
        <span class="fired-title">${escapeHtml(f.rule.title)}</span>
        <span class="fired-pts" style="color:${cat.color}">+${f.rule.points}</span>
      </div>`;
    wrap.appendChild(div);
  }
}

/* ---------- raw trace viewer ---------- */

function renderTraceViewer(trace) {
  const wrap = document.getElementById("trace-viewer");
  wrap.innerHTML = "";

  wrap.appendChild(traceSection("System prompt", [
    { id: "prompt-0", text: trace.system_prompt || "(none)" }
  ]));

  wrap.appendChild(traceSection("Conversation", (trace.conversation || []).map((m, i) => ({
    id: `msg-${i}`, text: `[${m.ts}] ${m.role}: ${m.content}`
  }))));

  wrap.appendChild(traceSection("Tool calls", (trace.tool_calls || []).map((t, i) => ({
    id: `tool-${i}`,
    text: `[${t.ts}] ${t.tool}(${JSON.stringify(t.input)}) → ${t.status.toUpperCase()} ${t.duration_ms}ms${t.output ? "\n  output: " + t.output : ""}`
  }))));

  wrap.appendChild(traceSection("Retrieved docs", (trace.retrieved_docs || []).length
    ? trace.retrieved_docs.map((d, i) => ({
        id: `doc-${i}`, text: `${d.id} (${d.source}, score ${d.score}): ${d.content}`
      }))
    : [{ id: "doc-none", text: "(0 documents retrieved)" }]));

  wrap.appendChild(traceSection("Logs", (trace.logs || []).map((l, i) => ({
    id: `log-${i}`, text: `[${l.ts}] ${l.level.padEnd(5)} ${l.event} — ${l.message}`, level: l.level
  }))));

  wrap.appendChild(traceSection("Final response", [
    { id: "response-0", text: `[${trace.final_response?.ts}] ${trace.final_response?.content || ""}` }
  ]));
}

function traceSection(title, lines) {
  const sec = document.createElement("div");
  sec.className = "trace-section";
  sec.innerHTML = `<div class="trace-section-title">${title}</div>`;
  for (const l of lines) {
    const div = document.createElement("div");
    div.className = "trace-line" + (l.level === "ERROR" ? " line-error" : l.level === "WARN" ? " line-warn" : "");
    div.id = "ref-" + l.id;
    div.textContent = l.text;
    sec.appendChild(div);
  }
  return sec;
}

function jumpToRef(ref) {
  // evidence refs use type names: prompt, msg, tool, doc, log, response
  const map = { prompt: "prompt", tool: "tool", doc: "doc", log: "log", response: "response" };
  const [type, idx] = ref.split("-");
  const el = document.getElementById(`ref-${map[type] || type}-${idx}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("flash");
  void el.offsetWidth; // restart animation
  el.classList.add("flash");
}

/* ---------- optional LLM narrative ---------- */

async function onComposeWithClaude() {
  const key = document.getElementById("api-key").value.trim();
  const btn = document.getElementById("llm-btn");
  if (!key) { showToast("Paste an Anthropic API key first — or keep using offline mode."); return; }
  if (!lastResult || !lastResult.primary) { showToast("Run an investigation first."); return; }
  btn.disabled = true; btn.textContent = "Composing…";
  try {
    const text = await composeRootCauseWithClaude(key, lastResult, currentTrace);
    document.getElementById("root-cause").textContent = text;
    document.getElementById("root-cause-mode").textContent = "narrated by Claude · findings unchanged";
  } catch (e) {
    showToast("LLM call failed (" + e.message + ") — kept the rule-based narrative.");
  } finally {
    btn.disabled = false; btn.textContent = "Compose with Claude";
  }
}

/* ---------- misc ---------- */

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
